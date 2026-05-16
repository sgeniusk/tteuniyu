# Cluster 요약 LLM — Gemini 2.0 Flash (ADR-014 Phase 1)
#
# 비협상.
#   - rule 9 — 모든 LLM call audit log (model + prompt_version + input/output hash)
#   - 변호사 §1.3 — output에 hard-block 40+ 단어 0건 강제
#   - 변호사 §2.6 — copy ratio ≤ 15%
#   - rule 2 — 본문 자체는 RAM only, summary만 DB
#
# Backend (env LLM_BACKEND).
#   stub (default) — deterministic dummy (CI/dev)
#   gemini — google.generativeai (실 운영, GEMINI_API_KEY 필요)

from __future__ import annotations

import os
from dataclasses import dataclass

import structlog

from tteuniyu_worker.audit import LLMCallAudit, calculate_copy_ratio, hash_text
from tteuniyu_worker.cost_monitor import CostMonitor, estimate_gemini_cost
from tteuniyu_worker.llm_validator import VALIDATOR_VERSION, validate_llm_output

logger = structlog.get_logger(__name__)

PROMPT_VERSION_SUMMARIZE = "summarize_v1"
# gemini-2.0-flash는 2026년 신규 사용자 단종 (404). 2.5-flash로 이전.
GEMINI_MODEL_NAME = "gemini-2.5-flash"


@dataclass(frozen=True)
class ClusterSummary:
    why_trending: str
    coverage_summary: str
    audit: LLMCallAudit


SUMMARIZE_PROMPT_TEMPLATE = """\
다음은 한국 매체들이 보도한 같은 이슈에 대한 기사 N개입니다. 두 가지 한국어 요약을 작성하세요.

[1] 왜 지금 떴는가 (1-2 문장, 50자 이내)
[2] 매체는 어떻게 다뤘나 (3-5 문장, 200자 이내)

[비협상 — 위반 시 출력 무효]
- 다음 단어 절대 금지 — 매수, 매도, 보유, 진입, 청산, 호재, 악재, 목표가,
  수익률, 예측, 추천, 전망, 모멘텀, buy, sell, target price.
- "stance", "이념 분류" 같은 매체 분류 단어 절대 금지.
- 가격·시세·차트·매수 추천 일체 금지.
- 매체별 헤드라인을 그대로 인용하지 말고 사실관계만 추출.

[기사들]
{articles}

[출력 형식]
WHY_TRENDING: <한 문장>
COVERAGE_SUMMARY: <2-5 문장>
"""


class StubSummarizer:
    """CI/dev용 deterministic stub."""

    def summarize(
        self, headlines: list[str], category: str | None = None
    ) -> ClusterSummary:
        articles_text = "\n".join(f"- {h}" for h in headlines[:10])
        why = f"매체 {len(headlines)}개가 동일 이슈를 보도하며 관심이 집중됨."
        coverage = (
            f"{len(headlines)}개 매체에서 보도된 이슈입니다. "
            f"세부 사실은 매체별 원문을 비교해 확인하세요."
        )

        prompt = SUMMARIZE_PROMPT_TEMPLATE.format(articles=articles_text)
        full_output = f"WHY_TRENDING: {why}\nCOVERAGE_SUMMARY: {coverage}"

        validation = validate_llm_output(full_output)
        copy_ratio = calculate_copy_ratio(articles_text, full_output)

        audit = LLMCallAudit(
            model="stub",
            prompt_version=PROMPT_VERSION_SUMMARIZE,
            input_hash=hash_text(prompt),
            output_hash=hash_text(full_output),
            validator_version=VALIDATOR_VERSION,
            copy_ratio=copy_ratio,
            blocked_terms_result=validation.status,
            human_review_required=not validation.passed,
            cost_usd=0.0,
        )
        return ClusterSummary(why_trending=why, coverage_summary=coverage, audit=audit)


class GeminiSummarizer:
    """Gemini 2.0 Flash backend — 실 운영.

    설치 — uv sync --extra llm
    Env — GEMINI_API_KEY
    """

    def __init__(self, cost_monitor: CostMonitor | None = None) -> None:
        self._client = None
        self.cost_monitor = cost_monitor

    def _ensure_client(self) -> None:
        if self._client is None:
            try:
                import google.generativeai as genai
            except ImportError as err:
                raise ImportError(
                    "google-generativeai 미설치. uv sync --extra llm 실행 필요."
                ) from err
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise RuntimeError("GEMINI_API_KEY env 미설정")
            genai.configure(api_key=api_key)
            self._client = genai.GenerativeModel(GEMINI_MODEL_NAME)

    def summarize(
        self, headlines: list[str], category: str | None = None
    ) -> ClusterSummary:
        self._ensure_client()
        articles_text = "\n".join(f"- {h}" for h in headlines[:10])
        prompt = SUMMARIZE_PROMPT_TEMPLATE.format(articles=articles_text)

        assert self._client is not None
        response = self._client.generate_content(prompt)
        output_text = response.text or ""

        # 토큰·비용 추정
        input_tokens = len(prompt) // 3
        output_tokens = len(output_text) // 3
        cost = estimate_gemini_cost(input_tokens, output_tokens)
        if self.cost_monitor:
            self.cost_monitor.add(cost, source=GEMINI_MODEL_NAME)

        # WHY_TRENDING / COVERAGE_SUMMARY 파싱
        why = _extract_section(output_text, "WHY_TRENDING")
        coverage = _extract_section(output_text, "COVERAGE_SUMMARY")

        validation = validate_llm_output(output_text)
        copy_ratio = calculate_copy_ratio(articles_text, output_text)

        audit = LLMCallAudit(
            model=GEMINI_MODEL_NAME,
            prompt_version=PROMPT_VERSION_SUMMARIZE,
            input_hash=hash_text(prompt),
            output_hash=hash_text(output_text),
            validator_version=VALIDATOR_VERSION,
            copy_ratio=copy_ratio,
            blocked_terms_result=validation.status,
            human_review_required=(not validation.passed) or copy_ratio > 0.15,
            cost_usd=cost,
            metadata={"input_tokens": input_tokens, "output_tokens": output_tokens},
        )

        if not validation.passed:
            logger.warning(
                "summarize.validation.blocked",
                blocked_terms=validation.blocked_terms,
            )

        return ClusterSummary(why_trending=why, coverage_summary=coverage, audit=audit)


def _extract_section(text: str, label: str) -> str:
    """LLM 출력에서 LABEL: <text> 추출."""
    for line in text.splitlines():
        if line.startswith(f"{label}:"):
            return line[len(label) + 1 :].strip()
    return ""


def get_summarizer(cost_monitor: CostMonitor | None = None) -> StubSummarizer | GeminiSummarizer:
    backend = os.getenv("LLM_BACKEND", "stub").lower()
    if backend == "gemini":
        logger.info("summarize.backend", choice="gemini")
        return GeminiSummarizer(cost_monitor=cost_monitor)
    logger.info("summarize.backend", choice="stub")
    return StubSummarizer()
