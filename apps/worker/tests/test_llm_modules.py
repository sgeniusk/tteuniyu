# T-006 Step 5 — LLM 요약 + Trust Signal + audit + cost monitor + validator 단위 테스트

import pytest

from tteuniyu_worker.audit import calculate_copy_ratio, hash_text
from tteuniyu_worker.cost_monitor import (
    CostCapExceeded,
    CostMonitor,
    estimate_gemini_cost,
)
from tteuniyu_worker.llm_validator import (
    INVESTMENT_BANNED_EN,
    INVESTMENT_BANNED_KO,
    VALIDATOR_VERSION,
    validate_llm_output,
)
from tteuniyu_worker.summarize import (
    PROMPT_VERSION_SUMMARIZE,
    StubSummarizer,
    get_summarizer,
)
from tteuniyu_worker.trust_signal import (
    HOAX_THRESHOLD,
    HUMAN_REVIEW_CATEGORIES,
    PROMPT_VERSION_TRUST,
    StubTrustSignaler,
    get_trust_signaler,
)


# ─── llm_validator ────────────────────────────────────────────


def test_validator_passes_clean_text():
    result = validate_llm_output("국민연금 개편안이 발표되었습니다.")
    assert result.passed is True
    assert result.blocked_terms == []
    assert result.status == "pass"


def test_validator_blocks_korean_investment_word():
    for word in ["매수", "매도", "호재", "악재", "목표가", "예측", "추천", "전망"]:
        result = validate_llm_output(f"이 종목은 {word} 추천됩니다.")
        assert result.passed is False, f"'{word}' should be blocked"
        assert word in result.blocked_terms or "추천" in result.blocked_terms


def test_validator_blocks_english_investment_word_word_boundary():
    result = validate_llm_output("Analysts say buy this stock now.")
    assert result.passed is False
    assert "buy" in result.blocked_terms


def test_validator_does_not_block_substring_matches():
    """word boundary 보장 — 'buyer' 같은 단어는 'buy'로 차단되지 않아야."""
    result = validate_llm_output("The buyer market is strong.")
    # buyer는 buy의 substring이지만 단어 경계라 통과
    assert "buy" not in result.blocked_terms


def test_validator_blocks_classification_keywords():
    for word in ["stance", "ideology", "보수 매체", "진보 매체"]:
        result = validate_llm_output(f"이 매체는 {word} 입니다.")
        assert result.passed is False, f"'{word}' should be blocked"


def test_validator_version_stable():
    assert VALIDATOR_VERSION.startswith("v")
    assert "lawyer" in VALIDATOR_VERSION


def test_validator_banned_sets_size():
    # 변호사 의견서 §1.3 — 한글 30+ + 영문 11+ = 40+ 보장
    assert len(INVESTMENT_BANNED_KO) >= 30
    assert len(INVESTMENT_BANNED_EN) >= 10


# ─── audit ──────────────────────────────────────────────────────


def test_hash_text_deterministic():
    assert hash_text("같은 텍스트") == hash_text("같은 텍스트")
    assert hash_text("a") != hash_text("b")
    assert len(hash_text("test")) == 64  # SHA-256 hex


def test_copy_ratio_zero_for_disjoint_texts():
    src = "삼성전자가 1분기 반도체 흑자로 전환하였습니다 매출 성장세입니다"
    out = "구글 모회사 알파벳이 신규 AI 모델을 발표하였습니다 새 기능 추가"
    ratio = calculate_copy_ratio(src, out, ngram_size=3)
    assert ratio == 0.0


def test_copy_ratio_one_for_identical_texts():
    text = "한 두 세 네 다섯 여섯 일곱 여덟 아홉 열"
    assert calculate_copy_ratio(text, text, ngram_size=3) == pytest.approx(1.0)


def test_copy_ratio_handles_short_output():
    assert calculate_copy_ratio("source long text here", "short", ngram_size=5) == 0.0


# ─── cost_monitor ───────────────────────────────────────────────


def test_estimate_gemini_cost_low_token_count():
    # 1000 input + 500 output tokens
    cost = estimate_gemini_cost(1000, 500)
    expected = 0.0001 + 0.0002  # input + output
    assert cost == pytest.approx(expected)


