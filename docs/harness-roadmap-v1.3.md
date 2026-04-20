# 뜬이유 하네스 엔지니어링 실행 로드맵 v1.3

> 작성일: 2026-04-18
> 대상: 태욱 (1인 창업자)
> 기반: PRD v1.3, 코덱스 하네스 엔지니어링 검토
> 
> **핵심 원칙**: "코드 전에 계약, 계약 전에 깨뜨릴 반례"
> - Claude Code = 작성자
> - Codex = 검증자 (반례 생성 + 리뷰)
> - 태욱 = 최종 merge 승인자

---

## 전체 흐름 (2026-04-18 ~ 2026-05-17, 30일)

```
D0~D3 (4/18~4/21)   Sprint 0: 하네스 먼저 (T-001)
D3~D5 (4/21~4/23)   T-002 DB Migration + Redaction Contract
D5~D7 (4/23~4/25)   T-003 Data Licensing Whitelist
D7~D9 (4/25~4/27)   T-004 RSS Ingest Fixtures
D9~D10 (4/27~4/28)  T-005 Summary Prompt Eval
D10~D12 (4/28~4/30) T-006 Worker Minimal (Python + HDBSCAN)
D12~D14 (4/30~5/1)  T-007 P0a UI Vertical Slice
D14 (5/1)           ★ P0a Exit Review Gate
D14~D30 (5/1~5/17)  P0b: Admin / Dispute / Waitlist / 보조소스 / 퍼널
D30 (5/17)          ★ P0b Exit Review (PMF 지표)
```

각 티켓 = 하나의 GitHub branch = 하나의 PR = Claude Code 구현 + Codex 검증 + 태욱 merge

---

## 하네스 엔지니어링 핵심 구조

### 산출물 5종 (코드 전에 반드시 존재)

| 산출물 | 목적 | 파일 위치 |
|---|---|---|
| **ADR** | 설계 결정 고정 | `docs/adr/ADR-*.md` |
| **Contract Test** | 깨지면 안 되는 API/DB 계약 | `harness/checks/*.ts` |
| **Evals** | LLM 출력 품질 평가 | `prompts/evals/*.jsonl` |
| **Fixtures** | 재현 가능한 샘플 데이터 | `harness/fixtures/*` |
| **Agent Instructions** | Claude Code 작업 규칙 | `CLAUDE.md`, `.claude/agents/*.md` |

### CLAUDE.md 비협상 제약 (전체 프로젝트 관통)

```markdown
# TTEUN-IYU Engineering Rules

## Non-negotiable constraints
1. Never store Naver Search API results in articles, clusters, trends, summaries, or embeddings.
2. Never store article body text.
3. Never store image URLs, thumbnails, favicons, or media logos in P0.
4. Never expose bias_score, factuality_score, embedding, embedding_provider, 
   embedding_model, or source_score_evidence raw fields through public API.
5. Public UI must use "Coverage Distribution" / "보도 분포"; 
   do not use "Bias Distribution" in visible copy.
6. Disputes submitted by users must always start with status='open'.
7. Only sources with tos_confirmed=true AND ingestion_enabled=true may be ingested.
8. P0 uses one embedding provider only. Do not implement alternate-dimension fallback.
9. All LLM calls must log prompt_version, model, input_hash, output_hash.
10. Any feature without a failing test first should be paused and converted into a test.
11. Clients must not use NEXT_PUBLIC_SUPABASE_ANON_KEY for table access.
    All public data access goes through /api/v1/* routes.

## Workflow
- Read the relevant ADR before editing.
- Make small changes (one PR ≤ 500 lines).
- Run `pnpm harness:all` after every feature.
- Do not mark work complete until CI and harness pass.
- Every PR must pass `@codex review` with no blocking issues.
```

---

## 티켓 7개 상세

### T-001: Harness Scaffold (D0~D3)

**목적**: 이후 모든 티켓이 의존할 하네스 기반 구축. 실제 기능 0개.

