# sources_whitelist.yaml 로더 + Pydantic 검증 + active source 필터

"""config/sources_whitelist.yaml 로더 + Pydantic 검증.

비협상 (CLAUDE.md rule 7) — tos_confirmed AND ingestion_enabled 두 플래그
모두여야 ingest 허용. filter_active()가 강제.

비협상 (ADR-009 Amendment 1) — stance/ideology/leaning 등 분류 키 절대 금지.
Pydantic strict (extra='forbid')가 unknown 키 거부.

본 모듈은 harness:tos-whitelist (TS)와 동일한 schema를 Python으로 표현.
yaml 파일은 단일 진실 — TS 검증 + Python 로드 둘 다 같은 파일을 본다.
"""

from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
from typing import Annotated, Union

import structlog
import yaml
from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl

logger = structlog.get_logger(__name__)

# ── 비협상 — 매체에 절대 들어가면 안 되는 분류 키 (ADR-009 Amendment 1) ──
FORBIDDEN_KEYS: frozenset[str] = frozenset(
    {
        "stance",
        "ideology",
        "leaning",
        "political_orientation",
        "bias",
        "tilt",
        "orientation",
        "left_right",
    }
)


class Source(BaseModel):
    """단일 매체 entry.

    extra='forbid'로 unknown 키 자동 거부 → ADR-009 Amendment 1 강제.
    Pydantic이 stance/ideology 등 분류 키 발견 시 ValidationError raise.
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    slug: Annotated[str, Field(min_length=1, max_length=40, pattern=r"^[a-z0-9_-]+$")]
    name: Annotated[str, Field(min_length=1, max_length=40)]
    rss_url: HttpUrl
    base_url: HttpUrl
    contact_email: EmailStr | None = None
    tos_confirmed: bool
    ingestion_enabled: bool
    confirmed_at: datetime | None = None
    notes: str | None = None

    @property
    def is_active(self) -> bool:
        """CLAUDE.md rule 7 — 두 플래그 모두 true여야 ingest 허용."""
        return self.tos_confirmed and self.ingestion_enabled


class Whitelist(BaseModel):
    """전체 whitelist."""

    model_config = ConfigDict(extra="forbid")

    version: int = Field(ge=1)
    last_updated: Union[date, datetime, str]  # yaml은 date 자동 파싱, ISO str도 허용
    sources: list[Source] = Field(min_length=15)


def load(path: Path | str = "config/sources_whitelist.yaml") -> Whitelist:
    """yaml 파일 로드 + Pydantic 검증.

    cwd 기준 경로 (typical 사용 — repo root에서 실행).
    Pydantic이 strict 검증 — schema 위반 또는 forbidden 키 즉시 ValidationError.
    """

    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"whitelist not found: {p.absolute()}")

    raw = yaml.safe_load(p.read_text(encoding="utf-8"))

    # 추가 사전 방어 — Pydantic extra='forbid'와 중복이지만 명시적 메시지 제공
    if isinstance(raw, dict) and isinstance(raw.get("sources"), list):
        for entry in raw["sources"]:
            if not isinstance(entry, dict):
                continue
            forbidden = FORBIDDEN_KEYS & entry.keys()
            if forbidden:
                slug = entry.get("slug", "<unknown>")
                raise ValueError(
                    f"매체 '{slug}'에 forbidden 분류 키 발견 — {forbidden}. "
                    "ADR-009 Amendment 1로 절대 금지."
                )

    return Whitelist.model_validate(raw)


def filter_active(whitelist: Whitelist) -> list[Source]:
    """CLAUDE.md rule 7 — 활성화된 source만 반환.

    P0a Exit Criteria (PRD v1.7 §11) — active source ≥ 15.
    """

    active = [s for s in whitelist.sources if s.is_active]
    logger.info(
        "sources.filter_active",
        total=len(whitelist.sources),
        active=len(active),
        staged=len(whitelist.sources) - len(active),
    )
    return active
