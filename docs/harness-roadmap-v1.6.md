# 뜬이유 하네스 엔지니어링 실행 로드맵 v1.6

> 작성일: 2026-04-21
> 대상: 태욱 (1인 창업자)
> 기반: PRD v1.6 (확정), ADR-001~007
> 대체: harness-roadmap-v1.3.md (v1.3 티켓 구조는 유지·재사용)
>
> **핵심 원칙**: "코드 전에 계약, 계약 전에 깨뜨릴 반례, 계약 전에 지불 의향"
> - Claude Code = 작성자
> - Codex = 검증자 (반례 생성 + 리뷰)
> - 태욱 = 최종 merge 승인자 + 수익 큐레이션 + 조건 충족 판정
> - PostHog = 진입 조건 객관 판정자

---

## 0. 전체 흐름 (180일)

```
Phase P0w    D0~D7    (4/21~4/28)  Widget-shaped Revenue MVP
  T-W01      D0~D1    위젯 UI + API 스캐폴드
  T-W02      D1~D3    Embed Script
  T-W03      D3~D4    Pro/Creator/B2B 대기자 폼
  T-W04      D4~D6    AdZone + 수동 큐레이션 제휴 1건
  T-W05      D6~D7    PostHog 이벤트 + Exit 지표 대시보드

Phase Sprint 0  D7~D10  (4/28~5/1)  Harness Foundation
  T-001      하네스 스캐폴드 (18종) + ADR-001~007 정리

Phase P0a    D10~D24   (5/1~5/14)   신뢰 데모
  T-002      DB 마이그레이션 + Redaction Contract
  T-003      Data Licensing Whitelist (30매체)
  T-004      RSS Ingest Fixtures
  T-005      Summary Prompt Eval
  T-006      Python Worker (임베딩 + HDBSCAN)
  T-007      P0a UI Vertical Slice (/trends, /cluster/:id, OG)

Phase P0b    D24~D40   (5/14~5/30)  클로즈드 알파 + 조건부 iOS Small
  T-B01      결제 (Toss/Stripe)
  T-B02      Admin / Dispute / Waitlist 전환
  T-B03      보조 소스 (DataLab)
  T-B04      PMF 퍼널 + 클로즈드 알파 100명
  T-B05      (조건부) iOS Small Widget

Phase V0.5   D40~D100  (5/30~7/29)  수익 다각화 + Native 확장
  V-1        Weekly Report Pack
  V-2        API Access 공식
  V-3        iOS Medium/Large (조건부)
  V-4        Android Widget (조건부)
  V-5        카카오 애드핏 파일럿
  V-6        제휴 자동 매칭 검토

Phase V1     D100~D180 (7/29~9/27)  Native 풀스위트 + 광고 정식화
Phase V2     D180~D365 (9/27~~)     방법론 v1 + 학계 파트너십
```

각 티켓 = 하나의 GitHub branch = 하나의 PR = Claude Code 구현 + Codex 검증 + 태욱 merge

---

## 1. 하네스 엔지니어링 핵심 구조 (v1.3 유지 + v1.6 확장)

### 1.1 산출물 5종 (코드 전에 반드시 존재)

| 산출물 | 목적 | 파일 위치 |
|---|---|---|
| **ADR** | 설계 결정 고정 | `docs/adr/ADR-*.md` (001~007) |
| **Contract Test** | 깨지면 안 되는 API/DB/UI/수익 계약 | `harness/checks/*.ts` (18종) |
| **Evals** | LLM 출력 품질 평가 | `prompts/evals/*.jsonl` |
| **Fixtures** | 재현 가능한 샘플 데이터 | `harness/fixtures/*` |
| **Agent Instructions** | Claude Code 작업 규칙 | `CLAUDE.md`, `.claude/agents/*.md` |

### 1.2 CLAUDE.md 비협상 제약 v1.6 (14조 — v1.3 11조 + v1.6 3조)

