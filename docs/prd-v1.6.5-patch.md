# PRD v1.6.5 — Minor Patch (Card Reorder + Entity Facts + Trend Sparklines)

| 항목 | 내용 |
|---|---|
| 종류 | **Minor Patch** (UI 재배치 + schema 확장, ADR-008은 별도 발의) |
| 적용일 | 2026-05-03 |
| 부모 | `prd-v1.6.md` + v1.6.1~v1.6.4 patches |
| 영향 | §8 `/api/v1/clusters/[id]` shape 확장, §1.3 Layer 3 detail 재배치 |
| 호환성 | **Breaking on detail endpoint** (P0w 단일 클라이언트 — 안전) |
| 동반 | **ADR-008** Trend Time-Series Pipeline |

---

## 변경 사유

T-W04 직전 사용자 피드백 + ADR-008 설계 회의:

1. **시각 위계가 잘못됨**: 정체 → 왜 떴나 → 매체 순서는 "위키피디아 → 뉴스" 흐름. 사용자는 "뉴스 → 매체 입장 → 더 알고 싶으면 정체·맥락" 순으로 스캔함.
2. **정체가 너무 얄팍함**: 1줄 정의만으로는 "OpenAI 시가총액?" / "이 배우 최근 작품 평점?" 같은 즉문즉답 가치 부재.
3. **검색 흐름은 후킹 핵심**: "지금 떴는가" 답을 시각화하는 데 1주/1개월/6개월/1년 sparkline이 가장 직관적. **매번 LLM 호출 불가** → DB 시계열 + 백그라운드 워커 (ADR-008 별도 결정).

---

## 8가지 변경

- **R-1 카드 순서 재배치**: `📺 영상 뉴스` → `🚀 왜 지금 떴는가` → `📰 매체는 어떻게 다뤘나` → `🧠 AI 정밀 분석`
- **R-2 정체(subject) 통합**: 별도 카드 → `AI 정밀 분석` 안의 `entity_card` 필드. 도메인-특화 fact list 포함
- **R-3 entity_card 구조**: `{ definition, domain_facts: [{label, value, source?}] }` — 출처 노출 의무
- **R-4 AI 흐름 분석 카드**: 4-window sparkline (`7d / 30d / 6m / 1y`)
- **R-5 inline SVG Sparkline 컴포넌트**: 의존성 0KB, ~60줄 (Recharts/Visx 결정 지연)
- **R-6 Trend mock 생성기**: `lib/mock/trend.ts` — deterministic sin curve + spike (cluster_id 시드)
- **R-7 ADR-008 발의**: 트렌드 데이터 소스·DB schema·워커 cadence는 별도 ADR로 분리 (P0a T-006 워커 구현 시 참조)
- **R-8 YouTube 뉴스 영상 카드** (신규): 헤더 아래 + 왜 떴는가 위에 16:9 영상 카드. Lite YouTube Embed 패턴 (썸네일 + ▶ → 클릭 시 iframe 교체). MBC뉴스 / YTN / 연합뉴스 3채널 분산. P0w mock은 placeholder video_id + fallback UI; P0a (T-006)에서 YouTube Data API로 swap.

---

## Schema diff (cluster-schemas.ts)

```diff
+export const DomainFactSchema = z.object({
+  label: z.string().min(1).max(40),
+  value: z.string().min(1).max(120),
+  source: z.string().min(1).max(80).optional(),
+})
+
+export const EntityCardSchema = z.object({
+  definition: z.string().min(1).max(300),
+  domain_facts: z.array(DomainFactSchema).max(8),
+})
+
+export const TrendBucketSchema = z.object({
+  t: z.string(),                 // ISO bucket start
+  v: z.number().min(0),          // normalized 0..100
+})
+
+export const TrendWindowSchema = z.object({
+  window: z.enum(['7d', '30d', '6m', '1y']),
+  buckets: z.array(TrendBucketSchema).min(2).max(200),
+  source: z.string().min(1).max(40),
+  computed_at: z.string(),
+})
+
+export const TrendAnalysisSchema = z.object({
+  windows: z.array(TrendWindowSchema).min(1).max(4),
+  cached: z.boolean(),
+})

 export const AiAnalysisSchema = z.object({
-  subject: z.string().min(1).max(200).optional(),
   why_trending: z.string().min(1).max(500),
   coverage_summary: z.string().min(1).max(800),
+  deep: z.object({
+    entity_card: EntityCardSchema.optional(),
+    trend: TrendAnalysisSchema.optional(),
+  }).optional(),
 })
```

