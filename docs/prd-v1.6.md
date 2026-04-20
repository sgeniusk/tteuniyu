# PRD v1.6 — Widget-shaped Revenue MVP (확정본)

## 0. 문서 메타

| 항목 | 내용 |
|---|---|
| 문서 제목 | **PRD v1.6 — Widget-shaped Revenue MVP (확정본)** |
| 문서 버전 | v1.6 **FINAL** |
| 작성일 | 2026-04-21 |
| 이전 버전 | v1.5 (사용자 초안), v1.4 (Surface Strategy), v1.3 (하네스), v1.2, v1.1, v1.0 |
| 대상 | Engineering / Design / Codex / Claude Code / Legal / Business Development |
| 근거 자료 | prd-v1.5.md + 2026-04-21 Strategy Alignment Session |
| 코드네임 | TTEUN-IYU |
| 한국어 서비스명 | 뜬이유 |
| 진입 Feature명 | 실시간 이슈 위젯 (Rising Issues Widget) |
| 영문 브랜드 | 미결 (Q-31, D+14 결정) |
| Target MVP 공개 | **P0w: 2026-04-28 / P0a: 2026-05-14 / P0b: 2026-05-30** |
| 변경 원칙 | **기능 쌓기 전에 지불 의향 검증. 광고·제휴는 분리 영역에서만. 네이티브는 신호 기반 단계적 착수.** |
| 잠금 상태 | **확정 (변경 시 PRD v1.7 발의 필요)** |

---

## Changelog v1.5 → v1.6

### 핵심 변화 요약 (1줄)
v1.5의 "Widget-shaped Revenue First" 전략을 **유지**하되, 사용자의 수익화(광고·제휴 커머스·구독) 및 네이티브 위젯 P0 포함 의사를 **v1.5의 신뢰 포지셔닝과 충돌 없이 재조정**한 확정본.

### 7가지 구조적 변화 (v1.5 → v1.6)

- **S-1 브랜드 3-Layer 확정**: 뜬이유(서비스명) / 실시간 이슈 위젯(진입 feature) / Coverage Distribution(본체 분석) — v1.5에서 암묵적이던 계층을 명시. 진입 IA: `/` = 실시간 이슈 위젯 대시보드
- **S-2 수익화 5종 → 7종 확장**: v1.5의 B2C Pro·Creator Pro·B2B Lite·API·Weekly Report 5종 유지 + **Affiliate Commerce + Contextual Ads** 2종 추가. 단, **분리 영역 원칙(P12) 신설**로 Coverage·방법론·이의제기 영역에서는 수익화 요소 절대 차단
- **S-3 네이티브 위젯 단계적 착수**: v1.5 "V1 조건부" → **P0b D24-D40 iOS Small (진입 지표 충족 시) → V0.5 iOS Medium/Large + Android → V1 풀스위트**. 조건 미달 시 해당 단계 skip 후 Embed/B2B 피봇
- **S-4 데이터 소스 4계층으로 확장**: v1.5 3계층(RSS/외부검증/내부신호) + **4차 제휴 커머스 런타임 API** (쿠팡파트너스/11번가). 4차는 **저장 절대 금지, 1차 데이터와 혼합 금지**
- **S-5 하네스 15종 → 18종**: v1.5 15종 유지 + `assert-ad-zone-boundary`, `assert-affiliate-link-provenance`, `assert-native-widget-entry-condition` 3종 추가
- **S-6 Product Principle P12 신설 — 수익 영역 분리 (Revenue Zone Isolation)**: 광고·제휴 링크는 실시간 이슈 카드 하단 전용 `<AdZone>`에만 렌더. Coverage Distribution·방법론·이의제기·OG 카드·외신 비교 영역에서는 어떤 형태의 수익 요소도 렌더 금지. 위반 시 CI fail
- **S-7 ADR 3건 추가**: ADR-005 광고 분리, ADR-006 네이티브 위젯 단계적 착수, ADR-007 제휴 커머스 데이터 경계

### 일정 변화 (v1.5 → v1.6)

| Phase | v1.5 | v1.6 | 변화 |
|---|---|---|---|
| P0w | D0-D7 | D0-D7 | 유지 |
| Sprint 0 | D7-D10 | D7-D10 | 유지 |
| P0a | D10-D24 | D10-D24 | 유지 |
| **P0b** | D24-D40 | D24-D40 | **iOS Small Widget 조건부 포함** |
| **V0.5** | D40-D100 | D40-D100 | **iOS Medium/Large + Android Widget 추가** |
| V1 | D100-D180 | D100-D180 | **Native Widget 풀스위트 + 광고 네트워크 정식화** |
| V2 | D180+ | D180+ | 광고 모델 재검토 → **광고 네트워크 공식 제휴** |

### v1.5에서 유지되는 원칙 (불변)
- **"실시간 검색어" 금지** + "실시간 이슈" / "급상승 이슈" 통일
- Widget API p95 ≤ 300ms 계약
- 디자인 시스템 토큰 6축 (색상·타이포·spacing·radius·shadow·motion)
- 다크모드 디폴트
- Coverage Distribution 4색 의미 색상 (teal/slate/amber/violet)
- v1.3 하네스 8종 전체
- 브랜드 3후보 매트릭스 (Tteuniyu/WIT/Prism)
- Non-Goal: 네이버 실검 대체 포지셔닝, 자동 제휴 매칭, 본문 전문 저장

---

## 1. Product Overview

