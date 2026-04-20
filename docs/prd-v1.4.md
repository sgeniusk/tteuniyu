# Product Requirements Document v1.4
# 뜬이유 (TTEUN-IYU) — 한국 언론을 투시하는 AI

| 항목 | 내용 |
|---|---|
| 문서 버전 | **v1.4 (Surface Strategy + 디자인 시스템 + 위젯 플랫폼)** |
| 작성일 | 2026-04-20 |
| 이전 버전 | v1.3, v1.2, v1.1, v1.0 (archived) |
| 대상 | Engineering / Design / Codex / Claude Code / Legal Handoff |
| 근거 자료 | prd-v1.3.md + v1.3 거시 검토 세션 (2026-04-18~20) |
| Target MVP 공개 | **P0a: 2026-05-01 / P0b: 2026-05-17 / P1 Widget: V1에서 도입** |
| 변경 원칙 | **하네스는 v1.3에서 잠금. v1.4는 무엇을 만들고 어떻게 보일지에 집중** |

---

## Changelog v1.3 → v1.4

### Strategic Addition: Surface Strategy (가장 큰 변화)

v1.3까지 암묵적으로 "웹 앱"이던 제품이 v1.4에서 **3-surface 전략**으로 재정의됨. 이 변화는 JTBD 완성도·PMF 시그널·경쟁 차별화 3축 모두에 영향을 미침.

- **S-1 세 개의 표면 정의 (섹션 5.5 신규)**:
  - Surface 1 — Web (P0a~P0b 메인): `/trends`, `/cluster/:id`, `/methodology`
  - Surface 2 — Share Artifacts (P0a): OG 공유 카드 (카톡·슬랙·X·인스타)
  - Surface 3 — Widgets (V1 도입, P0a에서 API 준비): iOS/Android/macOS 홈스크린 위젯
- **S-2 위젯 플랫폼 전략 추가**: 한국 뉴스 소비 80%+ 모바일 + 홈스크린 5초 소비 = JTBD-1의 "20분 뉴스 소비 윈도우" 진입점 혁신. 다음 실검 부활과 구조적 차별화
- **S-3 Widget-First API 설계**: P0a의 API를 위젯이 나중에 이식하기 쉽도록 **레이턴시 p95 300ms + 최소 필드 반환** 원칙으로 설계

### Design System Foundation (신규 섹션 8.1)

- **D-1 디자인 시스템 토큰 정의**: 색상·타이포·spacing·radius·shadow·motion 6개 축 토큰화. shadcn/ui 커스터마이징 기반
- **D-2 색상 팔레트 확정**: v1.2의 4색(진보 teal / 중도 slate / 보수 amber / 외신 violet) + 뉴트럴 스케일 + 상태 색상 8단계
- **D-3 타이포그래피 시스템**: Pretendard (한글 본문) + Inter (영문·숫자) + JetBrains Mono (데이터). 5단계 scale
- **D-4 모바일 퍼스트 그리드**: 한국 뉴스 소비 mobile-dominant 반영. breakpoint: 360 / 768 / 1024 / 1440
- **D-5 다크모드 디폴트 확정**: v1.0에서 언급 후 희미해진 다크모드를 **디폴트로 고정**. 라이트 모드는 사용자 선택. 근거: 뉴스 소비 시간대 저녁 비중 + 신뢰 톤의 무채색 기반

### OG Card Visual Specification (신규 섹션 5.2)

PRD v1.3에서 "PMF 킬러 기능"으로 명시된 OG 카드의 **비주얼 명세 공백**을 해소. 카카오톡·슬랙·X 공유 시 뜬이유의 첫 인상을 결정하는 산출물.

- **V-1 레이아웃 템플릿 3종**: 표준(5+ 기사) / 표본부족(N<5) / 블라인드스팟(진영 편중) 케이스별
- **V-2 브랜드 요소 명세**: 로고·"판단하지 않고 분포를 보여줍니다" 카피 위치 고정
- **V-3 동적 요소 위계**: 이슈 제목 1순위 > Coverage Bar 2순위 > 수치 3순위 > 브랜드 4순위
- **V-4 QR 코드 처리**: 우하단 고정, 150px, `/cluster/:id` 딥링크

### Brand Identity Framework (신규 섹션 8.4)

브랜드명은 아직 미결(Q-31 Open)이지만, 결정 프레임과 이원 브랜드 전략을 v1.4에 고정:

