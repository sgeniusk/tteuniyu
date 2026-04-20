# 뜬이유 Claude Code 실행 프롬프트 모음 v1.2

> 본 문서는 PRD v1.2를 입력으로 Claude Code에서 순차 실행할 프롬프트 세트
> 각 프롬프트는 **새 Claude Code 세션**에서 실행, 이전 산출물은 파일로 첨부
> 
> **순서**: Step 0 (Sprint 0 Pre-Dev) → Step 1 (P0a 기술 셋업) → Step 2 (P0a 기능 구현) → Step 3 (P0b 확장)

---

## Step 0: Sprint 0 Pre-Dev — 데이터 라이선스·방법론·법무 선잠금

**목적**: 코드 한 줄 쓰기 전에 실행 가능성 블로커 5개 해결. 문서·체크리스트·ADR 산출.

**실행 시점**: 2026-04-18 즉시 (D0~D2)
**예상 소요**: 2일 (집중 투입 시 1일)
**산출물 형태**: Markdown 문서 6종 + YAML 1종

### Step 0 프롬프트

````
당신은 1인 부트스트랩 창업가의 Chief of Staff 역할이다. 
법무·데이터 엔지니어링·제품 전략을 모두 이해하며, "코드 전에 리스크 잠금"을 최우선시한다.

## 컨텍스트
- 실행자: 태욱 (1인 창업, Next.js+Supabase 숙련, Claude Code 숙련)
- 서비스: 뜬이유 (한국 언론 투시 AI) — PRD v1.2 기준
- 첨부: 
  - taewook-strategy-report.md (전략 보고서)
  - prd-v1.2.md (최신 PRD)
- 상황: PRD v1.2는 잠금되었으나, Sprint 0 Pre-Dev 체크리스트 6개가 미완료
  (법무 자문, Naver 공식 문의, RSS ToS 매트릭스, Public View 설계, 
   Methodology v0 초안, 도메인·Supabase)

## 작업
다음 6개 문서를 생성하여 `/docs` 디렉토리에 저장한다.
각 문서는 "태욱이 직접 사용하거나 외부 전문가에게 전달할 수 있는 수준"이어야 한다.

### 1. docs/data-licensing.md
30개 언론사 RSS의 ToS 확인 매트릭스.
- 컬럼: 매체명, 슬러그, RSS URL, robots.txt 확인, ToS 링크, 
        상업적 이용 가능성, 이미지 복제 가능성, 아웃링크 필수 여부,
        요약 생성 가능성, 확인 상태(pending/ok/restricted/blocked), 근거
- 초기 매체 리스트 30개 후보 선정 (종합 10 + 종편 4 + 공영 3 + 
  경제 8 + 통신 2 + 대안 3)
- 각 매체별 "확인 필요 질문" 3~5개
- 태욱이 직접 개별 매체에 문의할 때 쓸 이메일 템플릿 1개

### 2. docs/naver-official-inquiry.md  
네이버 개발자 고객센터에 보낼 공식 문의 초안 3종:
- 문의 A: DataLab 검색어 트렌드 API 일일 호출 한도 최종 확인 (1,000회/일 재확인)
- 문의 B: Search API 결과의 저장·가공 허용 범위 명확화
  (특히 "비상업·연구·신뢰 저널리즘 용도"의 예외 적용 여부)
- 문의 C: DataLab 결과 payload의 DB 저장 허용 범위
각 문의는 비즈니스 맥락 3~5문장 + 질문 3~5개 + 연락처로 구성.
한국어 존댓말, 공식 톤.

### 3. docs/legal-advisory-brief.md
법무 자문 변호사에게 전달할 Input 문서.
- 뜬이유 서비스 개요 1페이지 (비법률가도 이해 가능)
- 5대 법적 리스크 영역과 질문 ≥ 3개씩
  (1) 편향 라벨링 & 명예훼손 (정통망법 제70조)
  (2) Election Safety (공직선거법 제8조의6)
  (3) 이의제기 7일 SLA의 법적 근거
  (4) 매체 로고·썸네일 사용 가능 범위
  (5) AI 기본법 제31조 적용 범위와 선제 고지 의무
- 자문 계약 희망 형태 (시간당 vs 프로젝트 고정 vs 리테이너)
- 예산 범위 제안 (₩1,000,000~3,000,000)

