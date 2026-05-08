# ADR-015 — Trust Signal & Investment Risk Layer

> **Status**: Accepted (2026-05-09, P0w D7+1)
> **Decision date**: 2026-05-09
> **Decider**: 태욱 (Founder)
> **Supersedes**: ADR-009 §3 "보조 mini panel" (auxiliary stance panel 폐기)
> **Amends**: PRD v1.7 §5/§7/§9/§12 (v1.7.1 patch)
> **Related**: ADR-005 P12 광고 격리, ADR-007 제휴 데이터 경계, ADR-011 §법무 위험 매트릭스, ADR-014 비용 최적화 LLM 파이프라인

---

## 1. Context

PRD v1.7 정식 발의 직후, 사용자(태욱)가 다음 4가지 변경을 지시했다.

1. 좌/우 매체 색 구분 완전 제거 (ADR-009의 보조 mini 단계도 폐기)
2. 가짜뉴스·낚시성 이슈 → **빨간 글씨 경고**
3. 사실 근거 부족 단계 → **노란 글씨 경고**
4. 투자 정보 검색어 → 무료 사용자에게는 경고만, 유료 사용자에게는 별도 분석 패널 (가격 정보는 V0.5+ 유료 future task로 보류)

이는 v1.7의 "이슈 리스크 OS" 포지셔닝(ADR-010)과 정합한다. 사용자가 의사결정에 활용할 수 있는 정보를 우선하되 (P13 Actionable Information First), 잘못된 의사결정 위험은 명시적으로 경고해야 한다. 이념 색상은 위험 신호가 아니므로 surface에서 제거하고, 그 자리를 **Trust Signal**과 **Investment Risk Tag**가 대체한다.

---

## 2. Decision

3가지 신규 신호 + 1가지 시각 중립화를 도입한다.

### 2.1 Trust Tag 3종 (모든 사용자 노출)

| Tag | Trigger | UI |
|---|---|---|
| `hoax` | `hoax_likelihood ≥ 0.7` (LLM 평가) | 🔴 **빨간 배지 + 헤드라인 빨간색** "⚠ 검증되지 않은 정보" |
| `clickbait` | `clickbait_score ≥ 0.7` (LLM 평가, ADR-013 본론 추출과 결합) | 🔴 빨간 배지 "⚠ 낚시성 제목 가능성" |
| `low_confidence` | `sample_size < 5` OR `single_source_only=true` | 🟡 **노란 배지 + 헤드라인 노란색** "⚠ 보도 출처 부족 — 추가 검증 필요" |

표시 규칙.
- 우선순위: `hoax` > `clickbait` > `low_confidence` (한 카드에 하나만 노출)
- 위치: `/widget` 카드 상단 + `/cluster/[id]` 헤더 + `/embed/iframe` 카드 + Open Graph 카드 (V0.5+)
- 색상 토큰: red-600 (`#dc2626`) / amber-500 (`#f59e0b`) — slate 계열과 명도 대비 4.5:1 이상 (WCAG AA)
- 모바일 위젯 (V0.5+): 배지만 노출 (제목 색상 변경 X — 가독성 유지)
- 광고/제휴 카드는 Trust Tag 시스템과 완전 분리 (ADR-005/007 P12 격리 유지)

### 2.2 Investment Risk Tag (모든 사용자 노출 + Pro 전용 분석 게이트)

| 단계 | 조건 | UI |
|---|---|---|
| 자동 분류 | 클러스터에 키워드 매칭 (주식/코인/비트코인/원달러/금리/IPO/공시 등 60+ 키워드) → 카테고리 `investment` 추가 | 무료 사용자 — 🟡 노란 배지 + 카드 하단 고지 "⚠ 투자 정보 — 자본시장법상 투자 자문이 아닙니다. 신중히 판단하세요." |
| Pro+ 전용 분석 | `category=investment` 클러스터에 `<InvestmentImpactCard>` 노출 (Pro/Creator/Leader) | 분석 항목 — 관련 종목·자산명 (텍스트만) / 외신 비교 / 공시·발표 요약 / 분석가 의견 요약 (LLM) |
| 가격 정보 | **V0.5+ Future Task** (별도 ADR + 라이선스·법무 검토 후) | P0 단계에서는 가격·시세·차트 일체 표시 X |

