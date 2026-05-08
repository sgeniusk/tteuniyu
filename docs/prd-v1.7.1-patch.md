# PRD v1.7.1 Patch — Trust Signal & Investment Risk Layer

> **Status**: Accepted (2026-05-09, P0w D7+1)
> **Base**: PRD v1.7 (`docs/prd-v1.7.md`)
> **Driving ADR**: ADR-015 Trust Signal & Investment Risk Layer
> **Supporting amendment**: ADR-009 Amendment 1 (이념 라벨 완전 폐기)
> **Decider**: 태욱 (Founder)

---

## 0. 1줄 요약

v1.7 정식 발의 직후 사용자 지시로 추가된 4가지 변경을 단일 patch로 통합한다. 좌/우 색 라벨 완전 폐기 + Trust Tag 3종 (가짜·낚시·근거부족) + Investment Risk 무료 경고/유료 분석 분리.

---

## 1. 변경 요약

| # | 변경 | 영향 영역 |
|---|---|---|
| 1 | 좌/우 매체 색 구분 완전 제거 | §5.3, §7.1, §15 디자인 토큰 |
| 2 | 가짜뉴스·낚시 → 빨간 글씨/배지 | §7.1 Surface, §7.6 신규 카드 (TrustTag) |
| 3 | 사실 근거 부족 → 노란 글씨/배지 | 동일 §7.6 |
| 4 | 투자 정보 → Free 경고 + Pro 심층 분석 | §7.7 신규 (InvestmentImpactCard), §9.2 Pro 가치 강화, §9.7 자본시장법 신규 |

신규 ADR — ADR-015. 보조 amendment — ADR-009 Amendment 1.

---

## 2. §5 Naming & Language 패치

### 2.1 §5.3 매체군 표현 (재작성)

기존 (v1.7):
- "매체별 보도", 4분류 (보수/진보/중도/공영) 텍스트 라벨 허용

신규 (v1.7.1):
- 4분류 텍스트 라벨 **완전 제거**. 매체명만 노출.
- 매체 dot 색상 — slate-400 단일 회색 통일
- 좌/우 분포 시각화 일체 금지 (위젯/디테일/임베드/OG 모든 surface)

### 2.2 신규 Naming Ban (CLAUDE.md 업데이트 동반)

**한글 추가 금지**.
- 보수 매체, 진보 매체, 중도 매체, 공영 매체 (분류 표현)
- 이념 분류, 이념 분포, 성향 분류, 진영 라벨
- 좌파 매체, 우파 매체

**영문 추가 금지**.
- stance, ideology, ideological
- bias-color, stance-color
- left-leaning, right-leaning, left-wing, right-wing

**CSS 클래스/토큰 금지**.
- `stance-conservative`, `stance-progressive`, `stance-neutral`, `stance-public`
- `bias-color-*`, `ideology-*`

**허용 (변경 없음)**.
- "보도 분포" / "Coverage Distribution" — v1.6부터 유지
- "매체별 보도" / "외신 비교" — 출처 표시 기반 카피만

---

## 3. §7 Feature Specifications 패치

### 3.1 §7.1 Surface 매트릭스 갱신

| Surface | v1.7 | v1.7.1 변화 |
|---|---|---|
| `/widget` 카드 | 헤드라인·매체 dot(4색)·시간·요약 | 헤드라인 (red/amber/default 색) + 매체 dot 회색 + Trust Tag 배지 + 시간 + 요약 |
| `/cluster/[id]` 헤더 | 제목·요약·`<AuxiliaryStancePanel>` | 제목 (red/amber/default 색) + 요약 + **Trust Tag 배지** + Investment Warning (해당 시) |
| `/cluster/[id]` 매체 row | 매체명 + 색 dot + 헤드라인 + 본론 토글 | 매체명 + **회색 dot** + 헤드라인 (red/amber/default 색) + 본론 토글 |
| `/cluster/[id]` Pro panel | (없음) | **`<InvestmentImpactCard>` (category=investment + Pro+ 게이트)** |
| `/embed/iframe` 카드 | 헤드라인·매체·시간 | 헤드라인 (색) + Trust Tag 배지 + 매체·시간 |

### 3.2 §7.6 신규 — Trust Tag 3종 (전 사용자 노출)

```tsx
<TrustTag tag="hoax" />          // 🔴 ⚠ 검증되지 않은 정보
<TrustTag tag="clickbait" />     // 🔴 ⚠ 낚시성 제목 가능성
<TrustTag tag="low_confidence" />// 🟡 ⚠ 보도 출처 부족 — 추가 검증 필요
```

