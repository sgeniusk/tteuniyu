# PRD v1.5 — Widget-shaped Revenue MVP

## v1.4에서 v1.5로 바뀐 핵심 요약

### 전략 전환 (가장 큰 변화)
v1.4가 "3-surface 전략 정의 + 디자인 시스템 기반"이었다면, v1.5는 **"Native Widget-first"에서 "Widget-shaped Revenue-first"로 제품 전략의 중심을 이동**시킨다. v1.4에서 V1 일정(D+90~D+180)으로 계획했던 iOS/Android 네이티브 위젯은 **검증 신호 달성 후로 미루고**, 대신 7일 안에 **웹/임베드 위젯으로 유료 의향을 검증**하는 P0w 단계를 신설한다. 이 전환의 핵심은 **"위젯의 모양을 가진 수익 검증 도구"를 가장 먼저 만들자**는 것이다. 기능을 더 쌓기 전에 **누가, 왜, 얼마를 지불할 의사가 있는지**를 먼저 확인한다.

### 7가지 구조적 변화
- **S-1 P0w 단계 신설 (D0~D7)**: 웹/임베드 위젯 MVP로 유료 의향 검증. P0a·P0b보다 **먼저 실행**. 산출물은 `/widget`, `/api/v1/widget/top`, `/embed/widget.js`, Pro CTA, Creator Embed 대기자, B2B/API 문의 폼
- **S-2 실시간 검색어 표현 전면 금지**: "실시간 검색어"는 네이버 실검을 연상시켜 오해·상표·법무 리스크 초래. **"실시간 이슈", "급상승 이슈", "지금 뜨는 이유"**로 통일
- **S-3 데이터 소스 3계층 재정의**: 1차 언론 RSS(저장·가공 OK) / 2차 DataLab·Google Trends·BIGKinds(검증용) / 3차 제품 내부 신호(조회·공유·저장·재방문·유료 클릭). 제품 내부 신호를 **1급 데이터 소스**로 승격
- **S-4 수익화 섹션 신설 (5종 라인)**: B2C Pro / Creator Pro / B2B Lite / API Access / Weekly Report Pack. **광고 수익은 초기 핵심 모델에서 제외**
- **S-5 Success Metrics 수익 지표 7종 추가**: Paid Intent Rate / Preorder Conversion / B2B Lead Rate / Embed Install Rate / API Key Request / Trial to Paid Conversion / MRR. 사용자 수 지표보다 **상위 가중치**
- **S-6 Native Widget 진입 조건 명시**: 6개 검증 지표 중 **2개 이상 달성** 시에만 iOS Small Widget 착수. "일정 기반"이 아닌 "신호 기반" 착수
- **S-7 Harness 하네스 7종 추가**: assert-widget-contract, assert-source-provenance, assert-realtime-naming, assert-sample-quality-copy, assert-monetization-claims, assert-analytics-events, assert-surface-consistency

### Release Plan 재배치
- **v1.4 순서**: Phase 0 → P0a → P0b → V0.5 → V1 (Widget)
- **v1.5 순서**: **P0w (D0~D7, 수익 검증)** → **Sprint 0 Harness (D7~D10)** → **P0a (D10~D24, 신뢰 데모)** → **P0b (D24~D40, 클로즈드 알파)** → **V0.5 (D40~D100)** → **V1 (D100~D180, 위젯 진입 조건 충족 시 Native Widget)**
- 총 일정 10일 연장되었으나, **수익 검증이 실패하면 P0a 착수 전 피봇 가능**

### v1.4에서 유지되는 것
- **Surface Strategy**: Web / Share Artifacts / Widget 3-surface 명시적 정의
- **Design System 토큰**: 색상·타이포·spacing·radius·shadow·motion 6축 전체
- **OG Card Visual Spec**: 1200×630 레이아웃 3종 (표준/표본부족/블라인드스팟)
- **Widget API Contract**: `/api/v1/widget/top?size=*` 엔드포인트 계약
- **Brand Identity Framework**: Tteuniyu / WIT / Prism 3후보 매트릭스
- **디자인 시스템 토큰**, **다크모드 디폴트**, **모바일 퍼스트 브레이크포인트**

### v1.3에서 유지되는 것 (하네스)
- **P8 하네스 우선 원칙**, **P9 AI 역할 분리 원칙**
- **Public View → Next.js API Only** (C-1)
- **bias_disputes 서버 라우트화** (C-2), **waitlist 서버 라우트화** (C-3)
- **embedding 단일 provider** (C-5), **ingestion_runs 분리** (C-6)
- **T-001~T-007 티켓 구조** (Sprint 0 Harness 섹션에서 재사용)

---

## 1. 문서 메타

| 항목 | 내용 |
|---|---|
| 문서 제목 | **PRD v1.5 — Widget-shaped Revenue MVP** |
| 문서 버전 | v1.5 |
| 작성일 | 2026-04-20 |
| 이전 버전 | v1.4 (Surface Strategy + 디자인 시스템), v1.3 (하네스), v1.2 (데이터 라이선스), v1.1 (스코프 축소), v1.0 (archived) |
| 대상 | Engineering / Design / Codex / Claude Code / Legal / **Business Development** |
| 근거 자료 | prd-v1.4.md + 제품 전략 재검토 세션 (2026-04-20) |
| 코드네임 | TTEUN-IYU |
| 한국어 서비스명 | 뜬이유 |
| 영문 브랜드 | 미결 (Q-31, D+7 결정) |
| Target MVP 공개 | **P0w: 2026-04-27 / P0a: 2026-05-14 / P0b: 2026-05-30** |
| 변경 원칙 | **기능 쌓기 전에 지불 의향 검증. 네이티브는 신호 뒤로.** |

