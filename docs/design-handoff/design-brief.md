# 뜬이유 — 디자인 외주 메인 브리프

> **목적**: 디자이너가 본 문서 1건만으로 컨셉 3안 + 컴포넌트 라이브러리 작업을 시작할 수 있도록 자가완결 작성
> **작성일**: 2026-05-09 (P0w D7+1)
> **작성자**: 김태욱 (Founder)
> **참조**: PRD v1.7 (590줄) + v1.7.1 patch (318줄) + ADR 10건 (저장소 `docs/`)

---

## 0. 한 페이지 요약 (TL;DR)

- **제품** — 뜬이유 (TTEUN-IYU). "지금 뜨는 이유"를 한 문장으로 알려주는 한국 이슈 리스크 OS
- **사용자 #1** — 콘텐츠 크리에이터 (1인 뉴스레터·유튜버 — 매일 콘텐츠 소재 발굴)
- **사용자 #2** — PR/IR/홍보 실무자 (위기 모니터링)
- **사용자 #3** — 정책·법무·대관·연구자 (이슈 추적)
- **금지** — 정치 좌/우 색 라벨, "실시간 검색어" 표현, 매수/매도 추천 일체
- **시각 키** — 다크 테마 + teal 강조 + 회색 중립 + 빨강(위험)·노랑(주의) 신호
- **수익** — Free + 코인 + Pro $4.99 / Creator $9.99 / Leader $19.99
- **현재 상태** — web 위젯 + 임베드 + 클러스터 디테일 동작 (mock 데이터). 모바일 위젯 V0.5+
- **디자인 산출물** — Figma 컨셉 3안 → 핵심 surface 5건 → 컴포넌트 라이브러리 12-15개

---

## 1. 제품 정체성

### 1.1 브랜드 3-Layer

```
뜬이유 (서비스명, 한글)
  └─ 실시간 이슈 위젯 (진입 feature, Top 10 Coverage Bar 미니)
       └─ Coverage Distribution + AI 분석 (본체, 클러스터 디테일)
```

진입 화면(/widget)은 Top 10 카드 리스트로 가볍게 보여주고, 카드 클릭 시 디테일(/cluster/[id])에서 깊은 분석을 한다.

### 1.2 포지셔닝 (ADR-010)

**아니다**.
- ❌ 뉴스 앱 (네이버·다음 같은 종합 매체 X)
- ❌ 매체 비평 도구 (편향 분석 X)
- ❌ 정치 분류 도구 (좌/우 라벨 X — 완전 폐기)

**맞다**.
- ✅ **이슈 리스크 OS** — 크리에이터·홍보·연구자가 "이 이슈 어떻게 다룰까" 의사결정에 활용
- ✅ **소재 발굴 도구** — "오늘 무엇을 다룰까" 답하는 메인 surface
- ✅ **정정 가능 시스템** — AI 요약 오류는 매체가 1-click으로 정정 요청 가능

### 1.3 톤 & 보이스

| 속성 | 우리는 | 우리는 아니다 |
|---|---|---|
| 신뢰 | 출처를 명시 + 표본 N 노출 + 방법론 공개 | 단정·확신·예측 |
| 중립 | 매체별 보도를 그대로 (회색 dot, 매체명만) | 진영 분류·점수화·우열 비교 |
| 효율 | 한 문장 요약 + 클릭 시 깊이 | 긴 글·과도한 정보·스크롤 압박 |
| 톤 | 차분·실무·간결 (한국어 기본, 영어 부가) | 캐주얼·이모티콘 남발·낚시 |

UI 카피 예.
- ✅ "왜 지금 떴는가" / "매체는 어떻게 다뤘나" / "다음에 볼 신호"
- ❌ "🔥 핫이슈 🔥" / "지금 난리난 뉴스" / "주식 사세요!"

---

## 2. 페르소나 5종 (ADR-010 §3 재배치)

### Persona 1 (1순위) — 김크리에이터 (32세, 1인 뉴스레터·유튜버)

