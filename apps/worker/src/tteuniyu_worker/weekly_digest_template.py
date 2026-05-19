# Weekly Digest HTML/Text 템플릿 — Claude Design 핸드오프 반영
#
# Daily Digest v2(digest_template.py)와 동일한 디자인 언어 — 색·폰트·다크모드 공유.
# 콘텐츠 범위만 다름. Daily는 "어제 24시간", Weekly는 "지난 7일".
#
# 비협상.
#   - 정통망법 §50 — footer에 1-click unsubscribe link 필수
#   - 변호사 §1.4 — 자본시장법 고지 ("본 정보는 투자 자문이 아닙니다")
#
# Gmail/Naver Mail 호환 — 라이트 모드 100% inline CSS. 다크모드는 이메일에서
# @media (prefers-color-scheme) 가 유일하게 동작하는 방식이라 <style> 1블록 불가피.
#
# 디자인 출처 — docs/design-handoff/newsletter-design-brief.md + Claude Design 시안.

from __future__ import annotations

import html as html_escape
from dataclasses import dataclass, field
from datetime import datetime

from tteuniyu_worker.digest_template import (
    _FONT,
    BASE_URL,
    CATEGORY_LABELS,
    DigestSubscriber,
)

DEFAULT_WEEKLY_TEMPLATE_VERSION = "weekly_v1.0"

# 디자인 시안 — 일요일 18시 발행. 발행 주기는 추후 ADR로 확정.
WEEKLY_SUBTITLE = "이번 주 한국을 움직인 흐름"


@dataclass(frozen=True)
class WeeklyIssueCard:
    """주간 TOP 이슈 1건. Daily 카드의 '왜 떴나' 대신 '주중 전개' 타임라인."""

    cluster_id: str
    title: str
    category: str
    weekly_outlets_count: int
    # 주중 전개 — (요일 라벨, 사건) 단계 목록. 요일 라벨이 빈 문자열이면
    # 요일 강조 없이 사건만 렌더 (예: ("", "주 내내 후속")).
    timeline: list[tuple[str, str]] = field(default_factory=list)


@dataclass(frozen=True)
class CategoryFlow:
    """이번 주 카테고리 흐름 막대 1개."""

    category: str  # CATEGORY_LABELS 키 ('politics' 등)
    percent: int  # 0~100
    article_count: int


@dataclass(frozen=True)
class WeeklyDigestPayload:
    period_start: datetime
    period_end: datetime
    issues: list[WeeklyIssueCard]
    category_flows: list[CategoryFlow] = field(default_factory=list)
    # 에디토리얼 — 2~3문단 회고. 비우면 첫 이슈 기반 1문단 자동 생성.
    editorial_paragraphs: list[str] = field(default_factory=list)
    # top strip 발행 번호. None이면 번호 생략.
    issue_no: int | None = None
    # 카테고리 흐름 총 보도 건수. None이면 표기 생략.
    total_articles: int | None = None


# ─── 다크모드 <style> 블록 (이메일에서 불가피) ──────────────────

_WEEKLY_DARK_STYLE = """<style>
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
  .dd-bar-track { background-color: #262a32 !important; }
  .dd-bar-fill { background-color: #2dd4bf !important; }
  .dd-footer-link { color: #c9ced6 !important; }
}
</style>"""


def _format_period(start: datetime, end: datetime) -> str:
    return f"{start.month}월 {start.day}일 — {end.month}월 {end.day}일"


# ─── HTML 템플릿 ─────────────────────────────────────────────


