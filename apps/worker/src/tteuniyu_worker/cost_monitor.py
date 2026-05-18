# LLM 비용 모니터 — ADR-014 $50/월 cap + Slack alert
#
# 비협상 (CLAUDE.md rule 9 + ADR-014).
#   모든 LLM call의 cost를 누적, 월 cap 도달 시 Slack alert.
#   cap 초과 시 LLM 호출 자동 중단 (raise CostCapExceeded).

from __future__ import annotations

import json
import os
import urllib.request
from dataclasses import dataclass
from datetime import date
from threading import Lock

import structlog

logger = structlog.get_logger(__name__)

# ADR-014 — 월 cap default $50. env로 override 가능.
DEFAULT_MONTHLY_CAP_USD = 50.0


# Gemini 2.5 Flash-Lite 가격 (2026-05 기준 추정, 보수적).
# Input — $0.10 / 1M tokens = $0.0001 / 1K
# Output — $0.40 / 1M tokens = $0.0004 / 1K
# 2.5 Flash는 thinking 토큰 과금으로 비용 폭증 — flash-lite로 이전.
# 토큰 수는 usage_metadata 실측값 사용 (audit.extract_token_counts).
GEMINI_FLASH_INPUT_USD_PER_1K = 0.0001
GEMINI_FLASH_OUTPUT_USD_PER_1K = 0.0004


class CostCapExceeded(RuntimeError):
    """월 cost cap 초과 시 raise — 즉시 LLM 호출 중단."""


@dataclass
class CostMonitor:
    """월별 LLM 비용 추적.

    실 운영 시 — Supabase audit_logs에서 월 누적 cost 조회 후 본 모니터에 sync.
    P0a 단계는 in-memory 추적 (worker 재시작 시 reset — Step 5 후속 PR에서 DB 통합).
    """

    monthly_cap_usd: float = DEFAULT_MONTHLY_CAP_USD
    slack_webhook_url: str | None = None
    _lock: Lock = Lock()
    _current_month: str | None = None
    _current_total_usd: float = 0.0
    _alert_sent: bool = False

    def __post_init__(self) -> None:
        if self.slack_webhook_url is None:
            self.slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        env_cap = os.getenv("MONTHLY_COST_CAP_USD")
        if env_cap:
            try:
                self.monthly_cap_usd = float(env_cap)
            except ValueError:
                pass

    def _ensure_current_month(self) -> None:
        today = date.today()
        month = f"{today.year}-{today.month:02d}"
        if self._current_month != month:
            self._current_month = month
            self._current_total_usd = 0.0
            self._alert_sent = False

    def add(self, cost_usd: float, source: str = "gemini-2.5-flash") -> None:
        """비용 추가 + cap 검사.

        cap 80% 도달 시 Slack alert (1회만).
        cap 100% 초과 시 CostCapExceeded raise.
        """
        with self._lock:
            self._ensure_current_month()
            self._current_total_usd += cost_usd

            pct = (self._current_total_usd / self.monthly_cap_usd) * 100
            logger.info(
                "cost.added",
                source=source,
                cost_usd=cost_usd,
                month_total_usd=round(self._current_total_usd, 4),
                cap_pct=round(pct, 1),
            )

            if pct >= 100.0:
                raise CostCapExceeded(
                    f"월 cap ${self.monthly_cap_usd:.2f} 도달 — "
                    f"누적 ${self._current_total_usd:.2f} ({self._current_month})"
                )

            if pct >= 80.0 and not self._alert_sent:
                self._send_slack_alert(pct)
                self._alert_sent = True

    def _send_slack_alert(self, cap_pct: float) -> None:
        if not self.slack_webhook_url:
            logger.warning("cost.alert.no_webhook", cap_pct=cap_pct)
            return

        message = (
            f":warning: 뜬 이유 LLM 월 cost {cap_pct:.0f}% 도달 "
            f"(${self._current_total_usd:.2f} / ${self.monthly_cap_usd:.2f}) "
            f"— {self._current_month}"
        )
        try:
            req = urllib.request.Request(
                self.slack_webhook_url,
                data=json.dumps({"text": message}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            urllib.request.urlopen(req, timeout=5).read()
            logger.info("cost.alert.sent", cap_pct=cap_pct)
        except Exception as err:
            logger.error("cost.alert.failed", error=str(err))

    @property
    def month_total_usd(self) -> float:
        with self._lock:
            self._ensure_current_month()
            return self._current_total_usd

    @property
    def remaining_usd(self) -> float:
        return max(0.0, self.monthly_cap_usd - self.month_total_usd)


def estimate_gemini_cost(input_tokens: int, output_tokens: int) -> float:
    """Gemini 2.5 Flash 토큰당 비용 추정."""
    input_cost = (input_tokens / 1000) * GEMINI_FLASH_INPUT_USD_PER_1K
    output_cost = (output_tokens / 1000) * GEMINI_FLASH_OUTPUT_USD_PER_1K
    return input_cost + output_cost
