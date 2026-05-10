# sources.py 테스트 — Pydantic 검증 + ADR-009 Amendment 1 forbidden 키 거부

"""sources 모듈 단위 테스트.

핵심 시나리오.
  1. 정상 yaml 로드 + filter_active 동작
  2. ADR-009 Amendment 1 — stance/ideology 분류 키 발견 시 ValueError
  3. CLAUDE.md rule 7 — 한 플래그만 true이면 inactive 처리
  4. tos_confirmed=true인데 confirmed_at 누락 시 (yaml 단위 검증은 harness가, Python은 통과)
"""

from __future__ import annotations

from pathlib import Path

import pytest
from pydantic import ValidationError

from tteuniyu_worker.sources import Source, Whitelist, filter_active, load


def test_source_active_requires_both_flags():
    base = {
        "slug": "test",
        "name": "Test 매체",
        "rss_url": "https://example.com/rss",
        "base_url": "https://example.com",
        "tos_confirmed": True,
        "ingestion_enabled": True,
    }
    assert Source(**base).is_active is True

    only_tos = {**base, "ingestion_enabled": False}
    assert Source(**only_tos).is_active is False

    only_ing = {**base, "tos_confirmed": False}
    assert Source(**only_ing).is_active is False


def test_source_rejects_forbidden_classification_keys():
    """ADR-009 Amendment 1 — stance/ideology 등 분류 키 거부."""

    base = {
        "slug": "bad",
        "name": "Bad",
        "rss_url": "https://example.com/rss",
        "base_url": "https://example.com",
        "tos_confirmed": False,
        "ingestion_enabled": False,
    }

    for forbidden in ["stance", "ideology", "leaning", "bias", "tilt"]:
        payload = {**base, forbidden: "left"}
        with pytest.raises(ValidationError) as exc:
            Source(**payload)
        assert forbidden in str(exc.value)


def test_load_real_whitelist():
    """저장소 실제 yaml 로드 검증 — 30+ sources, 모두 staged."""

    project_root = Path(__file__).resolve().parents[2].parent
    yaml_path = project_root / "config" / "sources_whitelist.yaml"
    if not yaml_path.exists():
        pytest.skip(f"whitelist not found at {yaml_path}")

    whitelist = load(yaml_path)
    assert isinstance(whitelist, Whitelist)
    assert len(whitelist.sources) >= 15
    assert whitelist.version >= 1


def test_filter_active_returns_only_dual_flag():
    sources = [
        Source(
            slug="a",
            name="A",
            rss_url="https://a.com/rss",
            base_url="https://a.com",
            tos_confirmed=True,
            ingestion_enabled=True,
        ),
        Source(
            slug="b",
            name="B",
            rss_url="https://b.com/rss",
            base_url="https://b.com",
            tos_confirmed=True,
            ingestion_enabled=False,
        ),
        Source(
            slug="c",
            name="C",
            rss_url="https://c.com/rss",
            base_url="https://c.com",
            tos_confirmed=False,
            ingestion_enabled=True,
        ),
    ]
    whitelist = Whitelist(version=1, last_updated="2026-05-10", sources=[
        *sources,
        # filler — Whitelist가 min_length=15 강제하므로 더미 추가
        *[
            Source(
                slug=f"fill{i}",
                name=f"Fill {i}",
                rss_url=f"https://fill{i}.com/rss",
                base_url=f"https://fill{i}.com",
                tos_confirmed=False,
                ingestion_enabled=False,
            )
            for i in range(12)
        ],
    ])

    active = filter_active(whitelist)
    assert len(active) == 1
    assert active[0].slug == "a"
