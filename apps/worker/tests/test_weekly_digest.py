# Weekly Digest worker — 단위 테스트

from datetime import UTC, datetime, timedelta

from tteuniyu_worker.digest import (
    mock_subscribers,
    mock_weekly_payload,
    send_weekly_to_all_subscribers,
)
from tteuniyu_worker.digest_template import DigestSubscriber
from tteuniyu_worker.weekly_digest_template import (
    CategoryFlow,
    WeeklyDigestPayload,
    WeeklyIssueCard,
    render_weekly_digest_html,
    render_weekly_digest_text,
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


def _make_payload(with_flows: bool = True) -> WeeklyDigestPayload:
    end = datetime(2026, 5, 18, tzinfo=UTC)
    return WeeklyDigestPayload(
        period_start=end - timedelta(days=7),
        period_end=end,
        issue_no=38,
        total_articles=1247,
        editorial_paragraphs=["문단 하나.", "문단 둘.", "문단 셋."],
        issues=[
            WeeklyIssueCard(
                cluster_id="abc-1",
                title="삼성전자 노사 갈등",
                category="politics",
                weekly_outlets_count=38,
                timeline=[("월", "협상 시작"), ("수", "결렬"), ("금", "중노위 개입")],
            ),
            WeeklyIssueCard(
                cluster_id="abc-2",
                title="국민연금 개편안",
                category="economy",
                weekly_outlets_count=15,
                timeline=[("수", "윤곽 공개"), ("", "주말 찬반 논쟁")],
            ),
        ],
        category_flows=[
            CategoryFlow(category="politics", percent=42, article_count=524),
            CategoryFlow(category="economy", percent=31, article_count=387),
        ]
        if with_flows
        else [],
    )


# ─── HTML 렌더링 ──────────────────────────────────────────────


def test_html_includes_unsubscribe_link():
    """정통망법 §50 — 1-click 수신거부 link 필수."""
    sub = _make_subscriber()
    html = render_weekly_digest_html(sub, _make_payload())
    assert sub.unsubscribe_url in html
    assert "1-click 수신거부" in html


def test_html_includes_brand_and_period():
    """헤더 — 뜬이유 WEEKLY 브랜드 + 기간 표기."""
    html = render_weekly_digest_html(_make_subscriber(), _make_payload())
    assert "뜬이유 WEEKLY" in html
    assert "5월 11일 — 5월 18일" in html
    assert "WEEKLY No. 38" in html


def test_html_uses_email_safe_system_font():
    """이메일 webfont 불가 — 시스템 폰트 스택만."""
    html = render_weekly_digest_html(_make_subscriber(), _make_payload())
    assert "-apple-system" in html
    assert "Pretendard" not in html


def test_html_investment_notice_always_present():
    """변호사 §1.4 — 자본시장법 고지 상시 노출."""
    html = render_weekly_digest_html(_make_subscriber(), _make_payload())
    assert "투자 자문이 아닙니다" in html


def test_html_renders_weekly_timeline():
    """주중 전개 — 요일 라벨 + 사건이 카드에 노출."""
    html = render_weekly_digest_html(_make_subscriber(), _make_payload())
    assert "주중 전개" in html
    assert "협상 시작" in html
    assert "중노위 개입" in html
    # 요일 없는 단계도 사건만 정상 렌더
    assert "주말 찬반 논쟁" in html


def test_html_renders_category_flow_bars():
    """이번 주 카테고리 흐름 — 퍼센트/건수 막대."""
    html = render_weekly_digest_html(_make_subscriber(), _make_payload(with_flows=True))
    assert "이번 주 카테고리 흐름" in html
    assert "42%" in html
    assert "524건" in html
    assert "총 1,247건" in html


def test_html_omits_category_section_when_no_flows():
    html = render_weekly_digest_html(_make_subscriber(), _make_payload(with_flows=False))
    assert "이번 주 카테고리 흐름" not in html


def test_html_escapes_user_content():
    """XSS 방어 — 이슈 제목/타임라인 escape."""
    payload = WeeklyDigestPayload(
        period_start=datetime(2026, 5, 11, tzinfo=UTC),
        period_end=datetime(2026, 5, 18, tzinfo=UTC),
        issues=[
            WeeklyIssueCard(
                cluster_id="x",
                title="<script>alert(1)</script>",
                category="economy",
                weekly_outlets_count=1,
                timeline=[("월", "<img src=x>")],
            )
        ],
    )
    html = render_weekly_digest_html(_make_subscriber(), payload)
    assert "<script>alert(1)</script>" not in html
    assert "&lt;script&gt;" in html


def test_html_no_banned_investment_words():
    """hard-block 투자 단어 0건."""
    html = render_weekly_digest_html(_make_subscriber(), _make_payload())
    banned = ["매수", "매도", "호재", "악재", "목표가", "예측", "추천", "전망"]
    for word in banned:
        assert word not in html, f"banned word '{word}' leaked into HTML"


def test_html_no_realtime_naming_ban_words():
    """CLAUDE.md Naming Ban — '실검' 등 금지어 0건."""
    html = render_weekly_digest_html(_make_subscriber(), _make_payload())
    for banned in ["실시간 검색어", "실검", "인기 검색어", "실시간 순위"]:
        assert banned not in html


# ─── Text 템플릿 ──────────────────────────────────────────────


def test_text_includes_unsubscribe_url():
    sub = _make_subscriber()
    text = render_weekly_digest_text(sub, _make_payload())
    assert sub.unsubscribe_url in text


def test_text_does_not_include_html_tags():
    text = render_weekly_digest_text(_make_subscriber(), _make_payload())
    assert "<" not in text
    assert ">" not in text


def test_text_includes_timeline_and_flows():
    text = render_weekly_digest_text(_make_subscriber(), _make_payload())
    assert "주중 전개" in text
    assert "이번 주 카테고리 흐름" in text
    assert "삼성전자 노사 갈등" in text


# ─── mock + 발송 ───────────────────────────────────────────────


def test_mock_weekly_payload_smoke():
    """mock payload — 5개 이슈 + 4개 카테고리 흐름."""
    sub = mock_subscribers()[0]
    payload = mock_weekly_payload(sub)
    assert len(payload.issues) == 5
    assert len(payload.category_flows) == 4
    assert sum(f.percent for f in payload.category_flows) == 100


def test_send_weekly_to_all_subscribers_stub():
    subs = mock_subscribers()
    results = send_weekly_to_all_subscribers(subs, mock_weekly_payload)
    assert len(results) == len(subs)
    for r in results:
        assert r.sent is True
        assert r.cluster_count == 5
        assert r.message_id is not None


def test_editorial_auto_generated_when_empty():
    """editorial_paragraphs 비우면 첫 이슈 기반 1문단 자동 생성."""
    payload = WeeklyDigestPayload(
        period_start=datetime(2026, 5, 11, tzinfo=UTC),
        period_end=datetime(2026, 5, 18, tzinfo=UTC),
        issues=[
            WeeklyIssueCard(
                cluster_id="a",
                title="자동 생성 테스트 이슈",
                category="society",
                weekly_outlets_count=5,
                timeline=[("월", "시작")],
            )
        ],
    )
    html = render_weekly_digest_html(_make_subscriber(), payload)
    assert "자동 생성 테스트 이슈" in html
