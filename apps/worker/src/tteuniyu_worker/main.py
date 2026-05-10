# RSS 워커 CLI entry — PR #22는 dry-run only (DB 적재 X, stdout 출력)

"""RSS 워커 CLI entry.

Subcommands.
  dry-run  — config/sources_whitelist.yaml의 active source만 fetch,
             결과는 stdout 표/JSON. DB 적재 X, embedding X, LLM X.

PR #23 — 본격 fetch + HTML 추출 + 임베딩 + 클러스터링 → DB.
PR #24 — LLM 요약 + Trust Signal + audit log.

비협상 (CLAUDE.md rule 2/3) — 본문·이미지 URL 저장 X. PR #22는 RSS title +
URL + published_at만 메모리에 보유 후 출력 + 종료.

비협상 (CLAUDE.md rule 7) — sources.filter_active()로만 fetch.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import feedparser
import httpx
import structlog
from rich.console import Console
from rich.table import Table

from tteuniyu_worker.logging_setup import configure as configure_logging
from tteuniyu_worker.sources import Source, filter_active, load

logger = structlog.get_logger(__name__)
console = Console()


@dataclass(frozen=True)
class FetchOk:
    source: Source
    entry_count: int
    sample_titles: list[str]
    elapsed_ms: int


@dataclass(frozen=True)
class FetchFail:
    source: Source
    reason: str
    elapsed_ms: int


FetchResult = FetchOk | FetchFail


async def fetch_one(client: httpx.AsyncClient, source: Source) -> FetchResult:
    """단일 source RSS fetch + 파싱.

    feedparser는 동기 — RSS XML은 작아서 RAM 처리 후 즉시 폐기.
    timeout 8s (RSS는 보통 < 2s). 5xx/timeout은 fail로 기록 (운영자 review).

    rule 2 — 본문 fetch 안 함, RSS feed의 <title>·<link>·<published>만.
    """

    started = datetime.now()
    try:
        response = await client.get(str(source.rss_url), timeout=8.0)
        response.raise_for_status()
    except httpx.HTTPError as err:
        elapsed_ms = int((datetime.now() - started).total_seconds() * 1000)
        return FetchFail(source=source, reason=str(err), elapsed_ms=elapsed_ms)

    parsed = feedparser.parse(response.text)
    if parsed.bozo:
        elapsed_ms = int((datetime.now() - started).total_seconds() * 1000)
        return FetchFail(
            source=source,
            reason=f"feedparser bozo: {parsed.bozo_exception}",
            elapsed_ms=elapsed_ms,
        )

    entries = list(parsed.entries)
    sample_titles = [str(e.get("title", "<no title>"))[:60] for e in entries[:3]]
    elapsed_ms = int((datetime.now() - started).total_seconds() * 1000)
    return FetchOk(
        source=source,
        entry_count=len(entries),
        sample_titles=sample_titles,
        elapsed_ms=elapsed_ms,
    )


async def run_dry(whitelist_path: Path, max_concurrent: int = 6) -> int:
    """active source만 RSS fetch dry-run. exit code = fail 개수."""

    whitelist = load(whitelist_path)
    active = filter_active(whitelist)

    if not active:
        console.print(
            "[yellow]⚠ active source 0개. 운영자가 yaml에서 "
            "tos_confirmed:true + ingestion_enabled:true로 활성화 필요.[/yellow]"
        )
        console.print(
            f"[dim]총 {len(whitelist.sources)}개 source 등록됨 (모두 staged).[/dim]"
        )
        return 0

    semaphore = asyncio.Semaphore(max_concurrent)

    async def bounded_fetch(client: httpx.AsyncClient, src: Source) -> FetchResult:
        async with semaphore:
            return await fetch_one(client, src)

    headers = {
        "User-Agent": "tteuniyu-worker/0.1.0 (+https://github.com/sgeniusk/tteuniyu)",
        "Accept": "application/rss+xml, application/xml, text/xml",
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        results = await asyncio.gather(*(bounded_fetch(client, s) for s in active))

    # ── Rich 표로 결과 출력 ───────────────────────────────
    table = Table(title=f"RSS dry-run — {len(active)} active sources")
    table.add_column("slug", style="cyan", no_wrap=True)
    table.add_column("name", style="white")
    table.add_column("entries", justify="right", style="green")
    table.add_column("ms", justify="right", style="dim")
    table.add_column("status / sample title", style="white")

    fail_count = 0
    for result in results:
        match result:
            case FetchOk(source=s, entry_count=n, sample_titles=titles, elapsed_ms=ms):
                first = titles[0] if titles else "<no entries>"
                table.add_row(s.slug, s.name, str(n), str(ms), first[:80])
            case FetchFail(source=s, reason=r, elapsed_ms=ms):
                fail_count += 1
                table.add_row(
                    s.slug, s.name, "—", str(ms), f"[red]FAIL[/red] {r[:60]}"
                )

    console.print(table)

    success = len(active) - fail_count
    summary_color = "green" if fail_count == 0 else "yellow"
    console.print(
        f"[{summary_color}]Summary — {success}/{len(active)} ok, {fail_count} fail[/{summary_color}]"
    )

    # rule 9 — 모든 fetch 결과는 structured log
    logger.info(
        "dry_run.complete",
        total=len(active),
        success=success,
        fail=fail_count,
    )

    return fail_count


def cli() -> None:
    """python -m tteuniyu_worker.main 또는 `worker` 스크립트 진입점."""

    parser = argparse.ArgumentParser(
        prog="worker",
        description="뜬이유 RSS 워커 (P0a Foundation)",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub_dry = sub.add_parser("dry-run", help="active sources RSS fetch + 결과 출력 (DB 적재 X)")
    sub_dry.add_argument(
        "--whitelist",
        type=Path,
        default=Path("config/sources_whitelist.yaml"),
        help="whitelist 파일 경로 (default: config/sources_whitelist.yaml)",
    )
    sub_dry.add_argument(
        "--max-concurrent",
        type=int,
        default=6,
        help="동시 fetch 개수 (default: 6, 매체 부하 고려)",
    )

    args = parser.parse_args()
    configure_logging()

    if args.command == "dry-run":
        exit_code = asyncio.run(run_dry(args.whitelist, args.max_concurrent))
        sys.exit(exit_code)

    parser.print_help()
    sys.exit(2)


if __name__ == "__main__":
    cli()
