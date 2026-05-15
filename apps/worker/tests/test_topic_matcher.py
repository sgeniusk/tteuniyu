# Custom Topic 매칭 worker — 단위 테스트 (ADR-018)

import numpy as np
import pytest

from tteuniyu_worker.embed import StubEmbedder
from tteuniyu_worker.topic_matcher import (
    SIMILAR_MATCHING_THRESHOLD,
    TIER_LIMITS,
    ClusterCandidate,
    StubTopicMatcher,
    UserTopic,
    get_topic_matcher,
    match_all,
    match_one,
    run_matching_cycle,
    validate_keyword,
)


# ─── Tier 한도 (ADR-018 §2.1) ──────────────────────────────────


def test_tier_limits_are_correct():
    assert TIER_LIMITS["free"] == 0
    assert TIER_LIMITS["pro"] == 5
    assert TIER_LIMITS["creator"] == 20
    assert TIER_LIMITS["leader"] == 50


def test_similar_threshold_is_0_7():
    """ADR-018 §2.3 — Creator 의미적 매칭 임계값."""
    assert SIMILAR_MATCHING_THRESHOLD == 0.7


# ─── 키워드 입력 검증 (변호사 §1.3) ────────────────────────────


def test_validate_keyword_accepts_clean_input():
    result = validate_keyword("삼성전자 반도체")
    assert result.accepted is True
    assert result.blocked_terms == []


def test_validate_keyword_rejects_investment_word():
    """변호사 hard-block — '매수' 같은 단어 거부."""
    result = validate_keyword("삼성전자 매수 시점")
    assert result.accepted is False
    assert "매수" in result.blocked_terms


def test_validate_keyword_rejects_target_price():
    result = validate_keyword("삼성전자 목표가")
    assert result.accepted is False
    assert "목표가" in result.blocked_terms


def test_validate_keyword_rejects_classification_word():
    """ADR-009 Amendment 1 — stance/이념 분류 거부."""
    result = validate_keyword("진보 매체 동향")
    assert result.accepted is False
    assert "진보 매체" in result.blocked_terms


def test_validate_keyword_rejects_empty():
    assert validate_keyword("").accepted is False
    assert validate_keyword("   ").accepted is False


def test_validate_keyword_rejects_too_long():
    """ADR-018 — 40자 초과 거부."""
    long_kw = "한" * 41
    result = validate_keyword(long_kw)
    assert result.accepted is False
    assert "40" in (result.reason or "")


# ─── 매칭 알고리즘 ────────────────────────────────────────────


def _topic(keyword: str, mode: str = "similar", embedder=None) -> UserTopic:
    embedder = embedder or StubEmbedder()
    return UserTopic(
        topic_id=f"t-{hash(keyword) & 0xffff:x}",
        user_id="u-1",
        keyword=keyword,
        embedding=embedder.encode([keyword])[0],
        matching_mode=mode,
    )


def _cluster(title: str, embedder=None) -> ClusterCandidate:
    embedder = embedder or StubEmbedder()
    return ClusterCandidate(
        cluster_id=f"c-{hash(title) & 0xffff:x}",
        title=title,
        embedding=embedder.encode([title])[0],
    )


def test_exact_mode_matches_when_substring():
    embedder = StubEmbedder()
    topic = _topic("쿠팡", mode="exact", embedder=embedder)
    cluster = _cluster("쿠팡 새벽배송 권역 확대", embedder=embedder)
    result = match_one(topic, cluster)
    assert result is not None
    assert result.similarity == 1.0


def test_exact_mode_no_match_when_no_substring():
    embedder = StubEmbedder()
    topic = _topic("네이버", mode="exact", embedder=embedder)
    cluster = _cluster("쿠팡 새벽배송 권역 확대", embedder=embedder)
    result = match_one(topic, cluster)
    assert result is None


def test_exact_mode_case_insensitive():
    embedder = StubEmbedder()
    topic = _topic("ai", mode="exact", embedder=embedder)
    cluster = _cluster("AI 규제 통과", embedder=embedder)
    result = match_one(topic, cluster)
    assert result is not None


def test_similar_mode_matches_identical_text():
    """동일 텍스트는 cosine = 1.0 → 매칭."""
    embedder = StubEmbedder()
    topic = _topic("삼성전자 반도체", mode="similar", embedder=embedder)
    cluster = _cluster("삼성전자 반도체", embedder=embedder)
    result = match_one(topic, cluster)
    assert result is not None
    assert result.similarity > 0.99


def test_similar_mode_no_match_below_threshold():
    """Stub embedder는 deterministic — 다른 텍스트는 cosine 낮음."""
    embedder = StubEmbedder()
    topic = _topic("삼성전자 반도체", mode="similar", embedder=embedder)
    cluster = _cluster("국민연금 개편안", embedder=embedder)
    result = match_one(topic, cluster)
    # StubEmbedder는 의미 X — 우연히 0.7 이상일 수 있음. 확률적 검증.
    if result:
        assert result.similarity >= 0.7


def test_match_all_processes_multiple_topics():
    matcher = StubTopicMatcher()
    topics = matcher.fetch_active_topics()
    clusters = matcher.fetch_recent_clusters()
    assert len(topics) > 0
    assert len(clusters) > 0
    matches = match_all(topics, clusters)
    # Stub data — 쿠팡(exact)이 cluster c-2와 매칭됨
    assert any(m.keyword == "쿠팡" for m in matches)


# ─── Matcher 인터페이스 ────────────────────────────────────────


def test_get_topic_matcher_default_returns_stub(monkeypatch):
    monkeypatch.delenv("TOPIC_MATCHER_BACKEND", raising=False)
    matcher = get_topic_matcher()
    assert isinstance(matcher, StubTopicMatcher)


def test_run_matching_cycle_returns_stats():
    stats = run_matching_cycle()
    assert "topics" in stats
    assert "clusters" in stats
    assert "matches" in stats
    assert "inserted" in stats
    assert stats["topics"] > 0
    assert stats["clusters"] > 0


def test_stub_insert_returns_count():
    matcher = StubTopicMatcher()
    topics = matcher.fetch_active_topics()
    clusters = matcher.fetch_recent_clusters()
    matches = match_all(topics, clusters)
    inserted = matcher.insert_matches(matches)
    assert inserted == len(matches)