### 1.1 Vision (v1.5 유지)
한국에서 뉴스를 소비하는 모든 사람이 자신이 어느 진영의 렌즈로 세상을 보는지 실시간으로 인지하고, 그 렌즈를 선택적으로 바꿔 끼울 수 있는 사회를 만든다.

### 1.2 Mission (v1.5 유지)
뜬이유는 한국 언론의 구조적 편향을 대체하지 않고 가시화한다. 판단하지 않고 분포를 보여준다. 사용자는 AI의 해석이 아니라 **다원적 원본에 접근**한다.

### 1.3 Product Identity — 3-Layer Brand (v1.6 신규 확정)

**Layer 1: 뜬이유 (서비스·브랜드)**
- 최상위 브랜드명
- Mission·Vision·방법론의 주체
- 외부 커뮤니케이션의 단일 창구

**Layer 2: 실시간 이슈 위젯 (진입 Feature)**
- `/` (홈) = 실시간 이슈 위젯 대시보드
- Top 5~10 이슈 + mini Coverage Bar
- 수익화 요소가 렌더될 수 있는 유일한 영역
- **진입 유도 목적**: 방문자 → 카드 클릭 → Coverage Distribution 전체 뷰

**Layer 3: Coverage Distribution (본체 분석)**
- `/cluster/:id`, `/methodology`, `/dispute`, `/outlet-compare`
- **수익화 요소 절대 금지 영역**
- 뜬이유의 신뢰 인프라 핵심
- 방법론·이의제기·외신 비교의 공개 허브

### 1.4 Success Definition (12개월)

| 지표 카테고리 | 지표 | 목표 |
|---|---|---|
| Product | MAU | 100,000 |
| Product | WAU | 60,000 |
| Product | DAU | 20,000 |
| Revenue — B2C | Pro 구독자 | 500명 (MRR ₩3,000,000) |
| Revenue — Creator | Embed 유료 고객 | 50명 (MRR ₩750,000) |
| Revenue — B2B | Lite 계약 | 10건 (MRR ₩1,000,000) |
| Revenue — API | Enterprise pilot | 3~5건 |
| Revenue — Report | Weekly Report 구매 | 월 50건 (₩1,500,000) |
| Revenue — Affiliate | CTR (분리 영역) | 2%+ (V0.5 시점) |
| Revenue — Ads | 분리 영역 eCPM | $3 (V0.5 시점) |
| **MRR 합계 (12개월)** | **₩6,500,000+** | |
| Mission | WDDU | 40,000 |

### 1.5 Non-Goals (v1.6 최종)

v1.5 유지 + 명시화:
- iOS/Android 네이티브 위젯의 P0w 필수 산출물 포함 (P0b 조건부로 이동)
- "실시간 검색어" 용어 사용 (제품·SEO·마케팅 전면 금지)
- 광고 수익을 Coverage Distribution·방법론·이의제기 영역에 적용
- 네이버 실검 대체 포지셔닝
- 제휴 커머스의 자동 키워드 매칭 (P0w·P0a·P0b는 수동 큐레이션만, V0.5 이후 자동화 검토)
- 본문 전문·이미지·로고 저장
- Naver Search API 결과 저장·가공

---

## 2. Problem Statement (JTBD v1.5 유지 + JTBD-5 신규)

### 2.1 JTBD-1 ~ JTBD-4 (v1.5 유지)

### 2.2 JTBD-5 (Discovery) — **v1.6 신규**
**When** 출근길·점심 직후·저녁 식사 전 20분 윈도우에서,
**I want to** 지금 한국에서 **가장 활발히 논의되는 이슈 Top 5~10을 5초 내에 파악**하고,
**So I can** 필요 시 그 중 한 이슈를 깊게 파악(`/cluster/:id`) 또는 관련 커머스·정보·리소스에 접근한다.

→ **실시간 이슈 위젯의 직접 JTBD**. 수익화 요소(제휴 커머스·광고)는 이 JTBD의 자연스러운 연장. 단, Coverage Distribution 탐색으로 전환된 순간 수익화 요소 소거.

---

## 3. Target Users (v1.5 유지 + Persona 6 신규)

v1.5 Persona 1~5 유지.

### Persona 6 — 박트렌드 (28세, 대기업 마케팅 기획자) — **v1.6 신규**
- **맥락**: 브랜드 마케팅, 트렌드 리포트 주 2회 작성, 실시간 이슈 모니터링 필요
- **페인**: 실시간 검색어 없어진 후 대체 수단 부재. 네이버 데이터랩은 쿼터 제한
- **수익 의향**: 월 ₩50,000~100,000 부담 의사 (B2B Lite 타겟)
- **부가 가치**: 실시간 이슈 위젯에서 Amazon/쿠팡 관련 상품 링크 클릭하는 IA에 부정적 반응 없음 (본인도 마케터)
- **역할**: **Affiliate Commerce + B2B Lite 이중 타겟**

---

## 4. Product Principles (v1.5 P1~P11 유지 + P12 신설)

### P1~P11 (v1.5 유지)

### P12. 수익 영역 분리 (Revenue Zone Isolation) — **v1.6 신규 최상위 원칙**

**정의**: 모든 수익화 요소(광고·제휴 링크·CPA 배너·프리미엄 upsell)는 **실시간 이슈 위젯 카드 하단의 `<AdZone>` 컴포넌트** 내부에서만 렌더한다. Coverage Distribution 영역·방법론 영역·이의제기 영역·OG 카드·외신 비교 페이지에서는 어떤 형태의 수익 요소도 렌더 금지한다.

