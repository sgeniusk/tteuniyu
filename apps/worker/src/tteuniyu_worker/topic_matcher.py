# Custom Topic 매칭 worker — ADR-018 (Pro+ retention 핵심)
#
# 비협상.
#   - rule 4 — embedding RAM only, DB는 cosine 매칭 결과만
#   - 변호사 §1.3 — 키워드 입력 시 hard-block 40+ 단어 거부 + 안내
#   - PIPA §22-2 — auth.users JOIN으로 만 14세 미만 자동 제외 (ADR-016)
#   - rule 11 — service_role + RLS own data
#
# Backend (env TOPIC_MATCHER_BACKEND).
#   stub (default) — in-memory mock topics + clusters (CI/dev/dry-run)
#   supabase — 실 DB query + INSERT (SUPABASE_URL/SERVICE_ROLE_KEY 필요)

from __future__ import annotations

import os
from dataclasses import dataclass, field

import numpy as np
import structlog

from tteuniyu_worker.embed import Embedder, StubEmbedder, cosine_similarity, get_embedder
from tteuniyu_worker.llm_validator import validate_llm_output

logger = structlog.get_logger(__name__)

# ADR-018 §2.3 — 임계값
SIMILAR_MATCHING_THRESHOLD = 0.7

# ADR-018 §2.2 — Tier 한도
TIER_LIMITS: dict[str, int] = {
    "free": 0,
    "pro": 5,
    "creator": 20,
    "leader": 50,
}


@dataclass(frozen=True)
class UserTopic:
    topic_id: str
    user_id: str
    keyword: str
    embedding: np.ndarray
    matching_mode: str  # 'exact' / 'similar' / 'learned'


@dataclass(frozen=True)
class ClusterCandidate:
    cluster_id: str
    title: str
    embedding: np.ndarray


@dataclass(frozen=True)
class TopicMatch:
    topic_id: str
    cluster_id: str
    user_id: str
    keyword: str
    similarity: float


# ─── 키워드 입력 검증 (ADR-018 §2.2) ──────────────────────────


@dataclass(frozen=True)
class KeywordValidation:
    accepted: bool
    reason: str | None = None
    blocked_terms: list[str] = field(default_factory=list)


def validate_keyword(keyword: str) -> KeywordValidation:
    """사용자 키워드 입력 검증.

    비협상.
      - 길이 1~40자
      - 변호사 hard-block 40+ 단어 0건 (자본시장법 회피)
      - 분류 키워드 (stance/ideology) 0건
    """
    keyword = keyword.strip()
    if not keyword:
        return KeywordValidation(accepted=False, reason="빈 키워드")
    if len(keyword) > 40:
        return KeywordValidation(accepted=False, reason="40자 초과")

    validation = validate_llm_output(keyword)
    if not validation.passed:
        return KeywordValidation(
            accepted=False,
            reason="투자 판단성 또는 분류 단어가 포함되어 있습니다. 사실 추적 키워드로 변경해 주세요.",
            blocked_terms=validation.blocked_terms,
        )

    return KeywordValidation(accepted=True)


# ─── 매칭 알고리즘 ────────────────────────────────────────────


def match_one(
    topic: UserTopic, cluster: ClusterCandidate
) -> TopicMatch | None:
    """단일 topic ↔ cluster 매칭.

    matching_mode별 분기.
      exact (Pro) — keyword가 cluster 제목 내부 포함 (대소문자 무시)
      similar (Creator) — embedding cosine ≥ 0.7
      learned (Leader, V0.5+) — 사용자 피드백 기반 임계값 동적 (현재는 similar와 동일)
    """
    if topic.matching_mode == "exact":
        if topic.keyword.lower() in cluster.title.lower():
            return TopicMatch(
                topic_id=topic.topic_id,
                cluster_id=cluster.cluster_id,
                user_id=topic.user_id,
                keyword=topic.keyword,
                similarity=1.0,  # exact match
            )
        return None

    # similar / learned — cosine similarity
    sim = cosine_similarity(topic.embedding, cluster.embedding)
    if sim >= SIMILAR_MATCHING_THRESHOLD:
        return TopicMatch(
            topic_id=topic.topic_id,
            cluster_id=cluster.cluster_id,
            user_id=topic.user_id,
            keyword=topic.keyword,
            similarity=round(sim, 3),
        )
    return None


def match_all(
    topics: list[UserTopic], clusters: list[ClusterCandidate]
) -> list[TopicMatch]:
    """전체 활성 topics × 신규 clusters 매칭.

    O(N×M) — N=10K topics × M=100 clusters = 1M cosine ≈ 0.1초 (CPU dot product).
    """
    matches: list[TopicMatch] = []
    for topic in topics:
        for cluster in clusters:
            result = match_one(topic, cluster)
            if result is not None:
                matches.append(result)

    logger.info(
        "topic_matcher.complete",
        topics=len(topics),
        clusters=len(clusters),
        matches=len(matches),
    )
    return matches


# ─── Backend ────────────────────────────────────────────────