- **B-1 한국어 명칭 "뜬이유" 고정**: 한국 시장 MVP~V1까지 이 이름 유지
- **B-2 영문 브랜드 체계 3가지 옵션 매트릭스**: Tteuniyu (한국 오리진 직역) / WIT·Why It Trends (의미 직역) / Prism (미션 은유) — 도메인 확보 가능성이 결정 요인
- **B-3 이원 브랜드 운영 원칙**: 한국 사용자에게 "뜬이유", 외국인·B2B·학계에 영문 브랜드. 법인명은 영문, 서비스 UI는 한글 우선

### P0a 스코프 미세 조정

- **M-1 위젯 API 계약 P0a 포함**: `/api/v1/widget/top` 엔드포인트를 P0a에서 작성 (위젯 앱 자체는 V1). 이유: API 구조가 확정되면 V1에서 Swift·Kotlin 작업만 남음
- **M-2 다크모드 구현 P0a 포함**: 디폴트가 다크모드이므로 P0a에서 토큰화된 디자인 시스템 적용
- **M-3 카테고리 탭 우선순위**: 7개 중 모바일 기본 노출 3개(정치/경제/IT) + 가로 스크롤 + "더보기"로 재조정

### Minor Additions

- **N-1 엔터티 표기 일관성**: 코드·문서·UI 전체에서 브랜드 레이어링 명시 (코드네임: TTEUN-IYU, 서비스명: 뜬이유, 영문 미결)
- **N-2 접근성 다크모드 대비**: WCAG AA 4.5:1을 라이트·다크 양쪽에서 모두 통과

---

## Context (왜 v1.4가 필요한가)

v1.3은 **"안전하게 만들 수 있는 구조"**를 완성했다. 코덱스 하네스 엔지니어링 접근을 통해 AI 에이전트가 실수할 수 있는 경로를 모두 막았다. 그러나 v1.3은 **"어떻게 보일지"와 "어느 플랫폼에서 소비될지"**를 거의 다루지 않았다.

v1.4는 세 가지 공백을 메운다:
1. **Surface Strategy**: 뉴스 소비는 웹뿐만 아니라 홈스크린 위젯, 공유 링크 리치 프리뷰 등 **여러 표면에서 일어난다**. 이 세 표면을 설계 초기부터 일관되게 잡는다
2. **Design System**: 토큰 없이 Claude Design에 의뢰하면 AI 기본값으로 수렴되어 v1.0에서 경계했던 "AI-convergent generic aesthetics"로 귀결된다. 토큰을 먼저 정의한다
3. **OG Card Visual Spec**: PMF 킬러 기능인 OG 카드의 비주얼이 "1200×630 + 바 + 표본 + 브랜드"라는 추상 설명에 머물러 있었다. 실제 레이아웃·타이포·여백·브랜드 요소까지 고정한다

**한 문장 요약**: v1.4는 "뜬이유를 어느 표면에서 어떻게 보여줄지"를 디자인 시스템과 위젯 전략으로 확정한 버전.

---

## 1. Product Overview

### 1.1 Vision
한국에서 뉴스를 소비하는 모든 사람이 **자신이 어느 진영의 렌즈로 세상을 보는지 실시간으로 인지**하고, 그 렌즈를 **선택적으로 바꿔 끼울 수 있는** 사회를 만든다.

### 1.2 Mission
뜬이유는 한국 언론의 구조적 편향을 대체하지 않고 **가시화(visualize)** 한다. 판단하지 않고 분포를 보여준다. 사용자는 AI의 해석을 소비하는 것이 아니라, AI의 도움으로 **다원적 원본에 접근**한다.

### 1.3 Success Definition (12개월)
v1.3 유지.

### 1.4 Non-Goals (v1.4 정리)
v1.3 유지, 단 **다음 항목은 Non-Goal에서 제외 (즉 목표에 포함)**:
- **타 국가 언론 편향 분석** (v1.2 Non-Goal) → **해외 확장 시 별도 브랜드로 검토 가능**으로 완화. 한국 특화 모델은 유지하되, 영문 브랜드 체계(Q-31)를 통해 해외 접근 가능성 열어둠

v1.4 신규 Non-Goal:
- **위젯 네이티브 앱의 P0 포함** — 위젯은 V1, P0a에서는 API 계약만 준비
- **디자인 시스템을 Claude Design 기본값에 위임** — 토큰을 먼저 정의한 후 의뢰

---

## 2. Problem Statement (v1.3 유지 + JTBD 확장)

### 2.1 Jobs-to-be-Done

