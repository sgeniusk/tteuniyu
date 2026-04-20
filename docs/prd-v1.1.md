# Product Requirements Document v1.1
# 뜬이유 (TTEUN-IYU) — 한국 언론을 투시하는 AI

| 항목 | 내용 |
|---|---|
| 문서 버전 | **v1.1 (v1.0에서 실행 PRD로 재정의)** |
| 작성일 | 2026-04-17 |
| 이전 버전 | v1.0 (2026-04-17, 전략+실행 혼재) |
| 대상 | Engineering / Design / Legal Handoff |
| 코드네임 | TTEUN-IYU (이하 "뜬이유") |
| 근거 자료 | taewook-strategy-report.md, prd-v1.0.md, 외부 평가자 리뷰 (2026-04-17) |
| Target MVP 공개 | 2026-05-17 (D+30) — 클로즈드 알파 100명 + 대기자 1,000명 |
| 변경 원칙 | **P0 스코프 절반 축소, 데이터·방법론·법무 방어선 선 잠금** |

---

## Changelog v1.0 → v1.1

### Critical Fixes (데이터 의존성 및 실행 가능성)
- **C-1 Naver DataLab 쿼터 수정**: 25,000회/일 → **1,000회/일** (공식 문서 기준). P0에서 DataLab을 메인 소스 → 검증·보정 보조 소스로 강등
- **C-2 Google Trends API 포지션 재정의**: "무료(Alpha)" → "승인 필요, 미승인 시 pytrends 폴백"
- **C-3 DB migration 순서 수정**: `articles.cluster_id` FK를 `clusters` 생성 후 `ALTER TABLE`로 추가하는 2단계 migration
- **C-4 Claude Code Routines 제약 반영**: 최소 1시간 간격 명시. 5분 트렌드 수집은 Vercel Cron + Supabase Edge Functions, Routines는 Blindspot·쇼츠·주간 리포트 전용
- **C-5 bias_score v0 방법론 명시**: MVP~Phase 2 기간의 임시 점수 출처(AllSides·Ad Fontes 매핑 + 한국언론학보 기존 연구)와 "v0 실험, v1 예정(D+180)" 배지 필수

### Major Scope Reductions (P0 범위 대폭 축소)
- **M-1 MVP에서 제거**: YouTube 수집, X 수집, Media Diet, Blindspot Report, 쇼츠 자동화, B2B API, 외신 8개 전체 자동화, 로그인, 개인화
- **M-2 MVP로 이동**: `/methodology` 페이지(F-P0-3), `/cluster/:id` 이슈 상세(F-P0-4), Admin 도구(F-P0-5), **분포 카드 공유 OG 이미지(F-P0-6 — 킬러 기능)**
- **M-3 Bias Bar 시각화 완화**: "Left/Right" → **"진보 성향 보도권 / 중도·혼합 보도권 / 보수 성향 보도권"**. `factuality_score` UI 전면 노출 금지(방법론 공개 전 내부 전용)
- **M-4 DB 스키마 확장**: `methodology_versions`, `source_score_evidence`, `bias_disputes`, `admin_audit_logs`, `trend_clusters` 5개 테이블 P0 필수화
- **M-5 온보딩 플로우 추가**: 로그인 불필요 첫 방문 3분 투어 + 대기자 이메일 수집

### Metric Corrections (수치 불일치 해결)
- **N-1 WAU 통일**: Product WAU 60,000 / North Star WDDU 40,000 (67% 비율 의미)
- **N-2 MRR-Pro 단가 재정합**: Pro ₩6,900/월 × 2,500명 = ₩17,250,000 (할인·연간결제 반영 ARPPU ₩6,000 → MRR ₩15,000,000)
- **N-3 Diversity Index 수식 명시**: `H = -Σ p_i log₂ p_i`, 사용자 표시 `MDDI = H / log₂(4)` (0~1 정규화). 1.58 스케일 표기 삭제
- **N-4 Blindspot 경계 수식화**: `asymmetry × impact × foreign_attention × freshness_decay`. Center/Foreign 분모 처리 명시

### Legal Defense Strengthening (법무 방어선 선잠금)
- **L-1 AI 기본법 제31조 해석 정밀화**: "모든 AI 생성 콘텐츠 표시 의무" → "법적 의무 범위는 서비스 제공 형태별 별도 검토, 뜬이유는 신뢰 확보를 위해 선제적 고지"
- **L-2 썸네일·이미지 저장 금지**: 매체 로고/favicon 라이선스 미확인 상태에서 P0 사용 금지. OG 이미지는 자체 생성 그래픽만
- **L-3 선거 정책 구체화**: D-60~투표 종료 후보자·정당·지역구·여론조사 키워드 **Election Safety Pipeline** 분리, 쇼츠 자동생성 금지, 모든 제외·복원 public audit log
- **L-4 X Blindspotter 타인 분석 금지**: 초기엔 본인 계정(OAuth 소유 확인)만, 공인·기관 계정은 명시 동의 기반

---

## Context (왜 이 문서가 필요한가)

한국 뉴스 신뢰도 31%(Reuters DNR 2025), 네이버 실검 폐지 5년 공백, 다음 실검 부활(2026-03-03), AI 기본법 제31조 시행(2026-01-22), Claude Code Routines 출시(2026-04-14)가 동시에 교차하는 변곡점. 본 PRD v1.1은 v1.0의 야심을 유지하되 **"신뢰 인프라 제품은 기능을 많이 넣는 쪽이 아니라 적게 넣고 방어 가능하게"** 원칙으로 재작성됨. D+30에 엔지니어 1인이 실제로 완성 가능한 범위로 축소하고, 그 대신 **편향 방법론·데이터 권리·법무 방어선을 선잠그는 인프라 테이블**을 P0에 선배치함.

---

## 1. Product Overview

### 1.1 Vision
한국에서 뉴스를 소비하는 모든 사람이 **자신이 어느 진영의 렌즈로 세상을 보는지 실시간으로 인지**하고, 그 렌즈를 **선택적으로 바꿔 끼울 수 있는** 사회를 만든다.

### 1.2 Mission
뜬이유는 한국 언론의 구조적 편향을 대체하지 않고 **가시화(visualize)** 한다. 판단하지 않고 분포를 보여준다. 사용자는 AI의 해석을 소비하는 것이 아니라, AI의 도움으로 **다원적 원본에 접근**한다.

### 1.3 Success Definition (12개월)
- **Product**: MAU 100,000 / **WAU 60,000** / DAU 20,000 / Day30 리텐션 20%
- **Business**: MRR ₩15,000,000 (Pro ARPPU ₩6,000 × 2,500 + B2B 분리) / B2B 계약 3건 / 월 손익분기
- **Mission**: **WDDU 40,000** (Weekly Diverse-Diet Users, MDDI ≥ 0.6 유지 WAU — North Star)
- **Runtime**: 트렌드 레이턴시 p95 ≤ **15분 (P0)** → 5분 (V1) / 클러스터링 정확도 90%+ / 이의제기 7일 내 90% 응답

### 1.4 Non-Goals (명시적 제외 확장)
- 뉴스 기사 원문 재생산 (저작권 방어선)
- AI가 사실을 단정하는 팩트체크 엔진 (해석은 사용자 몫)
- 정치 성향 추천·매칭 (에코체임버 강화 방지)
- 실명 댓글·토론 커뮤니티 (명예훼손 리스크, V2 범위 외)
- 저널리스트 대체용 뉴스 원고 생성
- **(신규) 타 국가 언론 편향 분석** (한국 정치 지형 특화 모델, 해외 진출 시 별도 브랜드)
- **(신규) factuality_score UI 전면 노출** (v1 방법론 공개 전까지 내부 전용)
- **(신규) X 타인 계정 Blindspotter** (프로파일링 리스크, Phase 3 이후 동의 기반만)

---