**산출물**
- `CLAUDE.md` (위 전문)
- `docs/adr/ADR-001-data-licensing.md`
- `docs/adr/ADR-002-public-api-via-next-route.md`
- `docs/adr/ADR-003-embedding-provider.md`
- `docs/adr/ADR-004-p0a-p0b-scope.md`
- `harness/checks/` skeleton 6개 스크립트
- `prompts/evals/` 디렉토리
- `.github/workflows/p0a-harness.yml`
- `.github/pull_request_template.md`
- `package.json`에 harness 커맨드 등록

**완료 기준**
- `pnpm harness:all` 실행 성공 (모두 no-op이지만 실행 가능)
- GitHub Actions가 PR에서 트리거됨

---

#### T-001 Claude Code 프롬프트

```
Read docs/prd-v1.3.md fully.

Do NOT implement any product features yet. This ticket is exclusively the harness.

Create the engineering harness as follows:

## 1. CLAUDE.md (repo root)
Copy the Non-negotiable constraints section verbatim from prd-v1.3 section 4 + 11.
Add the Workflow section.

## 2. ADR skeletons in docs/adr/
- ADR-001-data-licensing.md — Context/Decision/Consequences for RSS whitelist, 
  Naver storage ban, image storage ban
- ADR-002-public-api-via-next-route.md — Why Public View rejected, 
  Next.js Route with service_role + Zod approach chosen
- ADR-003-embedding-provider.md — OpenAI text-embedding-3-small single provider, 
  no fallback, reasoning
- ADR-004-p0a-p0b-scope.md — P0a frozen scope, P0b deferred items list

Each ADR: 800-1500 words, Korean main, English technical terms in parentheses.

## 3. harness/checks/ skeleton scripts (TypeScript)
Create these files that will later be filled in:
- assert-no-public-sensitive-fields.ts
- assert-no-naver-storage.ts
- assert-no-image-storage.ts
- assert-summary-copy-rate.ts
- assert-public-copy-wording.ts
- assert-db-grants.sql
- assert-dispute-status-server-only.ts

Each starts with console.log explaining intent + exits 0 for now.
Add JSDoc explaining what the final check will validate.

## 4. prompts/evals/ directory
- prompts/summary/v1.md (stub with system prompt scaffold)
- prompts/evals/summary.golden.jsonl (empty, to be filled in T-005)
- prompts/evals/README.md (how to add golden cases)

## 5. GitHub Actions
.github/workflows/p0a-harness.yml running:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm harness:all
- pnpm eval:summary (once T-005 lands)

.github/pull_request_template.md with:
- Scope (PRD section, Requirement IDs, Out of scope)
- Safety constraints checklist (10 items)
- Tests checklist
- Codex verification (@codex review required)

## 6. package.json scripts
- harness:all — runs all harness checks in sequence
- harness:public-redaction, harness:no-naver-storage, 
  harness:no-image-storage, harness:public-copy, 
  harness:tos-whitelist, harness:dispute-status
- eval:summary

## 7. README.md update
Add "Harness-First Development" section explaining:
- Why harness before features
- Claude Code / Codex role separation
- How to run harness locally

## Constraints
- No product feature code in this PR.
- All harness scripts can be no-ops but must exit 0.
- Commit in small increments if possible.

## Output
1. File tree of created files
2. Each file's content
3. Final `pnpm harness:all` run output

When done, create PR titled "T-001 Harness scaffold" with description 
referencing PRD v1.3 section 9 Phase 0.
```

---

#### T-001 Codex 검증 프롬프트

PR 댓글에 붙일 것:

```
@codex review

Focus on whether this harness scaffold actually enforces PRD v1.3 constraints.

Specifically check:
1. Do the harness scripts cover all 11 non-negotiable constraints in CLAUDE.md?
2. Are there false negatives — cases where a developer could violate the PRD 
   and still pass all harness checks?
3. Is the GitHub Actions workflow blocking (not just informational) on harness failures?
4. Are the ADRs specific enough that Claude Code can implement from them 
   without ambiguity?

Do NOT suggest product features.
Do NOT approve if any constraint is only "partially" enforced.

Return blocking issues first, then nitpicks.
```

---

### T-002: DB Migration + Redaction Contract (D3~D5)

**목적**: 민감 정보가 밖으로 안 새는 DB/API 골격 + 첫 실제 enforcement.