표시 규칙.
- 우선순위 — `hoax` > `clickbait` > `low_confidence` (한 카드에 하나만)
- 위치 — `/widget` 카드 상단, `/cluster/[id]` 헤더, `/embed/iframe`, OG 카드 (V0.5+)
- 헤드라인 색상 — hoax/clickbait → red-600, low_confidence → amber-500, 기본 → slate-900
- WCAG AA 명도 대비 4.5:1 이상

신호 소스 (P0a LLM 워커, ADR-014 통합).
- `hoax_likelihood` ∈ [0, 1] — LLM 평가, ≥ 0.7 시 hoax 태그
- `clickbait_score` ∈ [0, 1] — LLM 평가, ≥ 0.7 시 clickbait 태그 (ADR-013 본론 추출과 결합)
- `low_confidence` — `sample_size < 5` OR `single_source_only=true` (규칙 기반)

P0w 단계 (mock).
- 30개 mock 클러스터 중 — hoax 1개, clickbait 1개, low_confidence 1개, investment 1개 임의 부여 (시각 검증용)

### 3.3 §7.7 신규 — Investment Risk Layer

#### 자동 분류
클러스터 본문/헤드라인에 키워드 매칭 (60+ 키워드).
- 자산 — 주식, 코인, 비트코인, 이더리움, 원달러, 환율, 금리, 달러, 엔화
- 거래 인프라 — 코스피, 코스닥, S&P, 나스닥, 다우, 닛케이, IPO, 공시
- 종목군 — 삼성전자, SK하이닉스, 엔비디아, 테슬라, 애플, 마이크로소프트 등
- 정책 — FOMC, 기준금리, 연준, 한은
- 매칭 시 카테고리에 `investment` 추가

#### Free 사용자 표시
- 🟡 노란 배지 "💰 투자 정보"
- 카드 하단 고지 "⚠ 자본시장법상 투자 자문이 아닙니다. 신중히 판단하세요."
- Pro 분석 deep link → "Pro에서 투자 분석 보기" CTA (가입/Coin 결제)

#### Pro/Creator/Leader 사용자 표시 — `<InvestmentImpactCard>`
분석 항목 (LLM 요약, 가격·시세 일체 X).
- 관련 종목·자산명 (텍스트만, 종목코드 005930 OK, "거래" 단어 X)
- 외신 비교 (Bloomberg/Reuters/FT 보도 요약, 출처 링크)
- 공시·발표 요약 (DART/SEC 등 1차 자료)
- 분석가 의견 요약 (공개 보도 요약, 매수/매도/추천 단어 X)

법무 고지 (필수, 모든 표시 위치).
- "본 정보는 투자 자문이 아닙니다."
- "투자의 책임은 본인에게 있습니다."
- Pro 카드 하단 — "본 분석은 공개 보도/공시 요약이며, 매매 권유가 아닙니다."

#### V0.5+ 유료 future task (P0/P0a/P0b 모두 X)
- 가격·시세·차트 일체 (KIS/한투 API 연동, 자본시장법 §6 변호사 자문 후 별도 ADR-016 발의)
- 알고리즘 추천 ("지금 사세요" 등) 절대 금지

---

## 4. §8 Widget API Contract 패치

### 4.1 `WidgetClusterSchema` 확장

```ts
const TrustTagSchema = z.enum(['hoax', 'clickbait', 'low_confidence', 'investment'])

const WidgetClusterSchema = z.object({
  // ... v1.7 기존 필드
  trust_tags: z.array(TrustTagSchema).default([]),
  hoax_likelihood: z.number().min(0).max(1).optional(),
  clickbait_score: z.number().min(0).max(1).optional(),
  sample_size: z.number().int().nonnegative(),
  single_source: z.boolean().default(false),
  is_investment: z.boolean().default(false),
  // 제거 필드 — stance_label, ideology_color, stance_distribution
})
```

### 4.2 신규 엔드포인트

`GET /api/v1/cluster/[id]/investment` — Pro+ 전용
- 응답 — Pro+ 분석 카드 데이터 (위 §3.3)
- Cache-Control — `private, max-age=60`
- 401 (no auth) / 402 (free tier) / 200 (Pro+)

---

## 5. §9 Monetization 패치

### 5.1 §9.2 3 Tier 가치 강화

