# 뜬이유 티켓 실행 프롬프트 북 v1.3

> T-001 ~ T-007 각 티켓에 대한 Claude Code 구현 프롬프트 + Codex 검증 프롬프트
> 
> 사용법:
> 1. 새 Claude Code 세션에서 해당 티켓 프롬프트 전체 복사
> 2. 컨텍스트 첨부 파일 먼저 업로드 (각 티켓 상단에 명시)
> 3. Claude Code가 PR 생성
> 4. GitHub PR 댓글에 Codex 검증 프롬프트 붙여넣기
> 5. Blocking issue 없으면 태욱이 merge

---

## T-001: Harness Scaffold

**브랜치**: `p0a/t001-harness-scaffold`
**예상 소요**: Claude Code 3~4시간 + Codex 검토 30분 + 태욱 검토 30분
**첨부 파일**: `docs/prd-v1.3.md`, `docs/harness-roadmap-v1.3.md`

### Claude Code 프롬프트

```
Context files (필수 첨부):
- docs/prd-v1.3.md
- docs/harness-roadmap-v1.3.md

Role: 당신은 Staff Engineer입니다. 1인 부트스트랩 창업가가 
agentic coding 환경에서 안전한 개발을 시작하도록 하네스를 구축합니다.

## 이번 티켓의 핵심
**제품 기능은 하나도 만들지 않습니다.** 
하네스(ADR + Contract Test + Evals + Fixtures + Agent Instructions) 
scaffold만 구축합니다.

## 1. CLAUDE.md (repo root)
다음 내용을 정확히 작성 (한글 섹션 제목 허용):

# TTEUN-IYU Engineering Rules

## Non-negotiable constraints
1. Never store Naver Search API results in articles, clusters, trends, 
   summaries, or embeddings.
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

## 2. ADR 4종 (docs/adr/)
각 ADR은 Context / Options Considered / Decision / Consequences 구조.
800-1500자, 한국어 본문 + 영어 기술용어 병기.
단호한 결정 (Options 나열만 하지 말고 Decision 명시).

### ADR-001-data-licensing.md
- Context: 한국 뉴스 데이터의 법적 제약 (저작권법, Naver Search ToS, 
  매체별 RSS ToS, 이미지 저작권)
- Options: 
  (1) Naver Search 기반 대량 수집 (v1.1 접근)
  (2) RSS 화이트리스트만 수집 (v1.2~v1.3)
  (3) BIGKinds 협상 기반
- Decision: (2) RSS 화이트리스트 + ToS 확인된 매체만. 
  Naver Search는 discovery only, DB INSERT 불가
- Consequences: 초기 매체 수 제한, 수동 ToS 검증 부담, 
  대신 법적 리스크 최소화

### ADR-002-public-api-via-next-route.md
- Context: 클라이언트가 Supabase에 직접 접근 시 bias_score 등 유출 위험
- Options: 
  (1) Supabase RLS + Public View
  (2) Supabase view with security_invoker
  (3) Next.js API Route + service_role + Zod schema
- Decision: (3) — Supabase view는 security definer/invoker 모두 
  함정이 있음. Next.js route가 가장 검증하기 쉽고 계약이 명확함
- Consequences: 모든 public GET은 /api/v1/* 경유. 
  클라이언트에서 Supabase client 사용 금지

### ADR-003-embedding-provider.md
- Context: pgvector(1536) 스키마에 fallback 추가 시 차원 충돌
- Options:
  (1) Multi-provider with dimension-agnostic schema 
      (article_embeddings 별도 테이블)
  (2) Single provider P0, abstraction V1+
  (3) OpenAI + Cohere dual with separate columns
- Decision: (2) — P0에서는 OpenAI text-embedding-3-small 단일. 
  장애 시 embedding_status='failed' + 재시도. V1에서 (1)로 진화
- Consequences: P0 장애 시 일시적 클러스터링 불가, 대신 스키마 단순

### ADR-004-p0a-p0b-scope.md
- Context: 13일 MVP에 기능 과다
- Options:
  (1) 30일 단일 MVP
  (2) P0a 신뢰 데모 + P0b 클로즈드 알파 분할
  (3) 60일 확장 MVP
- Decision: (2) — P0a는 "위험한 것이 새지 않는가" 검증, 
  P0b는 PMF 측정
- Consequences: Admin/Dispute/Waitlist 고급 기능 모두 P0b. 
  P0a Exit는 사용자 수가 아닌 하네스 통과

## 3. harness/checks/ skeleton 스크립트
각 스크립트는 TypeScript (ts-node 실행 가능). 
지금은 no-op이지만 JSDoc으로 최종 검증 내용 명시.

파일 생성:
- harness/checks/assert-no-public-sensitive-fields.ts
- harness/checks/assert-no-naver-storage.ts
- harness/checks/assert-no-image-storage.ts
- harness/checks/assert-tos-whitelist.ts
- harness/checks/assert-dispute-status-server-only.ts
- harness/checks/assert-summary-copy-rate.ts
- harness/checks/assert-public-copy-wording.ts
- harness/checks/assert-db-grants.sql
- harness/checks/block-dangerous-commands.mjs

각 스크립트 상단 주석:
```typescript
/**
 * Harness check: [이름]
 * 
 * Purpose: [한 문장]
 * 
 * Failure condition: [언제 exit 1]
 * 
 * Implementation status: skeleton (T-001)
 *   → filled in: [T-XXX]
 */
