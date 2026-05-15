# Daily Digest HTML/Text 템플릿 — Pretendard inline + 정통망법 footer
#
# 비협상.
#   - 정통망법 §50 — footer에 1-click unsubscribe link 필수
#   - 변호사 §1.3 — Trust Tag 4종 라벨 (검증 필요/제목-본문 괴리/표본 부족/기업 관련 이슈)
#   - 변호사 §1.4 — 자본시장법 고지 ("본 정보는 투자 자문이 아닙니다")
#
# Gmail/Naver Mail 호환 — inline CSS만, 외부 stylesheet 사용 X.

from __future__ import annotations

import html as html_escape
from dataclasses import dataclass, field
from datetime import datetime

DEFAULT_TEMPLATE_VERSION = "digest_v1.0"

# Trust Tag UI 라벨 매핑 (변호사 권고 ADR-015 Amendment 2)
TRUST_TAG_UI_LABELS = {
    "hoax": ("⚠ 검증 필요", "#dc2626"),
    "clickbait": ("⚠ 제목-본문 괴리 가능성", "#dc2626"),
    "low_confidence": ("⚠ 표본 부족", "#f59e0b"),
    "investment": ("🏢 기업 관련 이슈", "#f59e0b"),
}

CATEGORY_LABELS = {
    "politics": "🏛 정치",
    "society": "👥 사회",
    "economy": "💹 경제",
    "international": "🌐 국제",
    "tech_science": "🔬 IT·과학",
    "culture_sports": "🎭 문화·스포츠",
    "lifestyle": "☀ 라이프",
}


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


# ─── HTML 템플릿 ─────────────────────────────────────────────


def render_digest_html(subscriber: DigestSubscriber, payload: DigestPayload) -> str:
    """Gmail/Naver Mail 호환 HTML — inline CSS만."""

    date_str = payload.digest_date.strftime("%Y년 %m월 %d일")
    body_parts: list[str] = []

    # Custom Topic 매칭 (있으면 상단)
    if subscriber.include_custom_topics and payload.custom_topic_matches:
        body_parts.append(_render_custom_topic_section(payload.custom_topic_matches))

    # 카테고리별 클러스터
    body_parts.append(_render_clusters_by_category(payload.clusters))

    # 자본시장법 고지 (investment 태그 있는 경우만)
    has_investment = any(c.trust_tag == "investment" for c in payload.clusters)
    if has_investment:
        body_parts.append(_render_investment_notice())

    body_html = "\n".join(body_parts)

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>뜬 이유 다이제스트</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Pretendard','Apple SD Gothic Neo',sans-serif;color:#0f172a;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;">
  <!-- Header -->
  <div style="border-bottom:2px solid #14b8a6;padding-bottom:16px;margin-bottom:24px;">
    <h1 style="margin:0;font-size:24px;font-weight:700;color:#14b8a6;font-family:'JetBrains Mono',monospace;">뜬 이유</h1>
    <p style="margin:4px 0 0;font-size:14px;color:#64748b;">🌅 {html_escape.escape(date_str)} 한국 이슈 다이제스트</p>
  </div>

  {body_html}

  {_render_footer(subscriber)}
</div>
</body>
</html>"""


def _render_custom_topic_section(matches: list[CustomTopicMatch]) -> str:
    items_html = "\n".join(
        f"""
        <li style="margin-bottom:12px;">
          <strong style="color:#14b8a6;">🔍 {html_escape.escape(m.keyword)}</strong> →
          <a href="https://tteuniyu.com/cluster/{m.cluster_id}?utm_source=digest&utm_medium=email" style="color:#0f172a;text-decoration:none;">
            {html_escape.escape(m.cluster_title)}
          </a>
          <span style="color:#64748b;font-size:13px;">({m.outlets_count}개 매체)</span>
        </li>
        """
        for m in matches
    )
    return f"""
  <section style="background:#f0fdfa;border-left:4px solid #14b8a6;padding:16px 20px;border-radius:6px;margin-bottom:24px;">
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">추적 중인 키워드 매칭</h2>
    <ul style="margin:0;padding-left:0;list-style:none;">
      {items_html}
    </ul>
  </section>
"""


def _render_clusters_by_category(clusters: list[ClusterSummaryCard]) -> str:
    by_cat: dict[str, list[ClusterSummaryCard]] = {}
    for c in clusters:
        by_cat.setdefault(c.category, []).append(c)

    sections = []
    for cat, items in by_cat.items():
        cat_label = CATEGORY_LABELS.get(cat, cat)
        cards_html = "\n".join(_render_cluster_card(c) for c in items)
        sections.append(
            f"""
  <section style="margin-bottom:24px;">
    <h3 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">
      {html_escape.escape(cat_label)}
    </h3>
    {cards_html}
  </section>