```markdown
# TTEUN-IYU Engineering Rules v1.6

## Non-negotiable constraints

# v1.3 기존 (유지)
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

# v1.6 신규
12. **Revenue Zone Isolation (P12)**: `<AdZone>`, `<AffiliateCard>`,
    `<SponsoredCard>` must NEVER be rendered inside `<CoverageArea>`,
    `<CoverageBar>`, `<MethodologyPage>`, `<DisputePanel>`, `<OutletCompare>`,
    or `<OGCardCanvas>`. Enforced by harness:ad-zone-boundary.
13. **Affiliate Data Ephemerality**: Never store coupang / 11st / amazon
    product data (title, image, price, stock, reviews) in any database
    table. Runtime API call only, no cache, no log of raw payload.
14. **Native Widget Entry Condition**: Swift / Kotlin / Xcode files may
    not be committed unless `harness:native-widget-entry-condition`
    verifies that P0w Exit metrics (Paid Intent ≥ 4%, Waitlist ≥ 100)
    are met via PostHog API.

## Naming Ban List
- 실시간 검색어, 실검, 인기 검색어, 실시간 순위
- Trending Keywords, Real-time Search, Hot Search

## Workflow
- Read the relevant ADR before editing.
- Make small changes (one PR ≤ 500 lines).
- Run `pnpm harness:all` (18 checks) after every feature.
- Do not mark work complete until CI and harness pass.
- Every PR must pass `@codex review` with no blocking issues.
- Revenue-related PRs must reference ADR-005/006/007.
```

### 1.3 Harness 카탈로그 (18종)

| # | 하네스 | 출처 | 목적 |
|---|---|---|---|
| 1 | assert-no-public-sensitive-fields | v1.3 | bias_score 등 민감 필드 공개 API 노출 금지 |
| 2 | assert-no-naver-storage | v1.3 | Naver Search 결과 DB 저장 금지 |
| 3 | assert-no-image-storage | v1.3 | 이미지/로고/썸네일 저장 금지 |
| 4 | assert-tos-whitelist | v1.3 | tos_confirmed=false 소스 ingest 금지 |
| 5 | assert-dispute-status-server-only | v1.3 | 이의제기 status='open' 서버 강제 |
| 6 | assert-summary-copy-rate | v1.3 | 요약 copy ratio ≤ 15% |
| 7 | assert-public-copy-wording | v1.3 | "Coverage Distribution" 표현 강제 |
| 8 | assert-db-grants | v1.3 | anon/authenticated GRANT 0 |
| 9 | assert-widget-contract | v1.5 | Widget API Zod 스키마 + 레이턴시 + payload |
| 10 | assert-source-provenance | v1.5 | articles.source_id NOT NULL + ToS 재검증 |
| 11 | assert-realtime-naming | v1.5 | "실시간 검색어" 등 금지 표현 감지 |
| 12 | assert-sample-quality-copy | v1.5 | sample_size<5 UI 배지 필수 |
| 13 | assert-monetization-claims | v1.5 | "출시 예정" 라벨 강제 + 기능 허위 광고 방지 |
| 14 | assert-analytics-events | v1.5 | 필수 이벤트 11종 코드 발화 정적 분석 |
| 15 | assert-surface-consistency | v1.5 | Web/OG/Widget 3표면 데이터 일관성 |
| 16 | **assert-ad-zone-boundary** | **v1.6** | `<AdZone>` 배치 제한 AST + API 응답 검증 |
| 17 | **assert-affiliate-link-provenance** | **v1.6** | 제휴 링크 track_id + 저장 경로 차단 |
| 18 | **assert-native-widget-entry-condition** | **v1.6** | Swift 파일 커밋 시 PostHog 지표 검증 |

---

## 2. P0w 티켓 5개 (D0~D7)