- **JTBD** — 매일 아침 "오늘 다룰 소재 1개 + 어떻게 다룰지 각도 1개"를 5분 안에 결정
- **사용 빈도** — 일 2회 (아침 8시 + 점심 12시)
- **결제 의향** — Creator $9.99 (대기자 폼 4점)
- **중요 surface** — /widget Top 10 + /cluster/[id] (특히 "다음에 볼 신호" 카드 + Trust Tag)
- **디자인 함의** — 카드 grid가 "스캐닝"으로 빠르게 훑을 수 있어야 함 (10개 카드 = 한 화면)

### Persona 2 (2순위) — 박홍보 (38세, 스타트업 PR/IR 팀장)

- **JTBD** — 자사·경쟁사·업계 키워드가 뜨면 즉시 위기 알림 + 매체 분포 파악
- **사용 빈도** — 알림 → 즉시 진입 (Slack 알림 통합 V0.5+)
- **결제 의향** — Leader $19.99 (B2B 5인 시트)
- **중요 surface** — /cluster/[id] (특히 "매체별 보도" + Trust Tag hoax/clickbait)
- **디자인 함의** — 위기성(빨간 hoax 태그) 시각이 즉시 인지되어야 함

### Persona 3 (3순위) — 이연구 (45세, 협회·로펌 대관·법무 실무자)

- **JTBD** — 정책·이슈 시계열 추적 + 외신 비교 + 출처 링크
- **사용 빈도** — 주 2-3회 (이슈 발생 시 깊이 조사)
- **결제 의향** — Leader $19.99 (보고서·외신 액세스 가치)
- **중요 surface** — /cluster/[id] (특히 Timeline + 외신 비교 + 1차 자료 링크)
- **디자인 함의** — 정보 밀도 높음 — 시계열·표·각주 가독성 우선

### Persona 4 (4순위) — 최트레이더 (35세, 투자자·퀀트)

- **JTBD** — 투자 의사결정 보조 (가격 X, 맥락·외신·공시·분석가 의견 요약)
- **사용 빈도** — 일 5-10회 (시장 시간)
- **결제 의향** — Pro $4.99 + 자주 코인 충전
- **중요 surface** — /cluster/[id]/investment (Pro+ 전용 분석 패널)
- **디자인 함의** — "투자 자문 X" 자본시장법 고지가 모든 surface에서 즉시 보여야 함 (회피 불가)

### Persona 5 (5순위) — 취준생/학생 (24세)

- **JTBD** — 시사 면접·논술·리서치 대비 (배경 정리)
- **결제 의향** — Free 위주, 가끔 코인 충전
- **중요 surface** — /widget + /cluster/[id] (entity_card "정체" 카드)
- **디자인 함의** — 무료 사용자도 핵심 가치(entity 정의 + 외신 1건)는 받아야 함 (Pro 게이트는 InvestmentImpactCard만)

---

## 3. JTBD 6종 (Job-To-Be-Done)

| # | JTBD | 차원 | 페르소나 |
|---|---|---|---|
| 1 | "오늘 다룰 소재 1개를 5분 안에 결정하고 싶다" | Functional / Source | Creator |
| 2 | "자사 키워드가 뜨면 즉시 알고 매체 분포 보고 싶다" | Functional / Risk | PR/IR |
| 3 | "정책 이슈의 시계열·외신·1차 자료를 한 화면에서 보고 싶다" | Functional / Research | Researcher |
| 4 | "투자 결정 전 맥락(공시·외신·분석가 의견)을 정리해서 보고 싶다" | Economic / Trader | Trader |
| 5 | "시사 이슈의 배경·정의를 빠르게 파악하고 싶다" | Functional / Discovery | Student |
| 6 | "이슈에 대해 다른 사람과 차이를 만들 인사이트를 가지고 싶다" | Social | Creator + Trader |

---

## 4. 화면(Surface) 인벤토리

### 4.1 Surface 매트릭스