법무 고지 (모든 표시 위치 필수).
- "본 정보는 투자 자문이 아닙니다." (자본시장법 §6 회피)
- "투자의 책임은 본인에게 있습니다."
- Pro 전용 카드 하단에는 "본 분석은 공개 보도/공시 요약이며, 매매 권유가 아닙니다." 추가

비협상 제약.
- 가격·차트·매수/매도 추천 일체 금지 (P0/P0a/P0b/V0.5 전반)
- 종목 코드(005930 등) 표시 가능, 단 "거래" 단어 X
- 알고리즘 추천 (예 "지금 사세요") 절대 금지
- 한국투자증권 KIS API 등 시세 연동은 V0.5+ ADR-016 (예정) 발의 후

### 2.3 이념 색상 완전 중립화 (ADR-009 §3 supersede)

ADR-009는 "이념 라벨 → 보조 mini panel"로 강등했으나, v1.7.1에서 한 단계 더 진행해 **모든 색·기호 라벨 제거**.

폐기 항목.
- `<AuxiliaryStancePanel>` 컴포넌트 삭제 (apps/web/components/AuxiliaryStancePanel.tsx)
- 매체 dot 색상 — 4색(red/blue/grey/black) → **단일 회색 (slate-400)** 통일
- 4분류 라벨 (보수/진보/중도/공영) 텍스트 표시도 제거 — 매체명만 노출
- "이념" / "stance" / "ideology" 단어 코드/UI/문서에서 추방 (Naming Ban List 추가)

대체 정보.
- 매체 row는 매체명 + 시간 + 헤드라인만 표시
- 좌/우 분포 대신 **Trust Tag 분포** (이 클러스터에서 hoax 1, low_confidence 2 등) 노출 가능 (P0a 검토)

근거.
- 사용자 지시 (2026-05-09) — "좌 우 매체에 대한거(색 차이라든지 그런거)는 그냥 없애도 될 것 같고"
- ADR-010 정신 — 분류 자체가 가치 판단이므로 surface에서 빼고 Pro 분석 영역에 한정 (이번 결정으로 그것마저 제거)
- 한국 법무 — "이념 라벨" 자체가 명예훼손·허위사실 유포 리스크, 출처 표시만 안전

---

## 3. Implementation Plan

### 3.1 Schema (Sprint 0 / P0a 진입 시)

```ts
// apps/web/lib/schemas/widget.ts (확장)
const TrustTagSchema = z.enum(['hoax', 'clickbait', 'low_confidence', 'investment'])

const WidgetClusterSchema = z.object({
  // ... v1.7 기존 필드
  trust_tags: z.array(TrustTagSchema).default([]),     // 위 4종
  hoax_likelihood: z.number().min(0).max(1).optional(),
  clickbait_score: z.number().min(0).max(1).optional(),
  sample_size: z.number().int().nonnegative(),
  single_source: z.boolean().default(false),
  is_investment: z.boolean().default(false),
  // stance_label, ideology_color 필드 모두 제거
})
```

### 3.2 LLM 프롬프트 (ADR-014 워커 캐시 통합)

매 클러스터 생성 시 1회 호출, 결과는 캐시 (article_url + model + prompt_version 기반).

```
prompt_version: trust_signal_v1
output schema: { hoax_likelihood: 0-1, clickbait_score: 0-1, evidence_quality: high|medium|low, is_investment: boolean, investment_keywords: string[] }
```

비용 추정 (ADR-014 phase 1 Gemini 2.0 Flash 기준).
- 클러스터당 입력 ~500 토큰 + 출력 ~100 토큰 = $0.0001
- 일 30개 신규 클러스터 × 30일 = 900회 = ~$0.09/월 (반올림 $0.10)
- 총 ADR-014 $50/월 cap 내 안전 수용

### 3.3 컴포넌트 (Sprint 0 또는 P0a)

신규.
- `<TrustTag tag="hoax|clickbait|low_confidence" />` (apps/web/components/TrustTag.tsx)
- `<InvestmentWarning />` (Free 노란 배지, 자본시장법 고지)
- `<InvestmentImpactCard />` (Pro+, 게이트는 useTier hook + 서버 검증)
- `<InvestmentDeepLink href="/cluster/[id]/investment" />` (Free → "Pro 가입하면 분석 가능" CTA)