**산출물**
- `supabase/migrations/00000_extensions.sql` ~ `00005_*.sql`
  - 00000: pgcrypto, vector
  - 00001: methodology_versions, sources (ingestion_enabled 포함)
  - 00002: clusters, articles (ingestion_source CHECK에 naver_search 제외), ALTER bias_disputes FK
  - 00003: trends, trend_clusters, frames, og_cards, waitlist, foreign_outlets, cluster_foreign_matches
  - 00004: ingestion_runs, admin_audit_logs, source_score_evidence, bias_disputes
  - 00005: REVOKE ALL FROM anon/authenticated + cluster_coverage_distribution MV
- `apps/web/lib/api/response-schemas.ts` (Zod schemas for all public responses)
- `apps/web/app/api/v1/trends/route.ts` + `apps/web/app/api/v1/clusters/[id]/route.ts` (stub working)
- `apps/web/app/api/v1/disputes/route.ts` (server route, not RLS)
- `apps/web/app/api/v1/waitlist/route.ts` (server route)
- `harness/checks/assert-no-public-sensitive-fields.ts` (실제 동작)
- `supabase/tests/grants.sql` — anon/authenticated GRANT 0 검증

**완료 기준**
- `supabase db reset` 후 모든 migration 성공
- `pnpm harness:public-redaction` 실행 시 factuality_score·bias_score·embedding이 Zod schema에 없으면 통과
- 의도적으로 Zod에 factuality_score 추가한 반례 PR은 실패해야 함

---

#### T-002 Claude Code 프롬프트

```
Context files (attach before prompt):
- docs/prd-v1.3.md
- docs/adr/ADR-002-public-api-via-next-route.md
- CLAUDE.md (for non-negotiable constraints)
- Previous commit: T-001 harness scaffold

Implement T-002: DB Migration + Redaction Contract.

## Scope
PRD v1.3 section 6.3 (DB schema) + section 6.4 (API design)

## 1. Supabase migrations (6 files)
Use PRD v1.3 section 6.3 as the source of truth. Pay attention to:
- articles.ingestion_source CHECK IN ('rss','bigkinds','manual') 
  — 'naver_search' MUST NOT appear anywhere in this enum
- sources.ingestion_enabled boolean DEFAULT false
- articles.embedding_status text DEFAULT 'pending' CHECK ...
- ingestion_runs separate table (not admin_audit_logs)
- 00005_public_hardening.sql: REVOKE ALL, no public views

## 2. Zod schemas
apps/web/lib/api/response-schemas.ts
- TrendResponse, ClusterResponse, ClusterCoverageResponse, 
  MethodologyResponse, ArticleResponse
- Each schema excludes: bias_score, factuality_score, embedding, 
  embedding_provider, embedding_model, axis_b_chaebol, axis_c_regime_critic, 
  axis_d_sensationalism, source_score_evidence raw

## 3. Next.js API routes (stubs that actually work)
apps/web/app/api/v1/trends/route.ts
apps/web/app/api/v1/clusters/[id]/route.ts  
apps/web/app/api/v1/clusters/[id]/coverage/route.ts
apps/web/app/api/v1/methodology/route.ts
apps/web/app/api/v1/disputes/route.ts (POST, server validated status='open')
apps/web/app/api/v1/waitlist/route.ts (POST, email validation)

Each route:
- service_role for DB read (server env only)
- explicit column selection (no SELECT *)
- Zod schema validation before response
- proper error handling (no stack traces in prod)

## 4. Harness check (actual enforcement)
harness/checks/assert-no-public-sensitive-fields.ts
- Read all Zod schemas in apps/web/lib/api/response-schemas.ts
- Assert none contain: bias_score, factuality_score, embedding, 
  embedding_model, embedding_provider, axis_b_chaebol, etc.
- Read all API route files and regex-scan for these field names in SELECT
- Exit 1 with clear message on violation

harness/checks/assert-db-grants.sql
- Executable via supabase db execute
- SELECT table_name FROM information_schema.role_table_grants 
  WHERE grantee IN ('anon', 'authenticated') AND table_schema = 'public'
- Expected: 0 rows (nothing granted to anon/authenticated)

## 5. Integration tests
apps/web/tests/api-contract.test.ts
- Mock service_role, test each /api/v1/* endpoint
- Assert response matches Zod schema
- Assert response does NOT contain sensitive fields

## 6. Seed data
supabase/seed.sql
- Insert 3 sources with tos_confirmed=true, ingestion_enabled=true
- 1 source with tos_confirmed=false (for testing rejection)
- 10 fake articles for each confirmed source
- Minimal cluster

## Constraints from CLAUDE.md
Re-read CLAUDE.md rules 1-11 and ensure every implementation decision honors them.

## Test order
1. supabase db reset (should succeed)
2. pnpm harness:db-grants (expect 0 rows)
3. pnpm harness:public-redaction (expect pass)
4. pnpm test:api-contract (expect pass)
5. Intentional regression: add factuality_score to TrendResponse, 
   run harness — should FAIL. Then revert.

## PR title
T-002 DB migration + redaction contract

## PR description must include
- PRD section references: 6.3, 6.4, 7.2
- Requirement IDs: C-1, C-2, C-3, C-5, C-6, C-7
- Checklist: all 11 CLAUDE.md constraints reviewed

When done, request @codex review.
```