def render_weekly_digest_html(
    subscriber: DigestSubscriber, payload: WeeklyDigestPayload
) -> str:
    """Gmail/Naver Mail 호환 HTML — 라이트 inline + 다크모드 1 style 블록."""

    esc = html_escape.escape
    period = _format_period(payload.period_start, payload.period_end)

    # 에디토리얼 — 명시값 우선, 없으면 첫 이슈 기반 1문단 자동 생성.
    if payload.editorial_paragraphs:
        paragraphs = payload.editorial_paragraphs
    elif payload.issues:
        paragraphs = [
            f"이번 주 한국 언론이 가장 크게 다룬 이슈는 "
            f"'{payload.issues[0].title}'였습니다."
        ]
    else:
        paragraphs = ["지난 7일간 한국 언론이 무엇을, 왜 다뤘는지 정리했습니다."]

    total = len(paragraphs)
    editorial_html = "\n".join(
        f"""              <tr>
                <td class="dd-body" style="font-family:{_FONT}; font-size:14px; line-height:1.7; color:#374151;{'' if i == total - 1 else ' padding-bottom:12px;'}">
                  {esc(p)}
                </td>
              </tr>"""
        for i, p in enumerate(paragraphs)
    )

    issue_label = (
        f"WEEKLY No. {payload.issue_no} &nbsp;·&nbsp; " if payload.issue_no else ""
    )

    issue_total = len(payload.issues)
    cards = "\n".join(
        _render_weekly_issue_card(c, i + 1, is_last=(i == issue_total - 1))
        for i, c in enumerate(payload.issues)
    )

    flow_section = ""
    if payload.category_flows:
        flow_section = _render_category_flow_section(
            payload.category_flows, payload.total_articles
        )

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>뜬이유 Weekly · {esc(period)}</title>
{_WEEKLY_DARK_STYLE}
</head>
<body class="dd-page" style="margin:0; padding:0; background-color:#f4f4f2; font-family:{_FONT}; -webkit-font-smoothing:antialiased; color:#1a1a1a;">

<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; height:0; width:0;">
지난 7일 한국 언론이 다룬 가장 큰 이슈 TOP {issue_total} — 주중 어떻게 전개됐는가.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dd-page" style="background-color:#f4f4f2;">
  <tr>
    <td align="center" style="padding:20px 12px 40px 12px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
        <tr>
          <td class="dd-faint" style="padding:0 4px 10px 4px; font-size:11px; line-height:1.4; color:#9ca3af; letter-spacing:0.04em; font-family:{_FONT};">
            <span class="dd-rank" style="color:#14b8a6; font-weight:600;">●</span>&nbsp;&nbsp;{issue_label}매주 일요일 오후 6시 발행
          </td>
        </tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="dd-card" style="max-width:600px; width:100%; background-color:#ffffff; border:1px solid #e7e5e0;">

        <!-- HEADER -->
        <tr>
          <td class="dd-divider" style="padding:30px 32px 24px 32px; border-bottom:1px solid #ececec;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="dd-eyebrow" style="font-family:{_FONT}; font-size:12px; color:#14b8a6; font-weight:700; letter-spacing:0.12em; padding-bottom:8px;">
                  📬&nbsp; 뜬이유 WEEKLY
                </td>
              </tr>
              <tr>
                <td class="dd-title-xl" style="font-family:{_FONT}; font-size:24px; line-height:1.3; color:#0f172a; font-weight:700; padding-bottom:4px; letter-spacing:-0.01em;">
                  {esc(period)}
                </td>
              </tr>
              <tr>
                <td class="dd-meta" style="font-family:{_FONT}; font-size:11px; color:#9ca3af; letter-spacing:0.08em; padding-bottom:18px;">
                  {WEEKLY_SUBTITLE}
                </td>
              </tr>
{editorial_html}
            </table>
          </td>
        </tr>

        <!-- SECTION TITLE -->
        <tr>
          <td style="padding:26px 32px 4px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="dd-eyebrow" style="font-family:{_FONT}; font-size:11px; color:#14b8a6; font-weight:700; letter-spacing:0.14em; padding-bottom:4px;">
                  THIS&nbsp;WEEK&nbsp;·&nbsp;BIGGEST
                </td>
              </tr>
              <tr>
                <td class="dd-title-lg" style="font-family:{_FONT}; font-size:19px; color:#0f172a; font-weight:700; letter-spacing:-0.01em; padding-bottom:2px;">
                  이번 주 가장 큰 이슈&nbsp;<span class="dd-faint" style="color:#cbd5e1; font-weight:400; font-size:15px;">TOP {issue_total}</span>
                </td>
              </tr>
              <tr>
                <td class="dd-meta" style="font-family:{_FONT}; font-size:12px; color:#9ca3af; line-height:1.5; padding-bottom:8px;">
                  {esc(period)}&nbsp;&nbsp;·&nbsp;&nbsp;주간 누적 보도량 기준
                </td>
              </tr>
            </table>
          </td>
        </tr>

        {cards}
        {flow_section}

      </table>

      {_render_weekly_footer(subscriber)}

    </td>
  </tr>