```

그리고 실제 로직은 `console.log('[harness] skeleton: will verify XXX')` 
+ `process.exit(0)`로 두기.

## 4. prompts/evals/ 디렉토리
- prompts/summary/v1.md: Claude Haiku 요약 프롬프트 scaffold 
  (system prompt 2~3문단, "원문 복제 금지" 강제 조항)
- prompts/cluster_title/v1.md: Claude Sonnet 클러스터 타이틀 프롬프트 scaffold
- prompts/evals/summary.golden.jsonl: 빈 파일 (T-005에서 채움)
- prompts/evals/README.md: golden case 추가 방법

## 5. .github/workflows/p0a-harness.yml
Pull request on main 트리거. 단계:
- checkout
- pnpm install
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm harness:all (= 모든 harness 스크립트 순차 실행)
- pnpm eval:summary (T-005 이후 동작)

모든 단계 failure 시 PR merge 차단.

## 6. .github/pull_request_template.md
다음 구조로 작성:

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
- [ ] supabase db reset (if migration)
- [ ] playwright e2e (if UI)

## Codex verification
- [ ] @codex review requested
- [ ] Blocking issues resolved
- [ ] Codex approved
```

## 7. package.json
pnpm workspace root. scripts 섹션에:
- "lint": "eslint . --ext .ts,.tsx"
- "typecheck": "tsc --noEmit"
- "test": "vitest run"
- "harness:all": "pnpm harness:public-redaction && pnpm harness:no-naver-storage && pnpm harness:no-image-storage && pnpm harness:public-copy && pnpm harness:tos-whitelist && pnpm harness:dispute-status"
- "harness:public-redaction": "tsx harness/checks/assert-no-public-sensitive-fields.ts"
- "harness:no-naver-storage": "tsx harness/checks/assert-no-naver-storage.ts"
- "harness:no-image-storage": "tsx harness/checks/assert-no-image-storage.ts"
- "harness:public-copy": "tsx harness/checks/assert-public-copy-wording.ts"
- "harness:tos-whitelist": "tsx harness/checks/assert-tos-whitelist.ts"
- "harness:dispute-status": "tsx harness/checks/assert-dispute-status-server-only.ts"
- "eval:summary": "tsx harness/checks/assert-summary-copy-rate.ts"

devDependencies: typescript, tsx, vitest, eslint, @typescript-eslint/parser, 
@typescript-eslint/eslint-plugin, prettier

## 8. .claude/ 설정
- .claude/settings.json: hooks 설정 (PostToolUse lint + typecheck + 
  harness:public-redaction, PreToolUse Bash block-dangerous-commands)
- .claude/agents/db-security.md
- .claude/agents/ingestion.md
- .claude/agents/worker.md
- .claude/agents/frontend.md
- .claude/agents/qa-redteam.md

각 agent 파일은 harness-roadmap-v1.3.md의 "Claude Code Subagent 구성" 
섹션을 그대로 사용.

## 9. README.md
다음 섹션 추가:
- What is 뜬이유 (1단락)
- Harness-First Development (why)
- Claude Code / Codex role separation
- How to run harness locally (`pnpm install`, `pnpm harness:all`)
- How to contribute (ticket-based, PR template, Codex review)

## 10. pnpm-workspace.yaml
```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "workers/*"
```

하지만 아직 apps/packages/workers 하위 디렉토리는 만들지 않음 (T-002부터).

## Constraints
- 제품 기능 코드 없음
- 모든 harness 스크립트는 no-op이지만 exit 0
- 실행하지 않는 명령 (예: supabase db reset)은 추가하지 않음
- 커밋은 의미 단위로 (harness scaffold / ADRs / workflows / agents)

## Output order
1. 생성할 파일 트리
2. 각 파일의 content
3. `pnpm install` + `pnpm harness:all` 실행 결과 (모두 no-op pass)

## PR 작성
Title: `T-001 Harness scaffold`
Description: PRD v1.3 section 9 Phase 0 참조, 11개 constraints 구현 예정 명시.
PR template의 모든 safety checklist는 "n/a (scaffold only)"로 표시.

완료 후 `@codex review` 요청 코멘트 작성 (아래 Codex 프롬프트 사용).
```

### Codex 검증 프롬프트 (PR 댓글)

```
@codex review

Role: You are the adversarial verifier for PRD v1.3.

Scope: This PR is the harness scaffold (T-001). 
No product features should be present.

Verify the following:

## 1. Coverage check
For each of the 11 CLAUDE.md non-negotiable constraints, 
is there at least one harness skeleton script that will enforce it?
List which constraint maps to which script.

## 2. False negative hunt
Could a later PR violate any CLAUDE.md constraint while still passing 
the harness scripts (even with skeletons)? 
For each suspicious case, propose:
- The violation scenario
- The missing check
- How to strengthen the harness

## 3. ADR sufficiency
Do the 4 ADRs give Claude Code enough information to implement T-002~T-007 
without re-asking design questions? Identify ambiguities.

## 4. Hook safety
Does .claude/settings.json PostToolUse actually block on harness failure? 
If a hook fails, does Claude Code stop and fix, or continue?

## 5. CI blocking
Is .github/workflows/p0a-harness.yml configured to BLOCK merge on failure, 
not just inform?

## 6. Subagent scope
Are the 5 subagents' responsibilities orthogonal? 
Any overlap that could cause conflicting edits?