삭제.
- `<AuxiliaryStancePanel />` (apps/web/components/AuxiliaryStancePanel.tsx)
- 매체 dot 색상 클래스 (`stance-conservative`, `stance-progressive` 등)

수정.
- `<RisingIssuesList />` — 카드 상단에 `<TrustTag />` 슬롯 추가
- `<ClusterDetailHeader />` — 헤드라인 색상 prop 추가 (red/amber/default)
- `<OutletRow />` — dot 색상 → slate-400 단일

### 3.4 Pro Gate (서버 검증)

```ts
// apps/web/app/api/v1/cluster/[id]/investment/route.ts
// Cache-Control: private, max-age=60
// 401 if no auth, 402 if free tier
```

Free 사용자가 deep link 클릭 시 → "Pro에서 투자 분석 보기" 페이지 (Pro 가입 CTA + Coin 결제 옵션 noticed via ADR-011 §coin economy).

### 3.5 신규 Harness 2종 (v1.7 18종 → v1.7.1 20종)

- `harness:no-stance-color` — 코드/CSS에서 "stance-conservative", "stance-progressive", "ideology-*", "bias-color-*" 클래스명·식별자 0건 강제
- `harness:trust-tag-presence` — `WidgetClusterSchema`가 `trust_tags`/`hoax_likelihood`/`is_investment` 필드를 유지하는지 + `<TrustTag>` 컴포넌트가 `/widget`·`/cluster/[id]`에서 import되는지 검증

### 3.6 신규 Naming Ban (CLAUDE.md 업데이트)

추가 금지어.
- 한글 — "보수 매체", "진보 매체", "이념 분류", "이념 분포", "성향 분류"
- 영문 — "stance", "ideology", "ideological", "bias-color", "left-leaning", "right-leaning"
- 색상명 — `stance-conservative-red`, `stance-progressive-blue` 등 토큰명 자체

허용.
- "매체별 보도", "외신 비교" — 출처 표시 기반 카피만 허용
- "보도 분포" (Coverage Distribution) — v1.6부터 유지

---

## 4. Migration Plan

### 4.1 P0w 단계 (현재, mock 데이터)

- ADR-015 발의로 구조 확정
- 코드 변경은 v1.7.1 patch 머지 직후 별도 PR (P0w D7+2~D7+3)
  - `<AuxiliaryStancePanel>` 삭제
  - 매체 dot 회색 통일
  - mock 클러스터에 `trust_tags` 임의 부여 (3개 클러스터에 hoax/clickbait/low_confidence 1개씩, 1개에 investment)

### 4.2 P0a 단계 (D10~D24)

- LLM 워커에 `trust_signal_v1` 프롬프트 추가
- `trust_tags` 실 데이터 채움
- `<InvestmentImpactCard>` 정식 구현 (Pro 게이트 + 자본시장법 고지)

### 4.3 V0.5+ 단계

- 가격·시세 연동 별도 ADR-016 발의 (KIS API/한투/유진 라이선스, 자본시장법 §6 변호사 자문 후)
- 모바일 위젯 (iOS Small)에 Trust Tag 노출

---

## 5. Risks

### 5.1 LLM 오판으로 인한 명예훼손

- 매체 A의 정상 보도에 `hoax` 태그 잘못 부여 시 정통망법 §44-2 (정정 요청) 또는 명예훼손 소송 위험
- 완화책 1 — `hoax_likelihood ≥ 0.7` 임계값 + LLM에 "원문 인용 근거 제시" 강제 (output schema에 evidence_url 추가)
- 완화책 2 — 카드 하단에 "AI 자동 분석 결과입니다. 매체에 정정 요청 가능합니다" 고지 + 1-click 정정 요청 폼
- 완화책 3 — 1주 이내 정정 요청 누적 ≥ 3 시 자동 태그 제거 + 사람 검토 큐 (P0a)

### 5.2 자본시장법 위반 (투자 자문 무자격)