#### JTBD-1 (Functional) — 위젯 강화
**When** 출근길·점심 직후·저녁 식사 전 20분 뉴스 소비 윈도우에서,
**I want to** 지금 한국에서 무슨 일이 벌어지고 있고 각 진영이 어떻게 보도하는지 **5초 안에** (위젯) 또는 5분 안에 (웹) 파악하여,
**So I can** 동료·고객·단톡방에서 맥락 있는 시민으로 기능한다.

→ **위젯 도입으로 "5분 → 5초" 마찰 감소** 달성 목표

#### JTBD-2 (Emotional) — v1.3 유지

#### JTBD-3 (Social — 킬러) — OG 카드 비주얼 강화
**When** 카카오톡·슬랙·X에서 뉴스 링크가 공유될 때,
**I want to** **시각적으로 신뢰할 수 있는 분포 카드**를 2초 안에 회신하여,
**So I can** 단톡방의 게이트키퍼가 아닌 투명한 중재자로 신뢰를 구축한다.

→ **OG 카드의 시각적 완성도가 JTBD-3 성패 좌우**. v1.4의 섹션 5.2 Visual Spec 결정적

---

## 3. Target Users (v1.3 유지)

---

## 4. Product Principles (v1.4 — 1개 추가)

### P1~P9 (v1.3 유지)

### P10. 표면 일관성 (Surface Consistency) — **신규**
웹·OG·위젯 세 표면이 **동일한 데이터 모델과 언어**를 공유한다. 한 표면에서만 쓰는 특수 용어·색상·지표를 만들지 않는다. Coverage Distribution은 모든 표면에서 같은 이름·같은 4색·같은 해석 기준. 사용자가 웹→OG→위젯을 오가며 인지 비용이 0이어야 함.

---

## 5. Feature Specifications

### 5.1 P0a — 신뢰 데모 (v1.3 유지 + M-1~M-3 조정)

**P0a 산출물 (v1.4)**
- F-P0a-1 RSS 수집 (v1.3 유지)
- F-P0a-2 Python 워커 임베딩 + 클러스터링 (v1.3 유지)
- F-P0a-3 `/trends` 페이지 (v1.3 유지 + **다크모드 디폴트** + **카테고리 탭 3+스크롤 재정렬**)
- F-P0a-4 Coverage Distribution Bar v0 (v1.3 유지 + **디자인 토큰 적용**)
- F-P0a-5 `/cluster/:id` 이슈 상세 (v1.3 유지)
- F-P0a-6 `/methodology` 공개 페이지 (v1.3 유지)
- F-P0a-7 `/cluster/:id/og` OG 이미지 (v1.3 골격 + **v1.4 섹션 5.2 비주얼 명세 확정**)
- F-P0a-8 **위젯 API 계약 (v1.4 신규)**: `/api/v1/widget/top` 스텁 + 계약 테스트

### 5.2 OG Card Visual Specification (신규 섹션)

#### 5.2.1 목적과 측정
- **목적**: 카톡·슬랙·X·인스타에서 링크 공유 시 리치 프리뷰로 "뜬이유 = 판단하지 않는 분포 중재자" 각인
- **PMF 기여**: PRD v1.3 PMF 6단계 퍼널의 3단계(`og_generated`) → 4단계(`share_completed`) 전환율 핵심 지표
- **성공 기준**: og_generated → share_completed 전환율 ≥ 66% (3명 중 2명이 생성 후 실제 공유)

#### 5.2.2 해상도와 안전영역
- **크기**: 1200 × 630 px (OG 표준 + Twitter Large Card 호환)
- **안전영역**: 외곽 64px padding (카톡 프리뷰 clipping 고려)
- **픽셀 밀도**: @1x 렌더링, 모바일 고해상도는 2x 생성 옵션 (P1)

#### 5.2.3 레이아웃 템플릿 3종

**템플릿 A — 표준 (total_articles ≥ 5)**
```
┌──────────────────────────────────────────────────┐
│ [64px padding]                                   │
│                                                  │
│   뜬이유 · Coverage Distribution                 │  ← 32px, slate-400
│                                                  │
│   [이슈 제목 2줄 최대]                           │  ← 56px bold, slate-50
│   [80%까지 사용, 넘치면 ellipsis]                │
│                                                  │
│   ┌───────────┬──────┬────────────┬──────┐     │
│   │progressive│mixed │conservative│foreign│     │  ← 높이 48px
│   │    3      │  5   │     7      │  1    │     │  ← 36px bold 숫자
│   └───────────┴──────┴────────────┴──────┘     │
│                                                  │
│   표본 N=16 · 방법론 v0                          │  ← 24px slate-400
│                                                  │
│                                                  │
│   뜬이유는 판단하지 않고                         │  ← 20px slate-400
│   분포를 보여줍니다                              │  ← 왼쪽 고정
│                                                  │            ┌────┐
│   tteuniyu.com                                   │            │ QR │  ← 150×150
│                                                  │            └────┘
└──────────────────────────────────────────────────┘
```