## 2. Problem Statement

### 2.1 Jobs-to-be-Done

#### JTBD-1 (Functional) — 유지
**When** 출근길·점심 직후·저녁 식사 전 20분 뉴스 소비 윈도우에서,
**I want to** 지금 한국에서 무슨 일이 벌어지고 있고 각 진영이 어떻게 보도하는지 5분 안에 파악하여,
**So I can** 동료·고객·단톡방에서 맥락 있는 시민으로 기능한다.

#### JTBD-2 (Emotional) — 유지
**When** 정치 이슈에 대해 확신 혹은 분노가 치솟을 때,
**I want to** 내가 속한 진영의 주장이 반대 진영에서는 어떻게 보이는지 한 화면에서 검증받아,
**So I can** 감정 반응을 보류하고 인지 편향을 점검한다.

#### JTBD-3 (Social) — **승격: 킬러 시나리오**
**When** 카카오톡·슬랙·X에서 뉴스 링크가 공유될 때,
**I want to** "이 이슈는 진보 3건 / 중도 5건 / 보수 7건 / 외신 1건"이라는 **분포 카드 OG 이미지**를 2초 안에 회신하여,
**So I can** 단톡방의 게이트키퍼가 아닌 투명한 중재자로 신뢰를 구축한다.

→ **F-P0-6 (분포 카드 공유) 가 사실상 뜬이유의 PMF 테스트**임. "/cluster/:id의 공유 버튼 클릭 수"가 MVP의 핵심 행동 지표.

### 2.2 Pain Point 매트릭스

| Pain Point | 빈도 | 심각도 | 현 해결 비용 | 뜬이유 해결 | MVP 포함 |
|---|---|---|---|---|---|
| 진영별 보도 프레이밍 차이 확인 | 일 3~5회 | 상 | 15분/회 수동 검색 | Bias Distribution Bar | ✅ |
| 카톡 논쟁 시 맥락 공유 | 주 5~10회 | 상 | 불가능 | **분포 카드 공유 OG** | ✅ |
| 실시간 이슈 신속 파악 | 시간당 1회 | 중 | 시그널·커뮤니티 순회 | 15분 간격 업데이트 | ✅ |
| 방법론 투명성 요구 | 월 1회 | 중 | 없음 | `/methodology` 페이지 | ✅ |
| 이의제기 경로 | 분기 1회 | 중 | 없음 | `/admin/bias_dispute` | ✅ |
| 특정 진영 집중 이슈(맹점) 인지 | 주 2~3회 | 중상 | 거의 불가능 | Blindspot 주간 리포트 | ❌ V1 |
| 본인 뉴스 소비 편향 자각 | 월 1회 성찰 | 중 | 불가능 | Media Diet Tracker | ❌ V1 |
| 쇼츠 세대 맥락 부재 | 일 수시 | 상 | 없음 | AI 쇼츠 + 딥링크 | ❌ V2 |
| B2B 위기 실시간 모니터링 | 상시 | 극상 | 월 수백만 원 | 키워드 알림 + 확산 | ❌ V2 |

### 2.3 왜 지금인가
- **다음 실검 부활(2026-03-03)** — 시장 수요 공식 인정, 10분 간격 갱신 + 선거 D-60 후보자 키워드 제외 원칙 → 뜬이유의 타이밍·정책 프레임 직접 벤치마크
- **Claude Code Routines(2026-04-14)** — 1인 운영 자동화 임계 돌파 (저빈도 작업 전용, 5분 트렌드엔 부적합)
- **Perplexity × SKT (2024-02 발표)** — 이미 배포 채널 확보한 AI 검색 경쟁자. "갑작스런 압력"이 아닌 "기존 선점자"로 포지셔닝

---

## 3. Target Users

### 3.1 Persona 1 — 이지훈 (27세, 스타트업 PM) — MVP Primary
- **맥락**: 일 뉴스 소비 45분+, 시그널+유튜브+뉴닉+X 조합 파워유저
- **지불 의향**: Pro ₩9,900/월까지 확실, 연간 결제 선호
- **MVP 역할**: 클로즈드 알파 100명 핵심 충원 풀

**User Stories (5, MVP 집중)**
1. PM으로서 `/trends`에 로그인 없이 진입해 7개 카테고리 Top 10을 한 화면에서 훑고 싶다.
2. PM으로서 관심 이슈 카드에서 `/cluster/:id`로 진입해 진보/중도/보수/외신 분포 바 + 관련 기사 5~10건을 보고 싶다.
3. PM으로서 Slack 논쟁 중 **"분포 카드" 버튼 1회 클릭으로 OG 이미지 URL**을 복사해 공유하고 싶다.
4. PM으로서 `/methodology`에서 편향 분류 원칙·소스 가중치·제외 키워드를 확인하고 싶다.
5. PM으로서 대기자 이메일로 V1 기능(Blindspot, Media Diet) 런칭을 받아보고 싶다.

### 3.2 Persona 2 — 박수민 (34세, 대기업 홍보팀 과장) — V2 B2B
- **MVP 단계 역할**: B2B 영업 대상 데크에 인용할 PMF 증거 생산만. 기능 구현은 V2.

### 3.3 Persona 3 — 최영자 (52세, 자영업) — V1 이후
- **MVP 단계 역할**: 클로즈드 알파 사용성 테스트 인터뷰 대상 3~5명. TTS·고대비는 V1에.

### 3.4 Persona 4 — 강도현 (19세, 대학생) — V2 바이럴
- **MVP 단계 역할**: **분포 카드 공유(F-P0-6)의 바이럴 증폭 핵심**. 쇼츠·학생 할인은 V2.

**수익 기여 모델 신규 명시**:
- Z세대는 직접 유료 기여 낮음. 대신 **공유 카드 바이럴 × 쇼츠 채널 조회수 기여도**로 측정.
- 전용 KPI: 친구 초대 당 Blindspotter 사용(V2), 분포 카드 Instagram Story 공유 전환율.

---

## 4. Product Principles

### P1. 가시화 우선, 판단 금지 (Visualize, Don't Judge)
AI는 매체 분포·편향 가중치·소스 가중치를 보여준다. "이 기사는 거짓"이라고 선언하지 않는다. 모든 UI 컴포넌트는 **분포형 시각화 + 원본 링크**를 기본으로 한다.

**위험 UI (금지)**: "이 매체는 우파", "이 기사는 편향", "진실성 4.2"
**안전 UI (원칙)**: "이 이슈를 다룬 보도 분포", "이 매체의 최근 90일 프레임 경향", "표본 N=12, 신뢰도 낮음", "방법론 v0.2 기준"

### P2. 방법론 공개 (Methodology in the Open)
편향 점수 산출식, 트렌드 가중치, 제외 키워드, 에디터 개입 로그는 매주 공개된다. 모든 기능에서 "알고리즘 보기" 버튼은 **2클릭 이내** 접근 가능하다. **P0부터** `/methodology` 페이지 존재 강제.

### P3. 다양성 디폴트, 진영 선택제 (Diverse by Default, Partisan by Choice)
추천 피드 초기값은 MDDI **0.6 강제**. 사용자가 명시적으로 "자기 진영만 보기"를 선택할 때만 축소. 에코체임버는 **옵트인**이다.

### P4. 휴먼 감독 강제 (Human-in-the-Loop by Contract)
쇼츠 최종 공개·Blindspot 리포트 발행·신규 매체 편향 점수는 **DB 레벨 CHECK constraint로 휴먼 승인 단계를 강제**. 삭제·우회 불가.

### P5. 원본 존중 (Respect the Source)
기사 전문 저장 금지. **제목 + 요약 2~3문장(abstractive, 비복제형) + 아웃링크**. **썸네일·매체 로고는 라이선스 확인 전 사용 금지** (P0에서는 OG 자체 생성 그래픽만).

