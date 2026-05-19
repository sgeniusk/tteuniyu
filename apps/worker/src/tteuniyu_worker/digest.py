# Daily Digest 워커 — ADR-017 (Pro+ retention 핵심)
#
# 비협상.
#   - 정통망법 §50 — 모든 이메일 footer에 1-click unsubscribe link
#   - 정통망법 §50의2 — 발송 시각 09:00 KST (안전 시간대) — GHA cron 외부 강제
#   - 변호사 §5.3 — digest_consent + marketing_consent 분리
#   - ADR-016 — 만 14세 미만 발송 X (digest_subscriptions JOIN auth.users 시 검증)
#   - ADR-014 cost cap — Resend 발송 비용 별도 (LLM cost와 분리)
#
# Backend (env DIGEST_BACKEND).
#   stub (default) — Resend 호출 X, HTML 콘솔 출력 (CI/dev/dry-run)
#   resend — 실 발송 (RESEND_API_KEY 필요)

from __future__ import annotations

import json
import os
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

import structlog

from tteuniyu_worker.digest_template import (
    DEFAULT_TEMPLATE_VERSION,
    DigestPayload,
    DigestSubscriber,
    render_digest_html,
    render_digest_text,
)

if TYPE_CHECKING:
    from tteuniyu_worker.weekly_digest_template import WeeklyDigestPayload

logger = structlog.get_logger(__name__)


@dataclass(frozen=True)
class DigestSendResult:
    user_id: str
    email: str
    sent: bool
    message_id: str | None = None
    template_version: str = DEFAULT_TEMPLATE_VERSION
    cluster_count: int = 0
    custom_topic_matches: int = 0
    error: str | None = None


class StubDigestSender:
    """CI/dev용 — 콘솔 출력만, 실 발송 X."""

    def send(self, subscriber: DigestSubscriber, payload: DigestPayload) -> DigestSendResult:
        html = render_digest_html(subscriber, payload)
        text = render_digest_text(subscriber, payload)
        logger.info(
            "digest.stub.send",
            user_id=subscriber.user_id,
            email=subscriber.email,
            cluster_count=len(payload.clusters),
            custom_topic_matches=len(payload.custom_topic_matches),
            html_chars=len(html),
            text_chars=len(text),
        )
        return DigestSendResult(
            user_id=subscriber.user_id,
            email=subscriber.email,
            sent=True,
            message_id=f"stub-{subscriber.user_id}",
            cluster_count=len(payload.clusters),
            custom_topic_matches=len(payload.custom_topic_matches),
        )


_RESEND_API_URL = "https://api.resend.com/emails"


