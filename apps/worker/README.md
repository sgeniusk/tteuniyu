# tteuniyu-worker

> RSS 수집 + 클러스터링 + LLM 요약 워커 — P0a Foundation (T-006).
>
> **Status (2026-05-10)** — PR #22 RSS dry-run only. PR #23 클러스터링 / PR #24 LLM 합류 예정.
> **Hosting** — GitHub Actions cron (매 5분, manual trigger 우선).
> **Runtime** — Python 3.12 + uv.

---

## 빠른 시작 (로컬)

### 1. uv 설치

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
# 또는
brew install uv
```

### 2. 의존성 설치 + 가상환경 생성

```bash
cd apps/worker
uv sync                  # .venv 자동 생성 + lockfile 동기화
```

### 3. RSS dry-run 실행

```bash
# 저장소 루트에서 실행 (whitelist 경로가 cwd 기반 default)
cd /path/to/tteuniyu
uv --directory apps/worker run worker dry-run
```

또는 직접.

```bash
cd apps/worker
uv run worker dry-run --whitelist ../../config/sources_whitelist.yaml
```

### 4. 출력 예 (active source 0개일 때)

```
⚠ active source 0개. 운영자가 yaml에서 tos_confirmed:true + ingestion_enabled:true로 활성화 필요.
총 30개 source 등록됨 (모두 staged).
```

운영자가 매체 ToS 확인 + `confirmed_at` 채움 + `ingestion_enabled: true` 활성화 후 다시 실행.

---

## 비협상 제약 (CLAUDE.md + ADR)

| Rule | 본 워커 적용 |
|---|---|
| rule 2 — body 저장 X | RSS feed의 `<title>` + `<link>` + `<published>`만 메모리 처리, DB 적재 X (PR #22 dry-run 한정) |
| rule 3 — image URL 저장 X | 본 워커는 이미지 URL 처리 X |
| rule 7 — tos_confirmed AND ingestion_enabled | `sources.filter_active()`가 강제 |
| rule 9 — 모든 LLM call audit log | PR #24에서 적용 (PR #22는 LLM 미사용) |
| rule 11 — service_role only | `SUPABASE_SERVICE_ROLE_KEY` env로만 접근 |
| ADR-009 Amendment 1 | sources.py의 `FORBIDDEN_KEYS` + Pydantic `extra='forbid'`로 분류 키 거부 |
| ADR-014 — $50/월 cap | PR #24에서 cost monitor 추가 |

---

## GitHub Actions cron 운영

`.github/workflows/p0a-worker.yml` 에서.

- **trigger** — `workflow_dispatch` (수동 실행) + `schedule` cron `*/5 * * * *` (5분마다, 추후 활성화)
- **secrets** — repo Settings → Secrets에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `SLACK_WEBHOOK_URL` 등록
- **dry-run** — 처음 며칠은 dry-run subcommand로 실 active source RSS 정상 동작 확인 후 `ingest` (PR #23 진입 시 신규 subcommand) 활성화

### 첫 수동 실행

```bash
gh workflow run p0a-worker.yml --ref main
```

---

## 디렉토리 구조

```
apps/worker/
├── .env.example
├── .python-version              # 3.12
├── pyproject.toml               # uv + hatchling 빌드
├── README.md
└── src/
    └── tteuniyu_worker/
        ├── __init__.py
        ├── main.py              # CLI entry — dry-run subcommand
        ├── sources.py           # yaml 로드 + Pydantic + filter_active
        └── logging_setup.py     # structlog JSON
```

PR #23 추가 예정.
- `extract.py` — readability/trafilatura HTML 본문 추출 (RAM only)
- `embed.py` — sentence-transformers 또는 OpenAI ada-002
- `cluster.py` — HDBSCAN 클러스터링 + DB 적재

PR #24 추가 예정.
- `summarize.py` — Gemini 2.0 Flash (ADR-014 Phase 1)
- `trust_signal.py` — Trust Signal LLM + hard-block 40+ validator
- `cost_monitor.py` — 일일 비용 누적 + Slack alert

---

## 테스트

```bash
cd apps/worker
uv run pytest                    # 현재 테스트 0건 (PR #23~#24에서 추가)
uv run ruff check src            # 린트
```

---

## 트러블슈팅

### `worker` 명령이 없다는 에러

```bash
uv sync                          # editable install 재실행
uv run worker dry-run            # uv run으로만 실행
```

### feedparser bozo 경고

매체 RSS에 XML invalid character가 들어있는 경우. PR #23에서 lxml fallback 추가 검토.

### timeout

기본 8s. 매체가 느릴 경우 `MAX_CONCURRENT_FETCH=3`으로 줄여 부담 완화.

---

## References

- T-006 ticket — `docs/tickets/T-006-rss-worker-foundation.md`
- 매체 whitelist — `config/sources_whitelist.yaml`
- harness — `harness/checks/assert-tos-whitelist.ts` (TS, 동일 schema 검증)
- ADR-008 (trend pipeline) / ADR-014 (LLM 비용) / ADR-015 Amendment 2 (Trust Signal)

**End of README — 2026-05-10**
