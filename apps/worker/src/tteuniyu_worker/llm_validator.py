# LLM output 검증기 — 변호사 권고 hard-block 40+ 단어
#
# 비협상 (변호사 의견서 §1.3 + ADR-015 Amendment 2 + CLAUDE.md rule 15).
#   - LLM 출력에 자본시장법 단어 발견 시 — 차단 + 재시도 또는 human_review_required=True
#   - 본 validator는 모든 summarize / trust_signal LLM call의 final 단계에서 호출

from __future__ import annotations

import re
from dataclasses import dataclass

# 변호사 권고 — Hard block 40+ 단어 (CLAUDE.md Naming Ban v1.7.2)
INVESTMENT_BANNED_KO: frozenset[str] = frozenset(
    {
        # 투자행동성
        "매수", "매도", "보유", "진입", "청산",
        "비중확대", "비중축소", "손절", "익절", "물타기", "관망",
        # 가격·수익성
        "목표가", "수익률", "상승 여력", "하락 위험",
        "급등", "급락", "반등", "조정", "상방", "하방",
        # 가치판단성
        "호재", "악재", "저평가", "고평가", "유망",
        "모멘텀", "리레이팅", "촉매",
        # 기타 가치판단
        "예측", "추천", "전망",
    }
)

INVESTMENT_BANNED_EN: frozenset[str] = frozenset(
    {
        "buy", "sell", "hold", "overweight", "underweight",
        "outperform", "underperform", "target price",
        "upside", "downside", "alpha",
    }
)

# 분류 키워드 (ADR-009 Amendment 1)
CLASSIFICATION_BANNED: frozenset[str] = frozenset(
    {
        "stance", "ideology", "ideological", "leaning",
        "left-leaning", "right-leaning", "left-wing", "right-wing",
        "보수 매체", "진보 매체", "중도 매체", "공영 매체",
        "이념 분류", "이념 분포", "성향 분류", "진영 라벨",
        "좌파 매체", "우파 매체",
    }
)

VALIDATOR_VERSION = "v1.7.2-lawyer-hardblock-2026-05-12"


@dataclass(frozen=True)
class ValidationResult:
    passed: bool
    blocked_terms: list[str]
    reason: str | None = None

    @property
    def status(self) -> str:
        """audit 'blocked_terms_result' 컬럼 값."""
        return "pass" if self.passed else "blocked"


def validate_llm_output(text: str) -> ValidationResult:
    """LLM 출력 검증 — 자본시장법 + 분류 키워드 hard-block.

    Returns ValidationResult with blocked_terms list (있으면).
    """
    if not text:
        return ValidationResult(passed=True, blocked_terms=[])

    blocked: list[str] = []

    # 한글 — substring 검사 (단어 경계 X — 한글은 형태소 처리 어려움)
    for word in INVESTMENT_BANNED_KO:
        if word in text:
            blocked.append(word)

    # 영문 — word boundary 검사 (b/case insensitive)
    text_lower = text.lower()
    for word in INVESTMENT_BANNED_EN:
        # word boundary or whitespace
        pattern = r"\b" + re.escape(word) + r"\b"
        if re.search(pattern, text_lower):
            blocked.append(word)

    # 분류 키워드
    for word in CLASSIFICATION_BANNED:
        if word in text or word.lower() in text_lower:
            blocked.append(word)

    if blocked:
        return ValidationResult(
            passed=False,
            blocked_terms=sorted(set(blocked)),
            reason=f"hard-block 단어 {len(set(blocked))}개 발견",
        )

    return ValidationResult(passed=True, blocked_terms=[])