### 4. docs/methodology-v0.md
편향 분류 방법론 v0 공개 문서 초안.
- 배경: 왜 v0가 필요한가 (임시 분류, v1 학계 패널로 승계 예정)
- 방법론 3축 평균:
  (A) AllSides Bias Rating의 한국 매체 대응 매핑
  (B) Ad Fontes Media의 한국 매체 대응 매핑
  (C) 한국언론학보·한국언론정보학보 2017~2024 수용자 인식 조사 리뷰
- 축 B/C/D (재벌 친화·정권 비판·선정성) 적용 기준 (v0는 축 A만 공개)
- 투명성 원칙 3개 (방법론 공개, 이의제기 경로, 정기 리뷰)
- v0 한계와 v1 계획 (2026-10-17 공개 목표)
- 이의제기 처리 프로세스 (SLA 7일, 상태 이동, public log)

### 5. docs/db-access-control.md
Supabase Public View / RLS 최종 설계.
- 원칙: base table은 service_role만, public은 view 경유
- 노출 필드 명세 (public_sources, public_articles, public_clusters, 
  public_trends, public_methodology, public_cluster_coverage)
- 제외 필드 목록과 제외 이유 (bias_score, factuality_score, 
  embedding, evidence raw, axis_b/c/d)
- RLS 정책: waitlist(INSERT open), bias_disputes(INSERT open, 
  SELECT where status='published')
- 테스트 계획: "anon JWT로 base table 접근 시 403" 회귀 테스트

### 6. config/sources_whitelist.yaml
매체 화이트리스트 YAML 시드 파일.
30개 매체 각각에 대해:
- slug, name, url, rss_url, category
- bias_score (v0 외부 매핑 임시값)
- ownership_group
- tos_confirmed (초기 모두 false, 수동 검증 후 true)
- axis_b_chaebol, axis_c_regime_critic, axis_d_sensationalism (nullable)
- notes

## 출력 제약
- 한국어 기본, 전문용어 영어 병기
- 마크다운 형식, ##·#### 헤딩
- 각 문서 상단에 purpose / owner / version / last_updated
- 애매한 "~할 수도 있다" 금지, 단정적 제안
- 법률 판단은 "전문가 자문 필요" 플래그만 달고 태욱이 판단할 재료 제공
- 태욱 본인이 바로 이메일 발송·계약 체결·YAML 커밋 가능한 수준
- 분량: 각 문서 1,500~5,000자 (config YAML 제외)

## 품질 기준
이 6개 산출물을 받은 태욱이 48시간 내에:
- 법무 자문 변호사 계약 체결 가능
- 네이버 고객센터 문의 3건 발송 가능  
- 매체 30개 ToS 검토 시작 가능
- Step 1 셋업 프롬프트로 이동 가능

시작해라. 6개 문서를 순서대로 생성.
````

### Step 0 완료 체크리스트 (태욱 확인)
- [ ] 6개 문서 `/docs/`에 저장
- [ ] `config/sources_whitelist.yaml` 30개 매체 초기 값
- [ ] 법무 자문 변호사 1~2명 컨택 시작
- [ ] Naver 고객센터 문의 3건 발송
- [ ] 매체 30개 중 10개 ToS 확인 시작

---

## Step 1: P0a 기술 아키텍처 확정 & 프로젝트 셋업

**목적**: ADR 12개 확정 + 모노레포 스캐폴딩 + DB migration 5-part 생성

**실행 시점**: Step 0 완료 후 (D2~D4)
**예상 소요**: 2일
**산출물 형태**: ADR 12개 + 프로젝트 파일 트리 + 초기 셋업 스크립트

### Step 1 프롬프트

````
당신은 10년차 Principal Engineer이자 Platform Architect다. 
Next.js · Supabase · Python Worker 프로덕션 운영 경험 풍부.
1인 창업가 제약(시간·비용·유지보수)을 깊이 이해하고, 
과잉 엔지니어링을 단호히 거부한다.

## 컨텍스트
- 첨부 필수:
  - prd-v1.2.md
  - docs/data-licensing.md
  - docs/db-access-control.md
  - docs/methodology-v0.md
  - config/sources_whitelist.yaml
