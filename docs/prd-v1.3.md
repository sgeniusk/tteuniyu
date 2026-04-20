# Product Requirements Document v1.3
# 뜬이유 (TTEUN-IYU) — 한국 언론을 투시하는 AI

| 항목 | 내용 |
|---|---|
| 문서 버전 | **v1.3 (하네스 엔지니어링 접근 반영)** |
| 작성일 | 2026-04-18 |
| 이전 버전 | v1.2, v1.1, v1.0 (archived) |
| 대상 | Engineering / Codex / Claude Code / Legal Handoff |
| 근거 자료 | prd-v1.2.md, 코덱스 하네스 엔지니어링 검토 (2026-04-18) |
| Target MVP 공개 | **P0a: 2026-05-01 / P0b: 2026-05-17** |
| 변경 원칙 | **계약 먼저, 구현은 나중. AI는 작성자와 검증자를 분리.** |

---

## Changelog v1.2 → v1.3

### Critical Architecture Changes (코덱스 리뷰 C-1~C-7)

- **C-1 Public View → Next.js API Only 전환**: Supabase view는 security definer 이슈로 권한 모델 복잡. P0는 **Next.js Route Handler가 service_role로 DB를 읽고 Zod schema로 응답 필터링**. 모든 public GET이 API 계약으로 고정됨
- **C-2 bias_disputes RLS 우회 차단**: v1.2의 `WITH CHECK (claim IS NOT NULL AND claimant_email IS NOT NULL)`로는 anon이 `status='published'` 제출 가능. **수정**: `status='open'` 강제 + `editor_response`/`responded_at`/`public_log_url` NULL 강제. 더 안전하게는 **anon INSERT 차단, /api/v1/disputes 서버 라우트만 통과**
- **C-3 waitlist 서버 라우트화**: anon INSERT 허용은 봇·중복·이메일 폭탄에 취약. **/api/v1/waitlist** 경유, Turnstile + rate limit + Resend double opt-in(선택)
- **C-4 15분 트렌드 vs 1시간 클러스터링 충돌 해소**: P0a에서는 UI에 **"보도 분포는 최대 60분 지연" 배지** 명시. P0b부터 클러스터 assignment 직후 event-driven materialized view refresh
- **C-5 embedding fallback 제거**: `vector(1536)` 고정 스키마에 차원 다른 provider fallback 넣으면 인덱스 깨짐. **P0는 OpenAI text-embedding-3-small 단일, 실패 시 `embedding_status='failed'` + 재시도**. V1에서 `article_embeddings` 별도 테이블로 provider abstraction
- **C-6 ingestion_runs 테이블 분리**: RSS 실패를 admin_audit_logs에 저장하는 것은 오남용. **사람 행위 = audit, 시스템 수집 = observability**. 별도 `ingestion_runs` 테이블
- **C-7 RSS ToS 표현 강화**: `robots.txt`는 크롤링 허용·차단 신호이지 저작권 이용허락 아님. **"저장·요약·재표시는 별도 이용조건 또는 법무 검토 기준으로 판단"** 명시

### Paradigm Shift: Harness Engineering First (가장 큰 변화)

- **P8 하네스 우선 원칙 (신규)**: PRD는 사람이 읽는 계약, 하네스는 에이전트가 지켜야 하는 **실행 가능한 법률·보안·품질 게이트**. Claude Code에 "PRD 읽고 만들어줘"는 금지, 먼저 **ADR + Contract Test + Evals + Fixtures + Agent Instructions** 5종 산출물로 변환
- **P9 AI 역할 분리 원칙 (신규)**: **Claude Code = 작성자(builder) / Codex = 검증자(adversarial reviewer)**. 같은 에이전트가 만들고 승인하지 않는다
- **T-001 ~ T-007 티켓화**: v1.2의 "Step 0~3"를 Claude Code 실행 티켓 7개로 재정의. 각 티켓은 PR 300~500줄 상한, PR마다 Codex review 필수 통과

### P0a Scope 재조정