| Tier | v1.7 차별화 | v1.7.1 추가 |
|---|---|---|
| Free | 위젯, 클러스터 detail, 코인 충전 | + Trust Tag 표시 (Trust Tag는 모든 사용자 노출) |
| Pro $4.99 | Frame Clash, Timeline, 무엇이 새로워졌나 | **+ InvestmentImpactCard (투자 심층 분석)** |
| Creator $9.99 | Pro + Daily digest, OG 카드 무제한, 키워드 알림 | (변경 없음) — Pro의 InvestmentImpactCard 포함 |
| Leader $19.99 | Creator + 우선 응답, 변호사 자문 dial 1회/월 | (변경 없음) |

투자 분석은 Pro의 핵심 차별화로 격상. ChatGPT 자문 (2026-05-03)의 "Trader 페르소나 가치 강화" 권고와 정합.

### 5.2 §9.7 한국 법무 위험 — 자본시장법 신규 항목

ADR-011 §법무 매트릭스에 다음 항목 추가 (변호사 자문 발송 우선 6번째 항목).

| 위험 | 조항 | 위반 시 | 완화책 |
|---|---|---|---|
| 유사투자자문업 무등록 | 자본시장법 §6, §17 | 형사처벌 (3년 이하 징역, 1억 이하 벌금) | "자문 X / 본인 책임" 고지 + "예측·추천·매수·매도" 단어 0건 강제 (LLM output validator) |
| 시세조작 정보 유포 | 자본시장법 §178 | 형사처벌 (10년 이하 징역, 5억 이하 벌금) | 가격·시세 표시 V0.5+로 보류, 공개 보도/공시 요약만 |
| 미공개 중요정보 이용 | 자본시장법 §174 | 형사처벌 + 부당이득 환수 | 1차 자료 (DART/SEC) 공개 시점 이후 데이터만 사용, 워커 캐시에 timestamp 기록 |

---

## 6. §12 Harness 패치

### 6.1 신규 2종 (v1.7 18종 → v1.7.1 20종)

#### `harness:no-stance-color`
- 검증 — 코드/CSS에서 `stance-conservative`, `stance-progressive`, `ideology-*`, `bias-color-*` 등 클래스명·식별자 0건
- 위치 — `apps/web/**/*.{ts,tsx,css}`
- 실패 케이스 — 위 패턴 grep hit ≥ 1
- ADR — ADR-015 §2.3, ADR-009 Amendment 1

#### `harness:trust-tag-presence`
- 검증 1 — `WidgetClusterSchema`가 `trust_tags`/`hoax_likelihood`/`is_investment` 필드 유지
- 검증 2 — `<TrustTag>` 컴포넌트가 `RisingIssuesList.tsx`/`ClusterDetailHeader.tsx`/`embed/iframe/page.tsx`에서 import
- 검증 3 — `<AdZone>` 안에 `<TrustTag>` 절대 없음 (P12 격리, ADR-005)
- ADR — ADR-015 §3.5

### 6.2 기존 harness 보강

- `harness:realtime-naming` — Naming Ban List에 §2.2 신규 항목 추가
- `harness:ad-zone-boundary` — `<TrustTag>` 컴포넌트 추가 (AdZone 안 절대 금지 검증)

---

## 7. §15 Design System 패치

### 7.1 색상 토큰

**제거**.
- `--color-stance-conservative` (red 계열)
- `--color-stance-progressive` (blue 계열)
- `--color-stance-neutral` (grey 계열)
- `--color-stance-public` (black 계열)

**신규**.
- `--color-trust-hoax` — red-600 `#dc2626`
- `--color-trust-clickbait` — red-600 `#dc2626`
- `--color-trust-low-confidence` — amber-500 `#f59e0b`
- `--color-trust-investment` — amber-500 `#f59e0b`
- `--color-outlet-dot` — slate-400 `#94a3b8` (단일 회색)

### 7.2 컴포넌트 추가/제거

**제거**.
- `<AuxiliaryStancePanel />` (apps/web/components/AuxiliaryStancePanel.tsx)
- `<StanceLegend />` (있다면)

**신규**.
- `<TrustTag tag="hoax|clickbait|low_confidence|investment" />`
- `<InvestmentWarning />` (Free, 카드 하단 노란 배지)
- `<InvestmentImpactCard />` (Pro+, 게이트)
- `<InvestmentDeepLink />` (Free → Pro CTA)

---

## 8. CLAUDE.md 비협상 제약 갱신

비협상 14조 → 15조로 확장.