"""
        )
    return "\n".join(sections)


def _render_cluster_card(cluster: ClusterSummaryCard) -> str:
    trust_html = ""
    if cluster.trust_tag and cluster.trust_tag in TRUST_TAG_UI_LABELS:
        label, color = TRUST_TAG_UI_LABELS[cluster.trust_tag]
        trust_html = f"""<span style="display:inline-block;font-size:12px;color:{color};font-weight:600;margin-right:6px;">{html_escape.escape(label)}</span>"""

    return f"""
    <div style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
      <p style="margin:0 0 6px;">
        {trust_html}
        <a href="https://tteuniyu.com/cluster/{cluster.cluster_id}?utm_source=digest&utm_medium=email" style="font-size:15px;font-weight:600;color:#0f172a;text-decoration:none;">
          {html_escape.escape(cluster.title)}
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">
        {html_escape.escape(cluster.why_trending)}
      </p>
      <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">
        {cluster.outlets_count}개 매체
      </p>
    </div>
"""


def _render_investment_notice() -> str:
    """변호사 §1.4 자본시장법 고지 — 투자 관련 cluster 있을 때만."""
    return """
  <section style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:6px;margin-bottom:24px;font-size:13px;color:#78350f;line-height:1.5;">
    💡 본 다이제스트의 기업 관련 이슈는 공개 보도·공시 요약입니다.
    투자 자문이 아니며, 투자의 책임은 본인에게 있습니다.
  </section>
"""


def _render_footer(subscriber: DigestSubscriber) -> str:
    """정통망법 §50 — 1-click 수신거부 + 사업자 정보."""
    return f"""
  <footer style="margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;line-height:1.6;">
    <p style="margin:0 0 8px;">
      이 메일은 뜬 이유 Pro+ 사용자에게 발송됩니다.
      <br>
      <a href="{html_escape.escape(subscriber.unsubscribe_url)}" style="color:#14b8a6;">수신거부 (1-click)</a>
      |
      <a href="https://tteuniyu.com/account/digest?utm_source=digest&utm_medium=email" style="color:#14b8a6;">설정 변경</a>
    </p>
    <p style="margin:0;font-size:11px;">
      뜬 이유 (TTEUN-IYU) · 한국 이슈 리스크 OS<br>
      문의 sgeniusk@gmail.com
    </p>
  </footer>
"""


# ─── Plain text 템플릿 (Gmail spam score 향상) ────────────────


def render_digest_text(subscriber: DigestSubscriber, payload: DigestPayload) -> str:
    date_str = payload.digest_date.strftime("%Y년 %m월 %d일")
    parts: list[str] = []
    parts.append(f"뜬 이유 다이제스트 — {date_str}\n")
    parts.append("=" * 50)

    if subscriber.include_custom_topics and payload.custom_topic_matches:
        parts.append("\n[추적 중인 키워드 매칭]\n")
        for m in payload.custom_topic_matches:
            parts.append(f"- {m.keyword} → {m.cluster_title} ({m.outlets_count}개 매체)")
            parts.append(f"  https://tteuniyu.com/cluster/{m.cluster_id}\n")

    parts.append("\n[오늘의 이슈]\n")
    by_cat: dict[str, list[ClusterSummaryCard]] = {}
    for c in payload.clusters:
        by_cat.setdefault(c.category, []).append(c)
    for cat, items in by_cat.items():
        parts.append(f"\n## {CATEGORY_LABELS.get(cat, cat)}")
        for c in items:
            tag_str = ""
            if c.trust_tag in TRUST_TAG_UI_LABELS:
                tag_str = f"[{TRUST_TAG_UI_LABELS[c.trust_tag][0]}] "
            parts.append(f"- {tag_str}{c.title} ({c.outlets_count}개 매체)")
            parts.append(f"  {c.why_trending}")
            parts.append(f"  https://tteuniyu.com/cluster/{c.cluster_id}")

    has_investment = any(c.trust_tag == "investment" for c in payload.clusters)
    if has_investment:
        parts.append("\n[기업 관련 이슈 안내]")
        parts.append("본 다이제스트의 기업 관련 이슈는 공개 보도·공시 요약입니다.")
        parts.append("투자 자문이 아니며, 투자의 책임은 본인에게 있습니다.")

    parts.append("\n" + "=" * 50)
    parts.append(f"수신거부 — {subscriber.unsubscribe_url}")
    parts.append("뜬 이유 · 한국 이슈 리스크 OS · sgeniusk@gmail.com")
    return "\n".join(parts)