- 실행자: 태욱 (1인, 부트스트랩, Next.js+Supabase 숙련)
- 목표: 30일 중 첫 12일(D2~D14) 안에 P0a 신뢰 데모 완성

## 역할
1. Architecture Decision Record (ADR) 12개 작성
2. pnpm 모노레포 프로젝트 구조 설계
3. Supabase migration 5-part SQL (PRD v1.2 6.3 기반)
4. 12일 마일스톤 체크리스트

## 작업

### Part 1: ADR 12개
각 ADR은 Context / Options / Decision / Consequences 구조.
단, **반드시 권고 옵션 1개를 명시** (옵션 나열만 금지).
비용 영향은 월 $ 단위로.

1. ADR-001: Monorepo (pnpm workspace) vs Polyrepo
2. ADR-002: Next.js App Router vs Pages Router
3. ADR-003: Supabase RLS + Public View 분리 전략
4. ADR-004: 15분 갱신 SWR polling vs Realtime CDC (P0는 polling 확정)
5. ADR-005: LLM 추상화 레이어 (Vercel AI SDK vs 직접 래핑 — 권고 필요)
6. ADR-006: 트렌드 수집 실행 위치 (Vercel Cron vs Supabase Edge Functions vs GitHub Actions)
7. ADR-007: 벡터 검색 (pgvector vs Pinecone)
8. ADR-008: 상태관리 (Server: React Query / Client: Zustand — 권고)
9. ADR-009: 스타일링 (Tailwind + shadcn/ui 사용 범위)
10. ADR-010: 분석·모니터링 (PostHog Cloud + Sentry 조합)
11. ADR-011: Python Worker 호스팅 (Fly.io vs Railway vs Modal vs Cloud Run)
12. ADR-012: 임베딩 제공자 (OpenAI text-embedding-3-small vs Voyage AI vs Cohere multilingual)

각 ADR은 PRD v1.2 제약(1인, ₩112,000/월 예산, 한국 정치 지형)을 
명시적으로 고려. 최종 권고는 단호하게.

### Part 2: 프로젝트 파일 트리
```
tteuniyu/                           # pnpm workspace root
├── apps/
│   ├── web/                        # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (marketing)/        # 랜딩, 투어
│   │   │   ├── trends/
│   │   │   ├── cluster/[id]/
│   │   │   ├── methodology/
│   │   │   ├── admin/              # P0b
│   │   │   └── api/v1/
│   │   ├── components/
│   │   ├── lib/
│   │   └── public/
│   └── python-worker/              # Fly.io 배포
│       ├── main.py                 # FastAPI
│       ├── clustering.py           # HDBSCAN
│       ├── embedding.py
│       ├── Dockerfile
│       └── fly.toml
├── packages/
│   ├── db/                         # Supabase 타입 공유
│   │   └── types.ts                # supabase gen types
│   ├── ui/                         # shadcn 컴포넌트 공유
│   └── prompts/                    # /prompts/summary/v1.md 등
├── supabase/
│   ├── migrations/
│   │   ├── 00000_extensions.sql
│   │   ├── 00001_methodology_sources.sql
│   │   ├── 00002_clusters_articles.sql
│   │   ├── 00003_trends_frames_misc.sql
│   │   └── 00004_public_views_rls.sql
│   ├── seed.sql                    # sources_whitelist.yaml → INSERT
│   └── functions/                  # Edge Functions (P0b)
├── docs/
│   ├── prd-v1.2.md
│   ├── data-licensing.md
│   ├── db-access-control.md
│   ├── methodology-v0.md
│   ├── adr/
│   │   ├── 001-monorepo.md
│   │   └── ...
│   └── runbooks/
├── config/
│   └── sources_whitelist.yaml
├── .github/workflows/
│   ├── ci.yml                      # typecheck + lint + test
│   └── migration-dry-run.yml       # PR마다 supabase migration 검증
├── pnpm-workspace.yaml
├── package.json
├── turbo.json                      # 선택: Turborepo
└── README.md
```

각 디렉토리에 한 줄 목적 설명.

### Part 3: Supabase Migration 5-part SQL
PRD v1.2 섹션 6.3 전체를 5개 파일로 분할:
- 00000_extensions.sql: pgcrypto, vector
- 00001_methodology_sources.sql: methodology_versions, sources, 
  source_score_evidence, bias_disputes (FK 제외), admin_audit_logs