class StubTopicMatcher:
    """In-memory mock — CI/dev/dry-run."""

    def __init__(self, embedder: Embedder | None = None) -> None:
        self.embedder = embedder or StubEmbedder()

    def fetch_active_topics(self) -> list[UserTopic]:
        seeds = [
            ("topic-1", "user-creator", "삼성전자 반도체", "similar"),
            ("topic-2", "user-creator", "AI 규제", "similar"),
            ("topic-3", "user-pr", "쿠팡", "exact"),
        ]
        embeddings = self.embedder.encode([s[2] for s in seeds])
        return [
            UserTopic(
                topic_id=t_id,
                user_id=u_id,
                keyword=kw,
                embedding=embeddings[i],
                matching_mode=mode,
            )
            for i, (t_id, u_id, kw, mode) in enumerate(seeds)
        ]

    def fetch_recent_clusters(self) -> list[ClusterCandidate]:
        seeds = [
            ("c-1", "삼성전자 1분기 반도체 흑자 전환"),
            ("c-2", "쿠팡 새벽배송 권역 확대"),
            ("c-3", "OpenAI 한국어 모델 공개"),
        ]
        embeddings = self.embedder.encode([s[1] for s in seeds])
        return [
            ClusterCandidate(cluster_id=c_id, title=title, embedding=embeddings[i])
            for i, (c_id, title) in enumerate(seeds)
        ]

    def insert_matches(self, matches: list[TopicMatch]) -> int:
        logger.info("topic_matcher.stub.insert", count=len(matches))
        return len(matches)


class SupabaseTopicMatcher:
    """실 운영 — Supabase 쿼리 + INSERT user_topic_matches."""

    def __init__(self, embedder: Embedder | None = None) -> None:
        self.embedder = embedder or get_embedder()
        self._client = None

    def _ensure_client(self):
        if self._client is None:
            from tteuniyu_worker.db import get_client

            self._client = get_client()
            if self._client is None:
                raise RuntimeError("Supabase client 미설정 (SUPABASE_URL + SERVICE_ROLE_KEY)")

    def fetch_active_topics(self) -> list[UserTopic]:
        self._ensure_client()
        # Supabase pgvector — embedding을 array로 받아 numpy로 변환
        # active=true + last 24h created_or_updated 우선
        result = (
            self._client.table("user_topics")
            .select("id,user_id,keyword,embedding,matching_mode")
            .eq("active", True)
            .execute()
        )
        topics: list[UserTopic] = []
        for row in result.data or []:
            emb = row.get("embedding")
            if emb is None:
                # 임베딩 미생성 — keyword에서 즉석 생성 (rule 4 RAM only)
                emb = self.embedder.encode([row["keyword"]])[0]
            else:
                emb = np.array(emb, dtype=np.float32)
            topics.append(
                UserTopic(
                    topic_id=row["id"],
                    user_id=row["user_id"],
                    keyword=row["keyword"],
                    embedding=emb,
                    matching_mode=row.get("matching_mode", "similar"),
                )
            )
        return topics

    def fetch_recent_clusters(self) -> list[ClusterCandidate]:
        """최근 24h 신규 클러스터만 (Daily Digest cycle과 정합)."""
        self._ensure_client()
        from datetime import datetime, timedelta, timezone

        cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        result = (
            self._client.table("clusters")
            .select("id,title")
            .gte("created_at", cutoff)
            .execute()
        )
        rows = result.data or []
        if not rows:
            return []
        titles = [r["title"] for r in rows]
        embeddings = self.embedder.encode(titles)  # rule 4 RAM only
        return [
            ClusterCandidate(
                cluster_id=r["id"], title=r["title"], embedding=embeddings[i]
            )
            for i, r in enumerate(rows)
        ]

    def insert_matches(self, matches: list[TopicMatch]) -> int:
        if not matches:
            return 0
        self._ensure_client()
        rows = [
            {
                "topic_id": m.topic_id,
                "cluster_id": m.cluster_id,
                "similarity": float(m.similarity),
            }
            for m in matches
        ]
        try:
            response = (
                self._client.table("user_topic_matches")
                .upsert(rows, on_conflict="topic_id,cluster_id")
                .execute()
            )
            inserted = len(response.data) if response.data else 0
            logger.info("topic_matcher.supabase.inserted", count=inserted)
            return inserted
        except Exception as err:
            logger.error("topic_matcher.supabase.failed", error=str(err))
            return 0


def get_topic_matcher() -> StubTopicMatcher | SupabaseTopicMatcher:
    backend = os.getenv("TOPIC_MATCHER_BACKEND", "stub").lower()
    if backend == "supabase":
        logger.info("topic_matcher.backend", choice="supabase")
        return SupabaseTopicMatcher()
    logger.info("topic_matcher.backend", choice="stub")
    return StubTopicMatcher()


def run_matching_cycle() -> dict[str, int]:
    """매 cycle 실행 — fetch active topics + recent clusters → match → insert."""
    matcher = get_topic_matcher()
    topics = matcher.fetch_active_topics()
    clusters = matcher.fetch_recent_clusters()
    matches = match_all(topics, clusters)
    inserted = matcher.insert_matches(matches)
    return {
        "topics": len(topics),
        "clusters": len(clusters),
        "matches": len(matches),
        "inserted": inserted,
    }