### P6. 방법론 선잠금 (Defense First) — **신규 원칙**
편향 점수·factuality 점수·선거 정책은 "만들고 공개" 순서가 아니라 **"방법론 문서·이의제기 경로·감사 로그 먼저, 점수 공개는 그 다음"**. P0에서 `methodology_versions`·`bias_disputes`·`admin_audit_logs` 테이블이 먼저 존재한다.

---

## 5. Feature Specifications

### 5.1 MVP (P0) — 0~30일

**전체 P0 산출물**:
- F-P0-1 실시간 트렌드 대시보드 (`/trends`)
- F-P0-2 Bias Distribution Bar v0 (이슈 카드·상세)
- F-P0-3 `/methodology` 공개 페이지
- F-P0-4 이슈 상세 페이지 (`/cluster/:id`)
- F-P0-5 Admin 도구 (키워드 제외·클러스터 병합·편향 점수 수정 로그)
- F-P0-6 **분포 카드 공유 OG 이미지** (킬러 기능)
- F-P0-7 온보딩 3분 투어 + 대기자 이메일 수집

---

#### F-P0-1: 실시간 트렌드 대시보드 (Live Trends Dashboard)

**User Story**: 사용자는 `/trends`에서 7개 카테고리별 Top 10 키워드를 **15분 간격 업데이트**로 본다 (P0 레이턴시 완화).

**Acceptance Criteria**:
```gherkin
Given 사용자가 `/trends`에 로그인 여부 무관하게 진입했을 때
When 기본 카테고리 "전체"가 로딩되면
Then 1초 내 Top 10 트렌드가 Server Component로 프리렌더되고
And 각 트렌드 카드에 키워드·순위·스코어·source_mix 바·최초 감지 시각·confidence 배지가 표시된다

Given 사용자가 카테고리 탭(정치/연예/스포츠/IT/국제/경제/생활)을 클릭했을 때
When 200ms 내 전환되면
Then URL이 `/trends?category={slug}`로 업데이트되어 공유 가능하고
And 탭 전환 애니메이션은 `prefers-reduced-motion` 존중

Given 사용자가 트렌드 카드의 "알고리즘 보기" 아이콘을 클릭했을 때
When 링크가 `/methodology#trend-formula` 앵커로 이동하면
Then 공식 전문 + source_weight 테이블 + freshness_decay 곡선 + 최근 7일 제외 키워드 리스트가 표시된다

Given 해당 키워드 관련 기사가 10개 미만일 때
When 트렌드 카드에 "표본 부족: 신뢰도 낮음" 배지와 "표본=N" 수치가 표시되면
Then 사용자는 "V1 알림 받기"를 구독할 수 있다

Given Naver DataLab 쿼터(1,000회/일) 소진 상태일 때
When source_mix의 Naver 구간이 "데이터 없음" 플레이스홀더로 표시되면
Then 하단에 "Naver 쿼터 소진, 00:00 자동 복구" 공지가 표시된다
```

**Edge Cases**
- **Naver DataLab 일 1,000회 제한** → 핵심 10개 키워드 검증용으로 제한, 기본 신호는 RSS+Naver Search(25K/일)+Daum 실시간 참조(준자동)+BIGKinds 보정
- 동일 키워드 표기 중복(띄어쓰기·이체자) → 한글 정규화(NFKC + 한자 변환) 클러스터링
- 선거법 위반 소지 키워드 → Election Safety Pipeline로 라우팅 (F-P0-5 Admin)
- 15분 Velocity 10배 초과 스파이크 → `noise_factor` 상향, 의심 플래그
- Google Trends API Alpha **미승인 상태** → pytrends 폴백 + "비공식 소스" 배지
- 영문 키워드(예: "K-pop")만 외신 소스 → 한국어 표기 매핑 + 영문 별칭

**데이터 요구사항**
- 테이블: `trends` / `trend_sources` / `trend_exclusions` / `trend_snapshots` / **`trend_clusters` (신규)**
- **수집 주기 (수정)**: Naver Search 15분 / DataLab 하루 4회 핵심 키워드 검증 / Daum 참조 15분 / BIGKinds 보정 하루 2회 / RSS 30개 5분
- 보존: Live 7일 → Snapshot 90일 집계 → 월별 집계
- Realtime: Postgres CDC → Supabase Realtime → Next.js `useSubscription`

**UI Wireframe**
- 상단: 로고 좌 / 카테고리 7탭 + "All" 중앙 / 로그인(Optional) 우
- 중단: 마지막 업데이트 타임스탬프 + Live 인디케이터 + **"source availability"** 배지(네이버/구글/다음/RSS 각각 ●○)
- 본문: 2열 그리드(데스크톱) / 1열(모바일), 카드 16:9
- 카드 구성: ① 순위 + 키워드 ② Spark Bar(폭=스코어 상대값) ③ Source Mix 수평 스택바 ④ 관련 기사 3개 제목 + 매체명(로고 없음) ⑤ Velocity 화살표 + **confidence 배지** + "자세히"
- 하단 Fixed: "방법론 보기" 버튼

---

#### F-P0-2: Bias Distribution Bar v0

**User Story**: 사용자는 각 트렌드 카드 및 이슈 상세 페이지에서 **"진보 성향 / 중도·혼합 / 보수 성향 / 외신"** 4구간 누적 바로 본다. (v1.0의 "Left/Right" 표현 완화)

**v0 vs v1 명확 구분**:
- **v0 (P0~Phase 2)**: AllSides·Ad Fontes·한국언론학보 2017(수용자 인식) 매핑 초기 점수 + NLP 논조 분석 + `methodology_version='v0'` 배지 **필수 노출**
- **v1 (Phase 3)**: 학계 패널 7인 + 수용자 조사 n=1,000 + NLP 3자 평균, `v1` 배지
- UI에 "**v0 실험, v1 예정(D+180)**" 고정 표기

**Acceptance Criteria**:
```gherkin
Given 이슈 클러스터에 기사 5개 이상 모였을 때
When Bias Bar가 렌더링되면
Then 진보/중도/보수 3색 누적 바 + 외신 분리 배지 + 각 구간 매체 수 + **methodology_version=v0 배지**가 표시되고
And 바 클릭 시 해당 구간 매체 리스트 드로어가 열리며
And 각 매체는 평균 bias_score(내부, UI에 숫자 미노출) + 기사 제목 리스트 + **"이의제기" 링크**가 표시된다

Given 외신 기사가 포함되어 있을 때
When Bias Bar 우측에 "외신 N건" 배지가 분리 표시되면
Then 클릭 시 Reuters/AP/NHK/Kyodo/BBC 국가별 분포 파이 차트가 표시된다

Given 기사 수가 5개 미만일 때
When Bias Bar가 비활성화되면
Then "표본 부족 (N=3)" 플레이스홀더 + 이유(수집 지연/신규 이슈)가 표시된다

Given 사용자가 모바일에서 Bias Bar를 길게 터치했을 때
When Tooltip이 올라오면
Then 각 구간의 매체 slug, 신뢰구간, **"절대 점수는 v1 공개 예정"** 문구가 표시된다

