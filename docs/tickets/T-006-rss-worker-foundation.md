# T-006 — RSS 워커 + 클러스터링 + LLM 요약 (P0a Foundation)

> **Status**: PR #21 (Foundation, 2026-05-10) 머지 완료. PR #22~#24 진입 직전.
> **Single ticket, 4 phased PRs**.
> **Source of truth**: PRD v1.7 §6 Data Source Strategy + v1.7.2 patch.
> **Driving ADR**: ADR-008 (trend pipeline), ADR-014 (LLM 비용), ADR-015 Amendment 2 (Trust Signal), ADR-016 (Privacy).
> **Driving lawyer source**: `docs/legal/2026-05-10-legal-response-opinion.md` 5개 영역.

---

## 1. 목표 (Outcome)

P0w mock 데이터를 P0a 실 RSS 데이터로 전환. 30개 매체 RSS → 본문 요약 → 클러스터링 → Trust Signal LLM 평가 → DB 적재까지 자동화.

**Definition of Done (4 PR 합산)**.
- [ ] sources_whitelist.yaml에 등록된 매체 중 운영자가 활성화(`tos_confirmed AND ingestion_enabled`)한 ≥ 15개 RSS 정상 수집
- [ ] articles 테이블에 시간당 ≥ 100건 적재 (지표는 P0a 시점에 measure)
- [ ] clusters 테이블에 daily ≥ 30 cluster 형성 + Trust Tag 자동 부여 (LLM hard-block 40+ 단어 0건)
- [ ] /api/v1/widget/top?size=large가 mock 대신 DB read로 응답
- [ ] /api/v1/clusters/[id] mock 대신 DB join 응답
- [ ] LLM 워커 비용 ≤ $50/월 cap (ADR-014)
- [ ] 모든 LLM call audit log (CLAUDE.md rule 9)
- [ ] correction_history 1-click 폼 동작

---

## 2. PR 분할

### PR #21 — Foundation (이번, 머지 완료 ✅)

- supabase/migrations/00020_p0a_foundation_schema.sql (8 tables)
- supabase/migrations/00021_p0a_grants.sql (RLS + service_role only)
- config/sources_whitelist.yaml (30 매체 stub, 모두 비활성)
- harness/checks/assert-tos-whitelist.ts 본격 구현
- 본 ticket

### PR #22 — Python 워커 skeleton + RSS dry-run (다음)

**사용자 결정 필요 항목**.
- 워커 hosting — Vercel cron / GitHub Actions / Railway / Fly.io / 맥미니 self-host?
- Python 버전 — 3.11 / 3.12?
- 패키지 매니저 — uv / poetry / pip-tools?

**범위 (사용자 결정 후 확정)**.
- `apps/worker/` 디렉토리 신규
- pyproject.toml + 기본 deps (httpx, feedparser, supabase-py, pydantic, structlog)
- `apps/worker/main.py` — RSS dry-run (active sources만 fetch, DB 적재 X, stdout 출력)
- `apps/worker/sources.py` — yaml 로드 + Pydantic 모델 + filter active
- 환경변수 — `.env.example` 추가 (SUPABASE_URL, SERVICE_ROLE_KEY 등)
- README — 로컬 실행 방법 + cron 스케줄 안내

### PR #23 — HTML 본문 추출 + Supabase client + ingest subcommand (메타만 INSERT)

상태 — 머지 완료 (2026-05-10).

- `apps/worker/src/tteuniyu_worker/db.py` — Supabase service_role client (lazy, env 기반)
  - `ArticleInsert` Pydantic + `insert_articles` (upsert by url)
  - 환경변수 미설정 시 dry-run mode로 fall-back (CI / 로컬 친화)
- `apps/worker/src/tteuniyu_worker/extract.py` — trafilatura 본문 추출 (RAM only, rule 2)
  - include_images=False (rule 3), include_links/comments/tables=False
  - target_language='ko' for Korean media