P0w는 Sprint 0보다 **먼저** 실행. 이 단계는 "하네스 전 수익 검증"이므로 최소한의 하네스 부재 허용 (단, naming·ad-zone-boundary·monetization-claims는 스캐폴드만이라도 포함).

### T-W01: Widget Web MVP Scaffold (D0~D1)

**목적**: `/widget` + `/api/v1/widget/top` 최소 구조

**산출물**
- `apps/web/app/widget/page.tsx` (Server Component, Top 5 카드)
- `apps/web/app/api/v1/widget/top/route.ts` (mock data 응답, Zod 스키마)
- `apps/web/components/IssueCard.tsx` (이슈 카드 + mini Coverage Bar)
- `apps/web/lib/api/widget-schemas.ts` (v1.4 기반 + ad_allowed, affiliate_slot 필드)
- 배포: Vercel preview URL

**완료 기준**
- Vercel preview에서 `/widget` 접속 시 Top 5 mock 카드 렌더
- `/api/v1/widget/top?size=medium` 응답이 Zod 스키마 통과
- `ad_allowed: true` 필드 포함

### T-W02: Embed Script (D1~D3)

**목적**: 외부 사이트용 `<script src>` 1줄 임베드

**산출물**
- `apps/web/public/embed/widget.js` (iframe 주입 스크립트)
- `apps/web/app/embed/iframe/page.tsx` (iframe 내부 페이지, Medium 사이즈 고정)
- `config/embed-cors.ts` (CORS 화이트리스트 정책 초안)
- 데모 페이지: `apps/web/app/embed/demo/page.tsx` (self-host 테스트)

**완료 기준**
- 외부 정적 사이트(GitHub Pages)에 `<script src="..."/>` 삽입 후 실제 렌더 확인
- Shadow DOM 또는 iframe으로 호스트 스타일 격리 확인
- `data-host` 속성으로 설치 도메인 PostHog에 기록

### T-W03: Waitlist / Inquiry Forms (D3~D4)

**목적**: Pro / Creator / B2B 세 폼 + 서버 라우트 저장

**산출물**
- `apps/web/components/ProWaitlistModal.tsx`
- `apps/web/components/CreatorWaitlistForm.tsx`
- `apps/web/components/B2BInquiryForm.tsx`
- `apps/web/app/api/v1/waitlist/route.ts` (POST, waitlist_type 필드 확장)
- Supabase migration: `waitlist` 테이블에 `waitlist_type`, `intent_score`, `metadata_jsonb` 컬럼 추가
- Resend 연동 (확인 이메일)

**완료 기준**
- 3개 폼 모두 POST → DB 저장 → 확인 이메일 발송
- 지불 의향 점수 4~5 → `intent_score` 기록
- `assert-monetization-claims` 통과 ("출시 예정" 라벨 명시)

### T-W04: AdZone + Manual Affiliate Curation (D4~D6)

**목적**: v1.6 P12 원칙의 첫 구현, 제휴 링크 1건

**산출물**
- `apps/web/components/AdZone.tsx` (wrapper, useAdZoneVisibility hook 포함)
- `apps/web/components/AffiliateCard.tsx` (partner, product_title, affiliate_url)
- `apps/web/hooks/useAdZoneVisibility.ts` (라우트 기반 show/hide)
- `config/affiliate_manual_curation.yaml` (스키마 + 예시 2건)
- `apps/web/app/api/v1/affiliate/lookup/route.ts` (쿠팡 Open API 런타임 호출, **캐시 없음**)
- `apps/web/app/admin/affiliate/page.tsx` (수동 큐레이션 등록 폼, P0w는 태욱 localhost 접근)

**완료 기준**
- `/widget` 카드 하단에 `<AdZone>` 1개 렌더
- `/cluster/:id` (P0a에서 구현 예정, 이번 티켓은 route placeholder만) 진입 시 `<AdZone>` 자동 숨김
- 쿠팡 API 런타임 호출 → 응답 렌더 → DB INSERT 경로 부재 검증 (단위 테스트)
- `assert-ad-zone-boundary` 스캐폴드 (Sprint 0 T-001에서 본격 구현)