- **P0a에서 최종 제외**: HDBSCAN 고도화, DataLab, BIGKinds, 외신, Admin, Dispute, waitlist 고급화, source evidence UI, full PostHog funnel → 모두 P0b
- **P0a Exit Criteria 재정의**: "사용자 수"에서 **"위험한 것이 밖으로 새지 않는가"**로 전환 — 투자자·알파·법무·엔지니어링 검증용 신뢰 데모

---

## Context (왜 v1.3이 필요한가)

v1.2가 실행 PRD였다면, v1.3은 **"실행 PRD를 AI 에이전트가 안전하게 다룰 수 있는 계약 문서"**로 재구성한 버전. 코덱스의 하네스 엔지니어링 검토에서 발견된 **보안 구멍(bias_disputes RLS 우회, Public View security definer), 스키마 충돌(embedding fallback), UX 일관성 문제(15분 vs 1시간)**를 모두 해소하고, 동시에 **AI 작성자/검증자 역할 분리**를 제품 원칙으로 격상시켜 "AI가 만들고 AI가 승인하는 순환 리스크"를 차단함.

**한 문장 요약**: v1.3은 "Claude Code로 구현하기 전에 Codex가 깨뜨릴 반례를 먼저 만든다"는 적대적 검증 루프를 제품 개발 방법론 자체에 내장한 버전.

---

## 1. Product Overview (v1.2 유지)

### 1.1 Vision / 1.2 Mission / 1.3 Success Definition / 1.4 Non-Goals
v1.2 내용 유지. 단 1.4에 추가:
- **(v1.3 신규) Supabase anon client의 public view 직접 read** — 모든 public GET은 Next.js API route 경유
- **(v1.3 신규) Embedding provider fallback with mismatched dimensions** — P0에서 차원 다른 provider 허용 금지

---

## 2. Problem Statement (v1.2 유지)

---

## 3. Target Users (v1.2 유지)

---

## 4. Product Principles

### P1~P7 (v1.2 유지)

### P8. 하네스 우선 (Harness First) — **신규**
PRD는 계약서, 하네스는 실행 게이트. Claude Code·Codex가 PRD만 읽고 코드를 생성하는 것을 금지. **먼저 ADR·Contract Test·Evals·Fixtures·Agent Instructions 5종 산출물로 변환 후 구현**. 실패하는 테스트가 먼저 없는 기능은 작성을 중단하고 테스트로 전환.

### P9. AI 역할 분리 (Separation of Authoring and Verification) — **신규**
같은 에이전트가 만들고 승인하지 않는다. Claude Code는 **구현 PR 작성자**, Codex는 **반례 테스트 PR 작성자 + 리뷰어**. 사람은 **최종 merge 승인자**. 모든 PR에 `@codex review` 통과 필수.

---

## 5. Feature Specifications (v1.2 구조 유지, C-1~C-7 반영)

### 5.1 P0a — 신뢰 데모 (D0~D14, 실제 13일)

**Exit Criteria 재정의 (v1.3)**
```
P0a는 사용자 수보다 "위험한 것이 밖으로 새지 않는가"를 검증한다.

필수 통과:
- public API에 내부 점수·임베딩 미노출 (자동 테스트)
- Naver Search 결과 저장 0건 (자동 테스트)
- 이미지/로고 저장 0건 (자동 테스트)
- ToS 미확인 source 수집 0건 (자동 테스트)
- summary copy ratio ≤ 15% (golden.jsonl 20 케이스 CI)
- coverage bar sample_quality 정상 표시 (E2E)

측정 참고 (목표치 아님):
- 매체 15개 이상 수집 진행 중
- 클러스터 50개 이상 형성
- Lighthouse 85+
```

**P0a 산출물 (v1.3 최종)**
- F-P0a-1 RSS 수집 (tos_confirmed 매체만)
- F-P0a-2 Python 워커 임베딩 + 최소 클러스터링 (HDBSCAN 기본 파라미터)
- F-P0a-3 `/trends` 페이지 (15분 SWR polling + "보도 분포 지연 배지")
- F-P0a-4 Coverage Distribution Bar v0 (공개 언어)
- F-P0a-5 `/cluster/:id` 이슈 상세
- F-P0a-6 `/methodology` 공개 페이지
- F-P0a-7 `/cluster/:id/og` OG 이미지