**템플릿 B — 표본 부족 (total_articles < 5)**
- Coverage Bar 자리에 회색 박스 + "표본 부족 · 초기 감지 단계" 문구
- "분포는 곧 형성됩니다" 안내
- 브랜드 요소는 동일

**템플릿 C — 블라인드스팟 (한쪽 편중 ≥ 85%, 반대 ≤ 5%)**
- Coverage Bar 상단에 경고 배지 "한쪽 진영에 집중된 보도"
- 부족한 진영은 stripe 패턴으로 강조 (색맹 대응)
- "이 관점은 아직 들어오지 않았습니다" 문구

#### 5.2.4 브랜드 요소 명세
- **로고**: 좌상단, 32px. 텍스트 로고 ("뜬이유") + 심볼 (결정 후)
- **슬로건**: "뜬이유는 판단하지 않고 분포를 보여줍니다" — 좌하단 2줄 고정
- **도메인**: 슬로건 아래 16px 간격, `tteuniyu.com` (브랜드 결정 후 확정)
- **QR**: 우하단, 150×150, 배경 흰색, 중앙에 뜬이유 심볼 매입

#### 5.2.5 색상 (다크모드 디폴트)
- **배경**: `#0A0E1A` (slate-950)
- **주 텍스트**: `#F8FAFC` (slate-50)
- **보조 텍스트**: `#94A3B8` (slate-400)
- **Coverage Bar**:
  - progressive: `#14B8A6` (teal-500)
  - mixed: `#94A3B8` (slate-400)
  - conservative: `#D97706` (amber-600)
  - foreign: `#8B5CF6` (violet-500)

#### 5.2.6 타이포그래피
- **제목**: Pretendard Bold 56px / 1.2 line-height
- **섹션 라벨**: Pretendard Medium 32px
- **데이터 숫자**: JetBrains Mono Bold 36px (가독성 + 데이터 톤)
- **메타 텍스트**: Pretendard Regular 24px
- **슬로건**: Pretendard Regular 20px

#### 5.2.7 생성 기술 스택
- **@vercel/og** Edge Runtime
- **Satori** + **resvg-js** for SVG → PNG
- **Pretendard fetch**: Google Fonts or self-hosted
- **캐시**: `og_cards` 테이블, 24시간 TTL
- **레이트리밋**: IP당 100회/시간 (abuse 방지)

#### 5.2.8 접근성
- Alt text 서버 생성: "이슈 '[제목]' — 진보 [N]건, 중도 [N]건, 보수 [N]건, 외신 [N]건 보도. 방법론 v0"
- 색상 외 패턴 구분: Bar 각 구간에 사선·도트·솔리드 패턴 병용

### 5.3 P0b — 클로즈드 알파 (v1.3 유지)

### 5.4 V1 Widget Features (신규 로드맵)

**도입 시점**: P0b Exit 이후 V1 Phase 2 (D+60~D+90)
**전제**: PMF 지표(share_completed ≥ 80, shared_link_opened ≥ 100) 달성

#### F-V1-W1: iOS Widget Suite
- **Small (2×2, 146×146pt)**: Top 1 이슈 + mini Coverage Bar 4단 + 업데이트 시각
- **Medium (4×2, 338×146pt)**: Top 3 이슈 리스트 + 각 mini Coverage Bar
- **Large (4×4, 338×354pt)**: Top 5 이슈 + 풀 Coverage Bar + 방법론 배지
- **Lock Screen (inline / circular)**: 전체 편향 편중도 1글자 ("=" 균형, "↑" 편중)

#### F-V1-W2: Android Widget Suite
- iOS 3-tier 동일 구조
- Material You 동적 색상 지원 (Android 12+)

#### F-V1-W3: macOS Desktop Widget
- iOS Large와 동일 구성, 데스크톱 해상도 대응

#### Widget Common Specifications
- **업데이트 주기**: WidgetKit 15분 (iOS 제약), Android JobScheduler 15분
- **딥링크**: 위젯 탭 → `/cluster/:id` 즉시 이동 → 공유 버튼 노출
- **오프라인 처리**: 마지막 성공 fetch 캐시 표시 + "X분 전 업데이트" 배지
- **백그라운드 예산**: iOS widget budget 준수 (timeline provider 최적화)