- "예측", "추천", "전망", "매수/매도" 단어 사용 시 자본시장법 §17 (유사투자자문업) 위반 가능성
- 완화책 1 — Pro 분석 카드 LLM 프롬프트에 위 단어 0건 강제 (output validator)
- 완화책 2 — 모든 표시 위치에 "투자 자문 X / 본인 책임" 고지 표준화
- 완화책 3 — 변호사 자문 우선 발송 항목 추가 (ADR-011 §법무 매트릭스에 §6 신규 항목 추가)

### 5.3 정치적 중립성 훼손 (반대 방향)

- 좌/우 색을 없앴는데 사용자가 "특정 매체에 자주 hoax 태그가 붙는다"고 인식 → 정치적 비난
- 완화책 1 — 월 1회 trust_tag 분포를 매체별로 공개 (`/methodology/trust-stats`)
- 완화책 2 — 임계값(0.7)과 프롬프트(`trust_signal_v1`) 자체를 GitHub에 공개
- 완화책 3 — LLM 모델 변경 시 ADR amendment 필수

### 5.4 광고 영역 격리 위반

- Trust Tag가 광고 영역에 노출되면 P12 격리 위반 (ADR-005)
- 완화책 — `<AdZone>` 안에 `<TrustTag>` 절대 렌더 금지 → `harness:ad-zone-boundary`에 컴포넌트 추가

---

## 6. Alternatives Rejected

### 6.1 가짜뉴스 신호를 사용자 신고만으로 표시 (LLM 자동 X)

- 거부 이유 — P0 단계에서 사용자 0명 → 신고도 0건 → 신호 자체가 동작 안 함
- 채택 이유 — LLM 자동 + 사용자 신고로 보완 (ADR-014 워커 + Pro 사용자 1-click 정정)

### 6.2 가격·시세를 P0a부터 즉시 도입

- 거부 이유 — 자본시장법 §6 (유사투자자문업 등록 요건), KIS API/한투 라이선스 비용·검토 시간, 변호사 자문 미발송
- 채택 이유 — V0.5+ Future Task로 분리, ADR-016 (예정) 별도 결정

### 6.3 좌/우 색 라벨을 Pro 전용으로만 유지

- 거부 이유 — Pro 사용자도 정치적 비난·법무 위험 동일, "Pro라서 보여준다"는 이중 기준
- 채택 이유 — 완전 폐기, 매체명만 노출

---

## 7. Decision Log

| 날짜 | 항목 | 결정 |
|---|---|---|
| 2026-05-09 | 좌/우 색 폐기 | 완전 제거 (보조 mini panel도 X) |
| 2026-05-09 | Trust Tag 3종 색상 | 빨강 (hoax/clickbait), 노랑 (low_confidence) |
| 2026-05-09 | 투자 가격 표시 | V0.5+ 유료 future task (P0/P0a/P0b 모두 X) |
| 2026-05-09 | 무료 투자 경고 문안 | "⚠ 투자 정보 — 자본시장법상 투자 자문이 아닙니다. 신중히 판단하세요." |
| 2026-05-09 | Pro 분석 카드 항목 | 종목·자산명(텍스트), 외신 비교, 공시·발표 요약, 분석가 의견 요약 |

---

## 8. Open Questions

1. Trust Tag 임계값 (0.7) — P0a 운영 후 실 데이터로 0.6 또는 0.8 조정 가능. 변경 시 ADR amendment 필수.
2. `clickbait_score`와 ADR-013 헤드라인 본론 추출 토글 통합 방법 — 본론과 원본 헤드라인 차이가 크면 자동 clickbait 점수 가중치? P0a Sprint 0에서 실험.
3. `low_confidence` + `hoax` 동시 발생 시 — 우선순위 hoax 표시하되 카드 하단에 "보도 출처도 부족합니다" 추가 표기 가능한지.
4. 정정 요청 폼 위치 — 매체 row 옆 vs 카드 하단 vs 별도 modal. P0a UX 테스트 후 결정.

---

## 9. Sign-off

```
Decided: 2026-05-09 (P0w D7+1)
Decider: 태욱 (Founder)
Reviewers (자문): Gemini + ChatGPT (기존 자문 종합), 외부 변호사 (예정)
Status: Accepted
```

**End of ADR-015 — 2026-05-09**