### T-W05: Analytics + Exit Metrics Dashboard (D6~D7)

**목적**: 11개 필수 이벤트 발화 + P0w Exit 판정 대시보드

**산출물**
- `apps/web/lib/analytics/events.ts` (이벤트 상수 11종 + posthog.capture wrappers)
- 11개 이벤트를 각 컴포넌트에 적용:
  - `widget_viewed`, `cluster_card_clicked`, `pricing_cta_clicked`,
    `pro_preorder_submitted`, `creator_waitlist_submitted`,
    `b2b_inquiry_submitted`, `embed_installed`, `embed_card_clicked`,
    `api_key_requested`, `affiliate_link_clicked`, `ad_clicked`
- PostHog 대시보드 세팅 (Exit Criteria 지표 6종 실시간 표시)
- `docs/p0w-exit-checklist.md` (체크리스트)

**완료 기준**
- 각 이벤트가 실제 동작에서 PostHog에 기록 확인
- 대시보드에서 Paid Intent Rate / 대기자 수 / 제휴 클릭 실시간 확인
- `assert-analytics-events` 스캐폴드 통과

---

## 3. P0w Exit Review Gate (D7, 2026-04-28)

### 자동 검증 (부분 하네스)
```bash
pnpm harness:widget-contract    ✅
pnpm harness:analytics-events   ✅
pnpm harness:monetization-claims ✅
pnpm harness:realtime-naming    ✅
# Sprint 0에서 나머지 14종 스캐폴드 착수
```

### Exit Criteria (v1.6 §14)
- [ ] 대기자 100명 이상 (Pro + Creator + B2B 합산)
- [ ] Pro Preorder 의향 20건 이상 (intent_score ≥ 4)
- [ ] Creator 대기자 10명 이상
- [ ] B2B/API 문의 3건 이상
- [ ] 광고/제휴 클릭 20건 이상
- [ ] 분리 영역 광고 누수 0건 (Harness 수동 검증)
- [ ] 치명적 신뢰·법무 이슈 0건
- [ ] 15개 이상 매체 RSS 수집 중 (ToS 확인 완료)

### Go / No-Go 판단
- **Go (모든 항목 충족)**: Sprint 0 → P0a
- **Partial Go (6/8 충족 + 누수 0건)**: Sprint 0 진행 + P0a 일정 1주 연장
- **No-Go (누수 ≥ 1건 OR 4/8 미만)**: 제품 전략 재검토 + ADR 수정 + v1.7 발의

### iOS Small Widget 조건 판정 (ADR-006)
- Paid Intent Rate ≥ 4% **AND** 대기자 ≥ 100
  - **충족**: T-B05 (P0b iOS Small) 활성화
  - **미충족**: T-B05 skip, Creator Embed 고도화로 투자 전환

---

## 4. Sprint 0 — Harness Foundation (D7~D10)

### T-001 v1.6: Harness Scaffold (18종)

**목적**: v1.3 T-001 확장판. 18종 하네스 전부 실행 가능한 스캐폴드.

**산출물**
- `CLAUDE.md` (14조 비협상 + Workflow + Naming Ban List)
- `docs/adr/ADR-001` ~ `ADR-007` 보강 (본 로드맵 작성 시점에 ADR-001~004 v1.3, ADR-005~007 v1.6 이미 존재)
- `harness/checks/` 18종 TypeScript 파일 (v1.3 스캐폴드 + v1.5 신규 7종 + v1.6 신규 3종)
- `prompts/evals/` 디렉토리 스캐폴드
- `.github/workflows/p0w-harness.yml` (18종 실행)
- `.github/pull_request_template.md` (14조 체크리스트 + ADR 참조 + Codex 검증)
- `package.json` scripts: `harness:all`, `harness:<each>`, `eval:summary`