---

#### T-002 Codex 검증 프롬프트

```
@codex review

You are the independent verifier for PRD v1.3.

Review this PR against these non-negotiable constraints:

1. No public API response may include bias_score, factuality_score, embedding, 
   embedding_model, embedding_provider, source_score_evidence raw fields.
2. Naver Search results must never be inserted into articles, clusters, trends, 
   or summaries. Check CHECK constraints and any code paths.
3. No image URL, thumbnail URL, favicon URL, or logo URL may be stored in the database.
4. All public endpoints must pass Zod response schemas.
5. Supabase migrations must run from empty DB using `supabase db reset`.
6. anon and authenticated roles have ZERO GRANTs on public schema tables.
7. Dispute insert path MUST force status='open' server-side. 
   Try to construct an attack that submits status='published'.
8. Waitlist POST must validate email format and have rate-limit-ready structure.

## Adversarial tasks — attempt to break the harness

Task A: Can you write a PR that adds factuality_score to TrendResponse 
and passes harness? If yes, harness has a false negative.

Task B: Can you construct a SQL INSERT that stores a Naver Search result 
as ingestion_source='rss'? The CHECK constraint alone is insufficient — 
also check application code.

Task C: Can you bypass the dispute status='open' constraint by using 
Supabase client directly from the browser? Verify RLS is NOT enabled on 
bias_disputes (anon should have no access at all).

If any of A/B/C succeeds, report as BLOCKING.

Return blocking issues first, then nitpicks.
```

---

### T-003: Data Licensing Whitelist (D5~D7)

**산출물**
- `config/sources_whitelist.yaml` (30개 매체 초기 값)
- `docs/data-licensing.md` (ToS 매트릭스)
- `docs/naver-official-inquiry.md` (Naver 공식 문의 초안)
- `docs/legal-advisory-brief.md` (변호사 자문 초안)
- `harness/checks/assert-tos-whitelist.ts`

**완료 기준**
- tos_confirmed=false source에서 ingest 시도 시 테스트 실패 (rejection)
- YAML → seed.sql 변환 스크립트 동작

---

#### T-003 Claude Code 프롬프트