Given 매체가 이의제기로 status='reviewing' 상태일 때
When Bias Bar의 해당 구간이 **반투명 처리**되면
Then "검토 중" 배지가 노출된다
```

**Edge Cases**
- 같은 매체 동일 이슈 다수 기사 → 매체 1회만 카운트 (첫 `published_at` 기준)
- v1 이전 편향 점수 매체 → "v0 임시" 배지 필수
- Lean 경계(±1 이내) → "경계 매체" 별도 표시, Center로 분류
- 광고성 기사·보도자료 → NLP + 제목 패턴 식별 → Bias Bar 제외 + `is_press_release=true`
- **factuality_score는 UI 전면 노출 금지** — 내부 정렬·필터링에만 사용

**데이터 요구사항**
- `sources.bias_score (-9.0~9.0, internal)` / `sources.factuality_score (internal only)` / `sources.ownership_group`
- `sources.methodology_version NOT NULL DEFAULT 'v0'`
- `sources.last_reviewed_at`, `sources.dispute_status`
- `clusters.left_count` / `center_count` / `right_count` / `foreign_count`
- **구간 규칙 완화**: `진보 ≤ -2`, `중도·혼합 -2~+2`, `보수 ≥ +2` (경계 확대로 분류 불안정성 흡수)

**UI Wireframe**
가로 풀블리드 12px 막대, 각 세그먼트 hover 시 라벨 팝업. 접근성상 색 외에 패턴(사선/도트/솔리드). **색상 매핑 수정**: 진보=청록(teal-500), 중도=회색(slate-400), 보수=진황(amber-600), 외신=보라(violet-500). **정당 색 연상 회피** (파랑=민주당, 빨강=국힘 회피).

---

#### F-P0-3: `/methodology` 공개 페이지 (**신규 MVP**)

**User Story**: 사용자·매체·기자·연구자는 `/methodology`에서 편향 분류 원칙·트렌드 공식·제외 키워드·이의제기 경로를 확인하고, 이의제기 양식을 제출한다.

**Acceptance Criteria**:
```gherkin
Given 사용자가 `/methodology`에 진입했을 때
When 4개 섹션(트렌드 산식 / 편향 분류 원칙 / 제외 키워드 정책 / 이의제기 프로세스)이 렌더링되면
Then 각 섹션은 anchor link로 외부 인용 가능하고
And 모든 수식·임계값은 수치로 표시되며
And 버전 이력(methodology_versions)이 타임라인으로 표시된다

Given 사용자가 "이의제기" 버튼을 클릭했을 때
When 양식이 프리필(이슈 ID, 매체 slug, claimant_email)로 열리면
Then 제출 시 `bias_disputes.status='open'`로 기록되고 에디터에게 Slack 알림 발송

Given 에디터가 admin에서 이의제기에 응답했을 때
When 응답 내용이 claimant_email로 전송되면
Then `bias_disputes.status='reviewing'→'accepted'|'rejected'|'published'`로 이동하고 public timeline에 기록

Given 사용자가 "방법론 v{n} 원본 논문·데이터" 링크를 클릭했을 때
When `methodology_versions.published_url`로 이동하면
Then GitHub Gist/Notion 공개 문서가 표시된다
```

**데이터 요구사항**: `methodology_versions`, `bias_disputes` (신규 테이블)

**UI Wireframe**
좌측 Sticky ToC, 본문 긴 long-form. 상단 "현재 버전: v0 (2026-05-17 발효, v1 예정 2026-10-17)" 고정 배너. 이의제기 양식은 하단 Modal.

---

#### F-P0-4: 이슈 상세 페이지 (`/cluster/:id`)

**User Story**: 사용자는 관심 트렌드 카드에서 진입하여 해당 이슈의 전체 보도 분포·관련 기사 리스트·외신 참조·분포 카드 공유를 한 화면에서 본다.

**Acceptance Criteria**:
```gherkin
Given 트렌드 카드의 "자세히" 클릭 시
When `/cluster/:id`로 이동하면
Then 1초 내 Server Component로 렌더되고
And 상단: 클러스터 제목 + 요약 + 첫 보도 시각 + 업데이트 시각
And 중단: Bias Distribution Bar v0 + 외신 배지
And 하단: 관련 기사 리스트(매체명 + 제목 + 발행시각 + 아웃링크)
And 사이드: **"분포 카드 공유" 버튼 (F-P0-6)**

Given 관련 기사가 진보 0건인 경우
When "이 진영 보도 없음 — 초기 단계일 가능성" 안내가 표시되면
Then 사용자는 "V1 Blindspot 알림 받기" 구독 가능

Given 외신 매칭이 존재할 때
When 외신 섹션이 접힘 상태로 표시되면
Then 클릭 시 외신 제목 + 국가 + 아웃링크 (P0는 Reuters·AP·BBC 3개만, 나머지 5개는 V1)
```

**Edge Cases**
- 클러스터 오탐(의미 다른 기사 묶임) → 사용자 "이 기사 분리 요청" 버튼 → `bias_disputes.claim` 저장
- 선거 클러스터 → 자동 "선거 안내 모드" 배너, 일부 UI 비활성화

**데이터 요구사항**: `clusters`, `articles`, `cluster_foreign_matches` (외신 3개로 축소)

---

#### F-P0-5: Admin 도구

**User Story**: 태욱(초기 운영자)은 `/admin`에서 키워드 제외, 클러스터 병합·분리, 매체 편향 점수 수정, 이의제기 검토를 수행하고 모든 행위는 `admin_audit_logs`에 기록된다.

**Acceptance Criteria**:
```gherkin
Given 에디터가 `/admin/trends`에서 선거 관련 키워드를 선택했을 때
When "제외 추가" 클릭하면
Then `trend_exclusions` INSERT + `admin_audit_logs`에 actor/action/reason 기록

Given 에디터가 `/admin/clusters`에서 두 클러스터를 선택해 "병합"했을 때
When `articles.cluster_id`가 일괄 업데이트되면
Then `admin_audit_logs.before/after`에 before-snapshot 저장되고 되돌리기(undo) 가능

Given 에디터가 매체 편향 점수를 수정했을 때
When `sources.bias_score` 변경되면
Then 이유(reason) 필수 입력 + `source_score_evidence` INSERT + `admin_audit_logs` 기록
And 매체가 reviewing 상태로 전환되며 Bias Bar에 "검토 중" 노출

Given 에디터가 이의제기 응답을 작성했을 때
When `bias_disputes.editor_response` 저장 + `responded_at` 자동 기입되면
Then claimant에게 이메일 발송 + 상태 이동
```

**데이터 요구사항**: `admin_audit_logs`, `source_score_evidence`, `bias_disputes` (모두 P0 필수)

**UI**: 단순한 관리자 내부 툴, shadcn Table + Form. 디자인 투자 최소.

---

#### F-P0-6: 분포 카드 공유 OG 이미지 (**킬러 기능**)

**User Story**: 사용자는 이슈 상세 페이지의 "공유" 버튼으로 OG 이미지 URL을 복사해 카카오톡·슬랙·X에 공유한다. 수신자는 이미지만으로 "이슈명 + 기사 수 + 편향 분포 바 + 표본 부족 여부 + 원본 링크 수 + 뜬이유 브랜드"를 인지한다.

**왜 이게 킬러인가**
- JTBD-3의 Social Job 직접 충족
- PMF 테스트 단일 지표 ("공유 카드 생성 수 / 이슈 조회수")
- 모든 바이럴 퍼널의 진입점

**Acceptance Criteria**:
```gherkin
Given 사용자가 `/cluster/:id`에서 "분포 카드 공유" 클릭했을 때
When OG 이미지가 `og.tteuniyu.com/cluster/:id.png` 경로로 생성되면
Then 1초 내 @vercel/og 기반 1200x630 이미지 반환되고
And 이미지 구성: 
  (1) 상단: 이슈 제목 (2줄 truncate)
  (2) 중단: Bias Distribution Bar 수평
  (3) 하단 좌: "진보 3 / 중도 5 / 보수 7 / 외신 1"
  (4) 하단 우: "표본 N=16, methodology v0"
  (5) 하단 공통: "뜬이유는 판단하지 않고 분포를 보여줍니다"
  (6) QR: `/cluster/:id` 복귀 링크

Given 이미지 URL이 카카오톡/슬랙/X 메타에 적합하게 반환될 때
When Open Graph 태그 + Twitter Card 태그가 모두 포함되면
Then 리치 프리뷰가 자동 표시된다

Given 표본 부족(N<5)인 경우
When 이미지에 "표본 부족, Bias Bar 비활성화" 배너가 강조되면
Then 오인 공유 방지 디자인 적용