Return format:
- BLOCKING issues first (must fix before merge)
- Suggested improvements second (nice to have)
- Approvals last (what's done well)

Do NOT suggest product features.
Do NOT approve if any CLAUDE.md constraint lacks a mapped harness check.
```

---

## T-002: DB Migration + Redaction Contract

**브랜치**: `p0a/t002-db-migration-redaction`
**예상 소요**: Claude Code 4~6시간 + Codex 검토 1시간
**첨부 파일**: `docs/prd-v1.3.md`, `docs/adr/ADR-002-public-api-via-next-route.md`, 이전 T-001 커밋

### Claude Code 프롬프트

```
Context files (필수 첨부):
- docs/prd-v1.3.md (특히 section 6.3, 6.4, 7.2)
- docs/adr/ADR-002-public-api-via-next-route.md
- CLAUDE.md
- T-001 머지된 커밋

Role: 당신은 Senior Backend Engineer입니다. 
DB migration + public API 계약을 하네스로 고정합니다.

## 이번 티켓의 핵심 (T-002)
1. v1.3 DB 스키마 구현 (Naver 저장 차단, ingestion_runs 분리, public view 제거)
2. Next.js API Route + Zod schema로 public access 전환
3. bias_disputes와 waitlist를 서버 라우트로 이관
4. 하네스 스크립트 3개를 실제 동작하도록 구현

## 1. Supabase migration (6 파일)
supabase/migrations/00000_extensions.sql:
- CREATE EXTENSION IF NOT EXISTS pgcrypto;
- CREATE EXTENSION IF NOT EXISTS vector;

supabase/migrations/00001_methodology_sources.sql:
- methodology_versions (UNIQUE(scope, version))
- sources (tos_confirmed, ingestion_enabled, internal bias_score/factuality_score)
- source_score_evidence (with confidence_interval_low/high)
- bias_disputes (FK는 00002에서 ALTER)
- admin_audit_logs

supabase/migrations/00002_clusters_articles.sql:
- clusters (denormalized count 없음)
- articles (ingestion_source CHECK IN ('rss','bigkinds','manual'), 
  embedding_status, embedding_provider, embedding_model, embedding_dim, 
  embedding_version, embedding vector(1536))
- ALTER bias_disputes ADD FK cluster_id, article_id

supabase/migrations/00003_trends_etc.sql:
- trends (source_mix, source_availability, confidence, sample_size)
- trend_clusters
- trend_exclusions
- frames
- waitlist (email validation CHECK)
- og_cards
- foreign_outlets (tos_confirmed)
- cluster_foreign_matches

supabase/migrations/00004_observability.sql:
- ingestion_runs (NEW — 시스템 실행 로그)

supabase/migrations/00005_public_hardening.sql:
- REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated
- REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated  
- REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated
- CREATE MATERIALIZED VIEW cluster_coverage_distribution
- CREATE UNIQUE INDEX idx_ccd_cluster
- v1.2의 public_* view 절대 만들지 않음
- v1.2의 bias_disputes RLS INSERT policy 제거 (서버 라우트만 허용)
- v1.2의 waitlist RLS INSERT policy 제거

모든 CREATE TABLE에 주석으로 PRD v1.3 섹션 참조.

## 2. Zod response schemas
apps/web/lib/api/response-schemas.ts:

```typescript
import { z } from 'zod'

// Public-facing trend response — INTENTIONALLY EXCLUDES: 
// bias_score, factuality_score, embedding, axis_*, source_score_evidence
export const TrendResponse = z.object({
  id: z.string().uuid(),
  keyword: z.string(),
  keyword_normalized: z.string(),
  category: z.string(),
  source_mix: z.record(z.number()),
  source_availability: z.record(z.boolean()),
  confidence: z.number().min(0).max(1),
  score: z.number(),
  rank: z.number().int(),
  velocity: z.number().nullable(),
  sample_size: z.number().int().nullable(),
  tracked_at: z.string(),
})

export const ClusterResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  summary: z.string().nullable(),
  first_reported_at: z.string().nullable(),
  last_updated_at: z.string().nullable(),
  velocity_score: z.number().nullable(),
  category: z.string().nullable(),
  methodology_version: z.string(),
})

export const ClusterCoverageResponse = z.object({
  cluster_id: z.string().uuid(),
  progressive_count: z.number().int(),
  mixed_count: z.number().int(),
  conservative_count: z.number().int(),
  foreign_count: z.number().int(),
  total_articles: z.number().int(),
  latest_article_at: z.string().nullable(),
  sample_quality: z.enum(['insufficient_sample', 'low_confidence', 'sufficient']),
})

export const ArticleResponse = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  source_name: z.string(),
  source_coverage_group: z.enum(['progressive_leaning', 'mixed_or_center', 'conservative_leaning']),
  title: z.string(),
  summary: z.string().nullable(),
  url: z.string().url(),
  canonical_url: z.string().url().nullable(),
  published_at: z.string(),
  cluster_id: z.string().uuid().nullable(),
  has_opinion_tag: z.boolean(),
  is_press_release: z.boolean(),
})

export const MethodologyResponse = z.object({
  scope: z.enum(['bias', 'trend', 'frames', 'blindspot', 'election']),
  version: z.string(),
  description: z.string(),
  published_url: z.string().url().nullable(),
  effective_from: z.string(),
})

// POST request schemas
export const DisputeSubmission = z.object({
  source_id: z.string().uuid().optional(),
  cluster_id: z.string().uuid().optional(),
  article_id: z.string().uuid().optional(),
  claimant_name: z.string().min(1).max(100).optional(),
  claimant_email: z.string().email().max(320),
  claim: z.string().min(20).max(5000),
})

export const WaitlistSubmission = z.object({
  email: z.string().email().max(320),
  referrer: z.string().max(500).optional(),
  utm_source: z.string().max(100).optional(),
  turnstile_token: z.string(),  // Cloudflare Turnstile verification
})

// Helper: convert internal bias_score to public coverage group
export function biasScoreToCoverageGroup(score: number): 'progressive_leaning' | 'mixed_or_center' | 'conservative_leaning' {
  if (score <= -2) return 'progressive_leaning'
  if (score >= 2) return 'conservative_leaning'
  return 'mixed_or_center'
}
```

## 3. Next.js API Routes
apps/web/app/api/v1/trends/route.ts:
- GET: service_role로 trends 읽기, Zod 검증 후 반환
- category query param 처리
- limit query param (default 10, max 50)
- Rate limit comment (T-007에서 upstash 추가 예정)

apps/web/app/api/v1/clusters/[id]/route.ts:
- GET: cluster + public-safe fields만

apps/web/app/api/v1/clusters/[id]/coverage/route.ts:
- GET: cluster_coverage_distribution materialized view에서
- sample_quality 계산: total_articles < 5 → insufficient_sample

apps/web/app/api/v1/clusters/[id]/articles/route.ts:
- GET: articles 목록, source join (only source_id, source_name, 
  source_coverage_group 노출)

apps/web/app/api/v1/methodology/route.ts:
- GET: 모든 active methodology versions

apps/web/app/api/v1/disputes/route.ts:
- POST: DisputeSubmission 검증 + status='open' 강제 + INSERT + Resend 알림

apps/web/app/api/v1/waitlist/route.ts:
- POST: WaitlistSubmission 검증 + Turnstile verify + INSERT

모든 Route Handler 공통:
- service_role key 서버 env에서만 읽기
- 명시적 컬럼 select (no *)
- Zod safeParse + 실패 시 400 with sanitized error
- Production에서 stack trace 숨기기

## 4. Harness 실제 구현
harness/checks/assert-no-public-sensitive-fields.ts:
```typescript
/**
 * Scan all files in apps/web/app/api/v1/ and apps/web/lib/api/
 * Assert:
 *  1. No Zod schema exports contain: bias_score, factuality_score, 
 *     embedding, embedding_provider, embedding_model, axis_b_chaebol,
 *     axis_c_regime_critic, axis_d_sensationalism
 *  2. No .select() call with '*' 
 *  3. No explicit .select('bias_score') etc.
 * Exit 1 on violation with file path + line.
 */
```

harness/checks/assert-db-grants.sql:
```sql
-- Run via: supabase db execute --file harness/checks/assert-db-grants.sql
-- Expect: 0 rows. Any row = violation.

SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated')
  AND table_schema = 'public'
  AND table_name NOT IN ('__private_do_not_use_');
```

harness/checks/assert-dispute-status-server-only.ts:
```typescript
/**
 * Static check:
 *  1. No anon INSERT policy exists on bias_disputes in migrations
 *  2. apps/web/app/api/v1/disputes/route.ts sets status='open' in INSERT
 *  3. disputes/route.ts does NOT accept status from req body
 */
```

## 5. API Contract Test
apps/web/tests/api-contract.test.ts:
- Mock service_role Supabase client
- Test each GET /api/v1/* route
- Assert response matches Zod schema
- Assert response keys do not include any forbidden field
- Use `expect(Object.keys(response)).not.toContain('factuality_score')`

## 6. Seed data
supabase/seed.sql:
- methodology_versions에 v0 삽입 (scope='bias', version='v0')
- sources 5개 (tos_confirmed=true 3개, false 2개) 
  -- 실제 매체명 말고 fixture name (e.g., "fixture-progressive-daily", 
  "fixture-centrist-daily", "fixture-conservative-daily")
- 각 confirmed source에 fake articles 10개
- 1개 cluster (manually linked)

## 7. Environment setup
.env.example:
- NEXT_PUBLIC_SUPABASE_URL (no anon key!)
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY
- OPENAI_API_KEY
- RESEND_API_KEY
- TURNSTILE_SITE_KEY (client)
- TURNSTILE_SECRET_KEY (server)
- NEXT_PUBLIC_POSTHOG_KEY
- SENTRY_DSN

주의: `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 **없음**. 
Supabase client from browser is prohibited.

## Constraints (CLAUDE.md 재확인)
- Rule 1 (Naver storage): articles CHECK에 'naver_search' 제외
- Rule 4 (public redaction): Zod schema에서 모든 민감 필드 제외
- Rule 6 (dispute status): server route에서 status='open' 강제
- Rule 11 (no anon key): NEXT_PUBLIC_SUPABASE_ANON_KEY 사용 안 함

## Test order
1. supabase db reset (5 migrations succeed)
2. pnpm harness:db-grants (0 rows)
3. pnpm harness:public-redaction (pass)
4. pnpm harness:dispute-status (pass)
5. pnpm test (api-contract test pass)
6. 반례 테스트: Zod schema에 factuality_score 추가 → harness 실패 확인 → revert

## PR
Title: T-002 DB migration + redaction contract
Description: 
- Requirements: C-1, C-2, C-3, C-5, C-6, C-7
- Checklist all safety items reviewed
- 반례 테스트 결과 첨부

완료 후 @codex review 요청.
```

### Codex 검증 프롬프트 (T-002)

```
@codex review

Role: Adversarial verifier for PRD v1.3 T-002.

## 1. Migration smoke test
Run `supabase db reset` mentally:
- Do all 6 migrations apply in order?
- Any FK reference forward (referencing not-yet-created table)?
- Any CHECK constraint with syntax error?

## 2. Redaction false negatives — ATTACK MODE
Try to construct attacks:

Attack A: PR that adds `factuality_score` to TrendResponse as nested object 
(e.g., `meta: { factuality: number }`) — does harness catch it?

Attack B: PR that uses `supabase.from('sources').select('*')` in a route — 
does harness catch it?

Attack C: PR that types the response as `any` to bypass Zod — 
does harness catch it?

If any attack succeeds, report as BLOCKING.

## 3. Naver storage leak — ATTACK MODE
Attack D: PR that inserts Naver Search result with 
`ingestion_source='rss'` but data from Naver — does CHECK constraint + 
harness:no-naver-storage catch it?

Attack E: Can you write `ingestion_source='naver_search'` via SQL directly? 
Verify CHECK IN enum.

Attack F: Is there any code path (e.g., a "debug" endpoint) that 
bypasses ingestion gate?

## 4. Dispute status bypass — ATTACK MODE
Attack G: Can you construct a dispute INSERT via /api/v1/disputes with 
`status='published'` in body? Does server strip it?

Attack H: Can you call Supabase client from browser to INSERT into bias_disputes? 
Verify `anon` has NO INSERT privilege.

## 5. Waitlist bot defense
Attack I: Can you POST to /api/v1/waitlist without Turnstile token? 
What happens?

Attack J: Submitting same email 100 times — rate limit?

## 6. Zod schema completeness
For each response schema, verify it matches what the DB actually returns.
Any field defined in DB but not in schema = risk of accidental exposure.

Format:
- BLOCKING (must fix)
- Nitpicks
- Approvals

If Attacks A-J all fail → approve.
```

---

## T-003: Data Licensing Whitelist

**브랜치**: `p0a/t003-data-licensing`
**예상 소요**: Claude Code 3~4시간 (문서 중심이라 짧음)
**첨부 파일**: PRD v1.3, ADR-001, T-001/T-002 머지본

### Claude Code 프롬프트

```
Context (필수):
- docs/prd-v1.3.md (section 5.1, 7.4, 11.3)
- docs/adr/ADR-001-data-licensing.md
- config/sources_whitelist.yaml (만약 이미 있으면)

Role: Compliance Engineer + Product Operations Lead.

## 이번 티켓의 핵심 (T-003)
데이터 라이선스 방어선 3개 문서 + 30개 매체 YAML + ToS 하네스.

## 1. config/sources_whitelist.yaml
30개 한국 매체. 각 entry:

```yaml
- slug: chosun
  name: 조선일보
  url: https://www.chosun.com
  rss_url: https://www.chosun.com/arc/outboundfeeds/rss/
  category: daily
  tos_confirmed: false  # 수동 검증 대기
  ingestion_enabled: false
  bias_score_v0: 6.5  # INTERNAL ONLY
  ownership_group: "조선미디어"
  axis_b_chaebol: null
  axis_c_regime_critic: null
  axis_d_sensationalism: null
  tos_source_url: null  # 확인 후 채우기
  notes: "보수 종합일간지, 조선미디어 계열"
```

카테고리별 분배:
- daily (10): 조선, 중앙, 동아, 한겨레, 경향, 국민, 서울, 한국, 세계, 문화
- broadcast (4): JTBC, TV조선, 채널A, MBN
- public (3): KBS, MBC, SBS
- economic (8): 매경, 한경, 서울경제, 파이낸셜, 이데일리, 머니투데이, 아주경제, 뉴스토마토
- wire (2): 연합뉴스, 뉴시스
- alternative (3): 오마이뉴스, 프레시안, 미디어오늘

bias_score_v0은 AllSides · Ad Fontes · 한국언론학보 수용자조사 매핑 기반 
임시값. -9 (극진보) ~ +9 (극보수). 각 값에 one-line reasoning을 주석으로.

## 2. docs/data-licensing.md
구조:

# 뜬이유 데이터 라이선스 매트릭스

## 원칙
- robots.txt는 크롤링 허용 신호이지 저작권 이용허락 아님
- RSS feed 공개 ≠ 저장·요약·재표시 허용
- P0 저장 허용 범위: 제목 + URL + 발행시각 + abstractive summary (2~3문장)
- P0 저장 금지: 본문 전문, 이미지, 로고, 썸네일

## ToS 확인 매트릭스

| 매체 | RSS URL | robots.txt | ToS 링크 | 상업적 이용 | 이미지 복제 | 아웃링크 필수 | 요약 허용 | 상태 | 근거 |
|---|---|---|---|---|---|---|---|---|---|
| 조선일보 | ... | ... | ... | 확인 필요 | 금지 | 필수 | 확인 필요 | pending | - |
... (30개)

## 검증 체크리스트 (매체당 질문 5개)
1. RSS feed의 헤더에 저작권 관련 안내가 있는가?
2. 웹사이트 이용약관에 "API·RSS를 통한 자동 수집" 관련 조항이 있는가?
3. 저작물의 "공정 이용" 범위로 볼 때 abstractive summary는 허용되는가?
4. 아웃링크 의무가 명시되어 있는가?
5. 상업적 서비스에서의 사용 제한이 있는가?

## 매체 문의 이메일 템플릿 (한국어 존댓말)
(3~4 문단: 서비스 소개 → 사용 범위 → 확인 요청 → 연락처)

## 3. docs/naver-official-inquiry.md
3개 문의 초안 (문의 A/B/C는 harness-roadmap에 명시).

## 4. docs/legal-advisory-brief.md
변호사 자문 Input (harness-roadmap에 명시한 구조).

## 5. harness/checks/assert-tos-whitelist.ts
```typescript
/**
 * Harness: tos-whitelist
 * 
 * Load config/sources_whitelist.yaml.
 * For each source:
 *  - If tos_confirmed=false OR ingestion_enabled=false:
 *    - Assert no articles.source_id == that source.id in fixture DB
 * Exit 1 on any violation.
 */

import { parse } from 'yaml'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const yaml = parse(readFileSync('config/sources_whitelist.yaml', 'utf-8'))
const unapproved = yaml.filter(s => !s.tos_confirmed || !s.ingestion_enabled)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

for (const src of unapproved) {
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('source_id', src.id)  // Match by slug or id
  
  if (count && count > 0) {
    console.error(`VIOLATION: ${src.slug} has ${count} articles but not approved`)
    process.exit(1)
  }
}
console.log('[harness:tos-whitelist] PASS')
```

## 6. scripts/seed-from-yaml.ts
YAML → SQL INSERT (모두 tos_confirmed=false로 삽입, 
태욱이 수동 검증 후 UPDATE).

## Constraints
- 실제 매체의 bias_score는 AllSides · Ad Fontes 공식 매핑 데이터 기반. 
  임의로 매기지 말고, 없으면 null.
- tos_confirmed=true로 **이 PR에서 전환하지 않음**. 수동 검증 후 별도 PR.
- bias_score_v0은 INTERNAL 컬럼. 절대 public API에 노출되면 안 됨.

## PR
Title: T-003 Data licensing whitelist + source scaffolding
Description: 
- 30개 매체 YAML 초기화
- ToS 매트릭스 문서
- Naver 공식 문의 + 법무 자문 브리프
- harness:tos-whitelist 실제 동작

완료 후 @codex review.
```

### Codex 검증 프롬프트 (T-003)

```
@codex review

Role: Adversarial verifier for T-003.

## 1. YAML integrity
- All 30 sources have required fields?
- bias_score_v0 values plausible (-9 to +9)?
- Any source marked tos_confirmed=true? (should be all false in this PR)

## 2. Leakage check
Attack A: Does bias_score_v0 appear in any public API schema? 
It's INTERNAL ONLY. Verify no leak.

Attack B: If I manually flip tos_confirmed=true without updating ToS 
source_url, does harness catch it? Should require evidence.

## 3. ToS matrix completeness
Are the 30 entries detailed enough that a lawyer can verify them quickly?
Any magic defaults that hide missing info?

## 4. Email template
Is the publisher email template legally safe? 
Does it avoid making claims the product can't back up?

## 5. Naver inquiry drafts
Are questions specific enough to get useful answers? 
Or too vague to actionable?

Format: BLOCKING / Nitpicks / Approvals.
```

---

## T-004: RSS Ingest Fixtures

**브랜치**: `p0a/t004-rss-ingest`
**예상 소요**: Claude Code 4~5시간

### Claude Code 프롬프트 (요약 버전)

```
Context: PRD v1.3 section 5.1 F-P0a-1, CLAUDE.md rules 1-3, 7
Ticket: T-004 RSS Ingest Fixtures

Implement:

1. apps/web/app/api/cron/ingest-rss/route.ts
   - Vercel Cron 5분 트리거
   - config/sources_whitelist.yaml에서 tos_confirmed=true AND 
     ingestion_enabled=true인 매체만 순회
   - rss-parser로 RSS fetch
   - canonical_url 추출 (rel="canonical" 메타)
   - duplicate detection (URL 기반)
   - articles INSERT (ingestion_source='rss', embedding_status='pending')
   - ingestion_runs에 결과 기록 (source_id, status, counts)
   - **이미지 URL, 로고, 썸네일 추출 금지** (원본 RSS에 있어도 저장 안 함)

2. Claude Haiku 요약 호출
   - prompts/summary/v1.md 사용 (T-001 scaffold에서 확장)
   - 프롬프트에 "원문 문장을 직접 복사하지 마세요" 강제 조항
   - prompt_version='summary/v1' 로그
   - articles.summary에 저장

3. harness/fixtures/rss/ 5개
   - fixture-progressive.xml (진보 성향 매체 스타일)
   - fixture-centrist.xml
   - fixture-conservative.xml
   - fixture-with-images.xml (이미지 태그 포함 — 무시되어야 함)
   - fixture-naver-style.xml (Naver Search 스타일 — 만약 수집되면 위반)

4. harness/checks/assert-no-image-storage.ts (실제 구현)
   - fixtures 수집 후 DB 스캔
   - articles.summary에 http:// 또는 https:// URL 패턴이 이미지면 fail
   - articles 테이블에 image_url, thumbnail, logo 등 컬럼 존재하면 fail

5. harness/checks/assert-no-naver-storage.ts (실제 구현)
   - articles WHERE ingestion_source='naver_search' 쿼리 → 0 rows 기대
   - apps/web 전체 파일에서 'naver_search' 문자열 검색 → 
     ingestion 방지 테스트 외에는 0 hit

6. Tests:
   - pnpm test:ingestion-fixtures (5 fixture 각각에 대해 수집 테스트)
   - pnpm harness:no-image-storage
   - pnpm harness:no-naver-storage
   - pnpm harness:tos-whitelist (tos_confirmed=false source 수집 시도 시 reject)

Constraints from CLAUDE.md:
- Rules 1, 2, 3, 7 엄격 준수
- 이미지 태그 파싱해서 넘겨주지 말고 파싱 단계에서 drop

PR title: T-004 RSS ingest + fixtures + harness
```

### Codex 검증 프롬프트 (T-004)

```
@codex review

Attack mode:

Attack A: fixture-with-images.xml을 수집하면 articles에 
image URL이 어디엔가 저장되는가? (summary 필드에 URL이 embed 되어도 안 됨)

Attack B: fixture-naver-style.xml을 수집 시도 → 차단되는가?

Attack C: tos_confirmed=false 매체 ID를 하드코딩으로 skip 리스트에서 제외하면 
수집되는가? (코드 레벨 가드가 있어야 함)

Attack D: RSS에 <content:encoded>로 전문이 들어와도 
articles.summary는 abstractive 요약만 저장하는가? 
전문 저장 시도가 있으면 catch하는가?

Attack E: Summary 프롬프트에 원문을 그대로 출력하라는 지시를 넣어도 
거부되는가? (golden.jsonl로 copy ratio 테스트는 T-005에서 강화)

Attack F: 같은 URL을 5분 간격으로 중복 수집 → 중복 INSERT 차단?
```

---

## T-005: Summary Prompt Eval

**브랜치**: `p0a/t005-summary-eval`
**예상 소요**: Claude Code 2~3시간

### Claude Code 프롬프트 (요약)

```
Context: PRD v1.3, CLAUDE.md rule 10, prompts/summary/v1.md scaffold

Implement:

1. prompts/summary/v1.md 완성
   - System prompt: abstractive summarization, 2-3 sentences, Korean
   - Explicit anti-copy rules ("원문 문장을 직접 복사하지 마세요")
   - Output format: JSON { summary: string }

2. prompts/evals/summary.golden.jsonl (20 cases)
   - 각 라인: { "input": {"title": "...", "content": "..."}, 
              "expected_max_copy_ratio": 0.15 }
   - 다양한 장르: 정치, 경제, 사회, IT, 문화
   - 함정 케이스: 아주 짧은 원문, 아주 긴 원문, 
     클릭베이트 제목, 광고성 보도자료
   - 각 케이스에 대해 "올바른 요약" 예시 1개

3. harness/checks/assert-summary-copy-rate.ts (실제 구현)
   - 20개 golden case 각각에 대해 Claude Haiku 호출
   - copy ratio 계산: 
     - 원문 n-gram (n=4)과 요약 n-gram의 Jaccard 유사도
     - 또는 Rouge-N score
   - ratio > 0.15인 케이스가 1개라도 있으면 exit 1

4. LLM 호출 로깅
   - prompt_version, model, input_hash (SHA256 of input), 
     output_hash, token_usage, duration
   - PostHog event로 발송 (또는 console.log + 파일 기록 P0a)

5. package.json:
   - "eval:summary": "tsx harness/checks/assert-summary-copy-rate.ts"

PR title: T-005 Summary prompt + golden eval + copy-rate harness
```

### Codex 검증 프롬프트 (T-005)

```
@codex review

Attack A: Add a golden case with "expected_max_copy_ratio": 0.99 — 
does test still pass? (should: we don't enforce per-case, we enforce overall)

Attack B: Modify the prompt to explicitly allow copy — 
does copy_ratio harness catch it?

Attack C: prompt_version이 로깅되지 않는 코드 경로가 있는가?

Attack D: input_hash 계산이 timing attack에 취약한가? (not critical P0)

Add 3 more adversarial golden cases:
- 원문과 제목이 완전 동일
- 원문이 한 문장
- 영어 원문 (외신) — 번역 후 요약 시 copy ratio 어떻게 계산?
```

---

## T-006: Worker Minimal

**브랜치**: `p0a/t006-worker-minimal`
**예상 소요**: Claude Code 4~6시간

### Claude Code 프롬프트 (요약)

```
Context: PRD v1.3 F-P0a-2, ADR-003 (embedding provider), CLAUDE.md rule 8

Implement Python Worker on Fly.io:

1. workers/clustering/ 디렉토리
   - FastAPI
   - Dockerfile
   - fly.toml (always-on, $10/month)

2. Endpoints:
   POST /embed
   - Input: { article_id, title, summary }
   - Call OpenAI text-embedding-3-small
   - Update articles.embedding, embedding_status='success'
   - On failure: embedding_status='failed' + retry queue

   POST /cluster/rebuild
   - Load recent 48h articles with embedding_status='success'
   - HDBSCAN (min_cluster_size=3, min_samples=2, default metric)
   - Assign articles.cluster_id
   - Noise (-1) → cluster_id=null
   - Generate cluster titles via Claude Sonnet (prompts/cluster_title/v1.md)
   - Update clusters table

   POST /cluster/title
   - Input: { cluster_id, article_titles: string[] }
   - Call Claude Sonnet 4.6
   - Return representative title + summary

3. Retry queue:
   - simple Postgres table or Redis
   - exponential backoff
   - max 3 retries

4. 테스트:
   workers/clustering/tests/test_embedding.py
   workers/clustering/tests/test_clustering.py (fixture 100 articles → 
     cluster 10+ 기대)
   workers/clustering/tests/test_retry.py

5. 단일 provider 강제:
   - ADR-003 준수
   - Cohere/Voyage import 없음
   - dimension mismatch 코드 없음

6. 호출 흐름:
   - Supabase webhook on articles INSERT → /embed (비동기)
   - Vercel Cron 15분 → /cluster/rebuild
   - Cluster 생성/업데이트 시 → /cluster/title
   - cluster_coverage_distribution MV refresh는 P0b에서 
     event-driven으로 강화

PR title: T-006 Python worker with embedding + clustering + title generation
```

### Codex 검증 프롬프트 (T-006)

```
@codex review

Attack A: Can you set embedding_provider='cohere' anywhere? 
ADR-003 mandates OpenAI only in P0.

Attack B: HDBSCAN noise (-1) 처리 — cluster_id에 -1이 들어가면 
schema violation. Integer 또는 UUID?

Attack C: 임베딩 실패 3회 후 어떻게 되는가? DLQ? 무한 retry?

Attack D: 100개 fixture 기사에서 cluster 10개 이상 나오는가? 
min_cluster_size=3이면 타당한가?

Attack E: cluster_title 프롬프트가 원본 제목을 그대로 반환해도 OK인가?
```

---

## T-007: P0a UI Vertical Slice

**브랜치**: `p0a/t007-ui-slice`
**예상 소요**: Claude Code 6~8시간

### Claude Code 프롬프트 (요약)

```
Context: PRD v1.3 F-P0a-3~7, ADR-002, CLAUDE.md rules 4, 5, 11

Implement vertical UI slice:

1. Pages:
   - apps/web/app/page.tsx (랜딩 + 3분 투어)
   - apps/web/app/trends/page.tsx
   - apps/web/app/cluster/[id]/page.tsx
   - apps/web/app/methodology/page.tsx

2. Components:
   - components/CoverageDistributionBar.tsx 
     * 4색: progressive=teal-500, mixed=slate-400, 
       conservative=amber-600, foreign=violet-500
     * sample_quality < sufficient → disabled + badge
     * 공개 카피 "보도 분포" (절대 "편향", "Bias" 사용 금지)
   - components/TrendCard.tsx (SWR 60초 polling)
   - components/CategoryTabs.tsx
   - components/MethodologyBadge.tsx (v0 임시 표시)
   - components/ShareButton.tsx (OG 이미지 URL 복사)
   - components/DelayBadge.tsx ("보도 분포 최대 60분 지연")

3. OG image:
   - apps/web/app/cluster/[id]/og/route.ts
   - @vercel/og 1200x630
   - 구성: 이슈 제목 + Coverage Bar + 표본 N + "뜬이유는 판단하지 않고 
     분포를 보여줍니다" + QR
   - 24시간 캐시 (og_cards 테이블)

4. API routes (이미 T-002에서 scaffolding, 완성):
   - /api/v1/trends
   - /api/v1/clusters/[id]
   - /api/v1/clusters/[id]/coverage
   - /api/v1/clusters/[id]/articles
   - /api/v1/methodology

5. State:
   - SWR for data fetching (60s polling on /trends)
   - No client-side Supabase (per CLAUDE.md rule 11)

6. Accessibility:
   - WCAG 2.1 AA
   - keyboard navigation
   - aria-label on all icons
   - prefers-reduced-motion
   - screen reader test

7. Harness:
   - harness/checks/assert-public-copy-wording.ts (실제 구현)
     * scan all apps/web/app/**/*.tsx for words: "편향", "Bias", 
       "factuality score", "사실성 점수"
     * fail on match in public UI (components/ and app/ excluding admin/)
   - harness/checks/assert-no-public-sensitive-fields.ts (확장)
     * scan for bias_score, factuality_score in JSX

8. E2E (Playwright):
   - tests/e2e/trends-page.spec.ts
     * /trends 로드, 카테고리 탭 동작, 트렌드 카드 표시
     * 15분 이상된 데이터가 있으면 DelayBadge 표시
   - tests/e2e/cluster-page.spec.ts
     * /cluster/[id] 이동, Coverage Bar 렌더
     * sample_quality=insufficient_sample 케이스에서 bar 비활성화
   - tests/e2e/og-card.spec.ts
     * /cluster/[id]/og 요청 → 1200x630 PNG 반환
     * 응답에 "뜬이유" 브랜드 요소 포함
   - tests/e2e/accessibility.spec.ts
     * axe-core 통합

9. Lighthouse:
   - CI에서 `pnpm test:lighthouse` 추가
   - Performance 85+ 필수

PR title: T-007 P0a UI vertical slice
```

### Codex 검증 프롬프트 (T-007)

```
@codex review

UI audit:

Attack A: 어디선가 "편향" 또는 "Bias"가 public UI에 노출되는가? 
(admin/ 디렉토리 외)

Attack B: bias_score 숫자가 DOM에 렌더되는가? (응답에 없어야 하지만 
혹시나)

Attack C: sample_size가 3인 cluster에서 Coverage Bar가 렌더되는가? 
(insufficient_sample badge로 대체되어야 함)

Attack D: OG 이미지에 오해 소지 문구가 있는가? 
"이 매체는 편향적" 같은 판정 표현 없는지.

Attack E: /cluster/:id/og 요청 → 캐시 동작 확인. 
동일 URL 1시간 내 재요청 시 DB INSERT 아닌 캐시 반환?

Attack F: NEXT_PUBLIC_SUPABASE_ANON_KEY가 번들에 들어가 있는가? 
(있으면 CLAUDE.md rule 11 위반)

Attack G: Playwright E2E는 실제 DB state로 돌리는가 아니면 mock인가? 
실제 DB면 fixture seeding 필요.

Attack H: Lighthouse 85+ 어떻게 측정? CI 환경에서 flaky?

Accessibility:
- 키보드만으로 모든 기능 사용 가능?
- VoiceOver smoke test 했는지?
- 색상 대비 4.5:1?
```

---

## P0a Exit Gate 통합 검증 (D14, 5/1)

### Claude Code 프롬프트 (태욱이 직접 실행)

```
Role: P0a Exit QA Lead.

Context: PRD v1.3, all merged PRs T-001~T-007.

## 자동 검증
실행: 
- pnpm harness:all
- pnpm eval:summary
- pnpm test
- pnpm test:e2e
- pnpm lighthouse

각 결과를 다음 형식 보고서로 작성:
- 테스트명
- 상태 (pass / fail / skipped)
- 실행시간
- 실패 시 에러 요약

## 수동 검증 (체크리스트)
- [ ] supabase db reset 으로 clean install 성공
- [ ] /api/v1/trends 응답 JSON grep 'factuality_score' → 0 hit
- [ ] /api/v1/trends 응답 JSON grep 'bias_score' → 0 hit
- [ ] /api/v1/trends 응답 JSON grep 'embedding' → 0 hit
- [ ] /methodology 페이지 방문 + 내용 완결
- [ ] OG 이미지 카톡에 링크 공유 → 리치 프리뷰 정상
- [ ] Lighthouse 모바일 85+
- [ ] ToS 확인 완료 매체 ≥ 15개 (config/sources_whitelist.yaml grep 
  tos_confirmed=true 카운트)

## 반례 공격 재확인
- factuality_score를 TrendResponse에 추가하는 PR → harness가 차단?
- ingestion_source='naver_search' 강제 INSERT → DB가 거부?
- dispute status='published'로 POST → 서버가 'open'으로 강제?

## Go/No-Go 결정
- 모두 통과 → "P0b GO: 이후 T-P0b-* 티켓 착수"
- 실패 존재 → "P0a NO-GO: 실패 영역 remediation PR 필요 ..."

Output: 
docs/exit-reviews/p0a-exit-review-YYYY-MM-DD.md
```

---

## P0b 티켓들 (간략 소개, 상세는 별도)

- **T-P0b-1 Admin minimal**: 키워드 제외, 클러스터 병합, 편향 수정 + audit log
- **T-P0b-2 Dispute end-to-end**: 서버 라우트 이미 T-002에 완성. 여기서는 admin 응답 플로우 + Resend 이메일 3단계
- **T-P0b-3 Waitlist + Turnstile**: T-002 서버 라우트 완성
- **T-P0b-4 DataLab + BIGKinds**: 검증·보정용 연동
- **T-P0b-5 Foreign 3 outlets**: Reuters/AP/BBC RSS + matching
- **T-P0b-6 PostHog funnel**: 6단계 이벤트 + 대시보드
- **T-P0b-7 Alpha invite system**: 대기자 → 초대 코드 → 100명

각 티켓은 P0a 패턴 그대로 (Claude Code 구현 + Codex 검증 + 태욱 merge).

---

## 요약: 7일 안에 실행 시작하는 법

**오늘 (4/18)**
1. `docs/prd-v1.3.md`, `docs/harness-roadmap-v1.3.md`, 이 문서 3개를 repo에 커밋
2. GitHub repo 생성, Codex GitHub App 설치
3. Supabase 프로젝트 생성 (도쿄 리전)
4. Vercel 프로젝트 연결 + 도메인

**내일 (4/19)**
1. 법무 자문 변호사 2명 컨택
2. Naver 공식 문의 3건 발송
3. T-001 Claude Code 프롬프트 실행 → PR

**모레 (4/20)**
1. T-001 Codex 검증 + 수정 + merge
2. T-002 착수

**매일 2~3시간 투입 시 D+30 P0b Exit 달성 가능**

**End of Ticket Prompt Book v1.3 — 2026-04-18**