</table>

</body>
</html>"""


def _render_timeline(steps: list[tuple[str, str]]) -> str:
    """주중 전개 — (요일, 사건) 단계를 ' → '로 연결. 요일은 dd-strong."""
    esc = html_escape.escape
    rendered: list[str] = []
    for weekday, event in steps:
        seg = ""
        if weekday:
            seg = (
                f'<span class="dd-strong" style="color:#0f172a; font-weight:600;">'
                f"{esc(weekday)}</span>&nbsp;"
            )
        seg += esc(event)
        rendered.append(seg)
    arrow = ' <span class="dd-sep" style="color:#cbd5e1;">→</span> '
    return arrow.join(rendered)


def _render_weekly_issue_card(
    cluster: WeeklyIssueCard, rank: int, is_last: bool
) -> str:
    """주간 이슈 카드 1개 — 순위 40px + 제목 + 주중 전개 + 메타줄."""
    esc = html_escape.escape
    cat_label = CATEGORY_LABELS.get(cluster.category, cluster.category)
    timeline_html = _render_timeline(cluster.timeline)

    outer_border = (
        "border-top:1px solid #ececec; border-bottom:1px solid #ececec;"
        if is_last
        else "border-top:1px solid #ececec;"
    )
    outer_pad = "0 32px 22px 32px" if is_last else "0 32px"

    url = f"{BASE_URL}/cluster/{cluster.cluster_id}?utm_source=weekly&utm_medium=email"

    return f"""
        <tr>
          <td style="padding:{outer_pad};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dd-divider" style="{outer_border}">
              <tr>
                <td style="padding:16px 0; vertical-align:top;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="72" valign="top" class="dd-rank" style="font-family:{_FONT}; font-size:40px; font-weight:800; color:#14b8a6; line-height:1; letter-spacing:-0.02em; padding-top:2px;">
                        {rank:02d}
                      </td>
                      <td valign="top" style="font-family:{_FONT};">
                        <div class="dd-title-md" style="font-size:16px; font-weight:700; color:#0f172a; line-height:1.35; letter-spacing:-0.01em; padding-bottom:8px;">
                          {esc(cluster.title)}
                        </div>
                        <div class="dd-body" style="font-size:13px; color:#4b5563; line-height:1.55; padding-bottom:10px;">
                          <span class="dd-why-label" style="color:#14b8a6; font-weight:600;">주중 전개&nbsp;·</span>&nbsp;{timeline_html}
                        </div>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td valign="middle" class="dd-meta" style="font-size:11.5px; color:#6b7280; line-height:1.6; font-family:{_FONT};">{esc(cat_label)}&nbsp;&nbsp;<span class="dd-sep" style="color:#d1d5db;">·</span>&nbsp;&nbsp;주간 {cluster.weekly_outlets_count}개 매체</td>
                            <td valign="middle" align="right" style="white-space:nowrap; padding-left:10px; font-family:{_FONT};"><a href="{url}" class="dd-link" style="font-size:12px; font-weight:600; color:#14b8a6; text-decoration:none;">주간 전개 보기&nbsp;→</a></td>
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


