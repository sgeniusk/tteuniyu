# RSS → 본문 추출 → articles INSERT (메타만, body는 RAM only)

"""ingest 파이프라인.

플로우.
  1. config/sources_whitelist.yaml 로드 + filter_active (rule 7)
  2. 각 active source RSS fetch (PR #22의 fetch 로직 재사용)
  3. 각 entry HTML fetch (HEAD/GET) + trafilatura 본문 추출 (RAM only, rule 2)
  4. articles INSERT (source_slug + url + headline + published_at, body 저장 X)
  5. 본문 추출 결과는 PR #25 LLM 호출 시 RAM 통과 — 현 PR은 통계만 log

비협상.
  - rule 2 — extract.py 결과 절대 DB 저장 X
  - rule 3 — image URL 처리 X
  - rule 7 — active source만 fetch
  - rule 9 — body extraction에 prompt_version 없음 (trafilatura는 LLM 아님 — log만)
  - rule 11 — service_role key로만 DB 접근 (db.py)

CI / Supabase 미설정 환경 — db.insert_articles가 dry-run mode로 fall-back.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any

import feedparser
import httpx
import structlog
from rich.console import Console
from rich.table import Table

from tteuniyu_worker.db import ArticleInsert, insert_articles
from tteuniyu_worker.extract import extract_body
from tteuniyu_worker.sources import Source

logger = structlog.get_logger(__name__)
console = Console()

USER_AGENT = "tteuniyu-worker/0.1.0 (+https://github.com/sgeniusk/tteuniyu)"
MAX_ENTRIES_PER_SOURCE = 20  # 매체당 최신 N건만 (P0a — 5분 cron이 cap 보장)


@dataclass(frozen=True)
class IngestStat:
    source: Source
    rss_entries: int
    extracted_count: int
    extracted_total_chars: int
    insert_attempted: int
    insert_inserted: int
    elapsed_ms: int
    error: str | None = None


def _parse_dt(value: Any) -> datetime | None:
    """RSS pub date를 datetime으로. 실패 시 None."""

    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            return parsedate_to_datetime(value)
        except (TypeError, ValueError):
            try:
                return datetime.fromisoformat(value)
            except ValueError:
                return None
    return None


async def _fetch_rss(client: httpx.AsyncClient, source: Source) -> list[dict[str, Any]]:
    """RSS feed fetch + 파싱 → entry dicts."""

    response = await client.get(str(source.rss_url), timeout=8.0)
    response.raise_for_status()
    parsed = feedparser.parse(response.text)
    if parsed.bozo:
        logger.warning(
            "ingest.rss.bozo", source=source.slug, exc=str(parsed.bozo_exception)
        )
    return list(parsed.entries[:MAX_ENTRIES_PER_SOURCE])


async def _fetch_html(client: httpx.AsyncClient, url: str) -> str | None:
    """단일 article URL HTML fetch."""

    try:
        response = await client.get(
            url,
            timeout=10.0,
            follow_redirects=True,
        )
        if response.status_code != 200:
            return None
        # 본문 fetch 후 RAM에서만 처리 — 즉시 변수 통과 후 GC.
        return response.text
    except httpx.HTTPError as err:
        logger.warning("ingest.html.fetch_failed", url=url, error=str(err))
        return None


async def _ingest_one(
    client: httpx.AsyncClient, source: Source
) -> IngestStat:
    """단일 source ingest — RSS fetch → entries → 본문 추출 → INSERT."""

    started = datetime.now()

    try:
        entries = await _fetch_rss(client, source)
    except httpx.HTTPError as err:
        elapsed_ms = int((datetime.now() - started).total_seconds() * 1000)
        return IngestStat(
            source=source,
            rss_entries=0,
            extracted_count=0,
            extracted_total_chars=0,
            insert_attempted=0,
            insert_inserted=0,
            elapsed_ms=elapsed_ms,
            error=f"rss_fetch: {err}",
        )

    payloads: list[ArticleInsert] = []
    extracted_count = 0
    extracted_total_chars = 0
    is_korean = not source.slug in {"reuters", "ap", "bbc", "nyt", "bloomberg", "nikkei"}

    for entry in entries:
        link = entry.get("link")
        title = entry.get("title")
        published_at = _parse_dt(entry.get("published") or entry.get("updated"))
        if not link or not title or not published_at:
            continue

        # 본문 추출 (RAM only — rule 2). 결과는 통계만 기록 후 폐기.
        # PR #25에서 LLM 요약 호출에 동일 본문 재취득 (또는 in-memory 전달).
        html = await _fetch_html(client, link)
        if html:
            extracted = extract_body(html, is_korean=is_korean)
            if extracted:
                extracted_count += 1
                extracted_total_chars += extracted.char_count
                # rule 2 — extracted.body는 여기서 GC. DB 적재 X.

        try:
            payload = ArticleInsert(
                source_slug=source.slug,
                url=link,
                headline=title[:300],
                published_at=published_at,
            )
            payloads.append(payload)
        except Exception as err:
            logger.debug("ingest.payload.skip", url=link, error=str(err))

    insert_result = await insert_articles(payloads)
    elapsed_ms = int((datetime.now() - started).total_seconds() * 1000)

    return IngestStat(
        source=source,
        rss_entries=len(entries),
        extracted_count=extracted_count,
        extracted_total_chars=extracted_total_chars,
        insert_attempted=insert_result["attempted"],
        insert_inserted=insert_result["inserted"],
        elapsed_ms=elapsed_ms,
    )


async def run_ingest(sources: list[Source], max_concurrent: int = 4) -> list[IngestStat]:
    """active source list에 대해 병렬 ingest 실행."""

    if not sources:
        console.print("[yellow]⚠ active source 0개 — ingest 스킵[/yellow]")
        return []

    semaphore = asyncio.Semaphore(max_concurrent)

    async def bounded(client: httpx.AsyncClient, src: Source) -> IngestStat:
        async with semaphore:
            return await _ingest_one(client, src)

    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        return await asyncio.gather(*(bounded(client, s) for s in sources))


def render_summary(stats: list[IngestStat]) -> int:
    """Rich table 출력 + fail count 반환."""

    if not stats:
        return 0

    table = Table(title=f"ingest — {len(stats)} active sources")
    table.add_column("slug", style="cyan", no_wrap=True)
    table.add_column("RSS", justify="right", style="white")
    table.add_column("extracted", justify="right", style="green")
    table.add_column("avg chars", justify="right", style="green")
    table.add_column("insert ok", justify="right", style="green")
    table.add_column("ms", justify="right", style="dim")
    table.add_column("status", style="white")

    fail_count = 0
    for s in stats:
        if s.error:
            fail_count += 1
            table.add_row(
                s.source.slug, "—", "—", "—", "—", str(s.elapsed_ms),
                f"[red]FAIL[/red] {s.error[:40]}",
            )
            continue
        avg = s.extracted_total_chars // s.extracted_count if s.extracted_count else 0
        table.add_row(
            s.source.slug,
            str(s.rss_entries),
            str(s.extracted_count),
            str(avg),
            f"{s.insert_inserted}/{s.insert_attempted}",
            str(s.elapsed_ms),
            "[green]ok[/green]",
        )

    console.print(table)
    return fail_count