### 5.5 Surface Strategy (신규 섹션)

뜬이유는 세 표면에서 동일한 데이터·언어·색상을 공유한다.

#### Surface 1 — Web (P0a~P0b 메인)
- 엔드포인트: `/trends`, `/cluster/:id`, `/methodology`
- 플랫폼: 모바일 웹 + 데스크톱 웹 (mobile-first)
- 역할: 뜬이유의 정식 진입점, 방법론·이의제기·상세 정보 허브
- 디자인: 섹션 8.1 디자인 시스템 토큰 풀 적용

#### Surface 2 — Share Artifacts (P0a)
- 엔드포인트: `/cluster/:id/og` → 1200×630 PNG
- 플랫폼: 카톡 리치 프리뷰, 슬랙 unfurl, X Large Card, 인스타 공유
- 역할: PMF 킬러 기능, 논쟁 맥락에서 뜬이유를 호출하는 "공유 단위"
- 디자인: 섹션 5.2 Visual Spec 엄격 준수

#### Surface 3 — Widgets (V1 도입, P0a에서 API 준비)
- 엔드포인트: `/api/v1/widget/top?size=small|medium|large`
- 플랫폼: iOS WidgetKit, Android AppWidget, macOS Widget
- 역할: 홈스크린 5초 소비, 재방문 트리거, 습관 형성
- 디자인: Surface 1의 미니 버전, 색상·라벨·수치 기준 동일

#### Surface 간 일관성 계약
- **데이터 모델**: 모든 표면이 `ClusterCoverageResponse` Zod 스키마 기반
- **언어**: 모든 표면에서 "보도 분포", "진보 성향 / 중도·혼합 / 보수 성향 / 외신" 고정
- **색상**: 섹션 8.1 디자인 토큰 유일 소스
- **업데이트 주기**: 모든 표면 15분 cadence 기본

### 5.6 Widget API Contract (P0a 포함, F-P0a-8)

#### Endpoint
```
GET /api/v1/widget/top?size=small|medium|large
```

#### Response Schema (Zod)
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
})

export const WidgetMediumResponse = z.object({
  clusters: z.array(WidgetSmallResponse).length(3),
  updated_at: z.string(),
})

export const WidgetLargeResponse = z.object({
  clusters: z.array(WidgetSmallResponse).length(5),
  methodology_version: z.string(),
  overall_diversity_index: z.number().min(0).max(1).nullable(),
  updated_at: z.string(),
})
```

#### Performance Contract
- **p95 레이턴시**: ≤ 300ms (위젯 timeout 엄격)
- **캐싱**: Vercel Edge Cache 15분 + Cache-Control 헤더
- **payload 크기**: Small ≤ 512 bytes, Medium ≤ 2KB, Large ≤ 4KB

#### Harness Check
`harness/checks/assert-widget-contract.ts`:
- Response size 제한 준수 검증
- 민감 필드 미포함 (bias_score 등)
- sample_quality가 insufficient_sample일 때 title에 오해 소지 없는지

---

## 6. Technical Requirements (v1.3 유지 + 위젯 API 추가)

### 6.1 시스템 아키텍처 (v1.4 확장)

```
[Data Sources — v1.3 유지]
            ↓
[Ingestion — v1.3 유지]
            ↓
[Processing — v1.3 유지]
            ↓
[Storage — v1.3 유지]
            ↓
[Delivery Surfaces — v1.4 3-Surface]
  Surface 1: Next.js 14 (Vercel) Web
    - /trends, /cluster/:id, /methodology
    - SWR 60s polling
  Surface 2: @vercel/og Edge
    - /cluster/:id/og (1200×630 PNG)
    - 24시간 캐시 (og_cards 테이블)
  Surface 3: Next.js API (P0a) + Native Apps (V1)
    - /api/v1/widget/top?size=*
    - Vercel Edge Cache 15분
    - V1: iOS WidgetKit, Android AppWidget