**근거**:
- v1.5 섹션 2.4 "광고 수익 초기 제외" 원칙의 정신을 유지하면서 사용자의 수익화 요구를 수용
- "판단하지 않는 중재자" 포지셔닝은 Coverage Distribution 영역의 중립성에서 나온다. 광고가 있으면 광고주 관련 이슈의 분포 표시에 외부 압력 가능성 존재
- 실시간 이슈 영역은 "어떤 이슈가 뜨는가"를 알리는 진입 Surface로, 수익화가 중립성을 훼손하지 않음

**구현 계약**:
- `<AdZone>` 컴포넌트는 `<CoverageArea>`·`<MethodologyPage>`·`<DisputePanel>`·`<OutletCompare>` 하위에 절대 배치 불가
- `pnpm harness:ad-zone-boundary` 정적 분석 통과 시에만 PR merge
- API 응답에 `ad_allowed: boolean` 필드 포함, false인 cluster(Coverage 전체 뷰 진입 후)는 클라이언트가 광고 렌더 스킵

---

## 5. Naming & Language (v1.5 유지 + v1.6 추가)

### 5.1 "실시간 이슈" 용어 체계 (v1.5 유지)
허용: 실시간 이슈, 급상승 이슈, 지금 뜨는 이유, Rising Issues
금지: 실시간 검색어, 실검, 인기 검색어, 실시간 순위, Trending Keywords, Real-time Search, Hot Search

### 5.2 Coverage Distribution 표현 (v1.5 유지)
공개 UI: "보도 분포 (Coverage Distribution)"
구간: "진보 성향 / 중도·혼합 / 보수 성향 / 외신"
금지: "편향", "Bias", "factuality score", "사실성 점수"

### 5.3 수익화 용어 체계 (v1.5 유지 + v1.6 추가)

v1.5 유지: Pro / Creator / Lite / Enterprise / Weekly Report Pack

v1.6 신규:
- **Related Products** (제휴 커머스 공개 라벨 — "연관 상품·서비스"): 내부 코드에서는 `affiliate_links`, UI에서는 "이 이슈와 관련된 상품" 명시
- **Sponsored** (광고 공개 라벨): 네이티브 광고 하단에 "Sponsored" 배지 필수 (전자상거래법·표시광고법 준수)

### 5.4 Harness 검증
- `assert-realtime-naming.ts`: 금지 표현 자동 감지 (v1.5 유지)
- `assert-ad-zone-boundary.ts`: Sponsored·Related Products 라벨 누락 시 실패

---

## 6. Data Source Strategy (v1.6 4계층 재정의)

### 6.1 1차 — 언론 RSS (v1.5 유지, 1급 저장 가능 데이터)
- 30개 매체 RSS (tos_confirmed + ingestion_enabled)
- 저장 범위: 제목, URL, canonical URL, 발행시각, abstractive summary (≤ 15% copy ratio)
- 금지: 본문 전문, 이미지, 로고, 썸네일

### 6.2 2차 — 외부 검증 데이터 (v1.5 유지)
- Naver DataLab (1,000회/일, payload 최소 저장)
- Google Trends (Alpha 승인 후)
- BIGKinds (하루 2회 보정)
- Naver Search (discovery only, 저장 금지)
- Daum 실시간 트렌드 (자동 스크래핑 금지)

### 6.3 3차 — 제품 내부 신호 (v1.5 유지, 1급 승격)
- 조회, 공유, 저장, 재방문, 유료 클릭, Embed 설치, API 키 요청, **광고 클릭, 제휴 링크 클릭**(v1.6 추가)

### 6.4 4차 — 제휴 커머스 런타임 API (v1.6 신규)

**역할**: 실시간 이슈 카드에 문맥 관련 제휴 링크 렌더

**소스**:
- 쿠팡파트너스 Open API (추천 상품 검색)
- 11번가 제휴 API (Alpha 승인 시)
- Amazon Associates (해외 이슈용, V0.5)

**저장·가공 계약**:
- **저장 절대 금지**: 검색 결과, 상품명, 이미지 URL, 가격, 재고
- **런타임 호출만 허용**: 사용자 요청 시점에 서버 사이드 API 호출 → 즉시 응답 → 캐시 없음
- **1차 데이터와 혼합 금지**: 쿠팡 상품명을 articles 테이블에 저장, 상품 검색 결과로 clusters 생성 모두 금지
- **매칭 방식 P0w~P0b**: 운영자 수동 큐레이션 1회/일 (`config/affiliate_manual_curation.yaml`)
- **매칭 방식 V0.5**: LLM 기반 문맥 매칭 자동화 검토, 단 자동 매칭은 ADR-007에 의해 "이슈 성격 감수성 검사" 통과 시에만

### 6.5 Harness 보증
- `assert-source-provenance.ts` (v1.5 유지)
- `assert-no-naver-storage.ts` (v1.3 유지)
- `assert-tos-whitelist.ts` (v1.3 유지)
- `assert-affiliate-link-provenance.ts` (**v1.6 신규**): 제휴 링크의 track_id, partner_id, ToS 준수 검증 + 저장 경로 차단

---

## 7. Feature Specifications

### 7.1 P0w — Widget-shaped Revenue MVP (v1.5 유지 + F-P0w-8 추가)

**목표**: 실시간 이슈 위젯형 웹 MVP로 **4가지 유료 의향 + 2가지 분리 영역 수익** 초기 검증.