---

## 2. Strategic Rationale — 왜 Widget-shaped Revenue First인가

### 2.1 v1.4까지의 가정과 위험

v1.4는 제품을 "Web → OG 카드 → Widget"으로 펼치는 세 표면 전략을 정립했다. 그러나 이 전략은 **"사용자가 모여들면 수익은 나중에 따라온다"**는 암묵적 가정 위에 서 있다. 1인 부트스트랩 맥락에서 이 가정의 위험은 두 가지다.

- **기회비용 위험**: D+0~D+180 기간 중 절반 이상을 "사용자 확보용 기능"에 쓰게 되는데, 이 중 수익 전환이 어려운 기능에 시간이 투입될 수 있다
- **검증 지연 위험**: PMF를 "공유 완료 80건"으로 측정하지만, 공유는 지불 의사와 약한 상관관계를 갖는다. 무료 공유 100건이 유료 1건보다 많은 노이즈를 만든다

### 2.2 Widget-shaped Revenue의 의미

뜬이유의 가치 제안은 **"홈스크린 5초 소비"가 아니라 "맥락 있는 시민으로 기능하고 싶은 사람의 지불 의향을 충족"**하는 것이다. 이 지불 의향은 네 가지 형태로 나타난다.

- **B2C Pro**: 개인이 더 깊은 분석·알림·히스토리를 원해서 월 구독
- **Creator Pro**: 뉴스레터·블로그·유튜브 운영자가 위젯 임베드로 독자에게 맥락 제공
- **B2B Lite**: 기업 홍보팀·IR팀이 자사 관련 이슈 트래킹용으로 기본 구독
- **API Access**: 금융·연구·미디어 기관이 raw 데이터 API 사용

이 네 가지 지불 의사를 **네이티브 앱 없이, 웹/임베드 위젯만으로** 먼저 검증한다. 이게 v1.5의 핵심 전환이다.

### 2.3 네이티브 위젯을 미루는 이유

- **학습·심사 비용**: iOS WidgetKit Swift 학습 2~3주 + App Store 심사 2~3주 = 최소 5주
- **수익 가설 불확정**: 네이티브 위젯이 수익으로 연결된다는 증거가 아직 없음
- **기회비용**: 같은 5주를 B2C Pro 지불 시스템·Creator Embed·B2B 영업 튜닝에 투자하는 것과 비교

네이티브는 **검증 신호 달성 후** (섹션 11 참조) 착수한다. "언제"가 아니라 "무엇이 참일 때"로 진입 조건을 바꾼다.

### 2.4 광고 수익을 초기 모델에서 제외하는 이유

- **신뢰 인프라 제품 포지셔닝과 상충**: "판단하지 않는 중재자"가 광고로 돈을 벌면 편향 의심 초래
- **CPM 경제성 부족**: 초기 트래픽으로는 광고 수익이 월 $100 미만
- **방법론 공개 원칙(P2)과 긴장**: 광고주 관련 이슈 분포 표시에 외부 압력 가능성

광고는 V2 이후, **방법론 v1 공개·학계 파트너십 확보 후** 재검토.

---

## 3. Product Overview

### 3.1 Vision (v1.4 유지)
한국에서 뉴스를 소비하는 모든 사람이 자신이 어느 진영의 렌즈로 세상을 보는지 실시간으로 인지하고, 그 렌즈를 선택적으로 바꿔 끼울 수 있는 사회를 만든다.

### 3.2 Mission (v1.4 유지)
뜬이유는 한국 언론의 구조적 편향을 대체하지 않고 가시화한다. 판단하지 않고 분포를 보여준다.

### 3.3 Success Definition (12개월, v1.5 수정)
- **Product**: MAU 100,000 / WAU 60,000 / DAU 20,000 (v1.4 유지)
- **Revenue (v1.5 전면 수정)**: 
  - Pro 구독자 500명 × ARPPU ₩6,000 = MRR ₩3,000,000 (B2C)
  - Creator Embed 유료 고객 50명 × ₩15,000 = MRR ₩750,000 (Creator)
  - B2B Lite 계약 10건 × ₩100,000 = MRR ₩1,000,000 (B2B)
  - API Access 건당 ₩500,000~ (Enterprise pilot)
  - Weekly Report Pack 구매 월 50건 × ₩30,000 = ₩1,500,000 (교육·연구)
  - **12개월 목표 MRR: ₩6,250,000+** (v1.4 단순 Pro MRR ₩3M보다 2배 다양성)
- **Mission**: WDDU 40,000 (v1.4 유지)

### 3.4 Non-Goals (v1.5 재정리)
v1.4 유지 + 추가:
- **(v1.5 신규) iOS/Android 네이티브 위젯을 P0 필수 산출물로 포함** — V1 이후, 진입 조건 충족 시에만
- **(v1.5 신규) "실시간 검색어" 용어 사용** — 제품 UI·SEO·마케팅 모두 금지. 섹션 7.2 참조
- **(v1.5 신규) 광고 수익을 초기 핵심 모델에 포함** — V2 이후 방법론 v1 공개 후 재검토
- **(v1.5 신규) 네이버 실검 대체 포지셔닝** — 출처 없는 순위형 실시간 검색어 서비스로 오인되지 않도록 카피 관리

