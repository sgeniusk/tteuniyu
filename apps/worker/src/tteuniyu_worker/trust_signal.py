# Trust Signal LLM — hoax_likelihood + clickbait_score + is_investment
#
# 비협상 (ADR-015 Amendment 2 + 변호사 §2.1).
#   Trust Tag 4종 internal field — UI 라벨 매핑은 components/TrustTag.tsx + iOS TrustTag.swift.
#   본 모듈은 internal field만 생성. UI 라벨 변환 X.

from __future__ import annotations

import json
import os
from dataclasses import dataclass

import structlog

from tteuniyu_worker.audit import LLMCallAudit, extract_token_counts, hash_text
from tteuniyu_worker.cost_monitor import CostMonitor, estimate_gemini_cost
from tteuniyu_worker.llm_validator import VALIDATOR_VERSION, validate_llm_output

logger = structlog.get_logger(__name__)

PROMPT_VERSION_TRUST = "trust_signal_v1"
# gemini-2.5-flash는 thinking(추론) 토큰을 대량 생성해 비용 폭증. flash-lite는
# thinking 기본 꺼짐 + 단가 저렴 — Trust Signal 평가에 충분.
GEMINI_MODEL_NAME = "gemini-2.5-flash-lite"

HOAX_THRESHOLD = 0.7
CLICKBAIT_THRESHOLD = 0.7

# 변호사 §2.5 — 자동 사람 검토 큐 진입 카테고리
HUMAN_REVIEW_CATEGORIES: frozenset[str] = frozenset(
    {
        "politics", "election",
        "crime", "lawsuit",
        "death", "suicide",
        "society",       # 사고·재해 포함
        "international", # 외교·국방 포함
        "finance", "investment",
    }
)


@dataclass(frozen=True)
class TrustSignalResult:
    hoax_likelihood: float
    clickbait_score: float
    is_investment: bool
    trust_tags: list[str]  # internal — hoax/clickbait/low_confidence/investment 부분집합
    human_review_required: bool
    audit: LLMCallAudit


TRUST_PROMPT_TEMPLATE = """\
다음 한국 매체들의 헤드라인 N개를 평가하세요.

[기사 헤드라인]
{headlines}

[평가 기준]
1. hoax_likelihood (0~1) — 검증되지 않은 또는 허위 사실 가능성. 0=신뢰, 1=의심.
2. clickbait_score (0~1) — 헤드라인이 본문 내용과 동떨어질 가능성. 0=정확, 1=낚시.
3. is_investment (true/false) — 주식·금리·환율·코인 등 투자 관련 이슈 여부.

[비협상]
- 절대 금지 단어 — 매수, 매도, 호재, 악재, 목표가, 예측, 추천, 전망,
  buy, sell, target price.
- "stance", "이념 분류" 등 매체 분류 단어 절대 금지.

[출력 — JSON only]
{{"hoax_likelihood": 0.X, "clickbait_score": 0.X, "is_investment": true/false}}
"""


class StubTrustSignaler:
    """CI/dev용 deterministic stub.

    헤드라인 hash 기반 deterministic 점수 (실제 의미 X — 코드 path 검증용).
    """

    def evaluate(
        self,
        headlines: list[str],
        category: str | None = None,
        sample_size: int = 0,
        single_source: bool = False,
    ) -> TrustSignalResult:
        joined = " ".join(headlines)
        h = hash(joined) & 0xFFFFFFFF
        # deterministic but pseudo-random
        hoax = ((h >> 16) & 0xFF) / 510.0  # 0~0.5
        clickbait = ((h >> 8) & 0xFF) / 510.0
        is_invest = bool((h & 0xFF) > 200)  # ~22% chance

        prompt = TRUST_PROMPT_TEMPLATE.format(headlines="\n".join(headlines))
        output = json.dumps(
            {
                "hoax_likelihood": round(hoax, 2),
                "clickbait_score": round(clickbait, 2),
                "is_investment": is_invest,
            }
        )

        return self._build_result(
            hoax,
            clickbait,
            is_invest,
            sample_size,
            single_source,
            category,
            prompt,
            output,
            "stub",
            cost_usd=0.0,
        )

    def _build_result(
        self,
        hoax: float,
        clickbait: float,
        is_investment: bool,
        sample_size: int,
        single_source: bool,
        category: str | None,
        prompt: str,
        output: str,
        model: str,
        cost_usd: float,
    ) -> TrustSignalResult:
        tags: list[str] = []
        if hoax >= HOAX_THRESHOLD:
            tags.append("hoax")
        if clickbait >= CLICKBAIT_THRESHOLD:
            tags.append("clickbait")
        if sample_size < 5 or single_source:
            tags.append("low_confidence")
        if is_investment:
            tags.append("investment")

        # 변호사 §2.5 — risk-based 자동 사람 검토 큐
        human_review = (
            "hoax" in tags
            or "clickbait" in tags
            or single_source
            or (category in HUMAN_REVIEW_CATEGORIES)
        )

        validation = validate_llm_output(output)

        audit = LLMCallAudit(
            model=model,
            prompt_version=PROMPT_VERSION_TRUST,
            input_hash=hash_text(prompt),
            output_hash=hash_text(output),
            validator_version=VALIDATOR_VERSION,
            blocked_terms_result=validation.status,
            human_review_required=human_review or not validation.passed,
            cost_usd=cost_usd,
        )

        return TrustSignalResult(
            hoax_likelihood=round(hoax, 3),
            clickbait_score=round(clickbait, 3),
            is_investment=is_investment,
            trust_tags=tags,
            human_review_required=human_review or not validation.passed,
            audit=audit,
        )


class GeminiTrustSignaler(StubTrustSignaler):
    """Gemini 2.0 Flash backend — 실 운영."""

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

    def evaluate(
        self,
        headlines: list[str],
        category: str | None = None,
        sample_size: int = 0,
        single_source: bool = False,
    ) -> TrustSignalResult:
        self._ensure_client()
        prompt = TRUST_PROMPT_TEMPLATE.format(headlines="\n".join(headlines))

        assert self._client is not None
        response = self._client.generate_content(prompt)
        output_text = response.text or ""

        # JSON parse
        try:
            parsed = json.loads(output_text.strip())
            hoax = float(parsed.get("hoax_likelihood", 0.0))
            clickbait = float(parsed.get("clickbait_score", 0.0))
            is_invest = bool(parsed.get("is_investment", False))
        except (json.JSONDecodeError, ValueError, TypeError) as err:
            logger.warning("trust_signal.parse_failed", error=str(err))
            hoax, clickbait, is_invest = 0.0, 0.0, False

        # 실제 토큰 — API usage_metadata (thinking 토큰 포함, 글자수 추정 X).
        input_tokens, output_tokens = extract_token_counts(
            response, prompt, output_text
        )
        cost = estimate_gemini_cost(input_tokens, output_tokens)
        if self.cost_monitor:
            self.cost_monitor.add(cost, source=GEMINI_MODEL_NAME)

        return self._build_result(
            hoax,
            clickbait,
            is_invest,
            sample_size,
            single_source,
            category,
            prompt,
            output_text,
            GEMINI_MODEL_NAME,
            cost_usd=cost,
        )


def get_trust_signaler(cost_monitor: CostMonitor | None = None) -> StubTrustSignaler:
    backend = os.getenv("LLM_BACKEND", "stub").lower()
    if backend == "gemini":
        logger.info("trust_signal.backend", choice="gemini")
        return GeminiTrustSignaler(cost_monitor=cost_monitor)
    logger.info("trust_signal.backend", choice="stub")
    return StubTrustSignaler()