**완료 기준**
- `pnpm harness:all` 18종 전부 실행 (no-op 포함 모두 exit 0)
- GitHub Actions PR에서 트리거
- 고의적 반례 PR 3건 (AdZone 누수 / Swift 조기 커밋 / 제휴 DB 저장) → CI fail 확인

---

## 5. P0a — 신뢰 데모 (D10~D24)

v1.3 T-002~T-007 유지 + **v1.6 증분**:

- **T-002 v1.6**: v1.3 DB 마이그레이션 + `waitlist_type`·`intent_score` 컬럼 확장 (T-W03에서 이미 추가된 경우 스킵)
- **T-003~T-006**: v1.3 동일
- **T-007 v1.6**: v1.3 P0a UI Slice + **Coverage 영역 `<AdZone>` 부재 검증 E2E 테스트 추가**

### P0a Exit Review Gate (D24, 2026-05-14)

#### 자동 검증 (하네스 18종 전부)
```bash
pnpm harness:all   # 18/18 ✅
pnpm eval:summary  # copy ratio ≤ 15% ✅
pnpm test:e2e      # /trends, /cluster/:id, Coverage Bar, OG card ✅
```

#### 수동 검증 (태욱)
- [ ] `supabase db reset`으로 clean install 성공
- [ ] `/api/v1/trends` 응답에 factuality_score 0건
- [ ] `/methodology` 페이지 방문 가능 + `<AdZone>` 부재 시각 확인
- [ ] OG 이미지 카톡 붙여넣기 → 광고·제휴 요소 부재 확인
- [ ] Lighthouse 85+ (모바일)
- [ ] ToS 확인 매체 ≥ 15개
- [ ] P0w 대기자에게 "P0a 오픈" 이메일 발송 + 클릭률 측정

---

## 6. P0b — 클로즈드 알파 + 조건부 iOS Small (D24~D40)

### T-B01: 결제 시스템 (Toss or Stripe Korea)
- P0w Preorder 의향자에게 우선 초대
- Pro 월 ₩6,900 결제 flow
- Harness: `assert-monetization-claims` 강화 (실제 결제 URL과 Pro 광고 카피 일치)

### T-B02: Admin / Dispute / Waitlist 전환
- v1.3 P0b + P0w 수집 대기자 이전 (Creator/B2B)

### T-B03: 보조 소스 (DataLab)
- v1.3 P0b 동일

### T-B04: PMF 퍼널 + 클로즈드 알파 100명
- v1.3 P0b 동일 + Revenue metrics 대시보드

### T-B05: (조건부) iOS Small Widget — ADR-006

**활성화 조건 (P0w Exit에서 확정)**:
- Paid Intent Rate ≥ 4% AND 대기자 ≥ 100

**산출물**:
- `apps/ios/TteuniyuWidget/` Xcode 프로젝트
- Small Widget (2×2): Top 1 이슈 + mini Coverage Bar
- TimelineProvider: 15분 주기 `/api/v1/widget/top?size=small` fetch
- TestFlight 내부 배포 (최대 10명, 초대 기반)
- Deep link: 위젯 탭 → Safari `/cluster/:id`

**Harness**:
- `harness:native-widget-entry-condition` PR merge 전 재검증
- PostHog API에서 Paid Intent·대기자 실시간 조회

**완료 기준**:
- TestFlight 빌드 1종 배포
- 10명 초대 완료
- App Store 제출은 V0.5에서 (심사 리스크 분산)

### P0b Exit Review (D40, 2026-05-30)

#### Revenue Metrics
- Pro 결제 완료 ≥ 10건
- Creator Pro 유료 전환 ≥ 5건
- B2B Lite 계약 ≥ 1건
- MRR ≥ ₩500,000

#### Mission Metrics
- share_completed ≥ 80
- shared_link_opened ≥ 100
- 이의제기 7일 내 응답률 100%

