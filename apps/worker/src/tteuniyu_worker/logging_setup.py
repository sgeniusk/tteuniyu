# structlog JSON 로깅 설정 — GHA·맥미니·로컬 모두 동일 포맷

"""structlog 기반 JSON 로깅. CI·운영·로컬 통합 포맷."""

from __future__ import annotations

import logging
import os
import sys

import structlog


def configure(level: str | None = None) -> None:
    """structlog 초기화.

    LOG_LEVEL env 또는 인자로 레벨 결정 (default INFO).
    LOG_FORMAT=plain이면 사람용 출력, 그 외 JSON.
    """

    log_level = (level or os.getenv("LOG_LEVEL", "INFO")).upper()
    log_format = os.getenv("LOG_FORMAT", "json").lower()

    logging.basicConfig(
        level=log_level,
        format="%(message)s",
        stream=sys.stdout,
    )

    processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if log_format == "plain":
        processors.append(structlog.dev.ConsoleRenderer(colors=True))
    else:
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelNamesMapping()[log_level]
        ),
        cache_logger_on_first_use=True,
    )