| # | Surface | URL | 우선순위 | 광고 가능 | 모바일 |
|---|---|---|---|---|---|
| S1 | 메인 위젯 | `/widget` | ★★★ | ✅ (5-6위 사이) | 반응형 |
| S2 | 클러스터 디테일 | `/cluster/[id]` | ★★★ | ❌ (P12) | 반응형 |
| S3 | 임베드 iframe | `/embed/iframe?size=small\|medium\|large` | ★★★ | ✅ | 고정 크기 |
| S4 | 랜딩 (홈) | `/` | ★★ | ✅ | 반응형 |
| S5 | Pro 대기자 폼 | `/preorder/pro` | ★★ | ❌ | 반응형 |
| S6 | Creator 대기자 폼 | `/preorder/creator` | ★★ | ❌ | 반응형 |
| S7 | B2B 문의 폼 | `/inquiries/b2b` | ★ | ❌ | 반응형 |
| S8 | 방법론 | `/methodology` | ★ | ❌ (P12) | 반응형 |
| S9 | 이의제기 | `/dispute`, `/cluster/[id]/dispute` | ★ | ❌ (P12) | 반응형 |
| S10 | 외신 비교 | `/outlet-compare` | ★ | ❌ (P12) | 반응형 |
| S11 | OG 카드 (이미지 렌더) | `/cluster/[id]/og` | ★ | ❌ (P12) | 1200×630 고정 |
| S12 | 투자 분석 패널 (Pro+) | `/cluster/[id]/investment` | ★★ (P0a) | ❌ | 반응형 |
| S13 | 코인 충전·잔액 | `/account/coins` (P0b) | ★ | ❌ | 반응형 |
| S14 | 구독 가입·관리 | `/account/subscription` (P0b) | ★ | ❌ | 반응형 |
| S15 | 모바일 iOS 위젯 (Small) | (네이티브) | ★ (V0.5+) | 검토 | 4×4 / 4×8 / 8×8 |

### 4.2 Surface 별 신규 카드 (v1.7 §7 추가)