**Exit Criteria (v1.6 보강)**
- 대기자 100명 이상
- 유료 선결제 의향 20건 이상
- Creator Embed 대기자 10명 이상
- B2B/API 문의 3건 이상
- **광고/제휴 링크 클릭 20건 이상** (v1.6 신규)
- **분리 영역 광고 누수 0건** (Harness 검증, v1.6 신규)
- 7일 내 치명적 신뢰·법무 이슈 0건

#### F-P0w-1 ~ F-P0w-7 (v1.5 유지)

#### F-P0w-8: `<AdZone>` 컴포넌트 + 수동 큐레이션 1건 — **v1.6 신규**

**User Story**: 방문자는 `/widget`에서 실시간 이슈 카드 하단에 "이 이슈와 관련된 상품" 또는 "Sponsored" 배지와 함께 제휴 링크 1개를 본다. Coverage Distribution 영역(`/cluster/:id`)으로 진입 순간 해당 영역 전체에서 광고·제휴 요소가 렌더되지 않는다.

**Acceptance Criteria**
```gherkin
Given 방문자가 /widget에 진입하고 Top 5 이슈 카드를 본다
When 각 카드 하단에 <AdZone> 영역이 최대 1개 렌더된다
Then AdZone은 "Sponsored" 또는 "연관 상품·서비스" 라벨을 포함하고
And 클릭 시 제휴 링크가 새 탭으로 이동하며
And PostHog 이벤트 `affiliate_link_clicked` 또는 `ad_clicked` 발화

Given 방문자가 이슈 카드를 클릭하여 /cluster/:id로 진입한다
When 페이지가 렌더된다
Then <AdZone>, <AffiliateZone>, <SponsoredCard> 어떤 것도 렌더되지 않는다
And API 응답의 ad_allowed 필드가 false이며
And harness:ad-zone-boundary가 통과한다

Given 운영자가 /admin/affiliate에서 수동 큐레이션 1건을 등록한다 (P0w 한정)
When 등록 시 issue_keyword, product_title, affiliate_url, partner(쿠팡/11번가), valid_until 입력
Then config/affiliate_manual_curation.yaml에 append되고
And 배포 후 /widget에서 해당 키워드 매칭 이슈 카드 하단에 렌더
```

**구현 범위 엄격 제한 (P0w)**
- 수동 큐레이션 1건/일만 허용, 자동 매칭·LLM 매칭 금지
- 광고 네트워크 (AdSense·카카오 애드핏) 연동 V1
- P0w에서는 "뜬이유 자체 Sponsored" 1건 + "제휴 링크 수동 큐레이션 1건" 총 최대 2개 슬롯

### 7.2 Sprint 0 Harness (D7~D10, v1.5 유지 + v1.6 3종 추가)

v1.5 15종 + v1.6 3종 = **총 18종**

### 7.3 P0a — 신뢰 데모 (D10~D24, v1.5 유지)

v1.5 F-P0a-1 ~ F-P0a-8 유지 + **v1.6 추가 제약**:
- `/cluster/:id`·`/methodology`·`/dispute` 페이지에 `<AdZone>` 렌더 금지 (P12 원칙)
- OG 카드에도 광고·제휴 요소 렌더 금지

### 7.4 P0b — 클로즈드 알파 + iOS Small Widget 조건부 착수 (D24~D40)

v1.5 P0b 기능 + v1.5 추가 F-P0b-8/9/10 + **v1.6 F-P0b-11 추가**:

#### F-P0b-11: iOS Small Widget (조건부) — **v1.6 신규**

**진입 조건 (P0w Exit 시 판단)**
- Paid Intent Rate ≥ 4% **AND**
- 대기자 ≥ 100명

**조건 충족 시 산출물 (D24~D40)**
- iOS WidgetKit Swift 프로젝트 초기화
- Small (2×2) 위젯 1종: Top 1 이슈 + mini Coverage Bar
- TestFlight 내부 배포 (최대 10명)
- App Store 제출은 P0b Exit 이후

**조건 미달 시**
- iOS Swift 작업 전면 skip
- P0b 기간을 Creator Embed 고도화 + B2B Lite 첫 계약에 투자
- V0.5 진입 시 재평가

**Harness 검증**
- `assert-native-widget-entry-condition.ts`: Swift 파일이 PR에 포함되면 PostHog 대시보드 API로 P0w Exit 지표 조회 → 조건 미충족 시 CI fail

### 7.5 V0.5 — 수익 다각화 + Native Widget 확장 (D40~D100)

v1.5 V0.5 + **v1.6 추가**:
- iOS Medium (4×2) / Large (4×4) 추가 (iOS Small 설치 ≥ 500 조건)
- Android AppWidget Small/Medium 추가 (iOS Small 설치 ≥ 500 조건)
- 제휴 커머스 자동 매칭 검토 (ADR-007 "이슈 성격 감수성 검사" 통과 시)
- 광고 네트워크 소규모 파일럿 (카카오 애드핏, 실시간 이슈 영역 한정)

### 7.6 V1 — Native Widget 풀스위트 + 광고 네트워크 정식화 (D100~D180)

v1.5 V1 + **v1.6 추가**:
- iOS Lock Screen / macOS Desktop Widget
- Android Material You 동적 색상 지원
- Google AdSense·네이버 애드포스트 정식 제휴 (분리 영역 유지)

### 7.7 V2 — 확장 (D180~D365)

v1.5 V2 유지 + 방법론 v1 공개 후 **추가 광고 영역 확장 검토**(단 Coverage 영역 침범은 여전히 금지).

---

## 8. Widget API Contract (v1.5 유지 + v1.6 확장)

### 8.1 Endpoint (v1.5 유지)
```
GET /api/v1/widget/top?size=small|medium|large
```