#### Go / No-Go
- **Go**: V0.5 전면 착수
- **Partial**: V0.5 범위 축소 재설계
- **No-Go**: Pivot 검토 + v1.7 발의

---

## 7. V0.5 / V1 / V2 (D40~D365)

### V0.5 (D40~D100, 2026-05-30 ~ 2026-07-29)

| 티켓 | 조건 | 산출물 |
|---|---|---|
| V-1 | 무조건 | Weekly Report Pack PDF 출시 |
| V-2 | 무조건 | API Access 공식 (Enterprise pilot 3~5건) |
| V-3 | iOS Small 설치 ≥ 500 | iOS Medium/Large Widget |
| V-4 | iOS Small 설치 ≥ 500 | Android AppWidget Small |
| V-5 | MRR ≥ ₩2M | 카카오 애드핏 파일럿 (실시간 이슈 영역 한정) |
| V-6 | ADR-007 감수성 필터 통과 | 제휴 커머스 자동 매칭 (제한적) |

### V1 (D100~D180, 2026-07-29 ~ 2026-09-27)

- iOS Lock Screen / macOS Desktop
- Android Material You (Android 12+)
- Google AdSense·네이버 애드포스트 정식 제휴
- Native Widget 풀스위트

### V2 (D180~D365, 2026-09-27 ~ 2027-04-18)

- 방법론 v1 공개
- 학계 파트너십
- B2B 엔터프라이즈 확장

---

## 8. Codex 설정 + PR 운영 (v1.3 유지 + v1.6 추가)

### 8.1 PR 템플릿 v1.6 (`.github/pull_request_template.md`)

```markdown
## Scope
- PRD section:
- Requirement IDs:
- Ticket: T-XXX
- Related ADRs: ADR-005 / ADR-006 / ADR-007 (해당 시)
- Out of scope:

## Safety constraints (CLAUDE.md v1.6 14조)
- [ ] No public sensitive fields (1)
- [ ] No Naver Search storage (2)
- [ ] No image/logo storage (3)
- [ ] ToS whitelist enforced (4)
- [ ] Summary copy-rate test passed (5)
- [ ] Coverage UI uses public wording only (7)
- [ ] Dispute status server-enforced (6)
- [ ] Embedding provider single (8)
- [ ] LLM calls log prompt_version (9)
- [ ] No NEXT_PUBLIC_SUPABASE_ANON_KEY usage (11)
- [ ] No SELECT *
- [ ] **Revenue Zone Isolation (P12, 12)** — AdZone boundary 준수
- [ ] **Affiliate Data Ephemerality (13)** — 저장 경로 부재
- [ ] **Native Widget Entry Condition (14)** — Swift 커밋 시 PostHog 검증 통과

## Tests
- [ ] pnpm lint
- [ ] pnpm typecheck
- [ ] pnpm test
- [ ] pnpm harness:all (18/18)
- [ ] supabase db reset
- [ ] playwright e2e (UI 변경 시)

## Codex verification
- [ ] @codex review requested
- [ ] Blocking issues resolved
- [ ] Codex approved

## Revenue impact (해당 시)
- [ ] 새 수익 요소가 `<AdZone>` 외부에 배치되지 않음
- [ ] 제휴 링크 track_id 포함 확인
- [ ] PostHog 이벤트 발화 확인
```

### 8.2 GitHub Actions `.github/workflows/p0w-harness.yml`