- 00002_clusters_articles.sql: clusters, articles, ALTER bias_disputes FK
- 00003_trends_frames_misc.sql: trends, trend_clusters, trend_exclusions, 
  frames, waitlist, og_cards, foreign_outlets, cluster_foreign_matches
- 00004_public_views_rls.sql: REVOKE, public_views, 
  MATERIALIZED VIEW cluster_coverage_distribution, RLS policies, GRANT

각 파일은 **Supabase CLI로 바로 실행 가능**해야 함. 
주석으로 각 CREATE TABLE / VIEW의 근거 PRD 섹션 인용.

### Part 4: 초기 셋업 스크립트 (bash)
```bash
#!/bin/bash
# setup.sh — Sprint 0 완료 후 태욱이 1회 실행

# 1. pnpm workspace 초기화
# 2. apps/web Next.js 14 생성 (TypeScript strict, Tailwind, shadcn/ui)
# 3. apps/python-worker FastAPI + Dockerfile
# 4. Supabase 프로젝트 연결 (서울 리전 대기, 도쿄 선택)
# 5. 환경변수 템플릿 .env.example
# 6. ESLint + Prettier + husky pre-commit
# 7. GitHub Actions CI (typecheck + lint + migration dry-run)
# 8. 초기 커밋 + 첫 push
```

환경변수 명세:
- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only)
- ANTHROPIC_API_KEY
- OPENAI_API_KEY (embedding)
- NAVER_CLIENT_ID / NAVER_CLIENT_SECRET (P0b)
- NCP_BIGKINDS_KEY (P0b)
- RESEND_API_KEY (P0b)
- POSTHOG_PROJECT_API_KEY
- SENTRY_DSN

### Part 5: 12일 마일스톤 체크리스트 (D2~D14)
- Day 2 (화): 모노레포 셋업, Supabase 프로젝트 생성, migration 4-part 실행
- Day 3 (수): sources_whitelist.yaml seed INSERT, Public View 테스트
- Day 4 (목): RSS 수집 모듈 (apps/web/app/api/cron/ingest-rss)
- Day 5 (금): Python 워커 배포 (Fly.io), 임베딩 동작
- Day 6 (토): Claude Haiku summary 프롬프트 + golden.jsonl 평가셋
- Day 7 (일): HDBSCAN 클러스터링 cron, cluster_coverage_distribution refresh
- Day 8 (월): /trends 페이지 UI (Server Component + SWR)
- Day 9 (화): Coverage Distribution Bar 컴포넌트 + 4색 매핑
- Day 10 (수): /cluster/:id 페이지
- Day 11 (목): /methodology 페이지 (이의제기 "D+30" 안내)
- Day 12 (금): /cluster/:id/og OG 이미지 (@vercel/og)
- Day 13 (토): Lighthouse 최적화, PostHog + Sentry 검증
- Day 14 (일): **P0a Exit Criteria 자체 검증**, 태욱 Go/No-Go 결정

## 출력 제약
- 한국어 설명 + 영어 코드 주석
- ADR은 단호한 권고 (옵션만 나열 금지)
- 비용은 월 $ 단위 명시
- 코드 블록은 실제 실행 가능
- 태욱의 BookCircle 프로젝트 관습 재활용 가능한 부분 명시
- Claude Code Routines는 저빈도 전용, 5~15분 트렌드엔 Vercel Cron

## 품질 기준
이 결과물을 받은 태욱이 12일 안에 Day 14 체크포인트 도달 가능해야 함.
각 Day 항목은 2~4시간 분량 (총 36~40시간 투입 전제).

시작해라. Part 1부터 순서대로.
````

### Step 1 완료 체크리스트
- [ ] `docs/adr/001-monorepo.md` ~ `012-embedding.md` 12개
- [ ] 프로젝트 파일 트리 생성
- [ ] `supabase/migrations/00000_*.sql` ~ `00004_*.sql` 5개
- [ ] `setup.sh` 실행 가능
- [ ] 12일 마일스톤 체크리스트

---

## Step 2: P0a 기능 구현 (반복 실행)