### 8.2 Response Schema (v1.6 확장)

```typescript
export const WidgetSmallResponse = z.object({
  cluster_id: z.string().uuid(),
  title: z.string().max(60),
  coverage: z.object({
    progressive: z.number().int(),
    mixed: z.number().int(),
    conservative: z.number().int(),
    foreign: z.number().int(),
  }),
  sample_quality: z.enum(['insufficient_sample', 'low_confidence', 'sufficient']),
  updated_at: z.string(),
  // v1.6 신규
  ad_allowed: z.boolean(),  // 실시간 이슈 영역 = true, Coverage 진입 = false
  affiliate_slot: z.object({
    enabled: z.boolean(),
    partner: z.enum(['coupang', '11st', 'amazon']).optional(),
    product_title: z.string().optional(),
    affiliate_url: z.string().url().optional(),
    valid_until: z.string().optional(),
    label: z.enum(['Sponsored', 'Related']).optional(),
  }).optional(),
})
```

### 8.3 Performance Contract (v1.5 유지)
- p95 레이턴시 ≤ 300ms
- payload: Small ≤ 768B (affiliate_slot 포함으로 v1.5 512B → v1.6 768B), Medium ≤ 3KB, Large ≤ 5KB

### 8.4 Harness Check
- `assert-widget-contract.ts` (v1.5 유지 + affiliate_slot 필드 검증 추가)
- `assert-ad-zone-boundary.ts` (**v1.6 신규**): `/api/v1/clusters/:id` 응답에 affiliate_slot·ad_allowed 필드 부재 확인

---

## 9. Monetization Strategy (v1.5 5종 → v1.6 7종)

### 9.1 B2C Pro (v1.5 유지)
- 월 ₩6,900 / 연 ₩69,000
- Free: 실시간 이슈 Top 10, 보도 분포 바, 기본 공유
- Pro: 키워드 알림, 개인 Media Diet 분석, Blindspot Report, 히스토리 30일+, 광고 없음(분리 영역까지)
- 12개월 목표: 500명 (MRR ₩3,000,000)

### 9.2 Creator Pro (v1.5 유지)
- 월 ₩15,000 ~ ₩29,000 tier
- 12개월 목표: 50명 (MRR ₩750,000)

### 9.3 B2B Lite (v1.5 유지)
- 월 ₩100,000 ~ ₩500,000
- 12개월 목표: 10건 (MRR ₩1,000,000)

### 9.4 API Access (v1.5 유지)
- 기본 월 ₩500,000 ~ Enterprise
- 12개월 목표: 3~5건 pilot

### 9.5 Weekly Report Pack (v1.5 유지)
- 건당 ₩30,000 / 월정기 ₩20,000
- 12개월 목표: 월 50건 (₩1,500,000)

### 9.6 Affiliate Commerce (v1.6 신규)

- **채널**: 쿠팡파트너스 (P0w), 11번가 (V0.5), Amazon Associates (V0.5 해외 이슈)
- **영역**: 실시간 이슈 카드 하단 `<AdZone>` 전용
- **매칭**: P0w~P0b 수동 큐레이션, V0.5 자동 매칭 검토
- **공개 라벨**: "연관 상품·서비스"
- **CTR 목표**: P0w 1% → V0.5 2% → V1 3%
- **수익 추정**: 쿠팡 CPC 평균 ₩200 × 실시간 이슈 일 방문 5,000 × CTR 2% = 월 ₩600,000 (V0.5)
- **Harness**: `assert-affiliate-link-provenance.ts`, `assert-ad-zone-boundary.ts`

### 9.7 Contextual Ads — Sponsored (v1.6 신규)

- **채널**: 카카오 애드핏 (V0.5 파일럿), Google AdSense·네이버 애드포스트 (V1)
- **영역**: 실시간 이슈 카드 하단 `<AdZone>` (Affiliate와 슬롯 공유, 1슬롯/카드)
- **공개 라벨**: "Sponsored" 배지
- **eCPM 목표**: V0.5 $1 → V1 $3
- **제외 규칙**:
  - Coverage Distribution 영역 = 렌더 금지 (P12)
  - 정치·선거 카테고리 이슈 = 광고 노출 금지 (광고주 중립성 의심 방지)
  - 표본 부족 이슈 (sample_size < 5) = 광고 노출 금지 (신뢰 저하 우려)

### 9.8 Harness 검증 (v1.6 통합)
- `assert-monetization-claims.ts` (v1.5 유지)
- `assert-ad-zone-boundary.ts` (v1.6 신규, P12 원칙)
- `assert-affiliate-link-provenance.ts` (v1.6 신규)
- `assert-political-category-no-ads.ts` (v1.6 신규 보조, 9.7 제외 규칙)

---

## 10. Success Metrics (v1.6 — Ad·Affiliate 지표 추가)

### Layer 1 — North Star (v1.5 유지)
WDDU (Weekly Diverse-Diet Users)

### Layer 2 — Revenue Metrics (v1.5 7종 + v1.6 3종 = 10종)

| 지표 | P0w | P0a | P0b | V0.5 | V1 |
|---|---|---|---|---|---|
| Paid Intent Rate | 4% | — | 8% | 12% | 15% |
| Preorder Conversion | 20건 | — | 100건 | 500건 | 2,000건 |
| B2B Lead Rate | 3건 | — | 10건 | 30건 | 60건 |
| Embed Install Rate | — | — | 30% | 50% | 60% |
| API Key Request | 1건 | — | 5건 | 15건 | 30건 |
| Trial to Paid Conversion | — | — | 15% | 25% | 35% |
| MRR | ₩0 | — | ₩500,000 | ₩2,000,000 | ₩6,000,000 |
| **Affiliate CTR** (v1.6) | 1% | — | 1.5% | 2% | 3% |
| **Ad Zone eCPM** (v1.6) | — | — | — | $1 | $3 |
| **Ad Isolation Compliance** (v1.6) | 100% | 100% | 100% | 100% | 100% |