---

## 4. Problem Statement (v1.4 유지 + JTBD-4 추가)

### 4.1 JTBD-1 ~ JTBD-3 (v1.4 유지)

### 4.2 JTBD-4 (Economic) — **v1.5 신규, 수익 전환 직결**

**When** 뉴스 맥락을 내 독자·팔로워·팀에 제공하고 싶을 때,
**I want to** 뜬이유의 급상승 이슈 위젯을 내 블로그·뉴스레터·사내 대시보드에 한 줄 `<script>` 로 임베드하여,
**So I can** 직접 큐레이션하지 않아도 독자에게 신뢰 가능한 이슈 맥락을 자동 제공한다.

→ **Creator Pro / B2B Lite의 직접적 JTBD**. 뜬이유가 "사용자 확보 도구"가 아니라 "맥락 인프라"가 되는 경로

---

## 5. Target Users (v1.4 유지 + Persona 5 추가)

v1.4의 Persona 1 (이지훈) ~ Persona 4 (강도현) 유지.

### Persona 5 — 김뉴스레터 (32세, 1인 뉴스레터 운영자) — **v1.5 신규**
- **맥락**: Stibee·Substack에서 매주 금요일 경제 뉴스레터 발행, 구독자 3,000명
- **페인**: 매주 이슈 큐레이션에 4시간 소모, 어느 매체가 어떻게 보도했는지 수동 비교 불가능
- **수익 의향**: 월 ₩15,000~30,000 부담 의사 있음 (독자에게 더 많은 맥락 제공 가치 평가)
- **역할**: **Creator Pro 타겟 페르소나**, P0w Embed 대기자 초기 모집 대상

---

## 6. Product Principles (v1.4 P1~P10 유지 + P11 추가)

### P11. 수익 검증 우선 (Validate Revenue First) — **v1.5 신규**
기능을 쌓기 전에 **누가, 왜, 얼마를 지불하는가**를 먼저 검증한다. MAU·WAU보다 Paid Intent Rate·Preorder Conversion·B2B Lead Rate가 상위 지표다. 수익 가설이 틀렸다면 기능을 더 만들기 전에 가설을 재설계한다.

---

## 7. Naming & Language (v1.5 신규 대섹션)

### 7.1 "실시간 이슈" 용어 체계

#### 허용 표현
- **실시간 이슈**: 공식 명칭. 모든 UI·API·마케팅에서 기본값
- **급상승 이슈**: velocity 강조 맥락
- **지금 뜨는 이유**: 서비스명 "뜬이유"와 연결된 시그니처 카피
- **Rising Issues**: 영문 공식 명칭

#### 금지 표현
- **실시간 검색어**: 네이버 실검 연상, 상표·법무 리스크
- **실검**: 동일 이유
- **인기 검색어**: 검색어 랭킹 서비스 오인
- **실시간 순위**: 출처 없는 랭킹 서비스 오인
- **Trending Keywords / Real-time Search / Hot Search**: 동일 이유의 영문 표현

### 7.2 Coverage Distribution 표현 (v1.4 유지)
- 공개 UI: "보도 분포 (Coverage Distribution)"
- 구간: "진보 성향 / 중도·혼합 / 보수 성향 / 외신"
- **금지**: "편향", "Bias", "factuality score", "사실성 점수"

### 7.3 수익화 용어 체계 (v1.5 신규)
- **Pro**: 개인 구독 (B2C)
- **Creator**: 크리에이터 임베드 구독 (Creator)
- **Lite**: 중소기업 구독 (B2B)
- **Enterprise**: 기업·기관 API 계약 (B2B+)
- **Weekly Report Pack**: 주간 리포트 단건 구매 (연구·교육)

### 7.4 Harness 검증 (섹션 12.8 참조)
- `assert-realtime-naming.ts`: 코드베이스·UI·API에서 금지 표현 자동 감지

---

## 8. Data Source Strategy (v1.5 재정의)

### 8.1 3계층 데이터 아키텍처

#### 1차: 언론 RSS / 뉴스 기반 이슈 클러스터링
- **역할**: **저장·가공·재표시 권리 확보된 유일한 1급 데이터**. 모든 public 표면의 근본 데이터
- **소스**: 30개 매체 RSS (ToS 확인 + tos_confirmed + ingestion_enabled)
- **저장 범위**: 제목, URL, canonical URL, 발행시각, abstractive summary (≤ 15% copy ratio)
- **금지**: 본문 전문, 이미지, 로고, 썸네일

#### 2차: 검증용 외부 데이터 (저장·재표시 제한)
- **Naver DataLab**: 1,000회/일, 핵심 키워드 트렌드 검증용. payload 최소 저장
- **Google Trends**: Alpha 승인 시 추가, pytrends 폴백
- **BIGKinds**: 하루 2회 보정, 공공데이터 조건 준수
- **Naver Search**: **discovery only**, DB 저장 금지 (CHECK constraint enforced)
- **Daum 실시간 트렌드**: 공식 API 전까지 자동 스크래핑 금지
- **역할**: RSS 기반 이슈가 "실제로 급상승 중인가"를 외부 시그널로 교차 검증