def _render_category_bar(flow: CategoryFlow, is_last: bool) -> str:
    """카테고리 흐름 막대 1개 — 라벨 + 퍼센트/건수 + 8px teal 막대."""
    esc = html_escape.escape
    label = CATEGORY_LABELS.get(flow.category, flow.category)
    pct = max(0, min(100, flow.percent))
    remainder = 100 - pct
    bar_bottom = "8px" if is_last else "4px"

    # 막대 — fill 셀 + 잔여 셀. pct가 0/100인 극단은 셀 생략.
    fill_cell = (
        f'<td class="dd-bar-fill" width="{pct}%" style="background-color:#14b8a6; '
        f'height:8px; line-height:8px; font-size:1px; border-radius:3px;">&nbsp;</td>'
        if pct > 0
        else ""
    )
    rest_cell = (
        f'<td width="{remainder}%" style="height:8px; line-height:8px; '
        f'font-size:1px;">&nbsp;</td>'
        if remainder > 0
        else ""
    )

    return f"""
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:10px 0 4px 0; font-family:{_FONT};">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" class="dd-title-md" style="font-size:13px; color:#0f172a; font-weight:700; line-height:1.4;">
                        {esc(label)}
                      </td>
                      <td valign="middle" align="right" class="dd-meta" style="font-size:13px; color:#6b7280; line-height:1.4; font-family:{_FONT};">
                        <span class="dd-rank" style="color:#14b8a6; font-weight:700;">{pct}%</span>&nbsp;&nbsp;<span class="dd-faint" style="color:#cbd5e1;">·</span>&nbsp;&nbsp;{flow.article_count:,}건
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 0 {bar_bottom} 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dd-bar-track" style="background-color:#ececec; border-radius:3px;">
                    <tr>{fill_cell}{rest_cell}</tr>
                  </table>
                </td>
              </tr>
            </table>"""


def _render_category_flow_section(
    flows: list[CategoryFlow], total_articles: int | None
) -> str:
    """이번 주 카테고리 흐름 — band 배경 + 가로 막대."""
    total_str = (
        f"&nbsp;&nbsp;·&nbsp;&nbsp;총 {total_articles:,}건"
        if total_articles is not None
        else ""
    )
    bars = "".join(
        _render_category_bar(f, is_last=(i == len(flows) - 1))
        for i, f in enumerate(flows)
    )
    return f"""
        <tr>
          <td class="dd-band" style="padding:22px 32px 8px 32px; background-color:#fafaf7;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="dd-eyebrow" style="font-family:{_FONT}; font-size:11px; color:#14b8a6; font-weight:700; letter-spacing:0.14em; padding-bottom:4px;">
                  THIS&nbsp;WEEK&nbsp;·&nbsp;BREAKDOWN
                </td>
              </tr>
              <tr>
                <td class="dd-title-lg" style="font-family:{_FONT}; font-size:19px; color:#0f172a; font-weight:700; letter-spacing:-0.01em; padding-bottom:2px;">
                  이번 주 카테고리 흐름
                </td>
              </tr>
              <tr>
                <td class="dd-meta" style="font-family:{_FONT}; font-size:12px; color:#9ca3af; padding-bottom:14px;">
                  주간 누적 보도 비중{total_str}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="dd-band" style="padding:0 32px 8px 32px; background-color:#fafaf7;">
            {bars}
          </td>
        </tr>
        <tr>
          <td class="dd-band" style="padding:18px 32px 26px 32px; background-color:#fafaf7;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" class="dd-dotdot" style="font-family:{_FONT}; font-size:11px; color:#cbd5e1; letter-spacing:0.4em;">
                  · · ·
                </td>
              </tr>
            </table>
          </td>
        </tr>"""