### Layer 3 — Product Metrics (v1.5 유지)

### Layer 4 — Mission Metrics (v1.5 유지)

### Native Widget 단계적 진입 조건 (v1.6 재정의)

| 단계 | 시점 | 진입 조건 | 미달 시 |
|---|---|---|---|
| iOS Small | P0b D24 | Paid Intent ≥ 4% AND 대기자 ≥ 100 | P0b 기간 Creator Embed·B2B에 투자 |
| iOS Medium/Large | V0.5 D40 | iOS Small 설치 ≥ 500 | V0.5 Weekly Report·Affiliate 고도화 |
| Android Small | V0.5 D40 | iOS Small 설치 ≥ 500 | Android PWA 대체 |
| Android Medium/Large | V1 D100 | Android Small 설치 ≥ 300 | Android 전략 재검토 |
| macOS Desktop | V1 D100 | iOS Large 설치 ≥ 200 | macOS skip |
| iOS Lock Screen | V1 D100 | MAU 50,000 | skip |

---

## 11. Harness Engineering (v1.5 15종 → v1.6 18종)

### 11.1 v1.3 기존 8종 (유지)
- assert-no-public-sensitive-fields.ts
- assert-no-naver-storage.ts
- assert-no-image-storage.ts
- assert-tos-whitelist.ts
- assert-dispute-status-server-only.ts
- assert-summary-copy-rate.ts
- assert-public-copy-wording.ts
- assert-db-grants.sql

### 11.2 v1.5 신규 7종 (유지)
- assert-widget-contract.ts
- assert-source-provenance.ts
- assert-realtime-naming.ts
- assert-sample-quality-copy.ts
- assert-monetization-claims.ts
- assert-analytics-events.ts
- assert-surface-consistency.ts

### 11.3 v1.6 신규 3종

#### 11.3.1 `assert-ad-zone-boundary.ts`
- 정적 분석: `<AdZone>`, `<AffiliateZone>`, `<SponsoredCard>` 컴포넌트가 다음 영역 하위에 배치되지 않는지 AST 스캔
  - `<CoverageArea>`, `<CoverageBar>`, `<MethodologyPage>`, `<DisputePanel>`, `<OutletCompare>`, `<OGCardCanvas>`
- API 응답 분석: `/api/v1/clusters/:id`, `/api/v1/methodology` 응답에 `affiliate_slot` 또는 `ad_slot` 필드 부재 확인
- 위반 시 파일 경로 + 라인 번호 출력, exit 1

#### 11.3.2 `assert-affiliate-link-provenance.ts`
- `config/affiliate_manual_curation.yaml` 로드
- 각 엔트리 검증:
  - `partner` ∈ {coupang, 11st, amazon}
  - `affiliate_url` 에 required track_id (쿠팡 `lptag`, 11번가 `afId`, Amazon `tag=`) 포함
  - `valid_until` 미래 시점
  - `issue_keyword` 최소 2자 이상
- API 런타임 호출 로그 스캔: Supabase `articles`·`clusters` 테이블에 affiliate payload 저장 시도 차단
- 위반 시 exit 1

#### 11.3.3 `assert-native-widget-entry-condition.ts`
- PR에 Swift 파일 (`*.swift`, `*.xcodeproj`) 포함 여부 탐지
- 포함 시 PostHog Cloud API 호출하여 P0w Exit 지표 조회:
  - `paid_intent_rate` ≥ 0.04
  - `waitlist_count` ≥ 100
- 미충족 시 PR에 Blocking comment + exit 1
- 우회 방지: 환경변수 `POSTHOG_BYPASS=true` 사용 시 태욱 수동 승인 요구 alert

### 11.4 CI 통합
`.github/workflows/p0w-harness.yml`:
```yaml
- pnpm harness:all  # 18종
- pnpm eval:summary
- pnpm test
- pnpm test:e2e
- pnpm harness:ad-zone-boundary  # 독립 실행 가능
- pnpm harness:affiliate-link-provenance
- pnpm harness:native-widget-entry-condition
```

---

## 12. Design System & Brand (v1.4/v1.5 유지)

섹션 전체 v1.4 섹션 8 + v1.5 섹션 14 유지.

### 12.1 v1.6 신규 컴포넌트 명세

#### `<AdZone>`
- 위치: 실시간 이슈 카드 하단 전용
- 스타일: `<CoverageBar>`와 시각적으로 구분 (상단 1px border-slate-800, padding 16px)
- 라벨: 상단 좌측 "Sponsored" (광고) 또는 "연관 상품·서비스" (제휴)
- 배제 페이지 자동 제거: `useAdZoneVisibility()` hook이 현재 라우트 체크
  - `/`, `/widget`, `/trends` = 렌더 허용
  - 그 외 모든 페이지 = 자동 숨김

#### `<AffiliateCard>`
- `<AdZone>` 하위에만 배치
- `affiliate_slot` 데이터로 렌더 (title, image placeholder, partner, CTA "상품 보기")
- 이미지 직접 로드 금지 (P0a 이미지 저장 금지 원칙) → placeholder 디자인 토큰 사용