`/cluster/[id]`에 v1.7부터 4개 신규 카드 합류 예정 (PR #13 이후 코드 합류).

1. **🔍 Frame Clash** — 매체간 단어 차이 (예 "발표" vs "공식 입장" vs "선언")
2. **🕒 Timeline overlay** — 보도·검색·공식발표 한 축 (시간순)
3. **🆕 무엇이 새로워졌나** — 같은 cluster 기존 vs 이번 보도 차이
4. **📅 다음에 볼 신호** — 후속 일정·관련 정책·발표 예정

이 4개는 Creator 페르소나 #1의 핵심 가치 카드. 디자인 우선순위 ★★★.

### 4.3 카드 순서 (PRD v1.6.5 + ADR-009 Amendment 1 + ADR-015)

`/cluster/[id]` 디테일은 다음 순서로 카드 노출.

```
← 돌아가기
[헤더: 카테고리 · 제목 · 표본 N · 갱신시간]
[Trust Tag 슬롯 — hoax/clickbait/low_confidence/investment 1개]
📺 영상 뉴스 (선택, YouTube Lite Embed)
🚀 왜 지금 떴는가 (teal 강조)
📰 매체는 어떻게 다뤘나 (산문, Coverage Bar 없음)
🧠 AI 정밀 분석
  - 정체 (entity_card)
  - 흐름 (trend sparkline)
🔍 Frame Clash (Pro 차별화, P0a 합류)
🕒 Timeline overlay (Pro 차별화, P0a 합류)
🆕 무엇이 새로워졌나
📅 다음에 볼 신호
💰 Investment Impact (해당 시 + Pro+ 게이트)
[매체별 보도 list]
[P12 footer]
```

---

## 5. 디자인 토큰

PRD v1.6 §15 + v1.7.1 patch §7 기준. Tailwind 클래스 매핑 포함.

### 5.1 색상

#### 베이스 (다크 우선)

| 용도 | Token | Hex | Tailwind |
|---|---|---|---|
| 배경 (메인) | `bg-base-950` | `#020617` | `bg-slate-950` |
| 배경 (카드) | `bg-base-900-60` | `#0f172a/60` | `bg-slate-900/60` |
| 보더 | `border-base-800` | `#1e293b` | `border-slate-800` |
| 텍스트 (본문) | `text-base-50` | `#f8fafc` | `text-slate-50` |
| 텍스트 (보조) | `text-base-400` | `#94a3b8` | `text-slate-400` |
| 텍스트 (캡션) | `text-base-500` | `#64748b` | `text-slate-500` |

#### 강조 (Accent)

| 용도 | Token | Hex | Tailwind |
|---|---|---|---|
| 메인 강조 | `accent-teal-500` | `#14b8a6` | `text-teal-500` |
| 강조 배경 | `bg-accent-500-5` | `#14b8a6/05` | `bg-teal-500/5` |
| 강조 보더 | `border-accent-500-30` | `#14b8a6/30` | `border-teal-500/30` |

#### 신호 (Trust Tag — ADR-015 §7.1)

| 용도 | Token | Hex | Tailwind |
|---|---|---|---|
| 위험 (hoax/clickbait) | `--color-trust-hoax` | `#dc2626` | `text-red-600`, `bg-red-600` |
| 주의 (low_confidence) | `--color-trust-low-confidence` | `#f59e0b` | `text-amber-500`, `bg-amber-500` |
| 투자 (investment) | `--color-trust-investment` | `#f59e0b` | `text-amber-500` |
| 매체 dot | `--color-outlet-dot` | `#94a3b8` | `bg-slate-400` |

**중요**.
- 좌/우 정치 색상 (red-blue 분류) **절대 금지** (ADR-009 Amendment 1)
- WCAG AA 명도 대비 4.5:1 이상 강제 (다크 배경 위 빨강·노랑 글씨)
- hoax/clickbait는 헤드라인 색상까지 변경 (red-600), low_confidence는 배지만 (amber-500)

### 5.2 타이포그래피

| 사이즈 | Token | px (mobile / desktop) | Tailwind |
|---|---|---|---|
| display-xl | (랜딩 hero) | 36 / 48 | `text-display-xl` (custom) |
| display-md | (페이지 타이틀) | 28 / 36 | `text-display-md` |
| heading-md | (카드 H2/H3) | 18 / 22 | `text-heading-md` |
| body-md | (본문) | 14 / 16 | `text-body-md` |
| body-sm | (보조) | 12 / 14 | `text-body-sm` |
| mono-md | (수치 강조) | 14 / 16 | `font-mono text-mono-md` |

폰트 패밀리.
- 한글·영문 본문 — **Pretendard** (https://github.com/orioncactus/pretendard)
- 코드·수치 — **JetBrains Mono**
- 보조 (옵션) — Inter (영문 산세리프 fallback)

```
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
font-family: 'JetBrains Mono', 'Menlo', monospace;  /* 수치·코드 */
```

### 5.3 Spacing (Tailwind 기본 + 커스텀)

기본 4-pt grid (`p-1`, `p-2`, `p-3`, `p-4`, `p-5`, `p-6`, `p-8`, `p-10`, `p-12`, `p-14`).

카드 내부 padding 표준.
- 카드 — `p-5` (20px) 기본
- 카드 헤더 — `gap-2` (8px) 아이콘과 텍스트 사이
- 섹션 간격 — `gap-6` (24px) 카드 간

### 5.4 Radius / Shadow / Motion

```css
--radius-sm: 0.375rem;  /* 6px, 작은 배지 */
--radius-md: 0.5rem;    /* 8px, 카드 기본 */
--radius-lg: 0.75rem;   /* 12px, 큰 카드 */

--shadow-card: 0 1px 3px rgba(0,0,0,0.4);  /* 다크 배경에 미세 */
--shadow-elevated: 0 8px 16px rgba(0,0,0,0.6);  /* modal */

--duration-fast: 120ms;     /* hover, focus */
--duration-normal: 200ms;   /* 카드 expand */
--duration-slow: 300ms;     /* modal in/out */
--easing: cubic-bezier(0.4, 0, 0.2, 1);  /* Tailwind 기본 ease */
```

### 5.5 좌·우 균형 (그리드)

기본 max-width — `max-w-3xl` (768px) 또는 `max-w-4xl` (896px) 중심 정렬.
임베드 iframe은 size별 고정.

| size | width × height | 용도 |
|---|---|---|
| small | 320 × 480 | 사이드바 위젯 |
| medium | 480 × 600 | 본문 임베드 |
| large | 720 × 800 | 풀와이드 임베드 |

---

## 6. 컴포넌트 라이브러리

디자이너가 만들 컴포넌트 12-15개. **★** = 비협상 제약 있음 (코드 검증 필요).

### 6.1 신호·태그 (Trust)

#### `<TrustTag tag="hoax|clickbait|low_confidence|investment" />` ★

```
🔴 hoax           "⚠ 검증되지 않은 정보"        red-600 배지 + 헤드라인 red-600
🔴 clickbait      "⚠ 낚시성 제목 가능성"        red-600 배지 + 헤드라인 red-600
🟡 low_confidence "⚠ 보도 출처 부족"             amber-500 배지 (헤드라인 그대로)
🟡 investment     "💰 투자 정보"                 amber-500 배지
```

규칙.
- 한 카드에 1개만 노출 (우선순위 hoax > clickbait > low_confidence > investment)
- 위치 — `/widget` 카드 상단, `/cluster/[id]` 헤더, `/embed/iframe` 카드, OG 카드 (V0.5+)
- 모바일 위젯은 배지만 (헤드라인 색상 변경 X — 가독성 유지)
- 광고/제휴 카드 안에 절대 렌더 금지 (P12)

#### `<InvestmentWarning />` ★

Free 사용자가 `category=investment` 클러스터를 볼 때 카드 하단 노란 영역.

```
⚠ 자본시장법상 투자 자문이 아닙니다. 신중히 판단하세요.
[Pro에서 투자 분석 보기 →]  (CTA 버튼)
```

### 6.2 분석 카드 (메인 surface)

#### `<RisingIssuesList limit={10} />` ★

`/widget` 메인. Top 10 카드 grid (모바일 1열, 데스크톱 1열 또는 2열).

각 카드 — [Trust Tag (선택)] · [순위·rank trend ↑/NEW] · 카테고리 · 제목 · 매체 dot N개 (회색) · 시간.

5위와 6위 사이에 `<AdZone>` 1슬롯.

#### `<ClusterDetailHeader cluster={...} />` ★

```
[← 돌아가기]
정치 · 뜬이유 · Issue Risk OS  (uppercase, slate-400)
[제목 — text-display-md]
표본 N=18 · 12분 전 갱신 · methodology v0.4
[Trust Tag (선택, ADR-015)]
[InvestmentWarning (해당 시)]
```

#### `<WhyTrendingCard summary={...} />`

teal 강조 카드. 1-3 문장 요약. 🚀 아이콘.

#### `<CoverageSummaryCard prose={...} />`

산문 카드. 📰 아이콘. **Coverage Bar 없음** (ADR-009로 위젯 surface에서 제거).

#### `<EntityCard entity={...} />`

🪪 아이콘. 정체(definition) + 도메인 사실 4-8개 (label-value-source 3열).

#### `<TrendSparklinePanel trend={...} />`

📈 아이콘. 4 윈도우 (7d/30d/6m/1y) 각 sparkline + 마지막 값 + delta arrow.

#### `<FrameClashCard frames={...} />` (v1.7 신규)

🔍 아이콘. 매체간 단어 차이 비교. 매체 row × 단어 grid.

#### `<TimelineOverlayCard events={...} />` (v1.7 신규)

🕒 아이콘. 시간 축에 보도·검색·공식발표 3 trace overlay.

#### `<WhatsNewCard delta={...} />` (v1.7 신규)

🆕 아이콘. 같은 cluster의 기존 vs 이번 보도 변화점.

#### `<NextSignalsCard signals={...} />` (v1.7 신규)

📅 아이콘. 후속 일정·관련 정책·발표 예정.

#### `<InvestmentImpactCard cluster={...} />` ★ (Pro+ 전용)

💰 아이콘. 다음 4개 항목.
- 관련 종목·자산명 (텍스트만, 종목코드 005930 OK, "거래" 단어 X)
- 외신 비교 (Bloomberg/Reuters/FT 보도 요약 + 출처 링크)
- 공시·발표 요약 (DART/SEC LLM 요약)
- 분석가 의견 요약 (LLM, "추천·매수·매도·예측·전망·목표가" 단어 0건)

카드 하단 필수 고지 — "본 분석은 공개 보도/공시 요약이며, 매매 권유가 아닙니다."

#### `<OutletRow report={...} />` ★

매체 row.
- **dot — slate-400 단일 회색** (4색 분류 절대 금지)
- 매체명 + 시간 + 헤드라인 + 외부 링크 ↗
- 매체군 라벨 텍스트 (보수/진보/중도/공영) **0건**
- 헤드라인 색상은 클러스터 Trust Tag에 따라 (hoax/clickbait → red-600, low_confidence → amber-500)

### 6.3 광고·제휴 (분리 영역)

#### `<AdZone allowed={true|false}>{children}</AdZone>` ★

`useAdZoneVisibility` hook으로 라우트 기반 deny-by-default. 다음 라우트만 ✅.
- ✅ `/`, `/widget`, `/trends`, `/embed/iframe`
- ❌ `/cluster/**`, `/methodology`, `/dispute`, `/outlet-compare`, `/cluster/[id]/og`, `/admin/**` (curation 페이지 제외)

#### `<AffiliateCard product={...} />` ★

ADR-007에 따라 placeholder image (실 product image 저장 X). 텍스트 정보만, `target="_blank"`. 하단 "이 카드는 제휴 링크입니다 (쿠팡 파트너스)" 표기.

#### `<SponsoredCard ad={...} />` (V0.5+)

광고 네트워크 카드. 본 단계에선 디자인만, 구현 X.

### 6.4 폼

#### `<PreorderForm tier="pro|creator|b2b" />`

대기자 폼. 4점 의향 점수(슬라이더 또는 세그먼트), 이메일, 도메인/회사, 사용 케이스.

### 6.5 공통 UI

#### `<Badge color="teal|red|amber|slate" size="sm|md">{text}</Badge>`
#### `<Card variant="default|teal|amber">{children}</Card>`
#### `<CTAButton variant="primary|secondary|coin">{text}</CTAButton>`
#### `<CategoryLabel category={...} />` (정치/사회/경제/국제/IT·과학/문화·스포츠/라이프 7-enum)

---

## 7. 사용자 흐름 (User Flows)

### Flow A — Creator의 아침 5분 (Persona 1, 일 2회)

```
1. 푸시 알림 또는 RSS reader → /widget 진입
2. Top 10 카드 스캐닝 (10초)
3. 흥미로운 카드 1개 클릭 → /cluster/[id]
4. 🚀 왜 지금 떴는가 (10초 정독)
5. 📰 매체는 어떻게 다뤘나 (20초)
6. 📅 다음에 볼 신호 (10초) — 콘텐츠 각도 결정
7. 외신 1-2건 클릭 (별도 탭 열림)
8. 다시 /widget 으로 → 다른 소재 검토 또는 종료

총 5분 안에 1-2개 소재 + 각도 결정.
```

디자인 함의 — 카드 grid 스캐닝 속도 + 디테일 페이지 스크롤 효율 + 외부 링크 명확성.

### Flow B — PR 위기 알림 (Persona 2, 알림 즉시)

```
1. Slack 알림 (V0.5+) "자사 키워드 'XX제약' Trust Tag hoax 부여"
2. 알림 클릭 → /cluster/[id] 직진
3. 🔴 hoax 배지 + 매체 분포 즉시 확인
4. 매체별 보도 list → 어느 매체가 hoax인지 1차 확인
5. 정정 요청 1-click 또는 자체 대응 결정
```

디자인 함의 — hoax 배지가 0.5초 안에 인지 + 매체별 정정 액션 1-click.

### Flow C — Trader 투자 결정 (Persona 4)

```
1. /widget → 투자 관련 클러스터 선택 (예 "연준 금리 동결")
2. /cluster/[id] 진입 → InvestmentWarning (노란 배지) 즉시 보임
3. Free 사용자 — "Pro에서 투자 분석 보기" CTA 클릭 → /pricing 또는 /signup
4. Pro 사용자 — InvestmentImpactCard 표시
   - 관련 종목 텍스트 확인
   - 외신 비교 정독
   - 공시 요약 정독
   - 분석가 의견 정독
   - 카드 하단 자본시장법 고지 항상 보임
5. 본인 판단으로 매매 (서비스 권유 X)
```

디자인 함의 — Free → Pro CTA 명확 + Pro 카드의 4개 항목 정보 밀도 + 자본시장법 고지 회피 불가.

### Flow D — 외부 사이트 임베드 (Creator의 뉴스레터·블로그)

```
1. Creator → /preorder/creator 가입
2. Creator dashboard → embed snippet 발급
   <script src="https://tteuniyu.com/widget.js" data-size="medium"></script>
3. Creator 뉴스레터에 붙여넣기
4. 독자 → 뉴스레터에서 medium iframe (480×600) 표시
5. 독자 → 카드 클릭 시 새 탭 → /cluster/[id]
```

디자인 함의 — 임베드 iframe 3 size 모두 단독 가독성 + 라이트/다크 자동 적응 (V0.5+).

---

## 8. 비협상 제약 (Non-Negotiable 15조)

저장소 `CLAUDE.md` 전체 정독 권장. 디자이너가 알아야 할 핵심.

### 8.1 표현·언어

- **금지** — 좌/우 색상, 매체군 분류 (보수/진보/중도/공영), "실시간 검색어", "stance", "ideology", "낚시", "예측", "추천", "매수", "매도"
- **허용** — "실시간 이슈", "Rising Issues", "지금 뜨는 이유", "Coverage Distribution / 보도 분포", "급상승 이슈"

### 8.2 색·분류

- **매체 dot — slate-400 단일 회색** (4색 분류 절대 X)
- **Trust Tag만 색 — red-600 / amber-500** (그 외 색상 신호 의미 부여 X)
- **정치 카테고리에는 광고·제휴 자동 매칭 X** (수동 큐레이션 OK)

### 8.3 광고 격리 (P12)

- **AdZone family는 Coverage 영역 절대 X** (`/cluster/**`, `/methodology`, `/dispute`, `/outlet-compare`)
- 광고 노출 가능 — `/`, `/widget` (5-6위 사이), `/trends`, `/embed/iframe`만
- 정치·사고·재해·의료 카테고리 클러스터에는 자동 매칭 X

### 8.4 자본시장법 고지

- 모든 InvestmentWarning / InvestmentImpactCard에 **"본 정보는 투자 자문이 아닙니다"** 고지 필수
- Pro 카드 하단 — "본 분석은 공개 보도/공시 요약이며, 매매 권유가 아닙니다"
- 가격·시세·차트·매수/매도 추천 일체 X (V0.5+ ADR-016 별도 발의 후)

### 8.5 데이터 노출

- bias_score, factuality_score, embedding 같은 raw 점수 절대 UI 노출 X (CLAUDE.md rule 4)
- 매체 본문 저장 X — 제목 + URL + 추상 요약(≤ 15% copy)만
- 이미지 URL·썸네일·favicon·매체 로고 P0 단계 표시 X

### 8.6 LLM·AI 표시

- AI 요약 카드 하단에 "AI 자동 분석 결과입니다. 매체에 정정 요청 가능합니다" 고지
- 정정 요청 1-click 폼 카드 어딘가에 (위치는 디자이너 결정)

---

## 9. 인스피레이션 & 안티패턴

### 9.1 영감 (단 표면적 모방 X)

| 서비스 | 빌리고 싶은 점 |
|---|---|
| **Bloomberg Terminal** | 정보 밀도 + 다크 테마 + 키보드 내비게이션 |
| **Notion** | 카드 형태 + 일관된 spacing + 한글 가독성 |
| **Linear** | 부드러운 인터랙션 + 미니멀 + 다크 우선 |
| **Stripe Dashboard** | 데이터 시각화 + sparkline + 차분한 톤 |
| **clien.net 본론 보기** | 헤드라인 본론 토글 (ADR-013, 한국적 UX) |

### 9.2 안티패턴 (절대 X)

- ❌ **네이버 실검 스타일** — 빨간색 순위 + 카운트 표시 + "급상승" 화살표 남발
- ❌ **다음 카카오 뉴스 스타일** — 매체 로고 grid + 색상 분류
- ❌ **카카오톡 채널 스타일** — 캐주얼 이모티콘 + "오늘의 핫이슈"
- ❌ **유튜브 썸네일 클릭베이트** — 큰 글씨 + 빨간 화살표 + 충격 표현
- ❌ **광고 헤비 매체** — 페이지 전체 광고 침투

### 9.3 한국적 디테일

- 한글 폰트 가독성 — Pretendard 강력 권장 (Apple SD Gothic Neo 대비 다크 배경 가독성↑)
- 띄어쓰기 — 한국어 8자 이상 줄바꿈 시 단어 단위 (CSS `word-break: keep-all`)
- 외래어 표기 — KS 표준 ("크리에이터", "이슈", "트렌드" — "Creator", "Issue", "Trend"는 영문 부가만)

---

## 10. 산출물 형식 (디자이너 옵션)

### Option A — Figma만 (개발자가 Tailwind 구현)
- 장점 — 디자이너 친숙
- 단점 — 비협상 컴포넌트(TrustTag, AdZone 등) 검증이 코드 합류 후로 미뤄짐

### Option B — HTML/Tailwind 코드만
- 장점 — 즉시 코드 합류 + harness 검증
- 단점 — 시각 의사결정 단계 느림

### Option C — Figma + 핵심 컴포넌트는 코드 (추천)
- Figma — 컨셉 3안, 화면 5건 디자인, 컴포넌트 라이브러리 비주얼
- 코드 — TrustTag, AdZone, InvestmentImpactCard 등 비협상 컴포넌트만
- 장점 — 시각 + 검증 둘 다
- 단점 — 디자이너가 Tailwind 친숙해야

---

## 11. 마일스톤 (협의)

| 시점 | 산출물 | 검증 방법 |
|---|---|---|
| D+0 | Kick-off 미팅 (1.5h) — 본 브리프 정독 후 | Q&A |
| D+3 | Figma 컨셉 3안 (각 1 화면 — /widget 위주) | 김태욱 1안 선정 + 피드백 |
| D+10 | 핵심 surface 5건 디자인 (Figma) — /widget, /cluster/[id], /embed/iframe, /, /preorder/pro | 시각 일관성·페르소나 적합성 |
| D+17 | 컴포넌트 라이브러리 12-15개 + 비협상 컴포넌트 4-5개 코드 (TrustTag, AdZone, InvestmentImpactCard, OutletRow, ClusterDetailHeader) | harness:no-stance-color + harness:trust-tag-presence 통과 |
| D+24 | 모바일 반응형 검증 + 라이트 테마 토글 (선택) | 320px / 768px / 1024px breakpoint |
| D+31 | 디자인 QA + 손질 (P0a 실 데이터 합류 후) | Persona 시나리오 walkthrough |

---

## 12. 참조 문서 우선순위

디자인 작업 진행 중 의문이 생기면 다음 순서로 read.

1. `docs/design-handoff/README.md` (5분)
2. `docs/design-handoff/design-brief.md` (이 파일, 60분)
3. `docs/design-handoff/surface-checklist.md` (작업 중 참조)
4. `CLAUDE.md` (저장소 루트, 비협상 15조, 30분)
5. `docs/prd-v1.7.md` §7 Feature Specifications + §15 Design System (60분)
6. `docs/prd-v1.7.1-patch.md` (TrustTag·투자 카드 신규, 30분)
7. `docs/adr/ADR-010-positioning-issue-risk-os.md` (포지셔닝 근거, 30분)
8. `docs/adr/ADR-015-trust-signal-and-investment-risk-layer.md` (TrustTag 사양, 30분)
9. 그 외 ADR (필요시)

---

## 13. 질문 채널

- **이메일** — sgeniusk@gmail.com
- **GitHub Issue** — https://github.com/sgeniusk/tteuniyu/issues (private repo 권한 후)
- **답변 SLA** — 24h (KST 평일)

---

**End of Design Brief — 2026-05-09**