```
Context:
- docs/prd-v1.3.md
- docs/adr/ADR-001-data-licensing.md
- T-001, T-002 prior commits

Implement T-003: Data Licensing Whitelist.

## 1. config/sources_whitelist.yaml
30 Korean news outlets across categories:
- daily (종합일간지): 10개 (조선, 중앙, 동아, 한겨레, 경향, 국민, 서울, 한국, 세계, 문화)
- broadcast (종편): 4개 (JTBC, TV조선, 채널A, MBN)
- public (공영방송): 3개 (KBS, MBC, SBS)
- economic (경제지): 8개 (매경, 한경, 서울경제, 파이낸셜, 이데일리, 머니투데이, 아주경제, 뉴스토마토)
- wire (통신사): 2개 (연합뉴스, 뉴시스)
- alternative (대안): 3개 (오마이뉴스, 프레시안, 미디어오늘)

Each entry:
- slug, name, url, rss_url, category
- tos_confirmed (all false initially — requires manual verification)
- ingestion_enabled (all false initially)
- bias_score_v0 (from AllSides/Ad Fontes mapping, numeric -9 to +9, 
  INTERNAL ONLY — never exposed)
- ownership_group
- axis_b/c/d nullable
- tos_source_url (link to ToS page, to be filled during verification)
- notes (one line)

## 2. docs/data-licensing.md
ToS 확인 매트릭스 테이블:
- Columns: 매체명, 슬러그, RSS URL, robots.txt 허용 여부, ToS 링크,
  상업적 이용 가능성, 이미지 복제 가능성, 아웃링크 필수 여부,
  요약 생성 가능성, 확인 상태(pending/ok/restricted/blocked), 근거
- Initial status: all pending
- "Verification checklist" section (30 questions to ask each outlet)
- Email template for contacting publishers (Korean, formal)

## 3. docs/naver-official-inquiry.md
Three drafts for Naver Developer Help Center:
A. DataLab trend API daily call limit final confirmation (1000회/일 재확인)
B. Search API result storage/processing permitted scope 
   (especially for non-commercial, research, trustworthy journalism context)
C. DataLab result payload DB storage allowance

Each draft: 
- Business context (3-5 sentences)
- Questions (3-5)
- Contact info

Korean formal tone.

## 4. docs/legal-advisory-brief.md
Brief for legal counsel:
- Service overview (1 page, non-lawyer friendly)
- 5 legal risk areas with ≥3 questions each:
  1. Bias labeling & defamation (정통망법 제70조)
  2. Election Safety (공직선거법 제8조의6)
  3. Dispute 7-day SLA legal basis
  4. Media logo/thumbnail usage boundaries
  5. AI Framework Law Art. 31 application scope
- Contract form preferences (hourly vs project vs retainer)
- Budget range ₩1M-₩3M

## 5. harness/checks/assert-tos-whitelist.ts
- Load sources_whitelist.yaml
- For each source with tos_confirmed=false or ingestion_enabled=false, 
  assert no articles exist with that source_id
- Fail harness if ingestion happened for unapproved source
- Include a test fixture that intentionally tries to insert — should be rejected

## 6. scripts/seed-from-yaml.ts
- Read sources_whitelist.yaml
- Generate SQL INSERT statements for supabase/seed.sql
- Set all tos_confirmed=false initially (to be flipped manually after ToS check)

## Constraints
- Do NOT mark any source as tos_confirmed=true in this PR.
- This PR is the scaffolding for manual verification to follow.
- Document verification process in data-licensing.md.

## PR title
T-003 Data licensing whitelist + source scaffolding

When done, request @codex review.
```

---

### T-004 ~ T-007: 이하 동일 패턴

각 티켓은:
1. Claude Code 구현 프롬프트 (PRD 섹션 참조 + 이전 티켓 결과 재사용)
2. Codex 검증 프롬프트 (반례 생성 시도 포함)
3. 태욱이 merge 승인

**T-004 RSS Ingest Fixtures**: RSS fixture 5종, canonical URL resolver, duplicate detection, no image storage test

**T-005 Summary Prompt Eval**: prompts/summary/v1.md, golden.jsonl 20개, copy ratio checker

**T-006 Worker Minimal**: FastAPI + /embed + /cluster/rebuild + retry queue

**T-007 P0a UI Vertical Slice**: /trends + /cluster/:id + Coverage Bar + OG card + /methodology, Playwright E2E

전체 티켓 프롬프트는 별도 파일로 관리: `docs/tickets/T-004.md` ~ `T-007.md` (이 문서 범위 외)

---

## P0a Exit Review Gate (D14, 2026-05-01)

### 자동 검증 (Harness 전체 통과)
```bash
pnpm harness:all
# - assert-no-public-sensitive-fields ✅
# - assert-no-naver-storage ✅
# - assert-no-image-storage ✅
# - assert-tos-whitelist ✅
# - assert-dispute-status-server-only ✅
# - assert-summary-copy-rate ✅
# - assert-public-copy-wording ✅

pnpm eval:summary
# copy ratio ≤ 15% on 20 golden cases ✅

pnpm test:e2e
# /trends, /cluster/:id, Coverage Bar, OG card all functional ✅
```