**P0a 제외 (모두 P0b로 이동)**
- HDBSCAN 고도화 / DataLab / BIGKinds / 외신 매칭
- Admin 도구 / Dispute form / Waitlist 고급 / Source evidence UI / Full PostHog funnel

---

#### F-P0a-1 RSS 수집 (v1.3)

**v1.2 차이점**
- `ingestion_source` CHECK에서 `'naver_search'` 제거. Naver Search는 **절대 INSERT 불가**
- 실패 로그는 `admin_audit_logs` 아닌 `ingestion_runs`에
- `sources.ingestion_enabled` 필드 추가 (tos_confirmed + ingestion_enabled 둘 다 true일 때만 수집)

**Acceptance Criteria 추가**
```gherkin
Given Naver Search API 응답을 articles.INSERT로 시도할 때
When ingestion_source='naver_search'로 요청되면
Then DB CHECK constraint로 거부되고
And 테스트 harness:no-naver-storage가 실패 케이스로 포착한다

Given sources.tos_confirmed=false 또는 ingestion_enabled=false인 매체에서 RSS 수집 시도 시
When 코드 레벨 가드에서 차단되면
Then ingestion_runs에 status='failed', error_message='source not approved' 기록
```

---

#### F-P0a-3 `/trends` 페이지 (v1.3 수정)

**UI 카피 추가 (C-4)**
- 트렌드 카드 하단: "**보도 분포는 최대 60분 지연될 수 있습니다. 방법론 보기**"
- P0b부터: cluster assignment 후 event-driven refresh로 전환 시 배지 제거

**API 방식 변경 (C-1)**
- Next.js API Route: `/api/v1/trends`
- 서버 내부에서 service_role로 DB 접근
- Zod response schema로 출력 검증
- 클라이언트 SWR 60초 polling

---

#### F-P0a-4 Coverage Distribution Bar v0 (v1.3 유지)
v1.2 내용 그대로.

---

#### F-P0a-6 `/methodology` (v1.3 수정)
- 이의제기 폼은 **완전히 P0b로 이동** (v1.2에서는 "D+30 오픈 예정" 안내만 있었음)
- P0a에서는 방법론 문서 표시 + 정적 이의제기 이메일 주소 표기

---

### 5.2 P0b — 클로즈드 알파 (D14~D30)

**F-P0b-1 Admin / F-P0b-2 Dispute / F-P0b-3 Waitlist / F-P0b-4~6 보조 소스 / F-P0b-7 PMF 퍼널**

**v1.3 변경점**

- F-P0b-2 Dispute: **Supabase anon INSERT 완전 차단**, `/api/v1/disputes` 서버 라우트만. `status='open'` 강제 + Turnstile
- F-P0b-3 Waitlist: **Supabase anon INSERT 완전 차단**, `/api/v1/waitlist` 서버 라우트만. Turnstile + rate limit 10req/hr/ip + 이메일 validation

---

## 6. Technical Requirements (v1.3 최종)

### 6.1 시스템 아키텍처

```
[Data Sources — P0 최종]
  RSS 30개 (ToS whitelist, tos_confirmed + ingestion_enabled 둘 다 true만)
  Naver Search (P0b: UI discovery only, DB INSERT 불가)
  Naver DataLab (P0b: 1K/일 검증용)
  BIGKinds (P0b: 하루 2회 보정)
  외신 RSS 3개 (P0b: Reuters/AP/BBC)
            ↓
[Ingestion]  
  Vercel Cron 5~15분 + Supabase Edge Functions (RSS fetch)
  ingestion_runs 로그 전용 테이블 (admin_audit_logs와 분리)
            ↓
[Processing]
  Edge Functions: RSS fetch, validation, tos_confirmed 체크
  Python Worker (Fly.io always-on): 
    - OpenAI text-embedding-3-small (단일, fallback 없음)
    - HDBSCAN 기본 파라미터
    - 클러스터 타이틀 생성 (Claude Sonnet 4.6)
  Claude Haiku 4.5: abstractive summary (Batch API)
            ↓
[Storage — v1.3 최종]    
  Supabase Postgres 15 + pgvector
  Base Tables (service_role only):
    + 기존 테이블 + ingestion_runs (신규)
  Public Access: 
    **Next.js API Routes only** (public view 레이어 제거)
    service_role로 읽고 Zod schema로 필터
            ↓
[Delivery]   
  Next.js 14 (Vercel) + SWR 60s polling
  모든 public GET은 /api/v1/* 경유
  @vercel/og for OG 이미지
```

