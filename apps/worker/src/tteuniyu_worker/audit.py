# LLM audit log — CLAUDE.md rule 9 + ADR-015 Amendment 2 + ADR-014
#
# 변호사 권고 — audit log는 면책 수단이 아닌 사후 검증·분쟁 대응용 (의견서 §1.5).
# 본 모듈은 모든 LLM call 결과를 구조화 + DB 적재 가능 형태로 변환.

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


@dataclass(frozen=True)
class LLMCallAudit:
    """단일 LLM call audit log.

    summaries / trust_signals 테이블 INSERT payload.
    DB 컬럼 — model / prompt_version / input_hash / output_hash /
    validator_version / copy_ratio / blocked_terms_result / human_review_required.
    """

    model: str
    prompt_version: str
    input_hash: str
    output_hash: str
    validator_version: str | None = None
    copy_ratio: float | None = None
    blocked_terms_result: str = "unknown"  # 'pass' / 'blocked' / 'unknown'
    human_review_required: bool = False
    generated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    cost_usd: float | None = None  # ADR-014 cost monitor 통합
    metadata: dict[str, Any] = field(default_factory=dict)

    def as_db_row(self, cluster_id: str | None = None) -> dict[str, Any]:
        return {
            "cluster_id": cluster_id,
            "model": self.model,
            "prompt_version": self.prompt_version,
            "input_hash": self.input_hash,
            "output_hash": self.output_hash,
            "validator_version": self.validator_version,
            "copy_ratio": self.copy_ratio,
            "blocked_terms_result": self.blocked_terms_result,
            "human_review_required": self.human_review_required,
            "generated_at": self.generated_at.isoformat(),
        }


def hash_text(text: str) -> str:
    """SHA-256 hex — input/output hash 표준."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def calculate_copy_ratio(source_text: str, output_text: str, ngram_size: int = 5) -> float:
    """source 대비 output의 n-gram overlap 비율.

    변호사 §2.6 — copy ratio ≤ 15% 권고. 본 함수는 단순 word-level n-gram 비교.

    Returns — 0.0~1.0 (output 단어 중 source에 그대로 등장하는 n-gram 비율).
    """
    src_words = source_text.split()
    out_words = output_text.split()
    if len(out_words) < ngram_size:
        return 0.0

    src_ngrams = set()
    for i in range(len(src_words) - ngram_size + 1):
        src_ngrams.add(" ".join(src_words[i : i + ngram_size]))

    matched = 0
    for i in range(len(out_words) - ngram_size + 1):
        ngram = " ".join(out_words[i : i + ngram_size])
        if ngram in src_ngrams:
            matched += 1

    total = len(out_words) - ngram_size + 1
    return matched / total if total > 0 else 0.0


def extract_token_counts(
    response: Any, fallback_input: str, fallback_output: str
) -> tuple[int, int]:
    """Gemini 응답에서 실제 토큰 수 추출 — (input_tokens, output_tokens).

    API의 usage_metadata가 실제 과금 토큰. 글자수 기반 추정은 한국어에서 크게
    어긋나고, 무엇보다 thinking 모델의 추론 토큰을 전혀 잡지 못한다.

    output에 thoughts_token_count(추론 토큰)를 합산 — 실제 과금 대상.
    usage_metadata 미제공 시에만 글자÷3 추정으로 fallback.
    """
    um = getattr(response, "usage_metadata", None)
    if um is not None:
        inp = int(getattr(um, "prompt_token_count", 0) or 0)
        out = int(getattr(um, "candidates_token_count", 0) or 0)
        out += int(getattr(um, "thoughts_token_count", 0) or 0)
        if inp > 0:
            return inp, out
    return len(fallback_input) // 3, len(fallback_output) // 3