```

### 6.2 외부 의존성 (v1.3 유지)

### 6.3 DB 스키마 (v1.3 유지 + V1에 widget 확장 없음 — 기존 테이블 재활용)

### 6.4 API 설계 (v1.3 유지 + 섹션 5.6 Widget API 추가)

### 6.5 Harness 프롬프트 관리 (v1.3 유지)

---

## 7. Non-Functional Requirements (v1.4 — 디자인·접근성 강화)

### 7.1 Performance
v1.3 유지 + 위젯 p95 ≤ 300ms 추가

### 7.2 Security (v1.3 유지)

### 7.3 Accessibility (v1.4 강화)
- v1.3 WCAG 2.1 AA 유지
- **다크모드·라이트모드 양쪽에서 4.5:1 대비** 검증
- **색각 이상 대응**: Coverage Bar 4구간에 색상 외 패턴(사선·도트·솔리드·크로스해치) 병용
- **Screen Reader**: 모든 Coverage Bar에 `aria-label="진보 N건, 중도 N건, 보수 N건, 외신 N건"` 동적 생성
- **위젯 접근성**: iOS VoiceOver · Android TalkBack 테스트 V1에서 필수

### 7.4 Legal Compliance (v1.3 유지 + 위젯 고려)
- **(v1.4 신규) 위젯의 매체 로고 노출**: 위젯 시각성이 높으므로 P5 원칙(매체 로고 사용 금지) 위젯에서도 엄격 준수. 위젯은 매체명 텍스트로만 표시

### 7.5 Observability (v1.3 유지)
### 7.6 Scalability (v1.3 유지)

---

## 8. Design System & Brand (신규 대섹션)

### 8.1 디자인 시스템 토큰

#### 8.1.1 색상 토큰

**다크모드 (디폴트)**
```
Neutral Scale (배경·텍스트)
  slate-950: #0A0E1A   배경 (body)
  slate-900: #0F172A   카드 배경
  slate-800: #1E293B   카드 테두리, 구분선
  slate-700: #334155   disabled 상태
  slate-400: #94A3B8   보조 텍스트
  slate-200: #E2E8F0   inverse 요소
  slate-50:  #F8FAFC   주 텍스트

Coverage Colors (의미 색상)
  teal-500:    #14B8A6   진보 성향 보도권
  slate-400:   #94A3B8   중도·혼합 보도권
  amber-600:   #D97706   보수 성향 보도권
  violet-500:  #8B5CF6   외신

State Colors (상태)
  emerald-500: #10B981   success
  amber-500:   #F59E0B   warning
  rose-500:    #F43F5E   error / 이의제기
  sky-500:     #0EA5E9   info
```

**라이트모드 (선택)**
```
Neutral Scale
  slate-50:  #F8FAFC    배경
  slate-100: #F1F5F9    카드 배경
  slate-200: #E2E8F0    카드 테두리
  slate-400: #94A3B8    disabled
  slate-600: #475569    보조 텍스트
  slate-900: #0F172A    주 텍스트
```

**커버리지 색상은 양쪽 모드에서 동일** (의미 일관성)

#### 8.1.2 타이포그래피

**폰트 패밀리**
- **한글 본문**: Pretendard Variable (400~700)
- **영문·숫자**: Inter Variable (400~700)
- **데이터·코드**: JetBrains Mono (400, 600)

**스케일 (Type Scale)**
```
display-xl:  56px / 1.2   Bold     OG 카드 이슈 제목
display-lg:  40px / 1.2   Bold     히어로 제목
display-md:  32px / 1.25  Bold     페이지 제목
heading-lg:  24px / 1.3   Semibold 섹션 제목
heading-md:  20px / 1.4   Semibold 카드 제목
body-lg:     16px / 1.5   Regular  본문
body-md:     14px / 1.5   Regular  기본 텍스트
body-sm:     12px / 1.4   Regular  메타
mono-md:     14px / 1.4   Regular  데이터
mono-lg:     18px / 1.3   Bold     숫자 강조
```

#### 8.1.3 Spacing Scale (4px 기반)
```
space-1:  4px
space-2:  8px
space-3:  12px
space-4:  16px
space-5:  20px
space-6:  24px
space-8:  32px
space-10: 40px
space-12: 48px
space-16: 64px
space-20: 80px
```

#### 8.1.4 Radius
```
radius-sm: 4px   배지
radius-md: 8px   버튼, 입력
radius-lg: 12px  카드
radius-xl: 16px  모달
radius-full: 9999px  Pill
```

#### 8.1.5 Shadow (다크모드에서 subtle)
```
shadow-sm: 0 1px 2px rgba(0,0,0,0.3)
shadow-md: 0 4px 6px rgba(0,0,0,0.4)
shadow-lg: 0 10px 15px rgba(0,0,0,0.5)
```

#### 8.1.6 Motion
```
duration-fast:     150ms  hover, focus
duration-normal:   250ms  카드 전환
duration-slow:     400ms  페이지 전환
duration-deliberate: 600ms 데이터 업데이트 (SWR 교체)

easing-standard: cubic-bezier(0.4, 0, 0.2, 1)
easing-decelerate: cubic-bezier(0, 0, 0.2, 1)
easing-accelerate: cubic-bezier(0.4, 0, 1, 1)