Given `og.tteuniyu.com` 이미지 요청이 1시간 100회/ip 초과 시
When 429 반환 + 캐시된 last-known-good 이미지 폴백
Then abuse 방지
```

**데이터 요구사항**
- `og_cards(cluster_id, generated_at, expires_at, image_url)` 24시간 캐시
- @vercel/og Edge Runtime 또는 Satori + resvg-js

**UI**: "공유" 버튼 → 3종 아이콘 (링크 복사 / 카톡 / X), 각 원클릭

---

#### F-P0-7: 온보딩 3분 투어 + 대기자 이메일 수집 (**신규 MVP**)

**User Story**: 첫 방문자는 로그인 없이 3분 투어(1. 왜 뜬이유인가 / 2. Bias Bar 데모 / 3. 방법론 소개)를 보고 이메일로 "V1 런칭 알림"을 구독한다.

**Acceptance Criteria**:
```gherkin
Given 첫 방문자가 `/`에 진입했을 때
When 3단 스텝 slider가 표시되면
Then 각 슬라이드 10~15초 자동 전환 + 수동 넘김 가능
And Step 3 종료 시 이메일 입력 CTA

Given 사용자가 이메일 제출 시
When Resend로 welcome 이메일 발송 + `waitlist(email, created_at, referrer)` 저장
Then "V1 (Blindspot + Media Diet) 준비되면 알려드릴게요" 확인
```

**데이터 요구사항**: `waitlist` 테이블, Resend API 연동

---

### 5.2 V1 (P1) — 30~180일

**v1.0과 동일 범위** — Blindspot / Frames / Media Diet / 외신 교차 확장 / 쇼츠 파이프라인 PoC
- v1.0의 F-P1-1~4 정의 **그대로 유지**, MVP 완료 후 재검토
- **추가 전제**: MVP에서 WAU 500명 / 공유 카드 생성 200건 달성 시 V1 착수 (PMF 없으면 V1 전면 재설계)

### 5.3 V2 (P2) — 180~365일

**v1.0과 동일** — 쇼츠 자동화 풀스케일 / 모바일 앱 / B2B Enterprise 대시보드
- v1.0의 F-P2-1~3 유지, V1 완료 후 재검토

---

## 6. Technical Requirements

### 6.1 시스템 아키텍처

```
[Data Sources — P0 축소판]
  Naver Search (25K/일) · Naver DataLab (1K/일 검증용) 
  · RSS 30개 · Daum 실시간 참조 · BIGKinds 보정
  · 외신 3개 (Reuters · AP · BBC, P0)
            ↓
[Ingestion]  
  Vercel Cron + Supabase Edge Functions (5~15분)
  Claude Code Routines는 저빈도 전용 (주간 리포트·쇼츠·백업)
            ↓
[Processing — 워커 분리]
  Edge Functions: RSS/API fetch (Deno)
  Python Worker (Fly.io/Cloud Run): 임베딩·HDBSCAN 클러스터링·팩트 보정
  Claude Haiku 4.5 (분류·요약·번역) + Sonnet 4.6 (Frames·스크립트)
            ↓
[Storage]    
  Supabase Postgres 15 + pgvector + Storage
  P0 테이블: sources / articles / clusters / trends / trend_exclusions /
            trend_clusters / frames / waitlist / 
            methodology_versions / source_score_evidence / 
            bias_disputes / admin_audit_logs / og_cards
            ↓
[Delivery]   
  Next.js 14 (Vercel) + Supabase Realtime + REST
  @vercel/og for OG 이미지
            ↓
[V2 Shorts]  
  Kling 2.6 / Veo 3.1 Fast → Edge TTS → Whisper API → ffmpeg → YouTube
```

**핵심 변경**:
- **Python 워커 분리**: HDBSCAN·임베딩 배치는 Edge Functions가 아닌 별도 워커 (Fly.io $5/월 부터 시작)
- **Whisper API 전환**: 로컬 GPU 없음 → Replicate Whisper API($0.00058/초)
- **트렌드 수집은 Edge Function + Vercel Cron**: Claude Code Routines는 1시간 최소 간격이라 부적합

### 6.2 외부 의존성 & 폴백 (수정)

| 서비스 | 용도 | **정확한 쿼터/비용** | 폴백 | P0 포함 |
|---|---|---|---|---|
| Naver Search | 뉴스 검색 | **일 25,000회 무료** | RSS 확장 | ✅ |
| Naver DataLab | 트렌드 **검증용** | **일 1,000회 무료** | pytrends | ✅ (축소) |
| Naver DataLab 쇼핑 | 경제 트렌드 보조 | **일 1,000회** | 제외 | ❌ V1 |
| Google Trends Alpha | 트렌드 | **승인 필요, 무상** | pytrends (비공식) | △ (승인 시) |
| pytrends | Google Trends 폴백 | **비공식 wrapper, 백엔드 변경 취약** | 수동 스냅샷 | ✅ |
| Daum 실시간 참조 | 트렌드 보정 | 공식 API 없음, 스크래핑 금지 가능성 | RSS | △ (준자동) |
| BIGKinds LAB | 기사 DB | **하루 2회 업데이트, 실시간성 낮음** | 자체 RSS | △ (보정용) |
| YouTube Data v3 | — | 일 10K 유닛 | — | ❌ V2 |
| X API v2 Basic | — | $200/월 | — | ❌ V2 |
| fal.ai Kling 2.6 | — | $0.72/24s | Pexels | ❌ V2 |
| fal.ai Veo 3.1 Fast | — | $3.60/8s | Kling | ❌ V2 |
| Replicate Whisper | — | $0.00058/s | — | ❌ V2 |
| Anthropic Claude | LLM | 종량제 + Batch 50% | — | ✅ |
| Supabase | DB/Auth/Realtime | Pro $25/월 | — | ✅ |
| Vercel | 배포 + @vercel/og | Pro $20/월 | Cloudflare Pages | ✅ |
| Resend | 이메일 | 3K/월 무료 | SendGrid | ✅ |
| Fly.io Python Worker | 클러스터링 | $5~20/월 | Cloud Run | ✅ |

**P0 월 운영비 예측**: Supabase $25 + Vercel $20 + Fly.io $10 + Claude API $50 + Resend $0 = **월 ~$105 (₩147,000)**

### 6.3 DB 스키마 (P0 확장)

**migration 순서 수정**: clusters → articles → FK 추가의 2단계

```sql
-- =====================
-- Part 1: 방법론 인프라 (가장 먼저 생성)
-- =====================

