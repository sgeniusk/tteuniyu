# trafilatura HTML 본문 추출 — RAM only (CLAUDE.md rule 2)

"""HTML 본문 추출 — trafilatura 기반.

비협상 (CLAUDE.md rule 2) — 본문 텍스트는 절대 DB 저장 X. 본 모듈은 RAM에서만
처리, caller가 LLM 요약(PR #25)에 즉시 전달 후 폐기.

비협상 (CLAUDE.md rule 3) — image URL 추출 X. trafilatura 옵션으로 image 제외.

비협상 (ADR-013) — 본론 추출은 사용자 toggle 시 시연용. P0a 단계에서는 LLM 요약
파이프라인 입력으로만 사용 (PR #25). UI toggle은 V0.5+ 별도 ADR에서.

trafilatura.extract().
  - include_comments=False (광고/스팸 제외)
  - include_tables=False (P0a — 표 데이터 제외)
  - include_images=False (rule 3)
  - include_links=False (외부 링크 제외)
  - favor_precision=True (Korean media에서 false positive 줄임)
  - target_language='ko' (Korean 매체 우선, 외신은 None)
"""

from __future__ import annotations

from dataclasses import dataclass

import structlog
import trafilatura

logger = structlog.get_logger(__name__)


@dataclass(frozen=True)
class ExtractResult:
    """본문 추출 결과 — RAM 전용. 절대 DB 저장 금지."""

    body: str
    char_count: int
    is_korean: bool


def extract_body(html: str, *, is_korean: bool = True) -> ExtractResult | None:
    """HTML → 본문 텍스트.

    실패 시 None 반환 (paywall, JS-only render, anti-bot 등).
    """

    if not html or len(html) < 200:
        return None

    body = trafilatura.extract(
        html,
        include_comments=False,
        include_tables=False,
        include_images=False,
        include_links=False,
        favor_precision=True,
        target_language="ko" if is_korean else None,
    )

    if not body:
        return None

    body = body.strip()
    if not body:
        return None

    return ExtractResult(
        body=body,
        char_count=len(body),
        is_korean=is_korean,
    )