```yaml
name: p0w-harness-v1.6

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

      # v1.3 하네스 8종
      - run: pnpm harness:no-public-sensitive-fields
      - run: pnpm harness:no-naver-storage
      - run: pnpm harness:no-image-storage
      - run: pnpm harness:tos-whitelist
      - run: pnpm harness:dispute-status-server-only
      - run: pnpm harness:summary-copy-rate
      - run: pnpm harness:public-copy-wording
      - run: pnpm harness:db-grants

      # v1.5 신규 7종
      - run: pnpm harness:widget-contract
      - run: pnpm harness:source-provenance
      - run: pnpm harness:realtime-naming
      - run: pnpm harness:sample-quality-copy
      - run: pnpm harness:monetization-claims
      - run: pnpm harness:analytics-events
      - run: pnpm harness:surface-consistency

      # v1.6 신규 3종
      - run: pnpm harness:ad-zone-boundary
      - run: pnpm harness:affiliate-link-provenance
      - run: pnpm harness:native-widget-entry-condition
        env:
          POSTHOG_PERSONAL_API_KEY: ${{ secrets.POSTHOG_PERSONAL_API_KEY }}

      - run: pnpm eval:summary
```

---

## 9. Claude Code Subagent 구성 v1.6 (5종 → 6종)

v1.3 Subagent 5종 유지 + **v1.6 신규 1종**:

```markdown
# .claude/agents/revenue-zone.md (v1.6 신규)
You are the Revenue Zone specialist.

Your responsibilities:
- `<AdZone>`, `<AffiliateCard>`, `<SponsoredCard>` component boundaries
- Affiliate API runtime-only contract enforcement
- Native Widget entry condition verification

Non-negotiable:
- Never render ad/affiliate components inside Coverage/Methodology/Dispute areas
- Never store coupang/11st/amazon product data in any DB table
- Never commit Swift/Kotlin files without PostHog entry condition check
- Every revenue-related PR must reference ADR-005, 006, or 007

Read before any change:
- docs/prd-v1.6.md §4 P12, §9, §11.3
- docs/adr/ADR-005, ADR-006, ADR-007
- CLAUDE.md constraints 12, 13, 14
```

다른 5종 (db-security, ingestion, worker, frontend, qa-redteam)은 v1.3 유지, 단 **qa-redteam에 v1.6 attack scenario 3종 추가**:

```markdown
# .claude/agents/qa-redteam.md (v1.6 증분)

... (v1.3 원문)

v1.6 신규 attack scenarios:
- Try to render <AdZone> inside <CoverageArea> (harness:ad-zone-boundary가 잡는가?)
- Try to INSERT coupang product title into articles table (harness:affiliate-link-provenance가 잡는가?)
- Try to commit a Swift file with POSTHOG_BYPASS=true when Paid Intent=0% (태욱 수동 승인 알림 작동하는가?)
- Try to render affiliate_slot in /api/v1/clusters/:id response (assert-ad-zone-boundary가 API 응답도 검증하는가?)
```

---

