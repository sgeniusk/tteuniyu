# Supabase client wrapper — service_role only (CLAUDE.md rule 11)

"""Supabase client wrapper.

비협상 (CLAUDE.md rule 11) — service_role key만 사용. anon/authenticated 절대 X.
client는 lazy init — env vars 미설정 시 None 반환 (CI dry-run 호환).

PR #23 — articles INSERT만.
PR #24 — clusters / cluster_articles INSERT.
PR #25 — summaries INSERT + audit_logs INSERT.
PR #41 — sources upsert (ingest 진입 시 yaml → sources 테이블 동기화).
"""

from __future__ import annotations

import os
from datetime import datetime
from functools import lru_cache
from typing import TYPE_CHECKING, Any

import structlog
from pydantic import BaseModel, ConfigDict, HttpUrl
from supabase import Client, create_client

if TYPE_CHECKING:
    from tteuniyu_worker.sources import Source

logger = structlog.get_logger(__name__)


class ArticleInsert(BaseModel):
    """articles INSERT 페이로드.

    비협상.
      - rule 2 — body 컬럼 부재 (extract.py 결과는 RAM에서만, DB 적재 X)
      - rule 3 — image URL 컬럼 부재
      - rule 9 — body_summary는 PR #25 LLM 호출 시 채워짐 (현 PR에서는 None)
    """

    model_config = ConfigDict(extra="forbid")

    source_slug: str
    url: HttpUrl
    headline: str
    published_at: datetime
    # body_summary 등 LLM 산출물은 PR #25에서 별도 UPDATE


@lru_cache(maxsize=1)
def get_client() -> Client | None:
    """env 기반 lazy Supabase client.

    SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 둘 다 설정 시 client 반환.
    하나라도 없으면 None — caller가 dry-run mode 분기.
    """

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        logger.warning(
            "db.client.no_env",
            note="SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 미설정 — dry-run mode",
        )
        return None

    return create_client(url, key)


async def insert_articles(payloads: list[ArticleInsert]) -> dict[str, Any]:
    """articles 테이블 일괄 INSERT.

    UNIQUE (url) 제약 위반 시 supabase-py가 ON CONFLICT 처리 — 자세한 정책은
    PR #24/#25에서 upsert 모드로 통합 결정.

    client 부재 시 dry-run 결과 반환 (실 INSERT 없음).
    """

    if not payloads:
        return {"mode": "noop", "attempted": 0, "inserted": 0}

    client = get_client()
    if client is None:
        logger.info(
            "db.insert_articles.dry_run",
            count=len(payloads),
            sample_urls=[str(p.url) for p in payloads[:3]],
        )
        return {"mode": "dry_run", "attempted": len(payloads), "inserted": 0}

    rows = [
        {
            "source_slug": p.source_slug,
            "url": str(p.url),
            "headline": p.headline,
            "published_at": p.published_at.isoformat(),
        }
        for p in payloads
    ]

    try:
        # supabase-py는 동기 — async wrapper는 PR #24에서 검토.
        # P0a Sprint 0 진입 시 asyncpg 직접 사용도 고려.
        response = client.table("articles").upsert(rows, on_conflict="url").execute()
    except Exception as err:
        logger.error("db.insert_articles.failed", error=str(err), count=len(payloads))
        return {"mode": "live", "attempted": len(payloads), "inserted": 0, "error": str(err)}

    inserted = len(response.data) if response.data else 0
    logger.info("db.insert_articles.ok", attempted=len(payloads), inserted=inserted)
    return {"mode": "live", "attempted": len(payloads), "inserted": inserted}