prefers-reduced-motion: 모든 duration 0ms, opacity 변환만 유지
```

### 8.2 그리드와 브레이크포인트

**브레이크포인트**
```
sm:  360px   (모바일, iPhone SE 대응)
md:  768px   (태블릿 세로)
lg:  1024px  (태블릿 가로, 작은 노트북)
xl:  1440px  (데스크톱)
2xl: 1920px  (대형 디스플레이)
```

**컨테이너 max-width**
- 모바일: 100% - 32px padding
- md~lg: max-width 768px
- xl+: max-width 1280px

**그리드**
- 모바일: 1 column
- md: 2 columns
- lg~xl: 2 columns (트렌드 카드), 3 columns (메서독로지 ToC)

### 8.3 아이콘 시스템

- **아이콘 세트**: Lucide React (일관성, 경량, 오픈소스)
- **크기**: 16 / 20 / 24 / 32px
- **스트로크**: 1.5px (Lucide 기본)
- **커스텀 아이콘**: Coverage Bar 4색 패턴 아이콘 4개 (자체 SVG)

### 8.4 브랜드 아이덴티티 체계

#### 8.4.1 명칭 계층
- **코드네임 (내부)**: TTEUN-IYU
- **한국어 서비스명**: 뜬이유
- **영문 브랜드**: 미결 (Q-31 참조)
- **법인명**: 미결 (법무 자문 후)

#### 8.4.2 브랜드명 3후보 매트릭스 (Q-31)

| 후보 | 의미 | 장점 | 단점 | 권장 시나리오 |
|---|---|---|---|---|
| Tteuniyu | 한국 오리진 직역 | v1.3까지 전체 문서 통일, Non-Goal과 일관 | 해외 발음 불가, B2B 전문성 약 | 한국 내수 집중 |
| WIT (Why It Trends) | 의미 직역 | 외신 인용 용이, B2B 친화, 이중 의미 (위트) | 도메인 경쟁 치열 | 해외 확장 가능성 |
| Prism | 미션 은유 | 제품 철학과 1:1 매칭 | NSA PRISM 연상, 상표권 경쟁 | 은유 중시 |

**결정 프레임**: 도메인 확보 가능성 (`tteuniyu.com` / `wit.news` / `prism.news`) × 해외 확장 의지 × 법무 자문

**결정 시점**: Q-31 D+7 결정 (법무 + 도메인 확인 후)

#### 8.4.3 이원 브랜드 운영
- 한국 UI: "뜬이유" 단독 사용
- 해외·B2B·학계: 영문 브랜드 + "뜬이유" 병기 형식
- 법인: 영문 명칭

#### 8.4.4 로고 시스템 (결정 대기)
- Wordmark: 한글 로고 + 영문 로고 2종
- Symbol: 프리즘·분포·투시 은유 스케치 3종 Claude Design 의뢰 예정
- 최소 크기: 16px (위젯·파비콘), 32px (표준)

### 8.5 컴포넌트 라이브러리

#### 8.5.1 shadcn/ui 기반
- Tailwind CSS + CVA (class-variance-authority)
- 다음 컴포넌트 우선 커스터마이징: Button, Badge, Card, Tabs, Table, Toast
- 뜬이유 전용 컴포넌트: `<CoverageBar>`, `<SampleQualityBadge>`, `<MethodologyBadge>`, `<ShareButton>`, `<DelayBadge>`

#### 8.5.2 Storybook (V1)
- P0는 컴포넌트 수 적어 생략
- V1에서 Storybook 도입 (Chromatic visual regression)

---

## 9. Success Metrics (v1.3 유지 + 위젯 지표 V1 추가)

### Layer 2 Product 지표에 V1 추가
- **Widget Install Rate**: iOS App Store + Android Play 설치 사용자 중 위젯 배치율 (V1 목표 30%)
- **Widget Tap Rate**: 위젯 노출 대비 탭 비율 (V1 목표 5%)
- **Widget → Share Conversion**: 위젯 탭 → OG 공유 전환율 (V1 목표 10%)

### OG 카드 전환율 명시 (P0b Exit)
- **og_generated → share_completed ≥ 66%**: v1.4에서 신규 추가, PMF 지표 보강

---

## 10. Release Plan (v1.3 유지 + V1 Widget Phase 추가)

### Phase 0, 1a, 1b (v1.3 유지)

### Phase 2 — V0.5 (D30~D90)
- v1.3 유지
- **추가**: Widget API 안정화 + iOS Small Widget 개발 시작 (Swift)

### Phase 3 — V1 (D90~D180)
- v1.3 유지 + Widget Suite 론칭:
  - iOS Widget Small/Medium/Large (D120)
  - Android Widget Small/Medium/Large (D150)
  - Lock Screen / macOS Widget (D180)

### Phase 4 — V2 (D180~D365)
- v1.3 유지

---

## 11. Open Questions (v1.3 유지 + 5개 추가)

### v1.3 Q-1~30 유지

### v1.4 신규

31. **Q-31 영문 브랜드명 확정**: Tteuniyu / WIT / Prism 중 선택 — **D+7 결정**. 도메인 확보 가능성 확인 필요
   - 우선 확인 도메인: tteuniyu.com, tteuniyu.kr, wit.news, whyittrends.com, prism.news, tryprism.com
   - 상표권 검색: 한국 특허청 + 미국 USPTO
   - B2B 영업 맥락 시뮬레이션: "삼성전자에 뜬이유 or WIT or Prism을 소개할 때"

32. **Q-32 iOS 위젯 V1 스코프**: Small만 vs Small+Medium vs 풀 suite — 1인 Swift 학습 시간 vs PMF 기여도 tradeoff. **D+90 결정**

33. **Q-33 Pretendard 라이선스**: Google Fonts 경유 vs self-hosted vs 대안 폰트 (Noto Sans KR). **D+7 법무 확인**

34. **Q-34 디자인 시스템 Storybook 도입 시점**: P1 vs V1 — 1인 운영 오버헤드 vs 일관성. **D+60 결정**

35. **Q-35 라이트모드 지원 범위**: 디폴트 다크모드 유지, 라이트모드는 V1 추가 vs P0a 포함. **D+10 결정** (Claude Design 의뢰 전)

---

## 12. Appendix (v1.3 유지 + v1.4 추가 매트릭스)

### 12.1 용어집 (v1.4 추가)
- **Surface**: 사용자가 뜬이유 데이터와 만나는 표면 (Web / OG / Widget)
- **Coverage Color**: 섹션 8.1의 4색 의미 색상 (teal/slate/amber/violet)
- **Design Token**: 디자인 시스템의 원자 단위 (색상·spacing·radius 등)

### 12.2 v1.3 → v1.4 비교 매트릭스

| 영역 | v1.3 | v1.4 | 변화 |
|---|---|---|---|
| Surface 개수 | 암묵적 웹 1개 | 명시적 3개 (Web / OG / Widget) | 전략적 확장 |
| OG 카드 명세 | 추상 1문단 | 비주얼 스펙 섹션 5.2 전체 | 구체화 |
| 디자인 시스템 | 4색 팔레트만 | 토큰 6축 전체 (색·타이포·spacing·radius·shadow·motion) | 시스템화 |
| 다크모드 | 언급만 | 디폴트 고정 + 토큰 두 세트 | 확정 |
| 모바일 우선 | 내재적 | 명시 + 브레이크포인트 5단 | 선언 |
| 위젯 전략 | 없음 | V1 로드맵 + P0a API 계약 | 신설 |
| 브랜드 체계 | 코드네임만 | 3후보 매트릭스 + 결정 프레임 | 구조화 |
| 컴포넌트 라이브러리 | 언급 | shadcn/ui 커스터마이징 범위 명시 | 범위 고정 |

### 12.3 Claude Design 의뢰 준비 체크리스트
- [ ] Q-31 브랜드명 결정
- [ ] Q-33 Pretendard 라이선스 확인
- [ ] Q-35 라이트모드 범위 결정
- [ ] 로고 스케치 3종 레퍼런스 수집
- [ ] OG 카드 비주얼 참조 3종 수집 (Ground News, Apple News, NYT morning)
- [ ] 위젯 참조 3종 수집 (Apple Weather, NYT Today, Reuters)

### 12.4 Verification v1.4

- [x] Surface Strategy 섹션 5.5 완성
- [x] OG 카드 비주얼 명세 섹션 5.2 완성
- [x] 디자인 시스템 토큰 섹션 8.1 완성
- [x] 브랜드 체계 섹션 8.4 완성 (3후보 + 결정 프레임)
- [x] 위젯 API 계약 F-P0a-8 포함
- [x] V1 Widget Suite 로드맵 섹션 5.4 포함
- [x] 다크모드 디폴트 확정
- [x] Q-31~35 Open Questions 추가
- [x] P10 표면 일관성 원칙 추가
- [x] 디자인 시스템 Claude Design 의뢰 체크리스트 포함

**End of PRD v1.4 — 2026-04-20**