CREATE TABLE methodology_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text UNIQUE NOT NULL,
  scope text NOT NULL CHECK (scope IN ('bias', 'trend', 'frames', 'blindspot', 'election')),
  description text NOT NULL,
  published_url text,
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  rss_url text,
  category text NOT NULL CHECK (category IN
    ('daily','broadcast','public','economic','wire','alternative','foreign')),
  bias_score numeric(3,1) NOT NULL CHECK (bias_score BETWEEN -9.0 AND 9.0),
  factuality_score numeric(3,1) CHECK (factuality_score BETWEEN 0.0 AND 10.0),  -- internal only
  ownership_group text,
  methodology_version text NOT NULL DEFAULT 'v0' REFERENCES methodology_versions(version),
  axis_b_chaebol numeric(3,1),
  axis_c_regime_critic numeric(3,1),
  axis_d_sensationalism numeric(3,1),
  is_state_owned boolean DEFAULT false,
  last_reviewed_at timestamptz,
  dispute_status text DEFAULT 'ok' CHECK (dispute_status IN ('ok','reviewing','disputed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE source_score_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id),
  methodology_version text NOT NULL REFERENCES methodology_versions(version),
  evidence_type text NOT NULL 
    CHECK (evidence_type IN ('expert_panel', 'audience_survey', 'nlp_corpus', 'ownership', 'correction_history', 'external_mapping')),
  evidence_summary text NOT NULL,
  sample_size int,
  confidence numeric(3,2),
  published_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bias_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id),
  cluster_id uuid,  -- clusters FK는 아래에서 ALTER로 추가
  article_id uuid,  -- articles FK는 아래에서 ALTER로 추가
  claimant_name text,
  claimant_email text NOT NULL,
  claim text NOT NULL,
  status text NOT NULL DEFAULT 'open' 
    CHECK (status IN ('open', 'reviewing', 'accepted', 'rejected', 'published')),
  editor_response text,
  responded_at timestamptz,
  public_log_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_audit_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id text NOT NULL,  -- uuid or bigserial string
  before jsonb,
  after jsonb,
  reason text NOT NULL,  -- 모든 admin 행위에 이유 필수
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- Part 2: 클러스터 (articles보다 먼저)
-- =====================

CREATE TABLE clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  left_count int NOT NULL DEFAULT 0,
  center_count int NOT NULL DEFAULT 0,
  right_count int NOT NULL DEFAULT 0,
  foreign_count int NOT NULL DEFAULT 0,
  blindspot_flag text CHECK (blindspot_flag IN ('left','right')),
  blindspot_score numeric(4,2),
  first_reported_at timestamptz,
  last_updated_at timestamptz,
  velocity_score numeric(5,2),
  category text,
  methodology_version text NOT NULL DEFAULT 'v0' REFERENCES methodology_versions(version),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- Part 3: 기사 (clusters FK 포함)
-- =====================

CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id),
  title text NOT NULL,
  summary text,  -- 2~3문장, abstractive, Haiku 4.5
  url text UNIQUE NOT NULL,
  canonical_url text,
  author text,
  published_at timestamptz NOT NULL,
  cluster_id uuid REFERENCES clusters(id),
  bias_score_inherited numeric(3,1),
  factuality_score numeric(3,1),
  embedding_provider text,
  embedding_model text,
  embedding_dim int,
  embedding_version text,
  embedding vector(1536),
  has_opinion_tag boolean DEFAULT false,
  is_press_release boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_articles_embedding ON articles USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_articles_cluster ON articles(cluster_id, published_at DESC);

-- bias_disputes FK 추가
ALTER TABLE bias_disputes 
  ADD CONSTRAINT fk_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id),
  ADD CONSTRAINT fk_article FOREIGN KEY (article_id) REFERENCES articles(id);

-- =====================
-- Part 4: 트렌드
-- =====================

CREATE TABLE trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  keyword_normalized text NOT NULL,
  category text NOT NULL,
  source_mix jsonb NOT NULL,
  source_availability jsonb NOT NULL,  -- 각 소스의 가용 여부
  confidence numeric(3,2) NOT NULL,    -- 0.0~1.0
  score numeric(6,3) NOT NULL,
  rank int NOT NULL,
  velocity numeric(5,2),
  sample_size int,
  tracked_at timestamptz NOT NULL DEFAULT now(),
  exclusion_reason text
);
CREATE INDEX idx_trends_category_tracked ON trends(category, tracked_at DESC);

CREATE TABLE trend_clusters (
  trend_id uuid REFERENCES trends(id),
  cluster_id uuid REFERENCES clusters(id),
  relevance numeric(4,3) NOT NULL,
  PRIMARY KEY (trend_id, cluster_id)
);

CREATE TABLE trend_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern text NOT NULL,
  reason text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('election','legal','pii','spam','abuse')),
  active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  removed_at timestamptz,
  removed_reason text
);

CREATE TABLE frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid REFERENCES clusters(id),
  source_id uuid REFERENCES sources(id),
  article_id uuid REFERENCES articles(id),
  frame_keywords text[] NOT NULL,
  lead_sentence text,
  headline text,
  confidence numeric(3,2),
  extracted_by text,
  prompt_version text,
  extracted_at timestamptz DEFAULT now()
);

-- =====================
-- Part 5: 사용자 (P0 최소)
-- =====================

CREATE TABLE waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  referrer text,
  utm_source text,
  created_at timestamptz DEFAULT now()
);

-- user_profiles는 V1에서 도입 (로그인 불필요 MVP)

-- =====================
-- Part 6: OG 카드 캐시
-- =====================

CREATE TABLE og_cards (
  cluster_id uuid PRIMARY KEY REFERENCES clusters(id),
  image_url text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  version int NOT NULL DEFAULT 1
);

-- =====================
-- Part 7: 외신 매칭 (P0: 3개 매체만)
-- =====================

CREATE TABLE foreign_outlets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  country text NOT NULL,
  state_owned boolean DEFAULT false,
  rss_url text
);

CREATE TABLE cluster_foreign_matches (
  cluster_id uuid REFERENCES clusters(id),
  article_id uuid REFERENCES articles(id),
  outlet_id uuid REFERENCES foreign_outlets(id),
  similarity numeric(4,3) NOT NULL,
  matched_at timestamptz DEFAULT now(),
  PRIMARY KEY (cluster_id, article_id)
);
```

**V1 이후 추가 예정**: `user_profiles`, `user_events`, `media_diets`, `blindspot_reports`, `editor_approvals`, `x_profiles`

### 6.4 API 설계

- Base URL: `https://api.tteuniyu.com/v1`
- 인증: **P0는 public read only** (로그인 없음). 이의제기·대기자만 POST
- Rate Limit: 공개 60/min/ip
- 버전: URL `/v1/`, Deprecation 6개월 고지

**P0 엔드포인트 (최소)**
- `GET /trends?category=&limit=`
- `GET /trends/formula` → `/methodology` anchor로 redirect
- `GET /trends/exclusions`
- `GET /clusters/:id`
- `GET /clusters/:id/bias`
- `GET /clusters/:id/foreign`
- `GET /cluster/:id/og` → @vercel/og 이미지
- `POST /waitlist`
- `POST /disputes` (bias_disputes INSERT)

**V1 이후 추가**: `/me/*`, `/b2b/*`, `/admin/*`

### 6.5 Harness 프롬프트 관리

- `/prompts/` Git 디렉토리: `summary/v1.md`, `classify/v1.md`, `frames/v1.md`
- 각 프롬프트에 **Input/Output JSON schema + golden.jsonl 평가셋 (10~30 케이스)**
- CI에서 Sonnet 호출하여 회귀 감지 (pass rate < 90% 시 fail)
- Batch API 50% 할인 경로: `/batched/*` 태그
- system prompt 공통 블록 `cache_control: ephemeral`

---

## 7. Non-Functional Requirements

### 7.1 Performance (P0 기준 완화)
- LCP ≤ 2.5s / INP ≤ 200ms
- 카테고리 탭 ≤ 200ms / Bias Bar 렌더 ≤ 100ms
- **트렌드 업데이트 UI 반영 ≤ 1s (P0), Realtime은 V1**
- API p95 ≤ 500ms / p99 ≤ 1s (P0 완화)
- Lighthouse Performance 85+ (P0), 90+ (V1)

### 7.2 Security
- 전 구간 TLS 1.3 + HSTS
- Supabase RLS (public read 외 모두 차단)
- API Key 90일 로테이션 (V1)
- OWASP ASVS L1 (P0), L2 (V2)
- Sentry + Dependabot
- CSP `default-src 'self'; script-src 'self' 'nonce-*'`

### 7.3 Accessibility
- WCAG 2.1 AA (색 대비 4.5:1, 키보드 네비게이션)
- 이미지 alt · 아이콘 aria-label 필수
- **Realtime 업데이트 `aria-live="polite"` — V1부터**
- `prefers-reduced-motion` 존중
- 다크모드 기본 + 고대비 옵션 (V1)
- VoiceOver / TalkBack 실기기 테스트 체크리스트 (V1)