**목적**: Step 1의 12일 마일스톤 중 Day 4~12 기능을 **기능 하나씩** 구현. 각 기능마다 새 Claude Code 세션에서 반복.

**실행 시점**: Step 1 완료 후 (D4~D12)
**예상 소요**: 기능당 2~4시간 × 9개 기능 = 20~36시간
**산출물 형태**: 실제 프로덕션 코드

### Step 2 프롬프트 템플릿 (기능별 재사용)

````
당신은 Senior Full-Stack Engineer다. 
Next.js 14 App Router · Supabase · TypeScript · Tailwind · shadcn/ui 
프로덕션 전문가. 성능·접근성·유지보수성 모두 중시.

## 컨텍스트 (모든 첨부 필수)
- prd-v1.2.md
- docs/adr/*.md (12개)
- supabase/migrations/*.sql (5개)
- config/sources_whitelist.yaml
- packages/db/types.ts (Supabase 생성 타입)
- packages/prompts/*.md (기존 프롬프트)
- 이전 기능 구현 커밋 (해당 시)

## 이번 세션 목표
구현할 기능 이름: **[기능 식별자 예: F-P0a-3 /trends 페이지]**

PRD v1.2 섹션 5.1 F-P0a-3 전체 명세를 따른다.
Acceptance Criteria는 반드시 모두 통과.

## 작업 구조
### Part 1: 데이터 레이어
- Supabase migration 추가 필요 시 신규 SQL 파일 (00005_xxx.sql)
- 필요 시 material view / index 추가
- TypeScript 타입 재생성 커맨드

### Part 2: API 레이어 (Server)
- app/api/v1/* Route Handler
- public_view만 SELECT (base table 절대 금지)
- Zod 스키마 검증, rate limiting
- 에러 응답 표준화 (code/message/detail)

### Part 3: UI 레이어 (Client)
- Server Component 우선, 인터랙티브 영역만 'use client'
- Tailwind + shadcn/ui 우선, 커스텀 최소화
- Coverage Distribution Bar 등 재사용 컴포넌트는 packages/ui로

### Part 4: 테스트
- Unit (Vitest): 유틸 함수, 스코어 공식
- Integration (Supabase CLI local): Edge Function → DB
- E2E (Playwright): 사용자 플로우 1개 이상

### Part 5: 성능
- LCP ≤ 2.5s, INP ≤ 200ms
- Lighthouse Performance 85+
- Core Web Vitals 75th 통과

### Part 6: 접근성
- WCAG 2.1 AA
- 키보드 네비게이션
- aria-label, prefers-reduced-motion
- VoiceOver / TalkBack smoke test

## 출력 형식
각 파일을 ```typescript 또는 ```sql 블록으로 제공.
파일 경로 주석 (// apps/web/app/trends/page.tsx).
각 Part 앞에 한국어 설명 2~3문장.
끝에 실행 순서 체크리스트 (bash 명령어 순서).
Claude Code에서 바로 Plan Mode → Execute 가능한 수준.

## 제약
- 외부 라이브러리 최소화 (ADR 기반)
- Edge Function은 Deno 호환
- Korean 텍스트 UTF-8 처리 명시
- service_role 키는 서버 환경변수만
- **base table GRANT는 테스트에서 자동 검증**
- 트렌드 수집 관련이면 Claude Code Routines 아닌 Vercel Cron 사용
- Lighthouse 자동 검증 CI 통과

## 품질 기준
- 태욱이 이 결과물을 커밋만 하면 PR 머지 가능한 수준
- Edge case 최소 5개 처리 (API 실패, 빈 데이터, 중복, 선동 키워드, 한글 정규화)
- 코드 주석은 "왜"를 설명 (무엇은 코드가 말함)

시작해라. Part 1부터 순서대로.
````

### Step 2 반복 대상 (P0a 9개 기능)
각각 새 세션에서 위 프롬프트 재사용:

1. **Day 4**: F-P0a-1 RSS 수집 파이프라인
2. **Day 5**: F-P0a-2 Python 워커 임베딩 + HDBSCAN
3. **Day 6**: Claude summary 프롬프트 + golden.jsonl CI
4. **Day 7**: HDBSCAN cron + materialized view refresh
5. **Day 8**: F-P0a-3 `/trends` 페이지
6. **Day 9**: F-P0a-4 Coverage Distribution Bar 컴포넌트
7. **Day 10**: F-P0a-5 `/cluster/:id` 상세 페이지
8. **Day 11**: F-P0a-6 `/methodology` 페이지
9. **Day 12**: F-P0a-7 OG 이미지 생성

### Step 2 완료 후 (Day 14) — P0a Exit Review

````
당신은 Senior QA Lead다. PRD Exit Criteria 자체 검증을 수행.

## 작업
PRD v1.2 섹션 9 Phase 1a "P0a Exit Criteria" 9개 항목을 
체크리스트로 전환하고, 각 항목에 대해:
- 현재 상태 (pass / fail / partial)
- 증거 (스크린샷·로그·쿼리 결과)
- fail 항목의 blocking severity
- P0b 진입 Go/No-Go 권고

## 특히 검증
1. Migration 5-part 실행 성공 (에러 0)
2. **base table anon GRANT 0건** (아래 쿼리로 자동 검증)
   ```sql
   SELECT table_name FROM information_schema.role_table_grants
   WHERE grantee IN ('anon', 'authenticated')
     AND table_schema = 'public'
     AND table_name IN ('sources', 'articles', 'clusters', 
                        'trends', 'source_score_evidence', 
                        'bias_disputes', 'admin_audit_logs');
   -- 결과: 0 rows 이어야 함
   ```
3. **public API 응답에 factuality_score 미포함** 자동 테스트
4. 15개 이상 매체에서 기사 수집 진행 중
5. 클러스터 50개 이상 형성
6. Lighthouse 85+

Go 시: Step 3 (P0b 확장) 프롬프트로 이동
No-Go 시: 실패 항목별 remediation 계획 + 예상 소요

시작해라.
````

---

## Step 3: P0b 확장 (Admin · 이의제기 · PMF 퍼널)

**목적**: Day 14~30, 클로즈드 알파 오픈 + PMF 6단계 퍼널 측정

**실행 시점**: Step 2 P0a Exit Go 결정 후 (D14~D30)
**예상 소요**: 16일
**산출물 형태**: Admin UI + 이의제기 플로우 + 퍼널 대시보드 + 알파 초대 시스템

### Step 3 프롬프트

````
당신은 Senior Full-Stack Engineer + Growth PM 혼합 역할이다.
P0a 신뢰 데모를 P0b 클로즈드 알파로 진화시킨다.
PMF 측정이 첫째, 기능 확장은 둘째.

## 컨텍스트 (모든 첨부 필수)
- prd-v1.2.md
- P0a 모든 커밋 (Day 2~14)
- Step 2 P0a Exit Review 결과
- docs/methodology-v0.md
- docs/data-licensing.md

## 실행 계획 (D14~D30, 16일)

### Sprint 1: Admin + 이의제기 (D14~D20)
- F-P0b-1 Admin 도구 (키워드 제외·클러스터 병합·편향 수정)
  - 각 작업은 admin_audit_logs에 actor/action/reason 필수 기록
  - shadcn Table + Form, 디자인 투자 최소
- F-P0b-2 이의제기 폼 + 에디터 응답 플로우
  - POST /disputes → status=open
  - Admin에서 reviewing → accepted/rejected/published 이동
  - Resend 이메일 트리거 3회 (접수 / 응답 / published)
  - **SLA 7일 운영 매뉴얼** docs/runbooks/disputes-sla.md
- 에디터는 태욱 1인 전제. 물량 < 10건/주 가정

### Sprint 2: 보조 데이터 (D20~D24)
- F-P0b-4 Naver DataLab 검증용 (1K/일)
  - Top 10 핵심 키워드만 하루 4회 호출 (총 40회 < 1,000 한도)
  - payload 저장 최소화 (집계값만)
- F-P0b-5 BIGKinds 보정 (하루 2회)
- F-P0b-6 외신 RSS 3개 (Reuters/AP/BBC) 매칭
  - pgvector similarity >= 0.78
  - 제목 + 리드 1문장 + 아웃링크만 저장
  - tos_confirmed 필수

### Sprint 3: PMF 퍼널 + 온보딩 + 알파 (D24~D30)
- F-P0b-3 온보딩 3분 투어 + 대기자 이메일
  - Resend welcome 이메일
  - waitlist 테이블 INSERT (RLS policy)
- F-P0b-7 PMF 6단계 퍼널 대시보드 (PostHog)
  - 이벤트 정의 6개: cluster_viewed, share_opened, 
    og_generated, share_completed, shared_link_opened, 
    shared_user_waitlisted
  - PostHog Funnel 빌더 설정 + 공유 대시보드 URL
  - docs/posthog-funnel.md (이벤트 스키마 문서)
- 클로즈드 알파 100명 초대
  - 대기자 중 선발 기준 + 초대 이메일 템플릿
  - 초대 코드 방식 or 이메일 화이트리스트
  - 피드백 수집 폼 (Typeform or 자체)

## 출력 구조
각 Sprint별:
### Part A: DB migration 추가분
### Part B: API 추가 엔드포인트
### Part C: UI 구현
### Part D: 테스트
### Part E: 운영 문서 (runbook)
### Part F: 배포 체크리스트

## 제약
- Admin은 태욱 1인 전제, UX 단순화
- 이의제기 SLA 7일 100% 준수 (물량 적음)
- Naver DataLab 1K/일 한도 실측 모니터링, 초과 시 자동 중단
- 공유 카드 이벤트 추적은 클라이언트 + 서버 양쪽 (로그인 없어도 session_id)
- 알파 초대는 30명/주 ramp-up (밴 리스크 분산)

## D+30 P0b Exit Criteria 자체 검증
PRD v1.2 섹션 9 Phase 1b 전 항목 체크:
- ✅ 대기자 1,000명
- ✅ 클로즈드 알파 100명 온보딩
- ✅ 잘못 묶인 클러스터 비율 ≤ 10%
- ✅ 표본 부족 표시 정확도 100%
- ✅ 방법론 페이지 조회율 WAU 중 10%
- ✅ 이의제기 7일 내 100% 응답
- ✅ **share_completed ≥ 80**
- ✅ **shared_link_opened ≥ 100**
- ✅ 매체 ToS 이슈 발생 0건

## V1 Go/No-Go 판단
- Go (두 PMF 지표 모두 달성): V1 전면 착수
- Partial (절반 달성): V1 범위 축소 재설계 (예: Blindspot만, Media Diet만)
- No-Go: V1 전면 재설계 또는 pivot 검토

시작해라. Sprint 1부터 순서대로.
````

---

## 실행 순서 요약

```
D0~D2 (4/18~4/20):  Step 0 — Sprint 0 Pre-Dev 문서 6종
D2~D4 (4/20~4/22):  Step 1 — ADR 12 + 스캐폴딩 + migration
D4~D14 (4/22~5/1):  Step 2 — P0a 9개 기능 반복 구현
D14    (5/1):        P0a Exit Review Go/No-Go
D14~D30 (5/1~5/17): Step 3 — P0b 확장 3 sprint
D30    (5/17):       P0b Exit Review & V1 Go/No-Go
```

## 스레드 분리 원칙

- **Step 0 → Step 1**: 완전 새 스레드 (문서 산출물만 첨부)
- **Step 1 → Step 2 (기능별)**: 기능마다 새 스레드 (ADR + migration + 이전 기능 코드 첨부)
- **Step 2 P0a Exit → Step 3**: 완전 새 스레드 (P0a 전체 커밋 첨부)
- **Step 3 Sprint 1 → 2 → 3**: 스프린트마다 새 스레드

## 주요 Go/No-Go 관문

| 관문 | 일자 | 기준 | 실패 시 |
|---|---|---|---|
| Sprint 0 완료 | D+2 | 6개 문서 + 매체 ToS 10개 확인 | Step 1 지연, 법무 우선 |
| Migration 5-part | D+3 | base table anon GRANT 0 | Step 1 롤백 |
| P0a Exit | D+14 | 9개 Exit Criteria | P0b 연기, 품질 재정비 |
| 매체 30개 ToS 완료 | D+20 | tos_confirmed=true ≥ 25개 | RSS 범위 축소 |
| P0b Exit (PMF) | D+30 | share_completed 80 + shared_link_opened 100 | V1 재설계 또는 pivot |

---

**End of Claude Code Execution Prompts v1.2 — 2026-04-18**