#### 3차: 제품 내부 신호 — **v1.5 1급 승격**
- **신호 종류**: 조회 (`cluster_viewed`), 공유 (`share_completed`), 저장 (`bookmark_added`), 재방문 (`returning_visit`), 유료 클릭 (`pricing_cta_clicked`), Embed 설치 (`embed_installed`), API 키 요청 (`api_key_requested`)
- **역할**: **PMF·수익 가설 검증의 핵심 데이터 소스**. 외부 데이터의 보조가 아닌 독립 층위
- **중요성**: 3차 신호가 부재하면 1·2차 데이터의 의미 해석 불가. 지금 사용자가 **어떤 이슈에 돈을 내는가**는 3차 데이터에서만 답 가능

### 8.2 데이터 소스별 Harness 보증
- `assert-source-provenance.ts`: 모든 저장된 article에 대해 source 출처 추적 가능 검증
- `assert-no-naver-storage.ts`: Naver Search 결과 저장 경로 차단 (v1.3 유지)
- `assert-tos-whitelist.ts`: tos_confirmed=false 소스에서 ingest 시도 차단 (v1.3 유지)

---

## 9. Feature Specifications

### 9.1 P0w — Widget-shaped Revenue MVP (신규, D0~D7)

**목표**: 실시간 이슈 위젯형 웹 MVP로 **4가지 유료 의향** (B2C Pro / Creator Pro / B2B Lite / API) 초기 검증.

**Exit Criteria**
- 대기자 100명 이상 수집
- 유료 선결제 의향 표시(Preorder CTA 클릭) 20건 이상
- Creator Embed 대기자 10명 이상
- B2B/API 문의 3건 이상
- 7일 내 발견된 치명적 신뢰·법무 이슈 0건

#### F-P0w-1: `/widget` — 스탠드얼론 웹 위젯

**User Story**: 방문자는 로그인 없이 `/widget`에 진입하여 실시간 이슈 Top 5 + 각 이슈의 보도 분포 미니 바를 한 화면에서 본다. 모바일·데스크톱 모두 대응.

**Acceptance Criteria**
```gherkin
Given 방문자가 /widget에 진입했을 때
When 페이지가 1초 내 Server Component로 프리렌더되면
Then Top 5 실시간 이슈 카드가 표시되고
And 각 카드에는: 이슈 제목 + mini Coverage Bar (4색) + 기사 수 + 업데이트 시각
And 카드 클릭 시 /cluster/:id로 이동

Given 방문자가 15분 이상 체류했을 때
When SWR 60초 polling이 새 데이터를 가져오면
Then 부드러운 전환으로 업데이트
And "보도 분포는 최대 60분 지연" 배지가 표시된다 (v1.3 유지)

Given 방문자가 스크롤 하단까지 도달했을 때
When Pro CTA / Creator Embed / B2B 섹션이 등장하면
Then 각각 대기자·문의 폼 링크가 표시된다
```

**구현 범위 엄격 제한**
- 로그인·개인화·다크모드 토글 모두 **P0a 이후**
- 카테고리 탭도 P0a 이후 (P0w는 "전체" 단일 뷰)
- 공유 버튼은 포함 (OG 카드는 P0a 본격 구현, P0w는 기본 OG 메타 태그)

#### F-P0w-2: `/api/v1/widget/top` — 위젯 API (v1.4 계약 유지)

v1.4 섹션 5.6의 Zod 스키마 + 레이턴시 p95 ≤ 300ms 계약 유지. P0w에서 **실제 작동**.

#### F-P0w-3: `/embed/widget.js` — Creator Embed 스크립트

**User Story**: 뉴스레터·블로그·사내 대시보드 운영자는 `<script src="https://tteuniyu.com/embed/widget.js" data-size="medium"></script>` 한 줄로 자신의 사이트에 뜬이유 실시간 이슈 위젯을 삽입한다.

**Acceptance Criteria**
```gherkin
Given 사이트 운영자가 embed.js 스크립트를 삽입했을 때
When 스크립트가 지정된 자리에 iframe 또는 Shadow DOM으로 위젯을 렌더하면
Then 위젯은 호스트 사이트 스타일 영향 없이 뜬이유 디자인 시스템으로 표시되고
And 호스트 사이트 방문자가 위젯 카드 클릭 시 새 탭으로 /cluster/:id 이동
And referrer로 호스트 도메인이 전달되어 Embed Install Rate 추적

Given 스크립트가 100개 이상 도메인에 설치되어 있을 때
When 각 설치는 CDN 캐시로 처리되면
Then 뜬이유 서버 부하 없이 확장 가능하다

Given P0w에서는 무료 무제한 설치 허용
When 설치 시 data-host 속성으로 도메인 추적되면
Then Creator Pro 유료화 시 기존 설치자 우선 혜택 제공 가능
```

**구현 범위 엄격 제한**
- 커스터마이징(색상·크기 조정) V1
- 인증·도메인 화이트리스트 V1
- P0w는 **iframe 단일 템플릿** (Medium 사이즈 고정)

#### F-P0w-4: Pro CTA (Preorder 의향 수집)

**User Story**: `/widget` 페이지 하단 + `/cluster/:id` 상세 하단에 "Pro 출시 알림 받기" CTA를 배치. 클릭 시 간단 폼 (이메일 + "월 6,900원이면 가입 의향이 있습니까?" 5점 척도 + 선택 코멘트).