#### `<SponsoredCard>`
- `<AdZone>` 하위에만 배치
- `<AffiliateCard>`와 슬롯 공유 (1슬롯/카드)
- V0.5 광고 네트워크 SDK 주입

---

## 13. Non-Functional Requirements (v1.5 유지 + v1.6 추가)

### 13.1 Performance (v1.5 유지)
- 위젯 API p95 ≤ 300ms
- Widget 페이지 LCP ≤ 2s

### 13.2 Security (v1.5 유지 + v1.6 추가)
- 제휴 링크: 서버 측 URL 서명 (tamper 방지)
- 광고 iframe sandbox + CSP 엄격 설정
- `<AdZone>` 컴포넌트가 Coverage 영역 하위로 이동되는 DOM 조작 공격 방지 (React boundary fingerprint)

### 13.3 Accessibility (v1.5 유지)
- `<AdZone>` 내부 요소에도 aria-label 필수
- "Sponsored" 배지는 스크린리더에서 먼저 읽힘 (transparency)

### 13.4 Legal Compliance (v1.5 유지 + v1.6 추가)
- **표시광고법**: "Sponsored" 배지 + "광고" 한글 표기 의무 (V0.5 광고 네트워크 정식화 시)
- **전자상거래법**: 제휴 링크에 "이 콘텐츠는 제휴 마케팅의 일환으로 일정 수수료를 받을 수 있습니다" disclaimer 페이지 하단 고정
- **쿠팡파트너스 약관 준수**: 쿠팡 브랜드 노출 금지 구간 존재 → `<AffiliateCard>`에서 "쿠팡" 텍스트 대신 "제휴 상품"만 표시
- **표시광고법 제3조 정치 광고 금지**: 정치 카테고리 이슈에 광고·제휴 렌더 금지 (`assert-political-category-no-ads.ts`)

### 13.5 Observability (v1.5 유지 + v1.6 추가)
- 광고 수익·제휴 CTR 실시간 대시보드 (PostHog)
- Ad Zone 누수 알림 (Sentry, Coverage 영역에서 ad_clicked 이벤트 발화 시 즉시 P0 incident)

### 13.6 Scalability (v1.5 유지)

---

## 14. Release Plan (v1.6 최종)

### Phase P0w — Widget-shaped Revenue MVP (D0~D7, 2026-04-21 ~ 2026-04-28)

**산출물 (F-P0w-1 ~ F-P0w-8)**
- `/widget` 페이지
- `/api/v1/widget/top` 엔드포인트 (affiliate_slot 필드 포함)
- `/embed/widget.js` 스크립트
- Pro CTA 폼 + waitlist 저장
- Creator Embed 대기자 폼
- B2B/API 문의 폼
- PostHog 9 + 2 = 11개 이벤트 추적
- 기본 OG 메타 태그
- **`<AdZone>` + 수동 큐레이션 제휴 링크 1건** (v1.6 신규)

**Exit Criteria**
- [ ] 대기자 100명 이상 (Pro + Creator + B2B 합산)
- [ ] Pro Preorder 의향 20건 이상
- [ ] Creator 대기자 10명 이상
- [ ] B2B/API 문의 3건 이상
- [ ] 광고/제휴 클릭 20건 이상 (v1.6)
- [ ] 분리 영역 광고 누수 0건 (Harness, v1.6)
- [ ] 치명적 신뢰·법무 이슈 0건
- [ ] 15개 이상 매체 RSS 수집 중

**Go/No-Go**
- Go: Sprint 0 Harness → P0a 착수
- No-Go: 포지셔닝·가격·타겟 재설계

### Phase Sprint 0 — Harness (D7~D10, 2026-04-28 ~ 2026-05-01)
- v1.3 T-001/T-002 + v1.5 7종 + **v1.6 3종 = 18종 하네스 전체 스캐폴드**

### Phase P0a — 신뢰 데모 (D10~D24, 2026-05-01 ~ 2026-05-14)
- v1.4/v1.5 P0a 기능 + Coverage/방법론 영역 Ad 차단 검증

### Phase P0b — 클로즈드 알파 + 조건부 iOS Small Widget (D24~D40, 2026-05-14 ~ 2026-05-30)
- v1.5 P0b + F-P0b-11 (iOS Small 조건부, v1.6 신규)

### Phase V0.5 — 수익 다각화 + Native 확장 (D40~D100)
- Weekly Report Pack, API Access 공식 런칭
- iOS Medium/Large + Android Small (조건부)
- 카카오 애드핏 소규모 파일럿
- 제휴 커머스 자동 매칭 검토

### Phase V1 — Native Widget 풀스위트 + 광고 네트워크 정식화 (D100~D180)
- iOS Lock Screen, macOS Desktop
- Android Material You
- Google AdSense·네이버 애드포스트 공식 제휴

### Phase V2 — 확장 (D180~D365)
- 방법론 v1 공개
- 학계 파트너십
- B2B 엔터프라이즈 확장

---

## 15. Open Questions

### v1.5 Q-1 ~ Q-40 유지

### v1.6 신규

**Q-41: <AdZone> 시각 경계 디자인**
- 실시간 이슈 카드와 AdZone 사이 구분선이 어느 수준이어야 사용자 인지 혼란 없는가
- A: 1px border + "Sponsored"/"연관 상품" 라벨 vs B: 카드 분리 (16px gap) vs C: 배경색 차별화
- 해결 시점: P0w 착수 전 Claude Design 의뢰 → **D+3 결정**