- `apps/worker/src/tteuniyu_worker/ingest.py` — orchestrate (RSS fetch → HTML fetch → 본문 추출 → INSERT articles)
  - articles INSERT는 source_slug + url + headline + published_at만 (body 저장 X, rule 2)
  - 본문 char_count는 stat으로 log만 (PR #25 LLM 호출 시 in-memory 재사용)
- `apps/worker/src/tteuniyu_worker/main.py` — `ingest` subcommand 추가
- `apps/worker/tests/test_sources.py` — 4 단위 테스트 (Pydantic + ADR-009 Amendment 1 forbidden 키 거부 등)
- `apps/worker/uv.lock` — 잠긴 의존성 (CI `uv sync --frozen` 요구)

### PR #24 — 임베딩 + HDBSCAN 클러스터링 + cron 활성화

- `apps/worker/src/tteuniyu_worker/embed.py` — sentence-transformers `paraphrase-multilingual-MiniLM-L12-v2`
  - embedding은 worker RAM에서 클러스터링 즉시 사용 후 폐기 (CLAUDE.md rule 4)
- `apps/worker/src/tteuniyu_worker/cluster.py` — HDBSCAN (sklearn)
  - 결과 cluster + cluster_articles 적재
  - sample_quality 자동 결정 (sample_size < 5 → insufficient_sample)
  - ad_allowed 자동 false 부여 (18+ 민감 카테고리, ADR-007 Amendment 1)
- 신규 harness — `assert-no-image-storage` 본격 구현 + `assert-source-provenance` 본격 구현
- `.github/workflows/p0a-worker.yml` — schedule cron `*/5 * * * *` 활성화

### PR #25 — LLM 요약 + Trust Signal + audit log + cost cap

- `apps/worker/src/tteuniyu_worker/summarize.py` — Gemini 2.0 Flash (ADR-014 Phase 1) — why_trending + coverage_summary
  - prompt_version `summary_v1` + audit log (model, input_hash, output_hash, copy_ratio, validator_version)
  - LLM hard-block 40+ 단어 validator (ADR-015 Amendment 2)
  - copy ratio ≤ 15% (CLAUDE.md rule 2 + harness:summary-copy-rate)
- `apps/worker/src/tteuniyu_worker/trust_signal.py` — Trust Signal LLM (prompt_version `trust_signal_v1`)
  - hoax_likelihood / clickbait_score / is_investment 평가
  - human_review_required 자동 큐 (ADR-015 A2.7 — 정치/선거/범죄/사망/재난/의료/금융 카테고리)
- `apps/worker/src/tteuniyu_worker/cost_monitor.py` — 일일 비용 누적 + $50/월 cap 도달 시 Slack alert (ADR-014)
- `apps/web/app/api/v1/widget/top/route.ts` — DB read 모드 추가 (env flag)
- 신규 harness — `assert-investment-language-block` 본격 구현 (40+ hard-block)

---

## 3. 사용자 결정 대기 항목

### 3.1 워커 hosting (PR #22 진입 전)

| 옵션 | 비용 | 장단점 | Founder 부담 |
|---|---|---|---|
| **Vercel Cron** | Pro $20/월 + Functions | Next.js 통합 깔끔, 콜드 스타트 | 낮음 |
| **GitHub Actions** | 무료 (public repo는 무제한) | 간단, scheduled workflow | 낮음 |
| **Railway** | $5/월 starter | 항상 켜진 worker, log 보존 | 낮음 |
| **Fly.io** | 무료 tier | scale-to-zero, region 선택 | 중간 |
| **맥미니 self-host** | 0 (이미 보유) | 비용 0, ADR-014 Phase 2와 정합 | 중간 (전기·네트워크) |

**추천** — GitHub Actions (cron schedule + free + secrets 통합) 또는 맥미니 (ADR-014 Phase 2 미리 시작).

### 3.2 Python 버전

- 3.11 (성숙 + 광범위 호환) 또는 3.12 (PEP 723 single-file scripts).
- 추천 — 3.12 (PEP 723으로 단일 파일 worker 시작 가능).

### 3.3 패키지 매니저

- uv (가장 빠름, 2024 표준화) / poetry (성숙) / pip-tools (단순).
- 추천 — uv (현 대세).

---

## 4. 대기 중인 운영자 액션

P0a 진입 직전에 사용자(태욱)가 수행.

- [ ] 30개 매체 ToS 직접 정독 + 변호사 검토 후 `config/sources_whitelist.yaml`의 `tos_confirmed: true` + `confirmed_at` 채움
- [ ] 매체에 RSS 자동 수집 + 정정 채널 응답 가능 여부 확인 (필요 시 contact)
- [ ] `ingestion_enabled: true`로 활성화
- [ ] 변호사 사인오프 후 `docs/privacy-policy-draft.md` → `v1.0.md`로 정식
- [ ] 회사 등기 + 사업자명·주소 채움 (privacy-policy v1.0 §10)

---

## 5. 비협상 체크 (워커 코드 작성 시)

- [ ] CLAUDE.md rule 2 — articles.body 절대 저장 X. 본문은 RAM에서만 처리
- [ ] CLAUDE.md rule 3 — image URL/thumbnail 저장 X
- [ ] CLAUDE.md rule 4 — embedding은 RAM에서만 처리 후 즉시 폐기
- [ ] CLAUDE.md rule 7 — sources_whitelist의 active source만 fetch
- [ ] CLAUDE.md rule 9 — 모든 LLM call에 prompt_version + model + input_hash + output_hash 로그
- [ ] CLAUDE.md rule 11 — 워커는 service_role key만 사용, anon X
- [ ] CLAUDE.md rule 15 — Trust Tag UI 라벨 X (worker는 internal field만 채움)
- [ ] ADR-007 Amendment 1 — 18+ 민감 카테고리는 ad_allowed=false 자동 부여
- [ ] ADR-014 — LLM call 비용 누적 + $50/월 cap + Slack alert
- [ ] ADR-015 Amendment 2 — LLM hard-block 40+ 단어 0건 강제 (validator)
- [ ] ADR-016 — PostHog autocapture 비활성화 + 직접 식별자 전송 X

---

## 6. 기존 mock 코드와의 공존 (PR #22~#24)

PR #22~#24 머지 동안 mock + DB 동시 운영. env flag로 분기.

```ts
// apps/web/app/api/v1/widget/top/route.ts (PR #24)
const USE_DB = process.env.WIDGET_DATA_SOURCE === 'db'
const clusters = USE_DB
  ? await fetchClustersFromDb(now, 20)
  : rotateClusters(now, 20)
```

P0a Exit 시점에 mock 코드 deprecate (rotateClusters 함수 + clusters.ts mock 삭제).

---

## 7. References

- PRD v1.7 §6 Data Source Strategy + §11 P0a Exit Criteria
- PRD v1.7.2 patch §3.4 SNS 공유 카드 자동 삽입
- ADR-008 (trend time series pipeline)
- ADR-013 (헤드라인 본론 추출)
- ADR-014 (cost-optimized AI summary pipeline)
- ADR-015 (+ Amendment 2 — Trust Signal & Investment Risk)
- ADR-016 (Privacy & Data Boundary)
- `docs/legal/2026-05-10-legal-response-opinion.md` (변호사 자문 740줄)
- harness/checks/README.md (21종 카탈로그)

**End of T-006 — 2026-05-10**