**Acceptance Criteria**
```gherkin
Given 방문자가 Pro CTA를 클릭했을 때
When 폼이 모달로 열리면
Then 이메일 입력 + 지불 의향 척도 + 선택 코멘트 필드 표시
And 제출 시 waitlist 테이블에 플래그 (waitlist_type='pro_preorder', intent_score 저장)
And Resend 확인 이메일 발송

Given 사용자가 "매우 가능" 또는 "가능" 선택 시
When 지불 의향 점수 ≥ 4로 기록되면
Then Paid Intent Rate 지표에 카운트
```

**범위 제한**
- 실제 결제 시스템 (Toss·Stripe) **P0b 이후**
- 폼은 "선결제 버튼"이 아닌 "알림 + 의향 표시" 수준

#### F-P0w-5: Creator Embed 대기자 폼

**User Story**: `/widget` 하단 별도 섹션에서 "내 블로그·뉴스레터에 뜬이유 위젯을 넣고 싶어요" CTA → 폼 (이메일 + 사이트 URL + 월간 방문자 수 + 관심 분야 + 예상 지불 의향).

#### F-P0w-6: B2B / API 문의 폼

**User Story**: `/widget` 하단 "기업용 API·대시보드 문의" CTA → 폼 (회사명 + 담당자명 + 이메일 + 회사 규모 + 용도).

#### F-P0w-7: 분석 이벤트 체계

**필수 이벤트 (PostHog)**
- `widget_viewed`: /widget 페이지 진입
- `cluster_card_clicked`: 위젯 카드 클릭
- `pricing_cta_clicked`: Pro CTA 클릭
- `pro_preorder_submitted`: Pro 폼 제출
- `creator_waitlist_submitted`: Creator 폼 제출
- `b2b_inquiry_submitted`: B2B 폼 제출
- `embed_installed`: embed.js 로드 (domain 추적)
- `embed_card_clicked`: Embed에서 카드 클릭 (referrer 추적)
- `api_key_requested`: API 문의 제출

**Harness 검증**
- `assert-analytics-events.ts`: 위 이벤트 9종이 모두 코드에서 발화되는지 정적 분석

### 9.2 Sprint 0 Harness (D7~D10, v1.3 T-001~T-002 재사용)

P0w 완료 후 즉시 실행. v1.3의 T-001 Harness Scaffold + T-002 DB Migration + Redaction Contract + **v1.5 추가 하네스 7종**.

### 9.3 P0a — 신뢰 데모 (D10~D24, v1.4 유지)

v1.4 F-P0a-1 ~ F-P0a-8 유지. 단 일정이 D+14에서 D+24로 연장됨 (P0w 7일 + Sprint 0 3일).

### 9.4 P0b — 클로즈드 알파 (D24~D40, v1.4 유지 + 수익 기능 추가)

v1.4 P0b 기능 유지 + v1.5 추가:
- **F-P0b-8 Pro 결제 시스템** (Toss 또는 Stripe Korea): P0w에서 의향 표시한 사용자에게 우선 초대
- **F-P0b-9 Creator Pro 유료 전환**: P0w 대기자 중 30명 이상에게 유료 전환 초대 (월 ₩15,000)
- **F-P0b-10 B2B Lite 첫 계약**: P0w 문의자 중 5건 이상 응대, 1~2건 계약 체결

### 9.5 V0.5 (D40~D100, v1.4 유지 + 수익 다각화)

- **Weekly Report Pack 출시**: 주간 편향 지도 PDF ₩30,000, 뉴스레터·연구자 대상
- **API Access 공식 런칭**: Enterprise pilot 3~5건
- **Blindspot Report**: v1.4 F-P1 유지

### 9.6 V1 (D100~D180, Native Widget 진입 조건부)

#### V1 Native Widget 진입 조건 (섹션 11 참조)
다음 6개 신호 중 **2개 이상 달성** 시에만 iOS Small Widget 착수:
1. 대기자 500명 이상
2. 유료 선결제 20건 이상 (실제 결제 완료)
3. Creator Embed 설치 30개 이상
4. B2B 문의 5건 이상
5. 7일 재방문율 25% 이상
6. 공유 전환율 10% 이상

**진입 조건 미달 시 V1 방향**: Native Widget 미착수, Creator Embed 고도화 + B2B Lite 기능 강화로 피봇.

### 9.7 V2 (D180~D365, v1.4 유지 + 광고 재검토)

v1.4 V2 유지 + 광고 수익 모델 재검토 (방법론 v1 공개·학계 파트너십 확보 후).

---

## 10. Monetization Strategy (v1.5 신규 대섹션)

### 10.1 B2C Pro — 개인 구독

- **가격**: 월 ₩6,900 / 연간 ₩69,000 (17% 할인)
- **Free vs Pro 경계**:
  - Free: 실시간 이슈 Top 10, 보도 분포 바, 기본 공유
  - Pro: 키워드 알림, 개인 Media Diet 분석, Blindspot Report, 히스토리 30일+, 광고 없음
- **타겟**: Persona 1 (이지훈, 스타트업 PM)
- **12개월 목표**: 500명 유료 구독 (MRR ₩3,000,000)
- **P0w 검증**: Preorder Conversion ≥ 4% (방문자 대비)

### 10.2 Creator Pro — 크리에이터 임베드

- **가격**: 월 ₩15,000 ~ ₩29,000 (도메인·방문자 수 기준 tier)
- **Free vs Pro 경계**:
  - Free: Medium 사이즈 단일 embed, tteuniyu 브랜딩 표시
  - Pro: Small/Medium/Large 모든 사이즈, 브랜딩 제거, 주제 필터, 방문자 분석 대시보드
