# Daily Digest HTML/Text 템플릿 — v2 디자인 (Claude Design 핸드오프 반영)
#
# 비협상.
#   - 정통망법 §50 — footer에 1-click unsubscribe link 필수
#   - 변호사 §1.3 — Trust Tag 4종 라벨 (검증 필요/제목-본문 괴리/표본 부족/기업 관련 이슈)
#   - 변호사 §1.4 — 자본시장법 고지 ("본 정보는 투자 자문이 아닙니다")
#
# Gmail/Naver Mail 호환 — 라이트 모드 100% inline CSS. 다크모드는 이메일에서
# @media (prefers-color-scheme) 가 유일하게 동작하는 방식이라 <style> 1블록 불가피.
#
# 디자인 출처 — docs/design-handoff/newsletter-design-brief.md + Claude Design v2 시안.

from __future__ import annotations

import html as html_escape
from dataclasses import dataclass, field
from datetime import datetime, timedelta

DEFAULT_TEMPLATE_VERSION = "digest_v2.0"

# 배포 도메인 — 커스텀 도메인 확보 시 한 곳만 변경.
BASE_URL = "https://tteuniyu.vercel.app"

# Trust Tag UI 라벨 + 색 (변호사 권고 ADR-015 Amendment 2).
# (라벨, 글자색, 배경색, 테두리색)
TRUST_TAG_UI = {
    "hoax": ("⚠ 검증 필요", "#dc2626", "#fef2f2", "#fecaca"),
    "clickbait": ("⚠ 제목-본문 괴리 가능성", "#dc2626", "#fef2f2", "#fecaca"),
    "low_confidence": ("⚠ 표본 부족", "#f59e0b", "#fff7ed", "#fed7aa"),
    "investment": ("🏢 기업 관련 이슈", "#f59e0b", "#fff7ed", "#fed7aa"),
}

# 하위 호환 — 기존 코드/테스트가 참조하던 매핑 (라벨, 색).
TRUST_TAG_UI_LABELS = {k: (v[0], v[1]) for k, v in TRUST_TAG_UI.items()}

CATEGORY_LABELS = {
    "politics": "🏛 정치",
    "society": "👥 사회",
    "economy": "💹 경제",
    "international": "🌐 국제",
    "tech_science": "🔬 IT·과학",
    "culture_sports": "🎭 문화·스포츠",
    "lifestyle": "☀ 라이프",
}

_WEEKDAY_KO = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"]

_FONT = "-apple-system, 'Malgun Gothic', '맑은 고딕', sans-serif"


@dataclass(frozen=True)
class DigestSubscriber:
    user_id: str
    email: str
    preferred_categories: list[str] = field(default_factory=list)
    include_custom_topics: bool = True
    include_frame_clash: bool = False
    unsubscribe_url: str = ""


@dataclass(frozen=True)
class ClusterSummaryCard:
    cluster_id: str
    title: str
    category: str
    outlets_count: int
    trust_tag: str | None  # 'hoax' / 'clickbait' / 'low_confidence' / 'investment' / None
    why_trending: str


@dataclass(frozen=True)
class CustomTopicMatch:
    keyword: str
    cluster_title: str
    cluster_id: str
    outlets_count: int


@dataclass(frozen=True)
class DigestPayload:
    digest_date: datetime
    clusters: list[ClusterSummaryCard]
    custom_topic_matches: list[CustomTopicMatch] = field(default_factory=list)
    # v2 디자인 — 헤더 에디토리얼 1문단. 비우면 첫 이슈 기반 자동 생성.
    editorial: str = ""
    # v2 디자인 — top strip 발행 번호. None이면 번호 생략.
    issue_no: int | None = None


# ─── 다크모드 <style> 블록 (이메일에서 불가피) ──────────────────

_DARK_STYLE = """<style>
@media (prefers-color-scheme: dark) {
  body, .dd-page { background-color: #0b0d11 !important; }
  .dd-card { background-color: #15181e !important; border-color: #262a32 !important; }
  .dd-band { background-color: #11141a !important; }
  .dd-divider { border-color: #262a32 !important; }
  .dd-title-xl, .dd-title-lg, .dd-title-md, .dd-strong { color: #f1f3f5 !important; }
  .dd-body { color: #c9ced6 !important; }
  .dd-meta { color: #8b95a3 !important; }
  .dd-faint { color: #6b7280 !important; }
  .dd-rank, .dd-eyebrow, .dd-link, .dd-why-label { color: #2dd4bf !important; }
  .dd-sep, .dd-dotdot { color: #3a4049 !important; }
  .dd-chip-teal { background-color: rgba(45,212,191,0.12) !important; color: #2dd4bf !important; }
  .dd-tag-red { background-color: rgba(220,38,38,0.14) !important; color: #f87171 !important; border-color: rgba(220,38,38,0.35) !important; }
  .dd-tag-amber { background-color: rgba(245,158,11,0.14) !important; color: #fbbf24 !important; border-color: rgba(245,158,11,0.35) !important; }
  .dd-keyword-card { background-color: #181b21 !important; border-color: #262a32 !important; }
  .dd-footer-link { color: #c9ced6 !important; }
}
</style>"""