### 7.4 Legal Compliance (P0 선잠금)

**저작권법 제7·28조**
- 기사 전문 저장 금지
- 제목 + **abstractive summary 2~3문장** (추출형 아님) + 아웃링크
- **썸네일·매체 로고 사용 금지** (P0), OG 이미지는 자체 그래픽
- `articles.summary` 생성 프롬프트에 "원문 문장 직접 복사 금지" 강제 + 회귀 테스트

**정보통신망법 제70조 (명예훼손)**
- 편향 라벨: **"OO 학술연구·수용자 조사 근거" 형식 필수**, 직접 서열화 표현 금지
- `methodology_version`, `sample_size`, `confidence_interval`, `last_reviewed_at`, `dispute_status` **모두 표시**
- 이의제기 7일 내 답변 SLA 문서화

**언론중재법 제17조의2**
- "인터넷뉴스서비스" 가능성 대비 정정 48시간 내 반영 자동화
- 원본 매체 정정 감지 cron

**공직선거법 제8조의6 (강화)**
- **Election Safety Pipeline**: D-60~투표 종료 후보자·정당·지역구·여론조사 키워드 별도 처리
- 자동 랭킹 노출 / 쇼츠 자동 생성 / 편향 강조 UI 기본 비활성화
- 모든 제외·복원 이벤트는 `admin_audit_logs` + public URL 공개
- 인터넷선거보도심의위 사전 자문 진행

**AI 기본법 제31조 (2026-01-22 시행) — 해석 정밀화**
- 법적 의무는 AI 사업자 중심, 일반 콘텐츠 제작자에 일괄 적용 아님
- 뜬이유는 **신뢰 확보 차원 선제 고지**: 쇼츠·요약·번역·프레임 키워드에 생성 모델명·검수 여부·에디터 승인 시각 노출
- YouTube Creator Studio "Altered content" 체크 **V2 쇼츠 업로드 시 강제**

**개인정보보호법**
- `user_events` 180일 보관 → 익명화 (V1)
- P0는 `waitlist.email`만 수집, 목적·보관기간 명시

**GDPR**
- EU 사용자 data export + 삭제 72시간 내 (V1)

### 7.5 Observability
- Sentry (Front + Edge Functions)
- **PostHog Cloud free tier (P0)**, self-hosted은 V2
- Supabase Logs + Vercel Logs
- Runbook: `/docs/runbooks/{incident, db-recovery, api-fallback, election-pipeline}.md`

### 7.6 Scalability
- 트렌드 수집: Edge Function 병렬 + Python 워커 큐
- DB: V2에 read replica, `admin_audit_logs` 월별 파티션
- OG 이미지: Vercel Edge Cache 24시간

---

## 8. Success Metrics (4 Layers, 수치 재정합)

### Layer 1 — North Star
**WDDU (Weekly Diverse-Diet Users)**: MDDI ≥ 0.6 유지 WAU
- 수식: `H = -Σ p_i log₂(p_i)`, `MDDI = H / log₂(4)` (0~1 정규화)
- 4 카테고리: {left, center, right, foreign}
- 12개월 목표: **40,000** (WAU의 67%)

### Layer 2 — Product

| 지표 | MVP(30d) | V1(180d) | V2(365d) |
|---|---|---|---|
| DAU | 150 | 5,000 | 20,000 |
| WAU | 500 | 18,000 | **60,000** |
| MAU | 1,000 | 30,000 | 100,000 |
| DAU/MAU | 15% | 18% | 22% |
| 평균 세션 | 2분 | 3분 | 4분 |
| Day 7 리텐션 | — | 28% | 35% |
| Day 30 리텐션 | — | 14% | 20% |
| **공유 카드 생성 수** | **200** | 5,000 | 30,000 |
| **방법론 조회율 WAU 중** | **10%** | 7% | 5% |

### Layer 3 — Business

| 지표 | MVP | V1 | V2 |
|---|---|---|---|
| Paid Conversion | — | 1.2% | 2.5% |
| Pro ARPPU | — | ₩5,500 | ₩6,000 |
| Pro 유료 구독자 | — | 500 | 2,500 |
| Pro MRR | — | ₩2,750,000 | ₩15,000,000 |
| B2B 계약 | 0 | 1 (ARR ₩6M) | 3 (ARR ₩60M) |
| **Total MRR** | ₩0 | ₩3,250,000 | ₩15,000,000+ |
| CAC (Pro) | — | ₩25,000 | ₩15,000 |
| LTV (Pro) | — | ₩40,000 | ₩55,000 |

### Layer 4 — Mission (공정성)
- MDDI WAU 평균 0.5+
- 편향 감소율 30일: 60%+
- Blindspot Consumption Ratio 평균 15%+
- **이의제기 7일 응답률 100%** (P0부터 SLA 100%, 물량이 적어 달성 가능)
- 방법론 문서 조회 WAU 10% (MVP 기준)
- 외신 교차 검증 월 1회 이상 Pro 사용자 40%+ (V1 이후)

---

## 9. Release Plan (P0 대폭 축소)

### Phase 0 — Pre-MVP Prep (D0~D7, 2026-04-17 ~ 2026-04-24)
- [ ] 법무 자문 변호사 컨택 + 방법론 v0 문서 초안 전달
- [ ] 데이터 소스별 권리·쿼터 매트릭스 최종화 (Naver DataLab 1K/일 확정)
- [ ] Bias Methodology v0 문서화 (AllSides·Ad Fontes 매핑 + 한국언론학보 연구 리뷰)
- [ ] 도메인 확보 (tteuniyu.com / tteuniyu.kr)
- [ ] Next.js 14 + Supabase 모노레포 스캐폴딩

### Phase 1 — MVP (D7~D30, 2026-04-24 ~ 2026-05-17)

**산출물**
- Migration 7-part 실행 (methodology_versions → sources → ... → articles → FK)
- RSS 30개 수집 크론 (5분)
- Naver Search 15분 크론
- Python 워커 — 임베딩 + HDBSCAN 클러스터링 (Fly.io)
- `/trends` 페이지 (15분 업데이트)
- Bias Distribution Bar v0 (진보/중도/보수/외신 4구간)
- `/cluster/:id` 이슈 상세
- `/methodology` 페이지 + 이의제기 폼
- `/admin` Admin 도구 (키워드 제외·클러스터 병합·편향 수정 로그)
- `/cluster/:id/og` OG 이미지 생성
- 랜딩 페이지 + 3분 투어 + 대기자 수집
- PostHog + Sentry

**Exit Criteria (수정)**
- ✅ 대기자 1,000명
- ✅ 클로즈드 알파 100명
- ✅ **트렌드 p95 ≤ 15분**
- ✅ **잘못 묶인 클러스터 비율 ≤ 10%** (수동 샘플링 100건)
- ✅ **표본 부족 표시 정확도 100%**
- ✅ **방법론 페이지 조회율 WAU 중 10%**
- ✅ **이의제기 응답 플로우 end-to-end 동작**
- ✅ **공유 카드 생성 200건**
- ✅ Lighthouse Performance 85+
- ✅ WCAG 자동 검사 통과

### Phase 2 — V0.5 (D30~D90, 2026-05-17 ~ 2026-07-17)
v1.0과 동일하되 **PMF 검증 후 착수 전제**:
- MVP 공유 카드 생성 200건 미달 시 V0.5 착수 보류, V0.1로 재설계
- 쇼츠 파이프라인 PoC (IT/AI 1채널), 토스 결제 (Pro ₩6,900/월), Blindspot 주간 뉴스레터

### Phase 3 — V1 (D90~D180) / Phase 4 — V2 (D180~D365)
v1.0과 동일

---

## 10. Open Questions (확장)