- **타겟**: Persona 5 (김뉴스레터, 1인 크리에이터)
- **12개월 목표**: 50명 유료 (MRR ₩750,000)
- **P0w 검증**: Creator Waitlist 10명 이상 (관심 시그널)

### 10.3 B2B Lite — 중소기업 구독

- **가격**: 월 ₩100,000 (기본 모니터링 대시보드) ~ ₩500,000 (키워드 알림 + 리포트)
- **가치**: 기업 관련 이슈 실시간 모니터링, 경쟁사 보도 분포 추적
- **타겟**: Persona 2 (박수민, 홍보팀 과장)
- **12개월 목표**: 10건 계약 (MRR ₩1,000,000)
- **P0w 검증**: 문의 3건 이상 (의향 시그널)

### 10.4 API Access — 기업·기관 API

- **가격**: 기본 월 ₩500,000 (10,000 req/월) ~ Enterprise 협의
- **가치**: raw 데이터 API로 자체 분석·대시보드 구축
- **타겟**: 금융 IR, 로펌, 미디어 리서치, 학계
- **12개월 목표**: 3~5건 Enterprise pilot
- **P0w 검증**: API 문의 1건 이상

### 10.5 Weekly Report Pack — 주간 리포트 단건

- **가격**: 건당 ₩30,000 (1회 구매) / 월간 정기 ₩20,000
- **가치**: 주간 편향 지도 PDF + 블라인드스팟 분석 + 프레임 변동
- **타겟**: 연구자, 교수, 교육 기관, 언론 관련 대학원
- **12개월 목표**: 월 50건 구매 (₩1,500,000)
- **P0w 검증**: V0.5 런칭, P0w에서는 의향 수집만

### 10.6 Harness 검증
- `assert-monetization-claims.ts`: 무료 기능을 Pro 기능으로 오인하게 하는 카피 방지. 모든 Pro CTA는 "출시 예정" 또는 "알림 받기" 명시

---

## 11. Success Metrics (v1.5 — 수익 지표 1급 승격)

### Layer 1 — North Star (기존)
WDDU (Weekly Diverse-Diet Users): MDDI ≥ 0.6 유지 WAU

### Layer 2 — Revenue Metrics (**v1.5 신규, 최상위 가중**)

| 지표 | P0w | P0b | V0.5 | V1 |
|---|---|---|---|---|
| **Paid Intent Rate** (방문자 대비 Pro CTA 클릭) | 4% | 8% | 12% | 15% |
| **Preorder Conversion** (CTA 클릭 중 의향 제출) | 20건 | 100건 | 500건 | 2,000건 |
| **B2B Lead Rate** (방문자 대비 B2B 문의) | 3건 | 10건 | 30건 | 60건 |
| **Embed Install Rate** (Creator 대기자 대비 실제 설치) | — | 30% | 50% | 60% |
| **API Key Request** (누적 문의) | 1건 | 5건 | 15건 | 30건 |
| **Trial to Paid Conversion** (Pro 트라이얼 → 유료 전환) | — | 15% | 25% | 35% |
| **MRR** | ₩0 | ₩500,000 | ₩2,000,000 | ₩6,000,000 |

### Layer 3 — Product Metrics (v1.4 유지, 가중 2위)

### Layer 4 — Mission Metrics (v1.4 유지)

### Native Widget 진입 조건 (섹션 9.6 재확인)
6개 신호 중 **2개 이상 달성** 시에만 iOS Small Widget 착수:
1. 대기자 500명 이상
2. 유료 선결제 20건 이상
3. Creator Embed 설치 30개 이상
4. B2B 문의 5건 이상
5. 7일 재방문율 25% 이상
6. 공유 전환율 10% 이상

---

## 12. Harness Engineering (v1.3 유지 + v1.5 7종 추가)

### 12.1 v1.3 기존 Harness (유지)
- `assert-no-public-sensitive-fields.ts`
- `assert-no-naver-storage.ts`
- `assert-no-image-storage.ts`
- `assert-tos-whitelist.ts`
- `assert-dispute-status-server-only.ts`
- `assert-summary-copy-rate.ts`
- `assert-public-copy-wording.ts`
- `assert-db-grants.sql`

### 12.2 `assert-widget-contract.ts` — **v1.5 신규**
- `/api/v1/widget/top` 응답이 Zod 스키마 엄격 준수 검증
- payload 크기 제한 (Small ≤ 512B, Medium ≤ 2KB, Large ≤ 4KB)
- 민감 필드 (bias_score 등) 절대 미포함
- p95 레이턴시 ≤ 300ms 벤치마크

### 12.3 `assert-source-provenance.ts` — **v1.5 신규**
- 모든 articles 행에 대해 source_id NOT NULL 검증
- sources.tos_confirmed=true AND ingestion_enabled=true 검증
- ingestion_source가 RSS만 통하는지 (Naver Search 금지) 재확인
- 원본 URL이 접근 가능한지 (dead link sampling)

### 12.4 `assert-realtime-naming.ts` — **v1.5 신규**
- 전체 코드베이스 + UI 문자열에서 금지 표현 스캔:
  - "실시간 검색어", "실검", "인기 검색어", "실시간 순위"
  - "Trending Keywords", "Real-time Search", "Hot Search"
- 발견 시 exit 1, 파일 경로 + 라인 번호 출력