**핵심 변경 (v1.3)**:
- **C-1**: Public View 레이어 제거. 모든 public access는 Next.js API route 경유
- **C-6**: `ingestion_runs` 테이블 신규
- **C-5**: embedding provider 단일, fallback 없음

### 6.2 외부 의존성 (v1.2 유지)

### 6.3 DB 스키마 (v1.3 최종 수정분만)

**변경 요약**:
- Public view 블록 전체 제거
- `ingestion_runs` 테이블 추가
- `sources.ingestion_enabled` 컬럼 추가
- `articles.ingestion_source` CHECK에서 `'naver_search'` 삭제
- `articles.embedding_status` 컬럼 추가
- `bias_disputes` RLS 재작성 + 서버 라우트 권장
- `waitlist` RLS 재작성 + 서버 라우트 권장

```sql
-- =====================================
-- PART 1~4: v1.2와 동일 (Extensions, Methodology/Sources, Clusters/Articles, Trends/Frames 등)
-- =====================================

-- 아래는 v1.2 대비 변경분

-- (1) sources 테이블에 ingestion_enabled 추가
ALTER TABLE sources 
  ADD COLUMN ingestion_enabled boolean DEFAULT false;
-- tos_confirmed + ingestion_enabled 둘 다 true인 매체만 수집

-- (2) articles.ingestion_source에서 naver_search 제거
-- (CREATE TABLE 시 CHECK IN ('rss','bigkinds','manual'))
-- Naver Search는 이 enum에 절대 들어가지 않음

-- (3) articles.embedding_status 추가
ALTER TABLE articles
  ADD COLUMN embedding_status text DEFAULT 'pending' 
    CHECK (embedding_status IN ('pending','success','failed'));

-- (4) ingestion_runs 신규 테이블 (C-6)
CREATE TABLE ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id),
  job_type text NOT NULL CHECK (job_type IN ('rss','datalab','bigkinds','foreign_rss')),
  status text NOT NULL CHECK (status IN ('success','partial','failed','skipped')),
  fetched_count int DEFAULT 0,
  inserted_count int DEFAULT 0,
  skipped_count int DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX idx_ingestion_runs_source_started 
  ON ingestion_runs(source_id, started_at DESC);

-- =====================================
-- PART 5: v1.3 RLS 최소화
-- 기본 원칙: 모든 anon/authenticated GRANT 제거
-- 모든 public access는 Next.js API route가 service_role로 읽고 반환
-- =====================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- anon·authenticated는 DB에 직접 SELECT 할 수 없음
-- service_role만 쓰고, 클라이언트는 NEXT_PUBLIC_SUPABASE_ANON_KEY 없이
-- Next.js API route로만 접근

-- bias_disputes, waitlist 직접 INSERT 정책 제거
-- (v1.2의 CREATE POLICY 블록 모두 삭제)
-- 대신 POST /api/v1/disputes, POST /api/v1/waitlist 라우트가 처리

-- =====================================
-- v1.2의 Public View 블록 (CREATE VIEW public_sources 등) 전체 삭제
-- =====================================

-- =====================================
-- cluster_coverage_distribution materialized view 유지
-- 단, 권한은 service_role only
-- =====================================

CREATE MATERIALIZED VIEW cluster_coverage_distribution AS
SELECT
  a.cluster_id,
  COUNT(DISTINCT a.source_id) FILTER (
    WHERE s.bias_score <= -2 AND s.category != 'foreign'
  ) AS progressive_count,
  COUNT(DISTINCT a.source_id) FILTER (
    WHERE s.bias_score > -2 AND s.bias_score < 2 AND s.category != 'foreign'
  ) AS mixed_count,
  COUNT(DISTINCT a.source_id) FILTER (
    WHERE s.bias_score >= 2 AND s.category != 'foreign'
  ) AS conservative_count,
  COUNT(DISTINCT a.source_id) FILTER (
    WHERE s.category = 'foreign'
  ) AS foreign_count,
  COUNT(DISTINCT a.id) AS total_articles,
  MAX(a.published_at) AS latest_article_at,
  MAX(a.cluster_id IS NOT NULL) AS has_any_cluster
FROM articles a
JOIN sources s ON s.id = a.source_id
WHERE a.is_press_release = false
  AND s.tos_confirmed = true
  AND s.ingestion_enabled = true
GROUP BY a.cluster_id;

CREATE UNIQUE INDEX idx_ccd_cluster ON cluster_coverage_distribution(cluster_id);

-- P0a: hourly refresh
-- P0b 이후: cluster assignment 직후 event-driven refresh
```

