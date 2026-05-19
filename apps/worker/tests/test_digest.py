# Daily Digest worker — 단위 테스트 (ADR-017)

from datetime import datetime, timezone

import pytest

from tteuniyu_worker.digest import (
    StubDigestSender,
    get_sender,
    mock_payload,
    mock_subscribers,
)
from tteuniyu_worker.digest_template import (
    TRUST_TAG_UI_LABELS,
    ClusterSummaryCard,
    CustomTopicMatch,
    DigestPayload,
    DigestSubscriber,
    render_digest_html,
    render_digest_text,
)


# ─── Trust Tag UI 라벨 (변호사 권고) ──────────────────────────


def test_trust_tag_ui_labels_correct():
    """변호사 권고 ADR-015 Amendment 2 — 4종 라벨 정확."""
    assert TRUST_TAG_UI_LABELS["hoax"] == ("⚠ 검증 필요", "#dc2626")
    assert TRUST_TAG_UI_LABELS["clickbait"] == ("⚠ 제목-본문 괴리 가능성", "#dc2626")
    assert TRUST_TAG_UI_LABELS["low_confidence"] == ("⚠ 표본 부족", "#f59e0b")
    assert TRUST_TAG_UI_LABELS["investment"] == ("🏢 기업 관련 이슈", "#f59e0b")


def test_trust_tag_old_labels_not_present():
    """구버전 라벨 절대 X — '검증되지 않은 정보' / '낚시성 제목 가능성' / '보도 출처 부족' / '투자 정보'."""
    for old in ["검증되지 않은 정보", "낚시성 제목 가능성", "보도 출처 부족", "투자 정보"]:
        for tag, (label, _) in TRUST_TAG_UI_LABELS.items():
            assert old not in label, f"{tag} contains old label '{old}'"


# ─── HTML 렌더링 ──────────────────────────────────────────────


def _make_payload(trust_tag: str | None = None, with_topic: bool = False) -> DigestPayload:
    return DigestPayload(
        digest_date=datetime(2026, 5, 15, tzinfo=timezone.utc),
        clusters=[
            ClusterSummaryCard(
                cluster_id="abc-123",
                title="삼성전자 1분기 흑자 전환",
                category="economy",
                outlets_count=18,
                trust_tag=trust_tag,
                why_trending="실적 발표로 보도 폭증.",
            ),
        ],
        custom_topic_matches=[
            CustomTopicMatch(
                keyword="삼성전자",
                cluster_title="삼성전자 1분기 흑자 전환",
                cluster_id="abc-123",
                outlets_count=18,
            )
        ]
        if with_topic
        else [],
    )


def _make_subscriber(include_topics: bool = True) -> DigestSubscriber:
    return DigestSubscriber(
        user_id="u-1",
        email="creator@example.com",
        preferred_categories=["economy"],
        include_custom_topics=include_topics,
        include_frame_clash=False,
        unsubscribe_url="https://tteuniyu.com/unsubscribe?token=t-1",
    )


def test_html_includes_unsubscribe_link():
    """정통망법 §50 — 1-click 수신거부 link 필수."""
    sub = _make_subscriber()
    html = render_digest_html(sub, _make_payload())
    assert sub.unsubscribe_url in html


def test_html_includes_brand_뜬이유():
    """헤더에 '뜬이유' 브랜드 표시 (v2 — 붙여쓰기)."""
    html = render_digest_html(_make_subscriber(), _make_payload())
    assert "뜬이유" in html


def test_html_uses_email_safe_system_font():
    """v2 — 이메일은 webfont 불가. 시스템 폰트 스택만 사용 (Pretendard X)."""
    html = render_digest_html(_make_subscriber(), _make_payload())
    assert "-apple-system" in html
    assert "Pretendard" not in html


def test_html_investment_notice_always_present():
    """변호사 §1.4 — v2는 footer에 자본시장법 고지를 상시 노출 (always-on, 더 안전)."""
    no_invest = render_digest_html(_make_subscriber(), _make_payload(trust_tag=None))
    assert "투자 자문이 아닙니다" in no_invest

    with_invest = render_digest_html(_make_subscriber(), _make_payload(trust_tag="investment"))
    assert "투자 자문이 아닙니다" in with_invest


def test_html_includes_lawyer_mandated_label_when_trust_tag():
    html = render_digest_html(_make_subscriber(), _make_payload(trust_tag="hoax"))
    assert "검증 필요" in html
    assert "검증되지 않은 정보" not in html


def test_html_custom_topic_section_only_when_subscriber_opts_in():
    payload = _make_payload(with_topic=True)
    sub_yes = _make_subscriber(include_topics=True)
    sub_no = _make_subscriber(include_topics=False)
    html_yes = render_digest_html(sub_yes, payload)
    html_no = render_digest_html(sub_no, payload)
    assert "내 관심 토픽" in html_yes
    assert "내 관심 토픽" not in html_no


def test_html_html_escapes_user_content():
    """XSS 방어 — 사용자 입력 키워드/cluster title은 escape."""
    payload = DigestPayload(
        digest_date=datetime(2026, 5, 15, tzinfo=timezone.utc),
        clusters=[
            ClusterSummaryCard(
                cluster_id="x",
                title="<script>alert(1)</script>",
                category="economy",
                outlets_count=1,
                trust_tag=None,
                why_trending="<img src=x>",
            )
        ],
    )
    html = render_digest_html(_make_subscriber(), payload)
    assert "<script>alert(1)</script>" not in html
    assert "&lt;script&gt;" in html


# ─── Text 템플릿 ──────────────────────────────────────────────


def test_text_includes_unsubscribe_url():
    sub = _make_subscriber()
    text = render_digest_text(sub, _make_payload())
    assert sub.unsubscribe_url in text


def test_text_does_not_include_html_tags():
    text = render_digest_text(_make_subscriber(), _make_payload(trust_tag="hoax"))
    assert "<" not in text
    assert ">" not in text


# ─── Sender 인터페이스 ────────────────────────────────────────


def test_get_sender_default_returns_stub(monkeypatch):
    monkeypatch.delenv("DIGEST_BACKEND", raising=False)
    sender = get_sender()
    assert isinstance(sender, StubDigestSender)


def test_stub_sender_returns_success_result():
    sender = StubDigestSender()
    sub = _make_subscriber()
    payload = _make_payload(with_topic=True)
    result = sender.send(sub, payload)
    assert result.sent is True
    assert result.user_id == sub.user_id
    assert result.cluster_count == 1
    assert result.custom_topic_matches == 1


def test_mock_subscribers_and_payload_smoke():
    """End-to-end mock — stub sender로 발송."""
    subs = mock_subscribers()
    sender = StubDigestSender()
    for sub in subs:
        payload = mock_payload(sub)
        result = sender.send(sub, payload)
        assert result.sent is True


# ─── 비협상 정합 ────────────────────────────────────────────


def test_html_no_banned_investment_words():
    """LLM이 들어갈 자리는 미리 검증된 텍스트만 사용. 본 템플릿에는 hard-block 단어 0건."""
    html = render_digest_html(_make_subscriber(), _make_payload(trust_tag="investment"))
    banned = ["매수", "매도", "호재", "악재", "목표가", "예측", "추천", "전망"]
    for word in banned:
        assert word not in html, f"banned word '{word}' leaked into HTML template"