### 12.5 `assert-sample-quality-copy.ts` — **v1.5 신규**
- sample_size < 5인 cluster가 UI에 렌더될 때 "표본 부족" 배지 필수
- Coverage Bar 미활성화 또는 회색 처리 필수
- OG 카드 템플릿 B (표본 부족 버전) 적용 여부

### 12.6 `assert-monetization-claims.ts` — **v1.5 신규**
- 무료 기능을 유료처럼 보이게 하는 카피 방지
- Pro CTA 버튼의 라벨은 "알림 받기" / "출시 예정" / "대기자 등록" 중 하나
- 아직 존재하지 않는 기능을 현재형으로 광고하는 카피 금지 (e.g., "실시간 알림 기능" → "실시간 알림 기능 (출시 예정)")

### 12.7 `assert-analytics-events.ts` — **v1.5 신규**
- 9개 필수 이벤트가 모두 코드에서 발화되는지 정적 분석
- posthog.capture() 호출이 각 이벤트에 대해 최소 1회 이상 존재
- 이벤트명 오타 방지 (상수로 관리)

### 12.8 `assert-surface-consistency.ts` — **v1.5 신규**
- 세 표면 (Web / OG / Widget) 간 데이터 일관성 검증
- 동일 cluster_id에 대해 세 표면의 counts가 같은 materialized view에서 유래하는지
- 색상 토큰 (teal/slate/amber/violet)이 세 표면 모두에서 동일 hex 값 사용

### 12.9 CI 통합
`.github/workflows/p0w-harness.yml`:
```yaml
- pnpm harness:all (기존 8종 + 신규 7종 = 15종)
- pnpm eval:summary
- pnpm test
- pnpm test:e2e
```

---

## 13. Non-Functional Requirements (v1.4 유지 + 수익 시스템 보안)

### 13.1 Performance (v1.4 유지)

### 13.2 Security (v1.4 유지 + v1.5 추가)
- **결제 시스템 보안 (P0b 이후)**: Toss/Stripe 공식 SDK만 사용, PCI-DSS 위임
- **Embed 스크립트 보안**: iframe sandbox, CSP 적용, XSS 방지
- **API Key 관리**: bcrypt 해시 저장, rotation 가능, rate limit per key

### 13.3 Accessibility (v1.4 유지)
### 13.4 Legal Compliance (v1.4 유지 + v1.5 추가)
- **(v1.5 신규) 실시간 검색어 오인 방지**: 카피·SEO·메타 디스크립션 모두 "실시간 이슈"로 고정
- **(v1.5 신규) 수익 관련 표시 의무**: 전자상거래법·표시광고법 준수
- **(v1.5 신규) Embed 스크립트 서비스 약관**: 설치 시 간단 ToS 동의 (V1)

### 13.5 Observability (v1.4 유지 + Revenue 지표 대시보드)
### 13.6 Scalability (v1.4 유지)

---

## 14. Design System & Brand (v1.4 유지)

v1.4 섹션 8.1 ~ 8.5 모두 유지:
- 색상 토큰 (다크모드 디폴트)
- 타이포그래피 (Pretendard + Inter + JetBrains Mono)
- Spacing / Radius / Shadow / Motion
- Breakpoints (360/768/1024/1440/1920)
- Icon System (Lucide React)
- Brand Identity 3후보 매트릭스 (Q-31)
- shadcn/ui 컴포넌트 라이브러리

---

## 15. Release Plan (v1.5 재배치)

### Phase P0w — Widget-shaped Revenue MVP (D0~D7, 2026-04-20 ~ 2026-04-27)

**산출물**
- `/widget` 페이지
- `/api/v1/widget/top` 엔드포인트
- `/embed/widget.js` 스크립트
- Pro CTA 폼 + waitlist 저장
- Creator Embed 대기자 폼
- B2B/API 문의 폼
- PostHog 9개 이벤트 추적
- 기본 OG 메타 태그 (풀 OG 카드는 P0a)

**Exit Criteria**
- [ ] 대기자 100명 이상 (Pro + Creator + B2B 합산)
- [ ] Pro Preorder 의향 20건 이상
- [ ] Creator 대기자 10명 이상
- [ ] B2B/API 문의 3건 이상
- [ ] 치명적 신뢰·법무 이슈 0건
- [ ] 15개 이상 매체 RSS 수집 중 (ToS 확인 완료)

**Go/No-Go**
- **Go**: Sprint 0 Harness로 전환
- **No-Go (지표 절반 미달)**: 제품 전략 재검토. 기능 아닌 포지셔닝·가격·타겟 재설계

### Phase Sprint 0 — Harness (D7~D10, 2026-04-27 ~ 2026-04-30)

v1.3 T-001 Harness Scaffold + T-002 DB Migration + Redaction Contract. **v1.5 신규 하네스 7종 포함**.

### Phase P0a — 신뢰 데모 (D10~D24, 2026-04-30 ~ 2026-05-14)

v1.4 P0a 기능 + v1.4 디자인 시스템 + v1.4 OG 카드 Visual Spec 풀 구현.

### Phase P0b — 클로즈드 알파 (D24~D40, 2026-05-14 ~ 2026-05-30)

v1.4 P0b + 수익 기능 (Pro 결제, Creator Pro 유료 전환, B2B Lite 첫 계약).

### Phase V0.5 — 수익 다각화 (D40~D100, 2026-05-30 ~ 2026-07-29)

- Weekly Report Pack 출시
- API Access 공식 런칭
- Blindspot Report

### Phase V1 — 진입 조건부 Native Widget (D100~D180, 2026-07-29 ~ 2026-09-27)