## 10. Claude Code Hooks v1.6 (`.claude/settings.json`)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          { "type": "command", "command": "pnpm lint --silent || echo 'LINT FAIL'" },
          { "type": "command", "command": "pnpm typecheck --silent || echo 'TYPECHECK FAIL'" },
          { "type": "command", "command": "pnpm harness:ad-zone-boundary || echo 'AD-ZONE BOUNDARY FAIL'" },
          { "type": "command", "command": "pnpm harness:realtime-naming || echo 'NAMING FAIL'" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node harness/checks/block-dangerous-commands.mjs" }
        ]
      }
    ]
  }
}
```

`harness/checks/block-dangerous-commands.mjs` v1.6:
- v1.3 원본 + 다음 추가 차단:
  - `git commit` 시 Swift 파일 포함하면 `harness:native-widget-entry-condition` 선행 실행
  - `INSERT INTO articles` + 쿠팡 키워드 포함 시 중단

---

## 11. 매일 작업 흐름 (태욱 관점, v1.6 증분)

### 아침 (30분)
- 전날 PR Codex 리뷰 확인
- 전날 P0w 지표 PostHog 대시보드 확인 (Paid Intent, 대기자, 제휴 클릭)
- Blocking issue 대응 지시

### 낮 (2~4시간, 티켓 하나)
- Claude Code 세션 시작
- 해당 티켓 프롬프트 실행 (`docs/tickets/T-XXX.md`)
- `pnpm harness:all` (18종) 검증
- PR 생성 → `@codex review`

### 저녁 (30분)
- PostHog에서 당일 지표 스냅샷 기록 (journal)
- P0w 기간 한정: `config/affiliate_manual_curation.yaml` 에 내일자 큐레이션 1건 등록

---

## 12. 비상 대응 플레이북 (v1.3 유지 + v1.6 추가)

### v1.3 Case 1~5 유지

### Case 6 (v1.6): `<AdZone>` Coverage 영역 누수 감지
- 증상: PostHog `ad_clicked` 이벤트가 `/cluster/:id` 경로에서 발화
- 대응: P0 incident → Sentry alert → 1시간 내 hotfix + harness 강화

### Case 7 (v1.6): iOS Swift 우회 커밋 시도
- 증상: `POSTHOG_BYPASS=true` 환경변수로 CI 우회
- 대응: Slack alert 작동 확인 → bypass 사용처 기록 → 태욱 수동 검토 후 승인/롤백

### Case 8 (v1.6): 쿠팡 API 응답 DB 저장 시도
- 증상: `harness:affiliate-link-provenance` fail
- 대응: 즉시 PR revert → ADR-007 재확인 → 재구현

### Case 9 (v1.6): 정치 카테고리 이슈에 광고 노출
- 증상: 정치 태그 cluster에서 `ad_clicked` 발화
- 대응: `assert-political-category-no-ads.ts` 추가 구현 (v1.6 하네스 확장 19종)

---

## 13. 이번 주 즉시 실행 (D0~D3, 2026-04-21~04-24)

### D0 (오늘, 4/21) 오후
- [ ] 도메인 확보: tteuniyu.com, tteuniyu.kr
- [ ] GitHub repo 생성: `tteuniyu/tteuniyu`
- [ ] Supabase 프로젝트: `tteuniyu-prod`
- [ ] Vercel 프로젝트 연결
- [ ] PostHog 프로젝트 생성 + Personal API Key 발급
- [ ] 쿠팡파트너스 계정 신청 + lptag 발급 대기
- [ ] Codex GitHub App 설치

### D1 (4/22)
- [ ] 법무 자문 2명 후보 컨택
- [ ] Naver 공식 문의 3건 발송
- [ ] 매체 30개 ToS URL 목록 작성 시작
- [ ] **T-W01 Claude Code 실행** (위젯 UI + API 스캐폴드)

### D2 (4/23)
- [ ] T-W01 PR merge 후 T-W02 착수 (Embed Script)
- [ ] `config/affiliate_manual_curation.yaml` 스키마 확정

### D3 (4/24)
- [ ] T-W02 PR merge 후 T-W03 착수 (Waitlist 폼)
- [ ] 이메일 템플릿 초안 (Resend 연동)

---

## 14. 로드맵 한 장 요약

```
D0-D7    P0w         수익 검증 (T-W01~W05)
D7       ★ P0w Exit  Paid Intent ≥ 4%, 대기자 ≥ 100 판정 → iOS Small 활성화 여부
D7-D10   Sprint 0    하네스 18종 스캐폴드 (T-001 v1.6)
D10-D24  P0a         신뢰 데모 (T-002~T-007)
D24      ★ P0a Exit  하네스 18/18 + 수동 6종
D24-D40  P0b         결제 + 알파 + (조건부) iOS Small (T-B01~B05)
D40      ★ P0b Exit  Revenue + Mission 지표
D40-D100 V0.5        Weekly Report + API + iOS Medium/Large + Android
D100-D180 V1         Native 풀스위트 + 광고 네트워크 정식화
D180+    V2          방법론 v1 + 학계
```

**End of Harness Engineering Roadmap v1.6 — 2026-04-21**
