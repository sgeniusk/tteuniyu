# 클러스터링 — agglomerative (default) + HDBSCAN (optional, T-006 Step 4)
#
# 비협상 (CLAUDE.md rule 4) — embedding raw 값은 worker RAM에서만, DB 저장 X.
# cluster_id + sample_quality + ad_allowed만 DB.
#
# 백엔드 선택 (env CLUSTERING_BACKEND).
#   agglomerative (default) — 순수 numpy + threshold (CI/dry-run 친화)
#   hdbscan — sklearn HDBSCAN (실 운영, uv sync --extra clustering 필요)
#
# 비협상 (ADR-007 Amendment 1) — 18+ 민감 카테고리 자동 ad_allowed=false 부여.

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Iterable

import numpy as np
import structlog

from tteuniyu_worker.embed import Embedder, cosine_similarity

logger = structlog.get_logger(__name__)

# ADR-007 Amendment 1 + 변호사 의견서 §3.5 — 광고·제휴 자동 매칭 X
SENSITIVE_CATEGORIES_FOR_ADS: frozenset[str] = frozenset(
    {
        "politics", "election",
        "society",      # 사고·재해 포함
        "international",  # 외교·국방 포함
        # 추가 변호사 권고 (의견서 §3.5)
        "religion", "ideology",
        "death", "suicide", "missing",
        "crime", "lawsuit",
        "finance", "investment", "insurance", "loan", "crypto",
        "real_estate", "lease",
        "labor_dispute", "strike",
        "gender", "discrimination",
        "public_health", "infectious_disease",
    }
)


@dataclass(frozen=True)
class ClusterResult:
    cluster_id: int  # 임시 — DB 적재 시 UUID 발급
    article_indices: list[int]
    sample_quality: str  # 'insufficient_sample' / 'low_confidence' / 'sufficient'
    ad_allowed: bool


@dataclass
class ClusterInput:
    """단일 article — embedding + 메타데이터."""

    title: str
    embedding: np.ndarray
    category: str | None = None  # ADR-009 Amendment 1 — 매체 stance X
    metadata: dict = field(default_factory=dict)


class AgglomerativeClusterer:
    """Pure numpy threshold-based agglomerative clustering.

    cosine similarity threshold (default 0.7) 이상이면 같은 클러스터.
    O(N²) — N < 1000 적합. 대규모는 HDBSCAN 권장.
    """

    def __init__(self, threshold: float = 0.7) -> None:
        self.threshold = threshold

    def fit_predict(self, embeddings: np.ndarray) -> np.ndarray:
        n = len(embeddings)
        if n == 0:
            return np.array([], dtype=np.int32)

        labels = np.full(n, -1, dtype=np.int32)
        next_label = 0

        for i in range(n):
            if labels[i] != -1:
                continue
            labels[i] = next_label
            for j in range(i + 1, n):
                if labels[j] != -1:
                    continue
                if cosine_similarity(embeddings[i], embeddings[j]) >= self.threshold:
                    labels[j] = next_label
            next_label += 1

        return labels


class HDBSCANClusterer:
    """sklearn HDBSCAN wrapper — 실 운영 단계.

    설치 — uv sync --extra clustering
    """

    def __init__(self, min_cluster_size: int = 2) -> None:
        self.min_cluster_size = min_cluster_size

    def fit_predict(self, embeddings: np.ndarray) -> np.ndarray:
        try:
            from sklearn.cluster import HDBSCAN
        except ImportError as err:
            raise ImportError(
                "scikit-learn 미설치. uv sync --extra clustering 실행 필요."
            ) from err

        if len(embeddings) == 0:
            return np.array([], dtype=np.int32)

        clusterer = HDBSCAN(
            min_cluster_size=self.min_cluster_size,
            metric="cosine",
        )
        return clusterer.fit_predict(embeddings)


def get_clusterer() -> AgglomerativeClusterer | HDBSCANClusterer:
    backend = os.getenv("CLUSTERING_BACKEND", "agglomerative").lower()
    if backend == "hdbscan":
        logger.info("cluster.backend", choice="hdbscan")
        return HDBSCANClusterer(min_cluster_size=2)
    logger.info("cluster.backend", choice="agglomerative", threshold=0.7)
    return AgglomerativeClusterer(threshold=0.7)


def derive_sample_quality(size: int) -> str:
    """ADR-005 — sample 5건 미만 = insufficient_sample."""
    if size < 5:
        return "insufficient_sample"
    if size < 10:
        return "low_confidence"
    return "sufficient"


def derive_ad_allowed(category: str | None) -> bool:
    """ADR-007 Amendment 1 — 18+ 민감 카테고리는 ad_allowed=false."""
    if category is None:
        return True
    return category.lower() not in SENSITIVE_CATEGORIES_FOR_ADS


def cluster_articles(articles: Iterable[ClusterInput]) -> list[ClusterResult]:
    """파이프라인 — embedding → 클러스터링 → ClusterResult.

    embedding은 caller가 미리 계산해서 ClusterInput에 담아줘야 함 (rule 4 준수 — RAM 처리).
    """
    items = list(articles)
    if not items:
        return []

    embeddings = np.stack([a.embedding for a in items])
    clusterer = get_clusterer()
    labels = clusterer.fit_predict(embeddings)

    # label별로 묶기 (HDBSCAN은 -1 = noise → 단독 클러스터로 처리)
    clusters: dict[int, list[int]] = {}
    next_singleton = 1_000_000
    for idx, label in enumerate(labels):
        if int(label) == -1:
            clusters[next_singleton] = [idx]
            next_singleton += 1
        else:
            clusters.setdefault(int(label), []).append(idx)

    results: list[ClusterResult] = []
    for cluster_id, member_indices in sorted(clusters.items()):
        # category 결정 — 가장 많이 나타난 카테고리 (ad_allowed 정책에 사용)
        cats = [items[i].category for i in member_indices if items[i].category]
        dominant_category: str | None = None
        if cats:
            dominant_category = max(set(cats), key=cats.count)

        results.append(
            ClusterResult(
                cluster_id=cluster_id,
                article_indices=member_indices,
                sample_quality=derive_sample_quality(len(member_indices)),
                ad_allowed=derive_ad_allowed(dominant_category),
            )
        )

    logger.info(
        "cluster.complete",
        article_count=len(items),
        cluster_count=len(results),
        ad_blocked=sum(1 for r in results if not r.ad_allowed),
    )

    return results


def embed_and_cluster(
    titles: list[str],
    categories: list[str | None] | None,
    embedder: Embedder,
) -> list[ClusterResult]:
    """편의 함수 — 제목 → 임베딩 → 클러스터링."""
    if categories is None:
        categories = [None] * len(titles)
    embeddings = embedder.encode(titles)
    inputs = [
        ClusterInput(title=t, embedding=embeddings[i], category=categories[i])
        for i, t in enumerate(titles)
    ]
    return cluster_articles(inputs)