**진입 조건 재확인** (6개 중 2개 이상):
1. 대기자 500명
2. 유료 선결제 20건
3. Creator Embed 30개
4. B2B 문의 5건
5. 7일 재방문율 25%
6. 공유 전환율 10%

- **조건 충족**: iOS Small Widget 착수 (Swift 학습 + WidgetKit + App Store 심사)
- **조건 미달**: Creator Embed 고도화 + B2B Lite 기능 강화 피봇

### Phase V2 — 확장 (D180~D365, 2026-09-27 ~ 2027-04-18)

v1.4 V2 유지 + 방법론 v1 공개 후 광고 재검토.

---

## 16. Open Questions

### v1.4 Q-1 ~ Q-35 유지

### v1.5 신규

**Q-36: "실시간 이슈" 명칭의 법무·브랜드 리스크**
- 네이버 "실검"·다음 "실시간 트렌드"와의 관계
- 상표권 조사 필요
- 해결 시점: **D+7 법무 자문 결과 반영**

**Q-37: Creator Embed 유료화 가격**
- 월 ₩15,000 기본 vs 도메인·방문자 수 기준 tier
- 경쟁사 (Ground News Embed, Feedly) 벤치마크
- 해결 시점: **V0.5 런칭 전 (D+100)**

**Q-38: Native Widget 착수 기준**
- "6개 중 2개 이상"이 너무 관대한가, 엄격한가
- 가중치 조정 필요성 (예: MRR 10만 원 + 대기자 300명)
- 해결 시점: **P0b Exit 직후 (D+40)**

**Q-39: B2B / API 과금 단위**
- 월 구독 vs 건당 vs 사용량 기반 (tokens·requests)
- Enterprise 협상 방식 (정액 vs 변동)
- 해결 시점: **V0.5 착수 전 (D+40)**

**Q-40: 데이터 소스별 저장·가공 가능 범위**
- Naver Search 약관 최종 확정 (v1.3 Q-24 확장)
- DataLab payload 저장 허용 범위
- BIGKinds 재배포 조건
- 해결 시점: **P0w 기간 중 Naver·BIGKinds 공식 답변 수신 (D+0~D+7)**

---

## 17. Appendix

### 17.1 v1.4 → v1.5 비교 매트릭스

| 영역 | v1.4 | v1.5 | 변화 |
|---|---|---|---|
| 제품 전략 중심 | Native Widget-first | **Widget-shaped Revenue-first** | 패러다임 전환 |
| P0 구조 | P0a (D+14) → P0b (D+30) | **P0w (D+7) → Sprint 0 → P0a → P0b** | 수익 검증 단계 선행 |
| Native Widget 일정 | V1 확정 (D+90) | **진입 조건부** (2/6 신호 필요) | 일정→신호 전환 |
| 수익 섹션 | Pro MRR 단일 | **5종 라인 (B2C/Creator/B2B/API/Report)** | 다각화 |
| Success Metrics | Product 위주 | **Revenue 최상위** (7종 지표) | 가중치 재배치 |
| 데이터 소스 | 2계층 (1차 RSS / 2차 외부) | **3계층 (+ 내부 신호)** | 3차 승격 |
| 용어 체계 | 미정리 | **"실시간 이슈" 통일, "실검" 금지** | 규제·브랜드 방어 |
| Harness | 8종 | **15종 (7종 추가)** | 수익·UX 검증 확장 |
| 광고 수익 | Non-Goal | **V2 이후 재검토** (초기 배제 유지) | 유지 |
| Persona | 4명 | **5명 (김뉴스레터 추가)** | Creator 타겟 명시 |
| JTBD | 3개 | **4개 (JTBD-4 Economic)** | 수익 JTBD 추가 |
| Product Principle | P1~P10 | **P1~P11** (P11 수익 검증 우선) | 원칙 확장 |

### 17.2 v1.5 Sprint 0 체크리스트

- [ ] Q-36~40 결정 또는 정보 수집 시작
- [ ] 법무 자문 1차 결과 (실시간 이슈 명칭·결제·Embed ToS)
- [ ] 15종 Harness 스크립트 동작 검증
- [ ] P0w에서 수집한 대기자·문의 데이터 분석 완료
- [ ] Native Widget 진입 조건 진척도 측정 세팅

### 17.3 Verification v1.5

- [x] 제목 "PRD v1.5 — Widget-shaped Revenue MVP"
- [x] P0w 단계 신설 (D0~D7, 웹/임베드 위젯, 수익 검증)
- [x] "실시간 검색어" 금지 + "실시간 이슈" 통일 (섹션 7)
- [x] 데이터 소스 3계층 재정의 (섹션 8)
- [x] 수익화 5종 라인 (섹션 10)
- [x] Success Metrics 수익 지표 7종 (섹션 11)
- [x] Native Widget 진입 조건 6개 중 2개 이상 (섹션 9.6)
- [x] Harness 7종 추가 (섹션 12.2~12.8)
- [x] Release Plan: P0w → Sprint 0 → P0a → P0b → V0.5 → V1 (섹션 15)
- [x] Open Questions Q-36~40 (섹션 16)
- [x] Native Widget P0w 필수 산출물 제외
- [x] "네이버 실검" 오인 표현 금지 (섹션 7.1)
- [x] 광고 수익 초기 핵심 모델 제외 (섹션 2.4)

**End of PRD v1.5 — 2026-04-20**