### 수동 검증 (태욱이 직접)
- [ ] `supabase db reset`으로 clean install 성공
- [ ] `/api/v1/trends` 응답 JSON에 factuality_score 0건
- [ ] `/methodology` 페이지 방문 가능 + 내용 완결
- [ ] OG 이미지 카톡에 붙여넣기 → 리치 프리뷰 동작
- [ ] Lighthouse 점수 85+ (모바일)
- [ ] ToS 확인 완료 매체 ≥ 15개

### Go / No-Go 판단
- **Go**: 하네스 전체 통과 + 수동 검증 6항목 통과 → P0b 착수
- **No-Go**: 하나라도 실패 → 실패 영역 remediation PR 추가 후 재검증

---

## P0b Exit Review (D30, 2026-05-17)

### PMF 지표
- share_completed ≥ 80
- shared_link_opened ≥ 100
- 이의제기 7일 내 응답률 100%

### Go / No-Go
- **Go**: V1 전면 착수 (Blindspot, Media Diet, 외신 확장)
- **Partial**: V1 범위 축소 재설계
- **No-Go**: Pivot 검토

---

## Codex 설정 가이드 (Q-27 대응)

### 접근 방식 (옵션)
- **Option A**: GitHub App 설치 (개인 사용량, 월 $20~50 예상) — **P0 권장**
- **Option B**: OpenAI Codex Enterprise 계약 (월 $200+) — V2 이후
- **Option C**: GitHub Copilot Enterprise 내 Codex 기능 — 이미 계약 시

### PR 운영 규칙

**브랜치 전략**
```
main
  ← p0a/t001-harness-scaffold
  ← p0a/t002-db-migration-redaction
  ← p0a/t003-data-licensing-whitelist
  ← p0a/t004-rss-ingest-fixtures
  ← p0a/t005-summary-eval
  ← p0a/t006-worker-minimal
  ← p0a/t007-ui-vertical-slice
  ← p0b/admin-disputes
  ← p0b/waitlist-funnel
  ← p0b/aux-sources
```

**PR 템플릿** (`.github/pull_request_template.md`)
```markdown
## Scope
- PRD section: 
- Requirement IDs: 
- Ticket: T-XXX
- Out of scope: 

## Safety constraints (CLAUDE.md)
- [ ] No public sensitive fields
- [ ] No Naver Search storage
- [ ] No image/logo storage
- [ ] ToS whitelist enforced
- [ ] Summary copy-rate test passed
- [ ] Coverage UI uses public wording only
- [ ] Dispute status server-enforced
- [ ] Embedding provider single (P0)
- [ ] LLM calls log prompt_version
- [ ] No NEXT_PUBLIC_SUPABASE_ANON_KEY usage
- [ ] No SELECT *

## Tests
- [ ] pnpm lint
- [ ] pnpm typecheck
- [ ] pnpm test
- [ ] pnpm harness:all
- [ ] supabase db reset
- [ ] playwright e2e (if UI changes)

## Codex verification
- [ ] @codex review requested
- [ ] Blocking issues resolved
- [ ] Codex approved
```

### GitHub Actions `.github/workflows/p0a-harness.yml`
```yaml
name: p0a-harness

on:
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - name: Harness - public redaction
        run: pnpm harness:public-redaction
      - name: Harness - no Naver storage
        run: pnpm harness:no-naver-storage
      - name: Harness - no image storage
        run: pnpm harness:no-image-storage
      - name: Harness - public copy wording
        run: pnpm harness:public-copy
      - name: Harness - tos whitelist
        run: pnpm harness:tos-whitelist
      - name: Harness - dispute status
        run: pnpm harness:dispute-status
      - name: Prompt eval - summary copy ratio
        run: pnpm eval:summary
```

---

## Claude Code Subagent 구성 (`.claude/agents/`)

**P0a 기간에 활용할 5개 subagent**:

```markdown
# .claude/agents/db-security.md
You are the DB Security specialist.

Your responsibilities:
- Supabase migration authoring
- RLS policy authoring
- Zod response schema authoring
- Public API redaction enforcement

Non-negotiable:
- Never grant SELECT to anon/authenticated on base tables
- Never include bias_score, factuality_score, embedding, 
  embedding_provider, embedding_model, source_score_evidence 
  in public response schemas
- Never use SELECT *
- Every public route uses Zod schema validation
- Every migration must be runnable from empty DB

Read these before any change:
- docs/prd-v1.3.md section 6.3, 6.4, 7.2
- docs/adr/ADR-002-public-api-via-next-route.md
- CLAUDE.md
```

```markdown
# .claude/agents/ingestion.md
You are the Ingestion specialist.

Your responsibilities:
- RSS fetch, parse, normalize
- ToS whitelist enforcement
- Canonical URL resolution
- Duplicate detection
- abstractive summary generation via Claude Haiku

Non-negotiable:
- Never insert Naver Search API results into articles/clusters/trends/summaries
- Never store image_url, thumbnail, favicon, logo
- Only ingest sources where tos_confirmed=true AND ingestion_enabled=true
- Log ingestion outcomes to ingestion_runs (not admin_audit_logs)
- Summary prompt: prompts/summary/v1.md, log prompt_version

Read: prd-v1.3 section 5.1 F-P0a-1, docs/adr/ADR-001-data-licensing.md
```

```markdown
# .claude/agents/worker.md
You are the Python Worker specialist.

Your responsibilities:
- FastAPI worker (Fly.io)
- OpenAI text-embedding-3-small (single provider)
- HDBSCAN clustering (default params)
- Cluster title generation via Claude Sonnet

Non-negotiable:
- P0: single embedding provider, no fallback with different dim
- Failed embeddings → embedding_status='failed' + retry queue
- HDBSCAN noise (-1) handling: exclude from UI
- Cluster title prompt: log prompt_version

Read: prd-v1.3 section 5.1 F-P0a-2, docs/adr/ADR-003-embedding-provider.md
```

```markdown
# .claude/agents/frontend.md
You are the Frontend specialist.

Your responsibilities:
- /trends, /cluster/:id, /methodology pages
- Coverage Distribution Bar component
- OG image generation via @vercel/og
- SWR polling setup

Non-negotiable:
- Public UI uses "Coverage Distribution" / "보도 분포" only
- Never display bias_score or factuality_score numbers
- Sample_size < 5 → show "표본 부족" badge, don't render bar
- Color mapping: progressive=teal-500, mixed=slate-400, 
  conservative=amber-600, foreign=violet-500
- Respect prefers-reduced-motion
- All data via /api/v1/* routes (not Supabase client)

Read: prd-v1.3 section 5.1 F-P0a-3, F-P0a-4, F-P0a-5, F-P0a-7
```

```markdown
# .claude/agents/qa-redteam.md
You are the QA Red Team specialist.

Your responsibilities:
- Design harness tests that attempt to break constraints
- Write fixtures that simulate attacks
- Review other agents' work for bypass possibilities

Your mindset: "How would an attacker or a hurried developer 
violate the PRD while still passing CI?"

Specific attacks to test:
- Submit dispute with status='published' via Supabase client
- Insert article with ingestion_source='rss' but Naver-origin data
- Add bias_score to Zod schema as nested object
- Use SELECT * in a migration
- Ingest from tos_confirmed=false source via direct SQL
- Store image_url as base64 data URI in summary field

For each attack: if it succeeds, write a failing test first, 
then propose the fix.
```

---