# ─── HTML 템플릿 ─────────────────────────────────────────────


def render_digest_html(subscriber: DigestSubscriber, payload: DigestPayload) -> str:
    """Gmail/Naver Mail 호환 HTML — 라이트 inline + 다크모드 1 style 블록."""

    esc = html_escape.escape
    date = payload.digest_date
    date_str = f"{date.year}년 {date.month}월 {date.day}일"
    weekday = _WEEKDAY_KO[date.weekday()]

    # 에디토리얼 — 명시값 우선, 없으면 첫 이슈 기반 자동 생성.
    if payload.editorial:
        editorial = esc(payload.editorial)
    elif payload.clusters:
        editorial = (
            f"어제 한국은 <span class=\"dd-strong\" style=\"color:#0f172a; font-weight:700;\">"
            f"{esc(payload.clusters[0].title)}</span> 이슈가 가장 크게 다뤄졌습니다."
        )
    else:
        editorial = "어제 한국 언론이 무엇을, 왜 다뤘는지 정리했습니다."

    # 집계 시간범위 — 전날 18시 ~ 당일 06시.
    prev = date - timedelta(days=1)
    window = f"{prev.month}월 {prev.day}일 18시 ~ {date.month}월 {date.day}일 06시"

    issue_label = (
        f"ISSUE No. {payload.issue_no} &nbsp;·&nbsp; " if payload.issue_no else ""
    )

    # 이슈 카드 (받은 순서 = velocity 순위).
    total = len(payload.clusters)
    cards = "\n".join(
        _render_issue_card(c, i + 1, is_last=(i == total - 1))
        for i, c in enumerate(payload.clusters)
    )

    # 내 관심 토픽 섹션.
    topic_section = ""
    if subscriber.include_custom_topics and payload.custom_topic_matches:
        topic_section = _render_custom_topic_section(payload.custom_topic_matches)

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>뜬이유 Daily · {esc(date_str)}</title>
{_DARK_STYLE}
</head>
<body class="dd-page" style="margin:0; padding:0; background-color:#f4f4f2; font-family:{_FONT}; -webkit-font-smoothing:antialiased; color:#1a1a1a;">