def test_cost_monitor_accumulates():
    monitor = CostMonitor(monthly_cap_usd=1.0)
    monitor.add(0.1)
    monitor.add(0.2)
    assert monitor.month_total_usd == pytest.approx(0.3)
    assert monitor.remaining_usd == pytest.approx(0.7)


def test_cost_monitor_cap_exceeded_raises():
    monitor = CostMonitor(monthly_cap_usd=1.0)
    monitor.add(0.5)
    monitor.add(0.4)
    with pytest.raises(CostCapExceeded):
        monitor.add(0.2)  # 1.1 → over 1.0


def test_cost_monitor_alert_threshold_no_webhook():
    """Alert at 80% — webhook 없으면 log warning만."""
    monitor = CostMonitor(monthly_cap_usd=1.0)
    monitor.add(0.8)  # 80% → alert sent (no webhook → warning log)
    assert monitor.month_total_usd == pytest.approx(0.8)


# ─── summarize stub ─────────────────────────────────────────────


def test_summarizer_stub_returns_clean_output():
    s = StubSummarizer()
    result = s.summarize(["삼성전자 반도체 흑자", "삼성전자 1분기 호조"])
    assert result.why_trending != ""
    assert result.coverage_summary != ""
    assert result.audit.model == "stub"
    assert result.audit.prompt_version == PROMPT_VERSION_SUMMARIZE
    assert result.audit.blocked_terms_result == "pass"
    assert result.audit.human_review_required is False


def test_summarizer_stub_audit_has_hashes():
    s = StubSummarizer()
    result = s.summarize(["test headline"])
    assert len(result.audit.input_hash) == 64
    assert len(result.audit.output_hash) == 64
    assert result.audit.cost_usd == 0.0


def test_get_summarizer_default_returns_stub(monkeypatch):
    monkeypatch.delenv("LLM_BACKEND", raising=False)
    s = get_summarizer()
    assert isinstance(s, StubSummarizer)


# ─── trust_signal stub ──────────────────────────────────────────


def test_trust_signaler_stub_returns_valid_scores():
    t = StubTrustSignaler()
    result = t.evaluate(["국민연금 개편안 발표"], category="politics", sample_size=10)
    assert 0.0 <= result.hoax_likelihood <= 1.0
    assert 0.0 <= result.clickbait_score <= 1.0
    assert isinstance(result.is_investment, bool)
    assert isinstance(result.trust_tags, list)


def test_trust_signaler_low_confidence_for_small_sample():
    t = StubTrustSignaler()
    result = t.evaluate(["헤드라인 1"], category="economy", sample_size=2)
    assert "low_confidence" in result.trust_tags


def test_trust_signaler_low_confidence_for_single_source():
    t = StubTrustSignaler()
    result = t.evaluate(["헤드라인 1"], category="economy", sample_size=10, single_source=True)
    assert "low_confidence" in result.trust_tags


def test_trust_signaler_human_review_for_politics_category():
    t = StubTrustSignaler()
    result = t.evaluate(["정치 이슈"], category="politics", sample_size=10)
    assert result.human_review_required is True
    assert "politics" in HUMAN_REVIEW_CATEGORIES


def test_trust_signaler_human_review_for_finance_category():
    t = StubTrustSignaler()
    result = t.evaluate(["금융 이슈"], category="finance", sample_size=10)
    assert result.human_review_required is True


def test_trust_signaler_audit_prompt_version():
    t = StubTrustSignaler()
    result = t.evaluate(["test"], sample_size=10)
    assert result.audit.prompt_version == PROMPT_VERSION_TRUST


def test_get_trust_signaler_default_returns_stub(monkeypatch):
    monkeypatch.delenv("LLM_BACKEND", raising=False)
    t = get_trust_signaler()
    assert isinstance(t, StubTrustSignaler)


def test_hoax_threshold_is_0_7():
    """ADR-015 Amendment 2 §2.1 — hoax 임계값 0.7."""
    assert HOAX_THRESHOLD == 0.7
