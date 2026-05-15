# T-006 Step 4 — embed + cluster 단위 테스트

import numpy as np
import pytest

from tteuniyu_worker.cluster import (
    SENSITIVE_CATEGORIES_FOR_ADS,
    AgglomerativeClusterer,
    ClusterInput,
    cluster_articles,
    derive_ad_allowed,
    derive_sample_quality,
    embed_and_cluster,
    get_clusterer,
)
from tteuniyu_worker.embed import (
    EMBEDDING_DIM,
    StubEmbedder,
    cosine_similarity,
    get_embedder,
)


# ─── Embedding ────────────────────────────────────────────────


def test_stub_embedder_deterministic():
    e = StubEmbedder()
    v1 = e.encode(["같은 텍스트"])
    v2 = e.encode(["같은 텍스트"])
    assert np.allclose(v1, v2)


def test_stub_embedder_different_text_different_vector():
    e = StubEmbedder()
    v1 = e.encode(["삼성전자 반도체"])
    v2 = e.encode(["국민연금 개편"])
    assert not np.allclose(v1, v2)


def test_stub_embedder_dim():
    e = StubEmbedder()
    v = e.encode(["테스트"])
    assert v.shape == (1, EMBEDDING_DIM)


def test_stub_embedder_l2_normalized():
    e = StubEmbedder()
    v = e.encode(["테스트"])
    norm = np.linalg.norm(v[0])
    assert abs(norm - 1.0) < 1e-5


def test_stub_embedder_empty_returns_zero_shape():
    e = StubEmbedder()
    v = e.encode([])
    assert v.shape == (0, EMBEDDING_DIM)


def test_get_embedder_default_returns_stub(monkeypatch):
    monkeypatch.delenv("EMBEDDING_BACKEND", raising=False)
    e = get_embedder()
    assert isinstance(e, StubEmbedder)


def test_cosine_similarity_identical_one():
    v = np.array([1.0, 0.0, 0.0])
    assert cosine_similarity(v, v) == pytest.approx(1.0)


def test_cosine_similarity_orthogonal_zero():
    v1 = np.array([1.0, 0.0, 0.0])
    v2 = np.array([0.0, 1.0, 0.0])
    assert cosine_similarity(v1, v2) == pytest.approx(0.0)


# ─── Sample quality ────────────────────────────────────────────


def test_sample_quality_thresholds():
    assert derive_sample_quality(0) == "insufficient_sample"
    assert derive_sample_quality(4) == "insufficient_sample"
    assert derive_sample_quality(5) == "low_confidence"
    assert derive_sample_quality(9) == "low_confidence"
    assert derive_sample_quality(10) == "sufficient"
    assert derive_sample_quality(100) == "sufficient"


# ─── Ad allowed (ADR-007 Amendment 1) ──────────────────────────


def test_ad_allowed_default_true_for_unknown_category():
    assert derive_ad_allowed(None) is True
    assert derive_ad_allowed("hobby") is True


def test_ad_allowed_false_for_sensitive_categories():
    forbidden_examples = [
        "politics", "election", "society", "international",
        "religion", "death", "crime", "finance",
        "investment", "real_estate", "labor_dispute",
        "gender", "public_health",
    ]
    for cat in forbidden_examples:
        assert not derive_ad_allowed(cat), f"{cat} should be ad_allowed=False"


def test_sensitive_categories_set_size_at_least_18():
    # ADR-007 Amendment 1 + 변호사 §3.5 — 18개 이상
    assert len(SENSITIVE_CATEGORIES_FOR_ADS) >= 18


# ─── Clustering ────────────────────────────────────────────────


def test_agglomerative_groups_similar_vectors():
    clusterer = AgglomerativeClusterer(threshold=0.7)
    embeddings = np.array([
        [1.0, 0.0, 0.0],
        [0.99, 0.14, 0.0],  # 같은 그룹
        [0.0, 1.0, 0.0],
        [0.14, 0.99, 0.0],  # 같은 그룹
    ])
    # L2 normalize
    embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    labels = clusterer.fit_predict(embeddings)
    # 처음 2개가 같은 라벨, 다음 2개도 같은 라벨, 두 그룹은 다른 라벨
    assert labels[0] == labels[1]
    assert labels[2] == labels[3]
    assert labels[0] != labels[2]


def test_agglomerative_empty_returns_empty():
    clusterer = AgglomerativeClusterer()
    labels = clusterer.fit_predict(np.array([]).reshape(0, 3))
    assert len(labels) == 0


def test_get_clusterer_default_agglomerative(monkeypatch):
    monkeypatch.delenv("CLUSTERING_BACKEND", raising=False)
    c = get_clusterer()
    assert isinstance(c, AgglomerativeClusterer)


def test_cluster_articles_assigns_metadata():
    embedder = StubEmbedder()
    titles = [
        "삼성전자 반도체 흑자",
        "삼성전자 반도체 흑자",  # 중복 — 같은 클러스터
        "쿠팡 새벽배송 확대",
    ]
    embeddings = embedder.encode(titles)
    inputs = [
        ClusterInput(title=t, embedding=embeddings[i], category="economy")
        for i, t in enumerate(titles)
    ]
    results = cluster_articles(inputs)
    assert len(results) >= 1
    # economy → ad_allowed=True (sensitive set에 없음)
    for r in results:
        if "economy" in {inputs[i].category for i in r.article_indices}:
            assert r.ad_allowed is True


def test_cluster_politics_blocks_ads():
    """ADR-007 Amendment 1 — politics 카테고리는 ad_allowed=False."""
    embedder = StubEmbedder()
    titles = ["국민연금 개편안 논의"]
    inputs = [
        ClusterInput(title=titles[0], embedding=embedder.encode(titles)[0], category="politics")
    ]
    results = cluster_articles(inputs)
    assert len(results) == 1
    assert results[0].ad_allowed is False


def test_embed_and_cluster_convenience_function():
    embedder = StubEmbedder()
    titles = ["AI 규제 통과", "AI 규제 통과"]  # 중복 → 1 클러스터
    results = embed_and_cluster(titles, categories=["tech_science", "tech_science"], embedder=embedder)
    assert len(results) == 1
    assert len(results[0].article_indices) == 2
    assert results[0].sample_quality == "insufficient_sample"  # 2 < 5
    assert results[0].ad_allowed is True  # tech_science 비-sensitive