<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; height:0; width:0;">
어제 한국 언론이 다룬 이슈 TOP {total} — 왜 떴고, 매체별로 어떻게 다뤘는가.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dd-page" style="background-color:#f4f4f2;">
  <tr>
    <td align="center" style="padding:20px 12px 40px 12px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
        <tr>
          <td class="dd-faint" style="padding:0 4px 10px 4px; font-size:11px; line-height:1.4; color:#9ca3af; letter-spacing:0.04em; font-family:{_FONT};">
            <span class="dd-rank" style="color:#14b8a6; font-weight:600;">●</span>&nbsp;&nbsp;{issue_label}매주 월–금 오전 7시 발행
          </td>
        </tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="dd-card" style="max-width:600px; width:100%; background-color:#ffffff; border:1px solid #e7e5e0;">

        <!-- HEADER -->
        <tr>
          <td class="dd-divider" style="padding:30px 32px 22px 32px; border-bottom:1px solid #ececec;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="dd-eyebrow" style="font-family:{_FONT}; font-size:12px; color:#14b8a6; font-weight:700; letter-spacing:0.12em; padding-bottom:8px;">
                  📬&nbsp; 뜬이유 DAILY
                </td>
              </tr>
              <tr>
                <td class="dd-title-xl" style="font-family:{_FONT}; font-size:24px; line-height:1.3; color:#0f172a; font-weight:700; padding-bottom:4px; letter-spacing:-0.01em;">
                  {esc(date_str)}&nbsp;<span class="dd-meta" style="color:#9ca3af; font-weight:400;">{weekday}</span>
                </td>
              </tr>
              <tr>
                <td class="dd-meta" style="font-family:{_FONT}; font-size:11px; color:#9ca3af; letter-spacing:0.08em; padding-bottom:16px;">
                  어제 한국 언론이 무엇을, 왜 다뤘는지
                </td>
              </tr>
              <tr>
                <td class="dd-body" style="font-family:{_FONT}; font-size:14px; line-height:1.65; color:#374151;">
                  {editorial}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- SECTION TITLE -->
        <tr>
          <td style="padding:24px 32px 4px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="dd-eyebrow" style="font-family:{_FONT}; font-size:11px; color:#14b8a6; font-weight:700; letter-spacing:0.14em; padding-bottom:4px;">
                  TODAY&nbsp;·&nbsp;TRENDING
                </td>
              </tr>
              <tr>
                <td class="dd-title-lg" style="font-family:{_FONT}; font-size:19px; color:#0f172a; font-weight:700; letter-spacing:-0.01em; padding-bottom:2px;">
                  지금 뜨는 이슈&nbsp;<span class="dd-faint" style="color:#cbd5e1; font-weight:400; font-size:15px;">TOP {total}</span>
                </td>
              </tr>
              <tr>
                <td class="dd-meta" style="font-family:{_FONT}; font-size:12px; color:#9ca3af; line-height:1.5; padding-bottom:8px;">
                  {window}&nbsp;&nbsp;·&nbsp;&nbsp;한국 언론 보도 기준
                </td>
              </tr>
            </table>
          </td>
        </tr>

        {cards}
        {topic_section}

      </table>

      {_render_footer(subscriber)}

    </td>
  </tr>
</table>