### 6.4 API 설계 (v1.3 — Next.js API Route 고정)

- Base URL: `https://api.tteuniyu.com/v1` (Next.js Route Handler)
- **모든 GET은 Next.js API route가 service_role로 DB read → Zod schema filter → response**
- **모든 POST는 /api/v1/* 라우트만, Supabase anon 직접 INSERT 금지**
- Rate Limit: IP당 분 단위 + Turnstile (bot 방지)

**P0a 엔드포인트**
```typescript
// apps/web/app/api/v1/trends/route.ts
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const TrendResponse = z.object({
  id: z.string().uuid(),
  keyword: z.string(),
  category: z.string(),
  source_mix: z.record(z.number()),
  source_availability: z.record(z.boolean()),
  confidence: z.number().min(0).max(1),
  score: z.number(),
  rank: z.number().int(),
  velocity: z.number().nullable(),
  sample_size: z.number().int().nullable(),
  tracked_at: z.string(),
  // 명시적 제외: bias_score, factuality_score, embedding
})

const TrendsArray = z.array(TrendResponse)

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
  )
  
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? 'all'
  const limit = Number(searchParams.get('limit') ?? 10)
  
  const { data, error } = await supabase
    .from('trends')
    .select('id, keyword, category, source_mix, source_availability, confidence, score, rank, velocity, sample_size, tracked_at')
    // 명시적 컬럼만. SELECT * 금지
    .eq('category', category === 'all' ? undefined : category)
    .is('exclusion_reason', null)
    .order('rank', { ascending: true })
    .limit(limit)
  
  if (error) return Response.json({ error }, { status: 500 })
  
  // Zod 검증: 실패하면 응답 자체 거부 (harness test가 포착)
  const validated = TrendsArray.parse(data)
  return Response.json({ trends: validated })
}
```

**금지 엔드포인트 (v1.2 유지 + 강조)**:
- ❌ `GET /sources/:id` (bias_score 제외 버전도 금지, v1에서 슬러그 기반 최소 fields만)
- ❌ 클라이언트에서 직접 Supabase SDK로 테이블 쿼리
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY` 노출 (클라이언트 Supabase client 전면 비활성화)

### 6.5 Harness 프롬프트 관리 (v1.2 유지 + 강화)

모든 LLM 호출은 다음을 로깅:
- prompt_version
- model (haiku-4-5-20251001 등)
- input_hash (SHA256 of prompt+input)
- output_hash
- token_usage
- 실행시각

→ `llm_calls` 관측성 테이블(V1 추가) 또는 PostHog 이벤트로 추적

---

## 7. Non-Functional Requirements (v1.3)

### 7.1 Performance (v1.2 유지)

### 7.2 Security (v1.3 강화)

**최상위 원칙**
- **Supabase anon/authenticated는 DB에 직접 접근 불가**
- 모든 public interaction은 Next.js API route (service_role) 경유
- `NEXT_PUBLIC_SUPABASE_URL`은 존재해도 `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 **프론트엔드 사용 안 함**
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 환경변수로만, CI 시크릿도 production만

**추가 레이어**
- API Route rate limiting (upstash/redis)
- Turnstile (Cloudflare) on waitlist + disputes
- Zod response schema 모든 public endpoint
- CSP strict + HSTS
- Sentry + Dependabot
- OWASP ASVS L1 (P0), L2 (V2)

### 7.3 Accessibility (v1.2 유지)

### 7.4 Legal Compliance (v1.2 유지 + C-7 RSS ToS 표현 강화)

**RSS ToS 조항 수정**
```
robots.txt는 수집 허용 신호로 참고하되, 저장·요약·재표시는 
별도 이용조건 또는 법무 검토 기준으로 판단한다. 
RSS feed가 공개되어 있어도 전문·이미지·로고 저장은 금지하며, 
제목·URL·발행시각·비복제형 요약만 저장한다.
```

### 7.5 Observability (v1.3 분리)

- **사람 행위 로그**: `admin_audit_logs` (admin action, dispute 응답 등)
- **시스템 실행 로그**: `ingestion_runs` (RSS fetch, API call 결과)
- **오류 추적**: Sentry (Front + Edge Functions + Python Worker)
- **LLM 호출**: PostHog 이벤트 또는 `llm_calls` 테이블(V1)
- **프로덕트 분석**: PostHog Cloud

### 7.6 Scalability (v1.2 유지)

---

## 8. Success Metrics (v1.2 유지, P0a 기준만 수정)

### P0a 측정 참고 (목표치 아닌 "관찰치")
v1.2에서 명시한 DAU 50/WAU 150 같은 숫자는 P0a 기간(13일) 동안은 **공식 목표가 아님**. P0a Exit는 **하네스 통과 여부**.

### P0b 이후 (v1.2 기준 유지)

---

## 9. Release Plan (v1.3 — 하네스 엔지니어링 프로세스)

### Phase 0 — Sprint 0 (하네스 먼저, D0~D3)

**목표**: 코드 작성 전에 "통과해야 할 문"을 먼저 만든다.

**산출물 (7개 티켓 = T-001 ~ T-007)**

#### T-001: Harness Scaffold
- `CLAUDE.md` (non-negotiable constraints)
- ADR 4개 (data licensing, public API access, embedding provider, P0a/P0b scope)
- `harness/checks/*` 스크립트 skeleton
- `pnpm harness:all` 명령
- `.github/workflows/p0a-harness.yml`
- `.github/pull_request_template.md`
- **완료 기준**: `pnpm harness:all` 실행 가능

#### T-002: DB Migration + Redaction Contract
- v1.3 migration 5-part (public view 제거, ingestion_runs 추가, anon INSERT 차단)
- 민감 컬럼 명세
- Zod response schema 파일
- bias_disputes 서버 라우트
- **완료 기준**: `pnpm harness:public-redaction` 통과 (factuality_score 0건)

#### T-003: Data Licensing Whitelist
- `config/sources_whitelist.yaml` 30개 매체
- `docs/data-licensing.md`
- `sources.tos_confirmed` + `ingestion_enabled` 플래그
- **완료 기준**: `harness:tos-whitelist` — `tos_confirmed=false` 수집 시도 시 테스트 실패

#### T-004: RSS Ingest Fixtures
- `harness/fixtures/rss/*.xml` 5종
- Canonical URL resolver
- Duplicate detection
- 이미지 저장 금지 테스트
- **완료 기준**: `harness:no-image-storage` + `harness:no-naver-storage` 통과

#### T-005: Summary Prompt Eval
- `prompts/summary/v1.md`
- `prompts/evals/summary.golden.jsonl` 20 케이스
- Copy ratio checker (<=15%)
- prompt_version 로깅
- **완료 기준**: `pnpm eval:summary` 통과

#### T-006: Worker Minimal
- FastAPI worker (Fly.io)
- `/embed`, `/cluster/rebuild`, retry queue
- Cluster title 프롬프트
- **완료 기준**: fixture 100개 기사에서 cluster 10개 이상 생성

#### T-007: P0a UI Vertical Slice
- `/trends`, `/cluster/:id`, Coverage Bar, OG card, `/methodology`
- Next.js API routes (public view 없이)
- Playwright E2E
- **완료 기준**: E2E 통과 + Lighthouse 85+

### Phase 1a — P0a 구현 (T-001 ~ T-007 순서 실행)

**프로세스**: 각 티켓은 
1. Claude Code가 구현 PR 생성
2. `@codex review` 실행
3. Codex가 blocking issue 제기
4. Claude Code가 수정
5. Codex 재검토
6. 사람(태욱)이 merge

### Phase 1b — P0b (D14~D30)
v1.2 유지, 단 Admin / Dispute / Waitlist 모두 **서버 라우트 기반**으로.

---

## 10. Open Questions (v1.3 추가)

v1.2의 Q-1~26 유지 + 신규:

27. **Q-27 Codex 액세스 확보 방식**: OpenAI Codex Enterprise 계약 vs GitHub App 설치 vs 개인 사용량 — **D+1 결정 필수**
28. **Q-28 Claude Code 사용 플랜**: Pro $20/월 vs Max $100/월 (Routines 활용)? 사용량 예측 후 D+3
29. **Q-29 Turnstile / 대안**: Cloudflare Turnstile vs hCaptcha vs Vercel Guard — 이메일 폭탄 대비 방식
30. **Q-30 Rate Limit 구현**: Upstash Redis (월 $0 tier) vs Vercel KV vs Supabase 자체 — D+7

---

## 11. Appendix

### 11.1 용어집 (v1.3 추가)
- **Harness**: 에이전트가 지켜야 할 실행 가능한 법률·보안·품질 게이트 세트 (테스트 + 정책 + 금지 규칙 + 프롬프트 평가 + CI 통합)
- **Adversarial Reviewer**: 코드 리뷰를 넘어 "깨뜨릴 반례를 능동적으로 찾는" 검증자 역할 — Codex가 담당
- **Contract Test**: API/DB 계약이 깨지지 않는지 지속적으로 검증하는 자동화 테스트
- **Non-negotiable Constraint**: CLAUDE.md에 선언된 절대 위반 불가 규칙

### 11.2 v1.3 비교 매트릭스

| 영역 | v1.2 | v1.3 | 개선 효과 |
|---|---|---|---|
| Public Access | Supabase view + RLS | Next.js API Route + Zod | 권한 모델 단순화, 컬럼 유출 방지 테스트 용이 |
| bias_disputes INSERT | anon 직접 (RLS 우회 가능) | 서버 라우트만 | status 우회 차단 |
| waitlist INSERT | anon 직접 | 서버 라우트 + Turnstile | 봇 차단, 이메일 품질 확보 |
| embedding fallback | Cohere fallback 언급 | P0 단일 provider | 스키마 충돌 방지 |
| ingestion 실패 로그 | admin_audit_logs | ingestion_runs 별도 | 관측성 계층 분리 |
| 개발 프로세스 | Claude Code 직접 구현 | Harness-First + Claude/Codex 분리 | "AI가 만들고 AI가 승인" 차단 |
| P0a 기능 개수 | 7개 | 7개 (유지) | 범위 동일, 하네스 추가 |
| P0a Exit 기준 | 9개 항목 | 하네스 통과 중심 | 사용자 수 → 안전성 |

### 11.3 Verification v1.3

- [x] C-1~C-7 Critical 모두 반영
- [x] P8 (하네스 우선) + P9 (AI 역할 분리) 원칙 추가
- [x] Next.js API Only 전환 완료
- [x] bias_disputes / waitlist 서버 라우트화
- [x] embedding provider 단일화
- [x] ingestion_runs 테이블 추가
- [x] RSS ToS 표현 강화
- [x] T-001 ~ T-007 티켓 정의
- [x] Claude Code / Codex 역할 분리 명시

**End of PRD v1.3 — 2026-04-18**
