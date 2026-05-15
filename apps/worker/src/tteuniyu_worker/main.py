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
    """active source만 RSS fetch dry-run.

    exit code 정책 — dry-run은 *진단 도구*이므로 항상 0 반환.
    RSS URL drift (404/410/feedparser bozo)는 운영 일상이며 CI를 깨선 안 됨.
    실패 매체 목록은 stdout 표 + structured log (`dry_run.complete`)로 노출."""

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

    # 진단 도구 — fail 개수와 무관하게 0. 실패 매체 정보는 stdout/log 참조.
    return 0


def cli() -> None:
    """python -m tteuniyu_worker.main 또는 `worker` 스크립트 진입점."""

    parser = argparse.ArgumentParser(
        prog="worker",
        description="뜬이유 RSS 워커 (P0a Foundation)",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # dry-run — RSS 응답·entry 수만 확인 (DB·HTML 적재 X)
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

    # ingest (PR #23) — RSS + HTML 본문 추출 (RAM only) + articles INSERT (메타만)
    sub_ing = sub.add_parser(
        "ingest",
        help="active sources RSS fetch + HTML 본문 추출 (RAM only) + articles INSERT",
    )
    sub_ing.add_argument(
        "--whitelist",
        type=Path,
        default=Path("config/sources_whitelist.yaml"),
        help="whitelist 파일 경로",
    )
    sub_ing.add_argument(
        "--max-concurrent",
        type=int,
        default=4,
        help="동시 ingest 개수 (default: 4, HTML fetch 포함)",
    )

    # cluster (T-006 Step 4) — 임베딩 + 클러스터링 dry-run (DB 적재 X)
    sub_cls = sub.add_parser(
        "cluster",
        help="article 제목 list → 임베딩 + 클러스터링 dry-run (RAM only, DB 적재 X)",
    )
    sub_cls.add_argument(
        "--titles",
        nargs="+",
        required=True,
        help="클러스터링 대상 제목 (공백 구분, 따옴표 사용 권장)",
    )
    sub_cls.add_argument(
        "--category",
        default=None,
        help="공통 카테고리 (예 economy, politics) — ad_allowed 정책 검증용",
    )

    # summarize (T-006 Step 5) — Gemini 요약 dry-run + audit log
    sub_sum = sub.add_parser(
        "summarize",
        help="cluster 제목 list → why_trending + coverage_summary (LLM_BACKEND=stub|gemini)",
    )
    sub_sum.add_argument("--headlines", nargs="+", required=True, help="cluster 헤드라인")
    sub_sum.add_argument("--category", default=None, help="공통 카테고리")

    # trust-signal (T-006 Step 5) — Trust Tag 평가 dry-run + audit log
    sub_trust = sub.add_parser(
        "trust-signal",
        help="cluster 헤드라인 → hoax/clickbait/investment Trust Signal 평가",
    )
    sub_trust.add_argument("--headlines", nargs="+", required=True, help="cluster 헤드라인")
    sub_trust.add_argument("--category", default=None, help="ad_allowed + human_review 정책")
    sub_trust.add_argument("--sample-size", type=int, default=10, help="cluster 표본 수")
    sub_trust.add_argument("--single-source", action="store_true", help="단일 매체만일 때")

    # digest (ADR-017) — Daily Digest 발송 (mock subscribers + Resend or stub)
    sub_dig = sub.add_parser(
        "digest",
        help="Daily Digest 발송 — mock subscribers (DIGEST_BACKEND=stub|resend)",
    )
    sub_dig.add_argument("--dry-run", action="store_true", help="실 발송 X (stub backend 강제)")

    # match-topics (ADR-018) — Custom Topic 매칭 cycle (mock or Supabase)
    sub_match = sub.add_parser(
        "match-topics",
        help="Custom Topic ↔ 신규 cluster 매칭 (TOPIC_MATCHER_BACKEND=stub|supabase)",
    )

    args = parser.parse_args()
    configure_logging()

    if args.command == "dry-run":
        exit_code = asyncio.run(run_dry(args.whitelist, args.max_concurrent))
        sys.exit(exit_code)

    if args.command == "ingest":
        from tteuniyu_worker.ingest import render_summary, run_ingest
        from tteuniyu_worker.sources import filter_active, load

        whitelist = load(args.whitelist)
        active = filter_active(whitelist)
        stats = asyncio.run(run_ingest(active, args.max_concurrent))
        fail_count = render_summary(stats)
        # 운영 정책 — 일부 매체 실패는 정상 (URL drift 일상). 전 매체 실패만 catastrophic.
        # success == 0이면 outage 신호로 exit 1, 그 외엔 0.
        success_count = len(stats) - fail_count
        sys.exit(0 if success_count > 0 else 1)

    if args.command == "cluster":
        from tteuniyu_worker.cluster import embed_and_cluster
        from tteuniyu_worker.embed import get_embedder

        embedder = get_embedder()
        categories = [args.category] * len(args.titles) if args.category else None
        results = embed_and_cluster(args.titles, categories, embedder)
        console.print(f"[green]✅ {len(args.titles)} 제목 → {len(results)} 클러스터[/green]")
        for r in results:
            members = ", ".join(args.titles[i][:30] for i in r.article_indices)
            console.print(
                f"  cluster {r.cluster_id} — quality={r.sample_quality}, "
                f"ad_allowed={r.ad_allowed}, members=[{members}]"
            )
        sys.exit(0)

    if args.command == "summarize":
        from tteuniyu_worker.cost_monitor import CostMonitor
        from tteuniyu_worker.summarize import get_summarizer

        cost_monitor = CostMonitor()
        summarizer = get_summarizer(cost_monitor=cost_monitor)
        result = summarizer.summarize(args.headlines, category=args.category)
        console.print(f"[green]✅ summarize ({result.audit.model})[/green]")
        console.print(f"  WHY        — {result.why_trending}")
        console.print(f"  COVERAGE   — {result.coverage_summary}")
        console.print(
            f"  audit      — copy_ratio={result.audit.copy_ratio:.3f}, "
            f"blocked={result.audit.blocked_terms_result}, "
            f"human_review={result.audit.human_review_required}, "
            f"cost=${result.audit.cost_usd:.5f}"
        )
        sys.exit(0)

    if args.command == "trust-signal":
        from tteuniyu_worker.cost_monitor import CostMonitor
        from tteuniyu_worker.trust_signal import get_trust_signaler

        cost_monitor = CostMonitor()
        signaler = get_trust_signaler(cost_monitor=cost_monitor)
        result = signaler.evaluate(
            args.headlines,
            category=args.category,
            sample_size=args.sample_size,
            single_source=args.single_source,
        )
        console.print(f"[green]✅ trust-signal ({result.audit.model})[/green]")
        console.print(
            f"  hoax_likelihood={result.hoax_likelihood:.3f} / "
            f"clickbait={result.clickbait_score:.3f} / "
            f"is_investment={result.is_investment}"
        )
        console.print(f"  trust_tags    — {result.trust_tags}")
        console.print(
            f"  audit         — blocked={result.audit.blocked_terms_result}, "
            f"human_review={result.audit.human_review_required}, "
            f"cost=${result.audit.cost_usd:.5f}"
        )
        sys.exit(0)

    if args.command == "digest":
        import os as _os

        from tteuniyu_worker.digest import (
            mock_payload,
            mock_subscribers,
            send_to_all_subscribers,
        )

        if args.dry_run:
            _os.environ["DIGEST_BACKEND"] = "stub"

        subscribers = mock_subscribers()
        results = send_to_all_subscribers(subscribers, mock_payload)
        ok = sum(1 for r in results if r.sent)
        console.print(
            f"[green]✅ digest — {ok}/{len(results)} subscribers (mock)[/green]"
        )
        for r in results:
            status = "✅" if r.sent else "❌"
            console.print(
                f"  {status} {r.email} — clusters={r.cluster_count}, "
                f"topic_matches={r.custom_topic_matches}, "
                f"message_id={r.message_id or '-'}"
            )
            if r.error:
                console.print(f"     [red]error: {r.error}[/red]")
        sys.exit(0 if ok == len(results) else 1)

    if args.command == "match-topics":
        from tteuniyu_worker.topic_matcher import run_matching_cycle

        stats = run_matching_cycle()
        console.print(f"[green]✅ match-topics[/green]")
        console.print(
            f"  topics={stats['topics']} / clusters={stats['clusters']} / "
            f"matches={stats['matches']} / inserted={stats['inserted']}"
        )
        sys.exit(0)

    parser.print_help()
    sys.exit(2)


if __name__ == "__main__":
    cli()