def _resend_post_email(
    *,
    api_key: str,
    from_email: str,
    to_email: str,
    subject: str,
    html: str,
    text: str,
    unsubscribe_url: str,
) -> tuple[str | None, str | None]:
    """Resend HTTP API 1건 발송 — (message_id, error) 반환. 예외는 error 문자열로.

    Daily / Weekly digest 공용. 정통망법 §50 — List-Unsubscribe 헤더 포함.
    """
    body = json.dumps(
        {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html,
            "text": text,
            # 정통망법 §50 — Unsubscribe header (1-click)
            "headers": {
                "List-Unsubscribe": f"<{unsubscribe_url}>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        _RESEND_API_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        response = urllib.request.urlopen(req, timeout=10)
        return json.loads(response.read()).get("id"), None
    except Exception as err:
        return None, str(err)


class ResendDigestSender:
    """Resend HTTP API 발송.

    설치 — uv sync --extra digest (resend SDK 또는 직접 HTTPX)
    Env — RESEND_API_KEY, DIGEST_FROM_EMAIL (default 'noreply@tteuniyu.com')
    """

    API_URL = _RESEND_API_URL

    def __init__(self) -> None:
        self.api_key = os.getenv("RESEND_API_KEY")
        self.from_email = os.getenv("DIGEST_FROM_EMAIL", "뜬이유 <noreply@tteuniyu.com>")

    def send(self, subscriber: DigestSubscriber, payload: DigestPayload) -> DigestSendResult:
        if not self.api_key:
            logger.error("digest.resend.no_api_key", user_id=subscriber.user_id)
            return DigestSendResult(
                user_id=subscriber.user_id,
                email=subscriber.email,
                sent=False,
                error="RESEND_API_KEY missing",
            )

        html = render_digest_html(subscriber, payload)
        text = render_digest_text(subscriber, payload)
        subject = f"🌅 어제 한국 이슈 다이제스트 — {payload.digest_date.strftime('%Y-%m-%d')}"

        message_id, error = _resend_post_email(
            api_key=self.api_key,
            from_email=self.from_email,
            to_email=subscriber.email,
            subject=subject,
            html=html,
            text=text,
            unsubscribe_url=subscriber.unsubscribe_url,
        )
        if error:
            logger.error("digest.resend.failed", error=error, user_id=subscriber.user_id)
            return DigestSendResult(
                user_id=subscriber.user_id,
                email=subscriber.email,
                sent=False,
                error=error,
            )
        logger.info(
            "digest.resend.sent",
            user_id=subscriber.user_id,
            email=subscriber.email,
            message_id=message_id,
        )
        return DigestSendResult(
            user_id=subscriber.user_id,
            email=subscriber.email,
            sent=True,
            message_id=message_id,
            cluster_count=len(payload.clusters),
            custom_topic_matches=len(payload.custom_topic_matches),
        )


def get_sender() -> StubDigestSender | ResendDigestSender:
    backend = os.getenv("DIGEST_BACKEND", "stub").lower()
    if backend == "resend":
        logger.info("digest.backend", choice="resend")
        return ResendDigestSender()
    logger.info("digest.backend", choice="stub")
    return StubDigestSender()


# ─── 송신 파이프라인 ─────────────────────────────────────────


def send_to_all_subscribers(
    subscribers: list[DigestSubscriber],
    payload_builder: Any,  # callable subscriber → DigestPayload
) -> list[DigestSendResult]:
    """모든 active 구독자에게 발송 — 결과 list 반환."""
    sender = get_sender()
    results: list[DigestSendResult] = []
    for subscriber in subscribers:
        payload = payload_builder(subscriber)
        result = sender.send(subscriber, payload)
        results.append(result)
    return results


# ─── 가짜 mock subscribers + payload (CI/dev/dry-run) ────────


def mock_subscribers() -> list[DigestSubscriber]:
    return [
        DigestSubscriber(
            user_id="00000000-0000-4000-8000-000000000001",
            email="creator@example.com",
            preferred_categories=["economy", "tech_science"],
            include_custom_topics=True,
            include_frame_clash=True,
            unsubscribe_url="https://tteuniyu.com/unsubscribe?token=mock-token",
        ),
    ]


def mock_payload(subscriber: DigestSubscriber) -> DigestPayload:
    from tteuniyu_worker.digest_template import (
        ClusterSummaryCard,
        CustomTopicMatch,
    )

    return DigestPayload(
        digest_date=datetime.now(timezone.utc),
        clusters=[
            ClusterSummaryCard(
                cluster_id="00000000-0000-4000-8000-000000000010",
                title="삼성전자 1분기 반도체 흑자 전환",
                category="economy",
                outlets_count=26,
                trust_tag="investment",
                why_trending="실적 발표로 매체 26곳이 동시 보도.",
            ),
            ClusterSummaryCard(
                cluster_id="00000000-0000-4000-8000-000000000011",
                title="국민연금 개편안 4분의 1 가입자 영향",
                category="politics",
                outlets_count=18,
                trust_tag=None,
                why_trending="개편 영향 범위 발표가 보도 폭증의 직접 원인.",
            ),
        ],
        custom_topic_matches=[
            CustomTopicMatch(
                keyword="삼성전자 반도체",
                cluster_title="삼성전자 1분기 반도체 흑자 전환",
                cluster_id="00000000-0000-4000-8000-000000000010",
                outlets_count=26,
            ),
        ]
        if subscriber.include_custom_topics
        else [],
    )


# ─── Weekly Digest — mock payload + 발송 (stub) ───────────────


def mock_weekly_payload(subscriber: DigestSubscriber) -> WeeklyDigestPayload:
    """CI/dev/dry-run용 가짜 Weekly payload — Claude Design 시안 샘플 데이터."""
    from datetime import timedelta

    from tteuniyu_worker.weekly_digest_template import (
        CategoryFlow,
        WeeklyDigestPayload,
        WeeklyIssueCard,
    )

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=7)
    return WeeklyDigestPayload(
        period_start=start,
        period_end=end,
        issue_no=1,
        total_articles=1247,
        editorial_paragraphs=[
            "이번 주 한국 언론은 삼성전자 노사 갈등을 주 내내 1면에서 다뤘습니다. "
            "월요일 협상이 시작될 때만 해도 통상적인 임단협 국면이었지만, 수요일 "
            "결렬과 함께 정부 개입 신호가 더해지며 주간 최대 사안이 됐습니다.",
            "주 후반에는 코스피 급락과 맞물리며 경제 불안 정서가 빠르게 번졌습니다. "
            "노사 이슈를 단독 사안으로 다루던 매체들도 금요일을 기점으로 함께 묶어 "
            "분석하기 시작했습니다.",
            "외교에서는 한미 정상 통화가 변수로 등장했습니다. 통화 직후 공개된 "
            "팩트시트의 해석을 두고 매체별 결이 갈렸습니다.",
        ],
        issues=[
            WeeklyIssueCard(
                cluster_id="00000000-0000-4000-8000-000000000010",
                title="삼성전자 노사 갈등",
                category="politics",
                weekly_outlets_count=38,
                timeline=[("월", "협상 시작"), ("수", "결렬"), ("금", "중노위 개입")],
            ),
            WeeklyIssueCard(
                cluster_id="00000000-0000-4000-8000-000000000011",
                title="코스피 급락·셀코리아",
                category="economy",
                weekly_outlets_count=29,
                timeline=[("화", "하락 시작"), ("금", "7443 마감")],
            ),
            WeeklyIssueCard(
                cluster_id="00000000-0000-4000-8000-000000000012",
                title="한미 정상 통화",
                category="international",
                weekly_outlets_count=22,
                timeline=[("목", "통화"), ("금", "팩트시트 공개")],
            ),
            WeeklyIssueCard(
                cluster_id="00000000-0000-4000-8000-000000000013",
                title="전세사기 특별법 후속 논의",
                category="society",
                weekly_outlets_count=18,
                timeline=[("월", "기자회견"), ("", "주 내내 후속")],
            ),
            WeeklyIssueCard(
                cluster_id="00000000-0000-4000-8000-000000000014",
                title="국민연금 개편안 윤곽",
                category="economy",
                weekly_outlets_count=15,
                timeline=[("수", "윤곽 공개"), ("", "주말 찬반 논쟁")],
            ),
        ],
        category_flows=[
            CategoryFlow(category="politics", percent=42, article_count=524),
            CategoryFlow(category="economy", percent=31, article_count=387),
            CategoryFlow(category="society", percent=15, article_count=187),
            CategoryFlow(category="international", percent=12, article_count=149),
        ],
    )


def send_weekly_to_all_subscribers(
    subscribers: list[DigestSubscriber],
    payload_builder: Any,  # callable subscriber → WeeklyDigestPayload
) -> list[DigestSendResult]:
    """Weekly Digest 발송 — DIGEST_BACKEND=resend 시 실 발송, 아니면 stub.

    Daily와 동일 env(DIGEST_BACKEND / RESEND_API_KEY / DIGEST_FROM_EMAIL).
    """
    from tteuniyu_worker.weekly_digest_template import (
        render_weekly_digest_html,
        render_weekly_digest_text,
    )

    backend = os.getenv("DIGEST_BACKEND", "stub").lower()
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("DIGEST_FROM_EMAIL", "뜬이유 <noreply@tteuniyu.com>")
    use_resend = backend == "resend" and bool(api_key)
    logger.info(
        "weekly_digest.backend",
        choice="resend" if use_resend else "stub",
        api_key_present=bool(api_key),
    )

    results: list[DigestSendResult] = []
    for subscriber in subscribers:
        payload = payload_builder(subscriber)
        html = render_weekly_digest_html(subscriber, payload)
        text = render_weekly_digest_text(subscriber, payload)
        issue_count = len(payload.issues)

        if use_resend:
            start, end = payload.period_start, payload.period_end
            subject = (
                f"📰 이번 주 한국 이슈 — "
                f"{start.month}/{start.day}~{end.month}/{end.day}"
            )
            message_id, error = _resend_post_email(
                api_key=api_key,  # type: ignore[arg-type]
                from_email=from_email,
                to_email=subscriber.email,
                subject=subject,
                html=html,
                text=text,
                unsubscribe_url=subscriber.unsubscribe_url,
            )
            if error:
                logger.error(
                    "weekly_digest.resend.failed",
                    error=error,
                    user_id=subscriber.user_id,
                )
            else:
                logger.info(
                    "weekly_digest.resend.sent",
                    user_id=subscriber.user_id,
                    email=subscriber.email,
                    message_id=message_id,
                )
            results.append(
                DigestSendResult(
                    user_id=subscriber.user_id,
                    email=subscriber.email,
                    sent=error is None,
                    message_id=message_id,
                    cluster_count=issue_count,
                    error=error,
                )
            )
            continue

        # stub — backend=resend 인데 api_key 없으면 실패 처리.
        if backend == "resend":
            logger.error("weekly_digest.resend.no_api_key", user_id=subscriber.user_id)
            results.append(
                DigestSendResult(
                    user_id=subscriber.user_id,
                    email=subscriber.email,
                    sent=False,
                    cluster_count=issue_count,
                    error="RESEND_API_KEY missing",
                )
            )
            continue

        logger.info(
            "weekly_digest.stub.send",
            user_id=subscriber.user_id,
            email=subscriber.email,
            issue_count=issue_count,
            category_flows=len(payload.category_flows),
            html_chars=len(html),
            text_chars=len(text),
        )
        results.append(
            DigestSendResult(
                user_id=subscriber.user_id,
                email=subscriber.email,
                sent=True,
                message_id=f"stub-weekly-{subscriber.user_id}",
                cluster_count=issue_count,
            )
        )
    return results