---

## UI 재배치 (`/cluster/[id]` 새 구조)

```
[Back link]
[Header: category · title · meta]

[🚀 왜 지금 떴는가]              ← teal accent, 시선 1번
   why_trending prose

[📰 매체는 어떻게 다뤘나]        ← slate, 시선 2번
   coverage_summary prose
   + (politics/society) Coverage Bar panel

[🧠 AI 정밀 분석]                 ← slate, 큰 카드 (확장 영역)
   ├─ 정체 (entity_card.definition)
   │   └─ domain_facts grid (label / value / source)
   └─ AI 흐름 분석 (4 sparklines: 7d / 30d / 6m / 1y)

[매체별 보도 리스트]
[P12 footer]
```

---

## entity_card domain_facts 카테고리별 가이드

| 카테고리 | 추천 facts |
|---|---|
| 기업 (OpenAI, 삼성, 카카오 등) | 추정 기업가치 / CEO / 설립연도 / 직원 수 / 주요 제품 |
| 인물 (배우·정치인) | 최근 작품·법안 / 평점 (로튼 평론가/팝콘 / RT) / 활동 분야 / 데뷔 |
| 영화·드라마 | 개봉일 / 감독 / 출연 / 평점 / 박스오피스 |
| 사건 | 발생일 / 장소 / 사상자 / 조사 진행 단계 |
| 정책 | 발의일 / 시행일 / 적용 대상 / 예상 비용 |
| 단체·조직 | 설립연도 / 본사 / 산하기관 / 핵심 사업 |

P0w mock에서는 위 가이드의 합리적 facts 3~5개씩.

---

## Trend mock 시계열 — `lib/mock/trend.ts`

P0w mock generator (deterministic):
- 기본 함수: `sin(t * frequency) * amplitude + baseline`
- "spike" 함수: 분 경계마다 한 cluster에 `2x` 부스트 (rotation rank와 동기화)
- cluster_id를 hash → frequency·amplitude·spike timing 결정
- output: `{ window, buckets: [{t, v}], source: 'p0w-mock', computed_at }`

bucket 수:
- 7d × hour = 168
- 30d × day = 30
- 6m × week = 26
- 1y × week = 52

---

## Sparkline 컴포넌트 — `components/TrendSparkline.tsx`

- 의존성 0KB inline SVG
- props: `{ data: number[], width?: 200, height?: 40, color?: 'teal-500' }`
- viewBox 기반 linear scale
- prefers-reduced-motion 자동 (애니메이션 없음)
- 색상은 디자인 토큰 그대로

V0.5 hover/tooltip 필요해지면 Recharts swap (마이그레이션 비용 작음 — 동일 props 인터페이스 유지).

---

## 변경하지 않는 것

- v1.6 §4 P12 — 그대로
- ADR-005/006/007 — 그대로
- /widget Top 10 + RisingIssuesList — 영향 없음
- /embed/iframe — 영향 없음
- 18종 하네스 카탈로그 — 그대로

---

## Forward Compatibility

- **P0a T-005 Claude Haiku**: prompt에 `deep.entity_card.domain_facts` JSON 출력 추가. `source` 필드 채움 의무 (출처 트래킹).
- **P0a T-006 워커**: ADR-008에 따라 `keyword_trends` 테이블에 4-window 시계열 적재.
- **V0.5 Sparkline**: hover/tooltip 추가 필요 시 Recharts (~30KB) swap.
- **B2B Lite**: domain_facts 풀이 Bloomberg/IMDb 등 외부 DB 연동 가능.

---

## Verification

- [ ] `cluster-schemas.ts`에 `EntityCardSchema`, `TrendAnalysisSchema`, `AiAnalysisSchema.deep`
- [ ] `lib/mock/trend.ts` deterministic generator
- [ ] `lib/mock/cluster-details.ts` 15 cluster 재작성 (entity_card + trend mock 4 windows)
- [ ] `/api/v1/clusters/[id]` 응답에 `deep.entity_card` + `deep.trend.windows[4]` 포함
- [ ] `/cluster/[id]` 페이지 카드 순서 재배치 + Sparkline 4개 렌더
- [ ] `harness:realtime-naming` + `harness:widget-contract` 통과
- [ ] 5 cluster 직접 방문 시각 확인 (politics·tech·economy·culture·insufficient_sample)

---

**End of v1.6.5 patch — 2026-05-03**