def _render_weekly_footer(subscriber: DigestSubscriber) -> str:
    """정통망법 §50 — 1-click 수신거부 + 변호사 §1.4 자본시장법 고지."""
    esc = html_escape.escape
    unsub = esc(subscriber.unsubscribe_url) if subscriber.unsubscribe_url else "#"
    digest_settings = f"{BASE_URL}/account/digest?utm_source=weekly&utm_medium=email"
    archive = f"{BASE_URL}/digest/archive?utm_source=weekly&utm_medium=email"
    return f"""
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
        <tr>
          <td class="dd-faint" style="padding:20px 24px 14px 24px; font-family:{_FONT}; font-size:11px; color:#9ca3af; line-height:1.6; text-align:center;">
            본 정보는 투자 자문이 아닙니다. 뜬이유는 한국 언론 보도를 분석·요약해 제공하는 정보 서비스이며,<br>매체별 보도 내용의 사실 여부를 보증하지 않습니다.
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:6px 24px 14px 24px; font-family:{_FONT}; font-size:12px; color:#6b7280; line-height:2;">
            <a href="{archive}" class="dd-footer-link" style="color:#374151; text-decoration:none; font-weight:600;">지난 호 보기</a>
            &nbsp;&nbsp;<span class="dd-sep" style="color:#d1d5db;">|</span>&nbsp;&nbsp;
            <a href="{BASE_URL}/widget" class="dd-footer-link" style="color:#374151; text-decoration:none; font-weight:600;">실시간 이슈 보기</a>
            &nbsp;&nbsp;<span class="dd-sep" style="color:#d1d5db;">|</span>&nbsp;&nbsp;
            <a href="{digest_settings}" class="dd-footer-link" style="color:#374151; text-decoration:none; font-weight:600;">발행 주기 변경</a>
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


def render_weekly_digest_text(
    subscriber: DigestSubscriber, payload: WeeklyDigestPayload
) -> str:
    period = _format_period(payload.period_start, payload.period_end)
    parts: list[str] = []
    parts.append(f"뜬이유 Weekly — {period}")
    parts.append(WEEKLY_SUBTITLE)
    parts.append("=" * 50)

    if payload.editorial_paragraphs:
        for p in payload.editorial_paragraphs:
            parts.append(f"\n{p}")
    elif payload.issues:
        parts.append(
            f"\n이번 주 한국 언론이 가장 크게 다룬 이슈는 "
            f"'{payload.issues[0].title}'였습니다."
        )

    parts.append(f"\n[이번 주 가장 큰 이슈 TOP {len(payload.issues)}]\n")
    for i, c in enumerate(payload.issues, start=1):
        cat = CATEGORY_LABELS.get(c.category, c.category)
        timeline = " → ".join(
            f"{wd} {ev}".strip() for wd, ev in c.timeline
        )
        parts.append(f"{i:02d}. {c.title}")
        parts.append(f"    주중 전개 · {timeline}")
        parts.append(f"    {cat} · 주간 {c.weekly_outlets_count}개 매체")
        parts.append(f"    {BASE_URL}/cluster/{c.cluster_id}\n")

    if payload.category_flows:
        parts.append("\n[이번 주 카테고리 흐름]\n")
        for f in payload.category_flows:
            cat = CATEGORY_LABELS.get(f.category, f.category)
            parts.append(f"  {cat} — {f.percent}% · {f.article_count:,}건")
        parts.append("")

    parts.append("=" * 50)
    parts.append("본 정보는 투자 자문이 아닙니다. 뜬이유는 한국 언론 보도를 분석·요약해")
    parts.append("제공하는 정보 서비스이며, 보도 내용의 사실 여부를 보증하지 않습니다.")
    parts.append(f"\n수신거부 (1-click) — {subscriber.unsubscribe_url}")
    parts.append("뜬이유 (TTEUN-IYU) · 문의 sgeniusk@gmail.com")
    return "\n".join(parts)
