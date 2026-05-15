# 임베딩 wrapper — stub + sentence-transformers backend (T-006 Step 4)
#
# 비협상 (CLAUDE.md rule 4) — embedding raw 값은 worker RAM에서만 처리, DB 저장 X.
# 클러스터링 직후 즉시 폐기.
#
# 백엔드 선택 (env EMBEDDING_BACKEND).
#   stub (default) — hashlib 기반 deterministic pseudo-embedding (CI/dry-run)
#   sentence_transformers — paraphrase-multilingual-MiniLM-L12-v2 (실 운영)
#
# 실 운영 시 — uv sync --extra embedding (sentence-transformers + torch 설치)

from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from typing import Protocol

import numpy as np
import structlog

logger = structlog.get_logger(__name__)

EMBEDDING_DIM = 384  # paraphrase-multilingual-MiniLM-L12-v2 출력 차원


class Embedder(Protocol):
    """공통 인터페이스 — stub와 sentence-transformers 모두 지원."""

    def encode(self, texts: list[str]) -> np.ndarray:
        """텍스트 list → (N, EMBEDDING_DIM) ndarray. L2-normalized."""
        ...


@dataclass(frozen=True)
class StubEmbedder:
    """Hashlib 기반 deterministic pseudo-embedding.

    CI / dry-run / 로컬 dev에서 sentence-transformers 무거운 모델 다운로드 회피용.
    실제 의미 학습 X — 단순히 동일 텍스트 → 동일 vector 보장.
    """

    dim: int = EMBEDDING_DIM

    def encode(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.zeros((0, self.dim), dtype=np.float32)

        vectors = []
        for text in texts:
            # SHA-256 hash → 32 bytes 반복으로 dim까지 확장
            h = hashlib.sha256(text.encode("utf-8")).digest()
            arr = np.frombuffer(h * (self.dim // 32 + 1), dtype=np.uint8)[: self.dim]
            # 0~255 → -1~+1 normalize
            v = (arr.astype(np.float32) - 127.5) / 127.5
            # L2 normalize
            norm = np.linalg.norm(v)
            if norm > 0:
                v = v / norm
            vectors.append(v)

        return np.stack(vectors)


class SentenceTransformerEmbedder:
    """sentence-transformers paraphrase-multilingual-MiniLM-L12-v2 wrapper.

    Lazy load — 첫 encode() 시점에 모델 다운로드. 이후 캐시.
    한국어 + 영어 둘 다 지원. on-device 무료.

    실 운영 시.
        uv sync --extra embedding  # sentence-transformers + torch 설치
        EMBEDDING_BACKEND=sentence_transformers
    """

    MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

    def __init__(self) -> None:
        self._model = None

    def _ensure_model(self) -> None:
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
            except ImportError as err:
                raise ImportError(
                    "sentence-transformers 미설치. uv sync --extra embedding 실행 필요."
                ) from err

            logger.info("embed.sentence_transformers.loading", model=self.MODEL_NAME)
            self._model = SentenceTransformer(self.MODEL_NAME)
            logger.info("embed.sentence_transformers.loaded")

    def encode(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.zeros((0, EMBEDDING_DIM), dtype=np.float32)

        self._ensure_model()
        assert self._model is not None
        vectors = self._model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return np.asarray(vectors, dtype=np.float32)


def get_embedder() -> Embedder:
    """env 기반 backend 선택.

    EMBEDDING_BACKEND 미설정 또는 'stub' → StubEmbedder.
    'sentence_transformers' → SentenceTransformerEmbedder.
    """
    backend = os.getenv("EMBEDDING_BACKEND", "stub").lower()
    if backend == "sentence_transformers":
        logger.info("embed.backend", choice="sentence_transformers")
        return SentenceTransformerEmbedder()
    logger.info("embed.backend", choice="stub")
    return StubEmbedder()


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """L2-normalized vector 간 cosine similarity."""
    return float(np.dot(a, b))