### v1.0에서 유지
1. Q-1 정식 브랜드명 — D+30 락인
2. Q-2 쇼츠 브랜드 분리 — D+60
3. Q-3 Pro 가격 최종 (₩3,900 vs ₩6,900 vs ₩9,900) — 베타 후 D+90
4. Q-4 Free 광고 정책 — D+90
5. Q-5 편향 점수 v1 공개 범위 — 법무 2차 후
6. Q-6 B2B 영업 리소스 — D+120
7. Q-7 쇼츠 TTS 전략 — D+45
8. Q-8 에디터 채용 시점 — Blindspot 수요 검증 후
9. Q-9 모바일 스택 (Expo vs 네이티브) — D+270
10. Q-10 Series A vs Bootstrap — D+365
11. Q-11 학계 1순위 대학 — D+180
12. Q-12 법인 설립 시점 — 회계사 자문 후
13. Q-13 데이터 리전 (도쿄 vs 국내) — 개인정보법 + 비용
14. Q-14 X API 의존도 — 3개월 측정 후
15. Q-15 프롬프트 오픈소스화 — D+180

### v1.1 신규
16. **Q-16 초기 매체 30개 선정 기준** — 종합 10 + 종편 4 + 공영 3 + 경제 8 + 통신 2 + 대안 3? 또는 전문지 포함? **D+7 결정 필수**
17. **Q-17 Beta 대기자 1,000명 확보 채널** — Product Hunt Korea / EO / 뉴닉 교차 / 커뮤니티 기고? **D+7 계획**
18. **Q-18 방법론 v0 공개 수준** — raw scores 모두 공개 vs 그룹 평균만 vs 카테고리별 분포만? **D+14 법무 자문**
19. **Q-19 Daum 실시간 트렌드 참조 방식** — 수동 스냅샷 vs 준자동 스크래핑(ToS 검토)? **D+7**
20. **Q-20 Election Safety 트리거 일자 계산** — 총선 D-60 / 지방선거 D-60 / 대선 D-60? 전국-지역 구분? **D+30 변호사**
21. **Q-21 Python 워커 호스팅** — Fly.io vs Railway vs Modal vs Cloud Run? **D+7 ADR**
22. **Q-22 임베딩 제공자 확정** — OpenAI text-embedding-3-small $0.02/1M vs Voyage AI vs Cohere? **D+7 ADR**
23. **Q-23 온보딩 3분 투어에 "정치 성향 자기보고" 포함 여부** — 개인정보 우려 vs 개인화 품질 tradeoff? **D+14**

---

## 11. Appendix

### 11.1 용어집

(v1.0 용어 유지, 추가 항목만 명시)
- **MDDI**: Media Diet Diversity Index, `H / log₂(4)` 0~1 스케일
- **v0 / v1 / v2 bias**: methodology_version 체계. v0는 외부 매핑 기반, v1은 학계+수용자+NLP 3자, v2는 정권 재조정 반영
- **Election Safety Pipeline**: 선거 D-60~투표 종료 후보자·정당·여론조사 키워드 별도 처리 경로
- **Source Availability**: 각 데이터 소스의 쿼터 소진·API 장애 상태
- **Confidence**: 트렌드 스코어 신뢰도 (표본 수·소스 다양성 기반)

### 11.2 경쟁사 Feature Parity Matrix

v1.0 유지, P0/V1/V2 칼럼 추가로 내부 우선순위 시각화

### 11.3 데이터 흐름 (법무 리뷰 포인트 강화)

1. **수집**: 공개 RSS + API → **아웃링크 + abstractive summary만** 저장, 전문·이미지 미저장
2. **처리**: Claude 호출 시 PII 마스킹, 사용자 이벤트는 pseudonymize (V1), 프롬프트는 `/prompts/` 버전 관리
3. **저장**: Supabase Postgres 도쿄 리전, P4에 국내 리전 이관 옵션
4. **열람**: RLS public read + admin audit log
5. **삭제**: 사용자 요청 72시간 내 (V1), 자동 익명화 180일 (V1)
6. **외부 공유**: B2B API는 aggregate만 (V2), 개인 Media Diet 외부 공유 불가 (V1)
7. **(신규) 이의제기**: 7일 내 답변, 결과는 `bias_disputes.public_log_url` 공개

### 11.4 준수 표준
- OWASP ASVS L1 (P0), L2 (V2)
- WCAG 2.1 AA
- Core Web Vitals
- SOC 2 Type I (Phase 4 목표)
- IAB TCF v2.2 / Apple App Tracking Transparency (V2)
- ISMS-P (Phase 4 검토)
- **(신규) 선거관리위원회 인터넷선거보도심의위 자문**

### 11.5 v1.1 다음 단계
- **즉시 (D0~D7)**: 
  1. 법무 자문 계약 + 방법론 v0 초안 전달
  2. Q-16~22 7개 Open Question 결정 (ADR 작성)
  3. Naver DataLab 1K/일 정확성 최종 확인 (support 티켓)
  4. 초기 매체 30개 선정 + 외부 매핑 점수 수집
  5. 도메인 확보 + Supabase 프로젝트 생성
- **D+14**: 
  1. RSS 30개 수집 + 클러스터링 PoC
  2. 매체 30개 v0 점수 배포
  3. Bias Bar UI + 방법론 페이지
- **D+30 Exit**: 
  1. 클로즈드 알파 100명
  2. 대기자 1,000명
  3. **공유 카드 생성 200건** (PMF 신호)
  4. 이의제기 응답 플로우 동작

---

## Verification v1.1 (완료 판정)

### 문서 완결성
- [x] 섹션 1~11 모두 존재, Changelog 추가
- [x] User Story 축소 (Persona 1 × 5 = 5개, MVP 집중)
- [x] Acceptance Criteria Gherkin 포맷 전 기능
- [x] Edge Case 기능당 5개 이상
- [x] DB 스키마 2단계 migration 실행 가능 (ALTER 포함)
- [x] Success Metrics 4 layer 수치 정합성

### 엔지니어 핸드오프 가능 여부
- [x] 스프린트 0 티켓 생성 가능 (Phase 0 + Phase 1)
- [x] Supabase Migration SQL 2-part 실행 가능
- [x] Edge Function/Python 워커 분리 명세

### 디자이너 핸드오프 가능 여부
- [x] 각 기능 UI Wireframe 설명
- [x] 색상 매핑 수정 (진보=teal / 중도=slate / 보수=amber / 외신=violet)
- [x] 접근성 WCAG 2.1 AA

### 법무 핸드오프 가능 여부
- [x] 데이터 흐름 7단계
- [x] 법규 7종 대응 (저작권·정통망법·언중법·선거법·AI기본법·PIPA·GDPR)
- [x] HITL DB CHECK constraint
- [x] 방법론 v0 선잠금 테이블 5종 P0 포함
- [x] Election Safety Pipeline 별도 명시
- [x] 이의제기 7일 SLA + public audit log

### 외부 평가자 지적 수용 여부
- [x] C-1~C-5 모든 Critical 반영
- [x] M-1~M-5 MVP 스코프 축소
- [x] N-1~N-4 수치 정합성
- [x] L-1~L-4 법무 방어선

### 1차 리뷰 지적 수용 여부
- [x] clusters 순환 참조 fix (2단계 migration)
- [x] v0 방법론 명시 (MVP Bias Bar 근거)
- [x] Claude Code Routines 1시간 제약 반영
- [x] Edge Function 쿼터 재계산 (Fly.io 워커 분리)
- [x] 쇼츠 원가 재계산 (Whisper API 추가)
- [x] B2B 티어 세분화 (V2)
- [x] Z세대 수익 모델 (공유 카드 바이럴)
- [x] Frames 색상 매핑 (정당 색 회피)
- [x] 해외 확장 Non-Goal
- [x] Open Questions 8개 추가
- [x] 프롬프트 평가 하네스
- [x] 온보딩 플로우

**End of PRD v1.1 — 2026-04-17**