async def upsert_sources(sources: list[Source]) -> dict[str, Any]:
    """sources 테이블 upsert — yaml → DB 동기화.

    ingest 진입 시 호출하면 articles FK 제약 (`articles_source_slug_fkey`)
    위반 사전 차단. yaml이 단일 진실, sources 테이블은 derived state.

    별도 seed migration 대신 워커가 동적으로 동기화 — yaml 갱신 시 마이그레이션
    추가 부담 X.

    client 부재 시 noop (CI/dry-run 호환).
    """

    if not sources:
        return {"mode": "noop", "attempted": 0, "upserted": 0}

    client = get_client()
    if client is None:
        logger.info("db.upsert_sources.dry_run", count=len(sources))
        return {"mode": "dry_run", "attempted": len(sources), "upserted": 0}

    rows = [
        {
            "slug": s.slug,
            "name": s.name,
            "rss_url": str(s.rss_url),
            "base_url": str(s.base_url),
            "contact_email": s.contact_email,
            "tos_confirmed": s.tos_confirmed,
            "ingestion_enabled": s.ingestion_enabled,
            "confirmed_at": s.confirmed_at.isoformat() if s.confirmed_at else None,
            "notes": s.notes,
        }
        for s in sources
    ]

    try:
        response = client.table("sources").upsert(rows, on_conflict="slug").execute()
    except Exception as err:
        logger.error("db.upsert_sources.failed", error=str(err), count=len(sources))
        return {"mode": "live", "attempted": len(sources), "upserted": 0, "error": str(err)}

    upserted = len(response.data) if response.data else 0
    logger.info("db.upsert_sources.ok", attempted=len(sources), upserted=upserted)
    return {"mode": "live", "attempted": len(sources), "upserted": upserted}


# ─── cluster-pending 헬퍼 (PR #44) ────────────────────────────────


class PendingArticle(BaseModel):
    """클러스터링 대기 article — DB read 결과."""

    model_config = ConfigDict(extra="allow")

    id: str
    headline: str
    source_slug: str


async def fetch_pending_articles(lookback_hours: int = 24) -> list[PendingArticle]:
    """최근 N시간 articles 중 cluster_articles에 아직 안 묶인 것만.

    Supabase는 LEFT JOIN으로 NOT EXISTS 표현이 까다로워 2단계 쿼리.
      1. cluster_articles에서 이미 묶인 article_id set 가져오기
      2. articles에서 ingested_at > cutoff 조건으로 가져온 뒤 set 차집합

    실 N < 5000 가정 — 그 이상은 SQL function (RPC)로 옮길 시점.
    """
    client = get_client()
    if client is None:
        logger.warning("db.fetch_pending.no_client")
        return []

    from datetime import timedelta

    cutoff = (datetime.utcnow() - timedelta(hours=lookback_hours)).isoformat()

    # 이미 클러스터링 된 article_id 집합
    clustered_resp = client.table("cluster_articles").select("article_id").execute()
    clustered_ids: set[str] = {row["article_id"] for row in (clustered_resp.data or [])}

    # 최근 N시간 articles
    pending_resp = (
        client.table("articles")
        .select("id, headline, source_slug")
        .gte("ingested_at", cutoff)
        .order("ingested_at", desc=True)
        .limit(2000)
        .execute()
    )

    pending = [
        PendingArticle(**row)
        for row in (pending_resp.data or [])
        if row["id"] not in clustered_ids
    ]
    logger.info(
        "db.fetch_pending.ok",
        total_recent=len(pending_resp.data or []),
        already_clustered=len(clustered_ids),
        pending=len(pending),
    )
    return pending


async def insert_cluster_with_articles(
    title: str,
    sample_quality: str,
    ad_allowed: bool,
    article_ids: list[str],
    outlets_count: int,
) -> str | None:
    """clusters 1건 + cluster_articles N건 INSERT, cluster_id 반환.

    실패 시 None — caller가 loop에서 collect.
    """
    client = get_client()
    if client is None:
        return None

    try:
        cluster_resp = (
            client.table("clusters")
            .insert(
                {
                    "title": title[:60],  # CHECK constraint 보호
                    "sample_quality": sample_quality,
                    "ad_allowed": ad_allowed,
                    "outlets_count": outlets_count,
                }
            )
            .execute()
        )
    except Exception as err:
        logger.error("db.insert_cluster.failed", error=str(err))
        return None

    if not cluster_resp.data:
        return None

    cluster_id = cluster_resp.data[0]["id"]

    try:
        client.table("cluster_articles").insert(
            [{"cluster_id": cluster_id, "article_id": aid} for aid in article_ids]
        ).execute()
    except Exception as err:
        logger.error(
            "db.insert_cluster_articles.failed",
            cluster_id=cluster_id,
            error=str(err),
        )
        # cluster row는 남지만 cluster_articles 0건 → 다음 회차에서 다시 시도되지 않음.
        # 부분 실패 추적용 로그만 남기고 caller에 cluster_id 반환.
    return cluster_id