```
15. Trust Signal & Investment Risk Layer (v1.7.1 ADR-015)

    - <TrustTag>는 hoax/clickbait/low_confidence/investment 4종만 허용. 임의 신규 태그 금지.
    - <InvestmentImpactCard>는 Pro+ 게이트 필수. 서버 응답에서 tier 검증 (401/402/200).
    - 가격·시세·차트·매수/매도 추천 일체 금지 (V0.5+ ADR-016 별도 발의 필요).
    - 매체 dot 색상은 slate-400 단일. 4색·이념 분류 일체 금지.
    - 자본시장법 고지 ("투자 자문 X / 본인 책임")는 모든 InvestmentWarning/InvestmentImpactCard에서 필수.
```

---

## 9. Migration Sequence

### 9.1 PR 분리 계획

| PR | 범위 | 머지 시점 |
|---|---|---|
| **PR #11 (이번)** | docs only — ADR-015 + ADR-009 Amendment + v1.7.1 patch + CLAUDE.md 갱신 | P0w D7+1 (오늘) |
| PR #12 | 코드 — `<AuxiliaryStancePanel>` 삭제, dot 회색 통일, 매체 row 단순화 | P0w D7+2 |
| PR #13 | 코드 — `<TrustTag>` 컴포넌트 + mock 클러스터 4종 (hoax/clickbait/low_confidence/investment) 부여 | P0w D7+3 |
| PR #14 | 코드 — `<InvestmentImpactCard>` 스켈레톤 + Pro 게이트 (mock) + `harness:no-stance-color`/`harness:trust-tag-presence` 본격 구현 | Sprint 0 진입 |
| PR #15 | LLM 워커 — `trust_signal_v1` 프롬프트 + 캐시 통합 (ADR-014) | P0a 진입 |

### 9.2 P0a 진입 후

- LLM 워커 정식 구동 → 실 trust_tags 채움
- 사용자 정정 요청 폼 (1주 ≥ 3 시 자동 태그 제거 + 사람 검토)
- 월 1회 매체별 trust_tag 분포 공개 (`/methodology/trust-stats`)

---

## 10. Verification

### 10.1 PRD 검증

- [x] ADR-015 발의 — Trust Tag 3종 + Investment Risk + 이념 색 폐기 통합
- [x] ADR-009 Amendment 1 — 보조 mini panel 단계 superseded by ADR-015
- [x] PRD §5/§7/§8/§9/§12/§15 patch 작성
- [ ] 사용자(태욱) 사인오프 (PR body 확인)

### 10.2 비협상 제약 정합성

- ADR-005 (P12 광고 격리) — `<TrustTag>`는 `<AdZone>` 안에 금지 → harness 검증 추가
- ADR-007 (제휴 데이터 경계) — InvestmentImpactCard는 제휴 링크 X, 1차 자료 링크만
- ADR-011 (수익 모델) — Pro 차별화 강화로 가입 전환율 ↑ 기대
- ADR-013 (헤드라인 본론) — clickbait 점수 가중치로 활용
- ADR-014 (LLM 비용) — `trust_signal_v1` 프롬프트 추가 비용 ~$0.10/월, $50 cap 내

### 10.3 정치적 중립성 검증

- 좌/우 색 0건 (UI/CSS/code/docs)
- Trust Tag는 매체가 아닌 **개별 클러스터**에 부여 (특정 매체 비방 위험 완화)
- 임계값(0.7) + 프롬프트 GitHub 공개로 투명성 확보

---

## 11. Open Questions

1. P0w 단계에서 mock LLM 출력으로 trust_tags를 줄 때, 어떤 mock 클러스터에 어떤 태그를 줄지 — 임의 vs 시나리오 기반 (예 정치 클러스터에 hoax, 연예 클러스터에 clickbait, 사고 클러스터에 low_confidence, 주식 클러스터에 investment)
2. Investment Pro 분석 카드의 분석가 의견 요약 — LLM이 매체 의견을 "요약"하는 것 자체가 자본시장법 §17 위반 가능성? P0a 변호사 자문 우선 항목.
3. 정정 요청 폼 — 매체에 직접 보내는 link인가, 운영자 큐에 들어오는가. P0a UX 결정.
4. Trust Tag와 ADR-009 Coverage Bar의 관계 — Coverage Bar는 매체군 분포(보조), Trust Tag는 클러스터별 위험. 두 시각화 동시 노출 가능 여부 P0a 디자인 검토.

---

## 12. Sign-off

```
Decided: 2026-05-09 (P0w D7+1)
Decider: 태욱 (Founder)
Driving ADR: ADR-015
Supporting ADR: ADR-009 Amendment 1
Status: Accepted (docs only, code 변경 PR #12 이후)
```

**End of PRD v1.7.1 Patch — 2026-05-09**