## Claude Code Hooks 설정 (`.claude/settings.json`)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm lint --silent || echo 'LINT FAIL — blocking'"
          },
          {
            "type": "command",
            "command": "pnpm typecheck --silent || echo 'TYPECHECK FAIL — blocking'"
          },
          {
            "type": "command",
            "command": "pnpm harness:public-redaction || echo 'HARNESS FAIL — fix before continuing'"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node harness/checks/block-dangerous-commands.mjs"
          }
        ]
      }
    ]
  }
}
```

`harness/checks/block-dangerous-commands.mjs`:
- Block `rm -rf /`, `DROP TABLE`, `DELETE FROM * WHERE true`, force push
- Warn on `supabase db reset` in non-local env

---

## 매일 작업 흐름 (태욱 관점)

### 아침 (30분)
- 전날 PR의 Codex 리뷰 확인
- Blocking issue 있으면 Claude Code에 수정 프롬프트
- 없으면 merge → 다음 티켓으로

### 낮 (2~4시간, 티켓 하나 기준)
- 새 Claude Code 세션 시작
- 해당 티켓 프롬프트 실행 (`docs/tickets/T-XXX.md`)
- 중간 산출물을 `pnpm harness:all`로 검증
- PR 생성

### 저녁 (30분)
- GitHub에서 `@codex review` 트리거
- Codex가 blocking issue 제기하면 다음날 아침에 대응
- 진행 상황을 `docs/journal/YYYY-MM-DD.md`에 1문단 기록

---

## 비상 대응 플레이북

### Case 1: Claude Code가 harness를 우회하려 함
- 증상: `pnpm harness:all`을 주석 처리하거나 skip 시도
- 대응: Hook이 차단. Claude Code에 "Skip harness는 violation, 수정하고 다시 실행" 재지시

### Case 2: Codex가 blocking issue 못 찾음
- 증상: Codex review 통과했는데 태욱이 검토해보니 우회 가능
- 대응: Codex에 구체 attack scenario 제시하고 재검증 요청. 
  발견된 false negative는 harness check로 추가

### Case 3: P0a Exit Gate에서 harness 통과했지만 실제 취약점 발견
- 대응: 취약점을 harness check로 먼저 추가 → 실패 확인 → 수정 → 재통과

### Case 4: 매체 ToS 확인 지연으로 15개 확보 실패
- 대응: P0a Exit 1~2일 연기 + RSS 15개 우선 확보 매체 focus

### Case 5: Naver 공식 문의 답변이 "저장 불가"로 확정
- 대응: PRD v1.4에 반영, Naver 사용 전면 제거 + RSS 매체 수 증대 또는 BIGKinds 협상 우선

---

## 이번 주 즉시 실행 (D0~D3, 2026-04-18 ~ 2026-04-21)

### D0 (오늘, 4/18) 오후
- [ ] 도메인 확보: tteuniyu.com, tteuniyu.kr
- [ ] GitHub repo 생성: `tteuniyu/tteuniyu`
- [ ] Supabase 프로젝트 생성: `tteuniyu-prod` (서울 리전 대기 시 도쿄)
- [ ] Vercel 프로젝트 연결
- [ ] Codex 접근 방식 결정 (Q-27) → GitHub App 설치

### D1 (4/19)
- [ ] 법무 자문 변호사 2명 후보 컨택 (이메일)
- [ ] Naver 공식 문의 3건 발송 (DataLab 쿼터, Search 저장 범위, DataLab 저장 범위)
- [ ] 매체 30개 ToS 페이지 URL 목록 작성 시작

### D2~D3 (4/20~4/21)
- [ ] T-001 Harness Scaffold Claude Code 실행
- [ ] PR 생성 + `@codex review`
- [ ] Blocking issue 대응
- [ ] Merge 후 T-002 착수

---

## 로드맵 한 장 요약

```
Day 0-3   T-001 Harness          (하네스 기반)
Day 3-5   T-002 DB+Redaction     (첫 실제 계약 enforcement)
Day 5-7   T-003 Data Licensing   (매체 30개 YAML + 법무 자문 시작)
Day 7-9   T-004 RSS Ingest       (fixture 기반 수집)
Day 9-10  T-005 Summary Eval     (copy ratio CI)
Day 10-12 T-006 Worker           (임베딩 + 클러스터링)
Day 12-14 T-007 P0a UI Slice     (/trends + Coverage Bar + OG)
Day 14    ★ P0a Exit Review
Day 14-22 P0b 티켓들 (Admin, Dispute, Waitlist 서버라우트)
Day 22-28 P0b 보조 소스 + PMF 퍼널
Day 28-30 클로즈드 알파 100명 초대
Day 30    ★ P0b Exit Review (PMF 지표)
```

**End of Harness Engineering Roadmap v1.3 — 2026-04-18**