**Q-42: 제휴 커머스 수동 큐레이션 운영 방식**
- 일 1회 수동 업데이트 운영자(태욱)가 지속 가능한가 vs 주 1회로 완화 vs Creator 유료 구독자에게 큐레이션 위임
- 해결 시점: P0w 중 실제 운영 부담 측정 → **D+7 결정**

**Q-43: 정치 카테고리 광고 제외 기준**
- "정치 카테고리" 판정 자동화 (cluster tag) vs 수동 블랙리스트 vs 하이브리드
- 해결 시점: V0.5 광고 파일럿 전 → **D+60 결정**

**Q-44: iOS Small Widget P0b 조건 수치 보수성**
- Paid Intent ≥ 4% + 대기자 ≥ 100은 달성 용이 → Swift 학습 병행 부담
- 대안: Paid Intent ≥ 6% + 대기자 ≥ 200 + 유료 선결제 5건 이상
- 해결 시점: P0w 중간 D+3 지표 기반 → **D+5 결정**

**Q-45: 표시광고법·전자상거래법 자문**
- 제휴·광고 관련 표시 의무 정확한 문구
- Coverage 영역에서 광고가 절대 렌더되지 않아도 "광고 수익 모델" 전체 공시 의무 여부
- 해결 시점: **D+7 변호사 자문 1차 결과**

---

## 16. Appendix

### 16.1 v1.5 → v1.6 비교 매트릭스

| 영역 | v1.5 | v1.6 | 변화 |
|---|---|---|---|
| 제품 Identity | 암묵적 (뜬이유 단일) | **3-Layer (뜬이유 / 실시간 이슈 위젯 / Coverage)** | 명시화 |
| 수익 모델 수 | 5종 | **7종 (+Affiliate, +Contextual Ads)** | 확장 |
| 수익 분리 원칙 | 암묵 | **P12 수익 영역 분리 원칙 (최상위)** | 신설 |
| Native Widget 일정 | V1 조건부 | **P0b 조건부 → V0.5 → V1 단계적** | 세분화 |
| 데이터 소스 계층 | 3계층 | **4계층 (+제휴 커머스 런타임)** | 확장 |
| Harness 개수 | 15종 | **18종 (+Ad/Affiliate/WidgetEntry)** | 확장 |
| 광고 수익 | 초기 제외 | **분리 영역 허용 (P0w 시작)** | 재조정 |
| Product Principle | P1~P11 | **P1~P12** | 확장 |
| JTBD | 4개 | **5개 (+JTBD-5 Discovery)** | 추가 |
| Persona | 5명 | **6명 (+박트렌드 마케터)** | 추가 |
| ADR | (v1.3) 4건 | **(v1.6) 7건 (+3건)** | 확장 |

### 16.2 v1.6 확정 체크리스트

- [x] 제목 "PRD v1.6 — Widget-shaped Revenue MVP (확정본)"
- [x] 3-Layer Brand Identity 명시 (섹션 1.3)
- [x] Product Principle P12 수익 영역 분리 (섹션 4)
- [x] 수익화 7종 (섹션 9)
- [x] Widget Roadmap 단계적 진입 조건 (섹션 10 + 7.4 + 7.5 + 7.6)
- [x] 데이터 소스 4계층 (섹션 6)
- [x] Harness 18종 (섹션 11)
- [x] F-P0w-8 AdZone 추가 (섹션 7.1)
- [x] F-P0b-11 iOS Small 조건부 (섹션 7.4)
- [x] Widget API Contract 확장 (섹션 8.2 ad_allowed, affiliate_slot)
- [x] Design System `<AdZone>`·`<AffiliateCard>`·`<SponsoredCard>` (섹션 12.1)
- [x] Legal Compliance 표시광고법·전자상거래법·쿠팡파트너스 약관 (섹션 13.4)
- [x] Open Questions Q-41~45 (섹션 15)
- [x] ADR-005/006/007 작성 예약 (별도 문서)

### 16.3 Phase 별 주요 File 산출

| Phase | 주요 파일 |
|---|---|
| P0w | `apps/web/app/widget/page.tsx`, `apps/web/app/api/v1/widget/top/route.ts`, `apps/web/public/embed/widget.js`, `apps/web/components/AdZone.tsx`, `apps/web/components/AffiliateCard.tsx`, `config/affiliate_manual_curation.yaml` |
| Sprint 0 | `harness/checks/*.ts` (18종), `.github/workflows/p0w-harness.yml`, `CLAUDE.md` |
| P0a | `apps/web/app/trends/page.tsx`, `apps/web/app/cluster/[id]/page.tsx`, `apps/web/app/methodology/page.tsx`, `apps/web/app/cluster/[id]/og/route.tsx` |
| P0b | `apps/web/app/api/v1/checkout/*`, `apps/web/app/admin/*`, (조건부) `apps/ios/*` Swift 프로젝트 |
| V0.5 | `apps/ios/Medium`, `apps/ios/Large`, `apps/android/*`, `apps/web/app/api/v1/reports/*` |
| V1 | `apps/ios/LockScreen`, `apps/macos/*`, 광고 네트워크 SDK 통합 |

---

## 17. 확정 선언

이 PRD v1.6은 **확정본**이며, 이후 변경은 PRD v1.7 발의와 승인을 거쳐야 한다. 하네스 엔지니어링 로드맵(`docs/harness-roadmap-v1.6.md`)과 티켓 프롬프트(`docs/tickets/*`)는 본 PRD를 **단일 소스 오브 트루스(Single Source of Truth)** 로 참조한다.

**End of PRD v1.6 — 2026-04-21 (확정)**