</body>
</html>"""


def _render_issue_card(cluster: ClusterSummaryCard, rank: int, is_last: bool) -> str:
    """이슈 카드 1개 — 순위 40px + 제목 + 왜떴나 + 메타줄."""
    esc = html_escape.escape
    cat_label = CATEGORY_LABELS.get(cluster.category, cluster.category)

    # Trust Tag 배지.
    trust_html = ""
    if cluster.trust_tag and cluster.trust_tag in TRUST_TAG_UI:
        label, fg, bg, border = TRUST_TAG_UI[cluster.trust_tag]
        tag_class = "dd-tag-red" if fg == "#dc2626" else "dd-tag-amber"
        trust_html = (
            f'&nbsp;&nbsp;<span class="dd-sep" style="color:#d1d5db;">·</span>&nbsp;&nbsp;'
            f'<span class="{tag_class}" style="display:inline-block; background-color:{bg}; '
            f'color:{fg}; border:1px solid {border}; padding:2px 7px; font-size:10.5px; '
            f'font-weight:600; border-radius:3px; line-height:1.2;">{esc(label)}</span>'
        )

    # 마지막 카드는 하단 테두리 + 여백.
    outer_border = (
        "border-top:1px solid #ececec; border-bottom:1px solid #ececec;"
        if is_last
        else "border-top:1px solid #ececec;"
    )
    outer_pad = "0 32px 22px 32px" if is_last else "0 32px"

    url = f"{BASE_URL}/cluster/{cluster.cluster_id}?utm_source=digest&utm_medium=email"

    return f"""
        <tr>
          <td style="padding:{outer_pad};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dd-divider" style="{outer_border}">
              <tr>
                <td style="padding:14px 0; vertical-align:top;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="72" valign="top" class="dd-rank" style="font-family:{_FONT}; font-size:40px; font-weight:800; color:#14b8a6; line-height:1; letter-spacing:-0.02em; padding-top:2px;">
                        {rank:02d}
                      </td>
                      <td valign="top" style="font-family:{_FONT};">
                        <div class="dd-title-md" style="font-size:16px; font-weight:700; color:#0f172a; line-height:1.35; letter-spacing:-0.01em; padding-bottom:4px;">
                          {esc(cluster.title)}
                        </div>
                        <div class="dd-body" style="font-size:13.5px; color:#4b5563; line-height:1.6; padding-bottom:12px;">
                          <span class="dd-why-label" style="color:#14b8a6; font-weight:600;">왜 떴나&nbsp;·</span>&nbsp;{esc(cluster.why_trending)}
                        </div>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td valign="middle" class="dd-meta" style="font-size:11.5px; color:#6b7280; line-height:1.7; font-family:{_FONT};">{esc(cat_label)}&nbsp;&nbsp;<span class="dd-sep" style="color:#d1d5db;">·</span>&nbsp;&nbsp;{cluster.outlets_count}개 매체 보도{trust_html}</td>
                            <td valign="middle" align="right" style="white-space:nowrap; padding-left:10px; font-family:{_FONT};"><a href="{url}" class="dd-link" style="font-size:12px; font-weight:600; color:#14b8a6; text-decoration:none;">매체별 비교&nbsp;→</a></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>"""


def _render_custom_topic_section(matches: list[CustomTopicMatch]) -> str:
    """내 관심 토픽 — 키워드별 그룹 카드."""
    esc = html_escape.escape

    # 키워드별 group (입력 순서 보존).
    grouped: dict[str, list[CustomTopicMatch]] = {}
    for m in matches:
        grouped.setdefault(m.keyword, []).append(m)

    cards: list[str] = []
    keywords = list(grouped.items())
    for idx, (keyword, items) in enumerate(keywords):
        is_last = idx == len(keywords) - 1
        links = "\n".join(
            f'<div class="dd-title-md" style="font-size:13.5px; color:#0f172a; '
            f'font-weight:600; line-height:1.55; padding-top:{"2px" if i == 0 else "0"};">'
            f'→ {esc(m.cluster_title)}</div>'
            for i, m in enumerate(items)
        )
        pad = "0 32px 24px 32px" if is_last else "0 32px"
        cards.append(
            f"""
        <tr>
          <td class="dd-band" style="padding:{pad}; background-color:#fafaf7;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dd-keyword-card" style="background-color:#ffffff; border:1px solid #ececec;">
              <tr>
                <td style="padding:12px 16px;">
                  <div class="dd-meta" style="font-size:11.5px; color:#9ca3af; padding-bottom:4px; font-family:{_FONT};">
                    <span class="dd-chip-teal" style="display:inline-block; background-color:#f0fdfa; color:#14b8a6; padding:2px 7px; font-size:11px; font-weight:700; border-radius:3px; letter-spacing:0.02em;">#&nbsp;{esc(keyword)}</span>&nbsp;&nbsp;<span class="dd-sep" style="color:#d1d5db;">·</span>&nbsp;&nbsp;매칭 {len(items)}건
                  </div>
                  {links}
                </td>
              </tr>
            </table>
          </td>
        </tr>"""
        )
        if not is_last:
            cards.append(
                '\n        <tr><td class="dd-band" style="background-color:#fafaf7; '
                'line-height:8px; font-size:8px;">&nbsp;</td></tr>'
            )

    total_matches = len(matches)
    return f"""
        <tr>
          <td class="dd-band" style="padding:22px 32px 6px 32px; background-color:#fafaf7;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="dd-eyebrow" style="font-family:{_FONT}; font-size:11px; color:#14b8a6; font-weight:700; letter-spacing:0.14em; padding-bottom:4px;">
                  MY&nbsp;·&nbsp;FOLLOWING
                </td>
              </tr>
              <tr>
                <td class="dd-title-lg" style="font-family:{_FONT}; font-size:19px; color:#0f172a; font-weight:700; letter-spacing:-0.01em; padding-bottom:2px;">
                  내 관심 토픽
                </td>
              </tr>
              <tr>
                <td class="dd-meta" style="font-family:{_FONT}; font-size:12px; color:#9ca3af; padding-bottom:14px;">
                  오늘 키워드와 매칭된 이슈 {total_matches}건
                </td>
              </tr>
            </table>
          </td>
        </tr>
        {"".join(cards)}
        <tr>
          <td class="dd-band" style="padding:0 32px 26px 32px; background-color:#fafaf7;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" class="dd-dotdot" style="font-family:{_FONT}; font-size:11px; color:#cbd5e1; letter-spacing:0.4em;">
                  · · ·
                </td>
              </tr>
            </table>
          </td>
        </tr>"""


def _render_footer(subscriber: DigestSubscriber) -> str:
    """정통망법 §50 — 1-click 수신거부 + 변호사 §1.4 자본시장법 고지."""
    esc = html_escape.escape
    unsub = esc(subscriber.unsubscribe_url) if subscriber.unsubscribe_url else "#"
    digest_settings = f"{BASE_URL}/account/digest?utm_source=digest&utm_medium=email"
    return f"""
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
        <tr>
          <td class="dd-faint" style="padding:20px 24px 14px 24px; font-family:{_FONT}; font-size:11px; color:#9ca3af; line-height:1.6; text-align:center;">
            본 정보는 투자 자문이 아닙니다. 뜬이유는 한국 언론 보도를 분석·요약해 제공하는 정보 서비스이며,<br>매체별 보도 내용의 사실 여부를 보증하지 않습니다.
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:6px 24px 14px 24px; font-family:{_FONT}; font-size:12px; color:#6b7280; line-height:2;">
            <a href="{digest_settings}" class="dd-footer-link" style="color:#374151; text-decoration:none; font-weight:600;">관심 토픽 관리</a>
            &nbsp;&nbsp;<span class="dd-sep" style="color:#d1d5db;">|</span>&nbsp;&nbsp;
            <a href="{BASE_URL}/widget" class="dd-footer-link" style="color:#374151; text-decoration:none; font-weight:600;">실시간 이슈 보기</a>
          </td>
        </tr>
        <tr>
          <td align="center" class="dd-title-md" style="padding:12px 24px 4px 24px; font-family:{_FONT}; font-size:13px; color:#0f172a; font-weight:700; letter-spacing:-0.01em;">
            뜬이유 &nbsp;<span class="dd-faint" style="color:#cbd5e1; font-weight:400;">—</span>&nbsp; 한국 언론이 지금 무엇을, 왜 다루는가
          </td>
        </tr>
        <tr>
          <td align="center" class="dd-faint" style="padding:4px 24px 10px 24px; font-family:{_FONT}; font-size:11px; color:#9ca3af; line-height:1.6;">
            뜬이유 (TTEUN-IYU) · 문의 sgeniusk@gmail.com
          </td>
        </tr>
        <tr>
          <td align="center" class="dd-faint" style="padding:6px 24px 22px 24px; font-family:{_FONT}; font-size:11px; color:#9ca3af; line-height:1.6;">
            {esc(subscriber.email)} 으로 발송되었습니다.&nbsp;
            <a href="{unsub}" class="dd-footer-link" style="color:#6b7280; text-decoration:underline;">1-click 수신거부</a>
          </td>
        </tr>
      </table>"""


# ─── Plain text 템플릿 (Gmail spam score 향상) ────────────────


def render_digest_text(subscriber: DigestSubscriber, payload: DigestPayload) -> str:
    date = payload.digest_date
    date_str = f"{date.year}년 {date.month}월 {date.day}일 {_WEEKDAY_KO[date.weekday()]}"
    parts: list[str] = []
    parts.append(f"뜬이유 Daily — {date_str}")
    parts.append("어제 한국 언론이 무엇을, 왜 다뤘는지")
    parts.append("=" * 50)

    if payload.editorial:
        parts.append(f"\n{payload.editorial}")
    elif payload.clusters:
        parts.append(
            f"\n어제 한국은 '{payload.clusters[0].title}' 이슈가 가장 크게 다뤄졌습니다."
        )

    parts.append(f"\n[지금 뜨는 이슈 TOP {len(payload.clusters)}]\n")
    for i, c in enumerate(payload.clusters, start=1):
        tag_str = ""
        if c.trust_tag in TRUST_TAG_UI:
            tag_str = f" [{TRUST_TAG_UI[c.trust_tag][0]}]"
        cat = CATEGORY_LABELS.get(c.category, c.category)
        parts.append(f"{i:02d}. {c.title}")
        parts.append(f"    왜 떴나 · {c.why_trending}")
        parts.append(f"    {cat} · {c.outlets_count}개 매체 보도{tag_str}")
        parts.append(f"    {BASE_URL}/cluster/{c.cluster_id}\n")

    if subscriber.include_custom_topics and payload.custom_topic_matches:
        parts.append("\n[내 관심 토픽]\n")
        grouped: dict[str, list[CustomTopicMatch]] = {}
        for m in payload.custom_topic_matches:
            grouped.setdefault(m.keyword, []).append(m)
        for keyword, items in grouped.items():
            parts.append(f"# {keyword} — 매칭 {len(items)}건")
            for m in items:
                parts.append(f"  → {m.cluster_title}")
            parts.append("")

    parts.append("=" * 50)
    parts.append("본 정보는 투자 자문이 아닙니다. 뜬이유는 한국 언론 보도를 분석·요약해")
    parts.append("제공하는 정보 서비스이며, 보도 내용의 사실 여부를 보증하지 않습니다.")
    parts.append(f"\n수신거부 (1-click) — {subscriber.unsubscribe_url}")
    parts.append("뜬이유 (TTEUN-IYU) · 문의 sgeniusk@gmail.com")
    return "\n".join(parts)
