# PRD v1.6.4 — Minor Patch (Structured AI Analysis)

| 항목 | 내용 |
|---|---|
| 종류 | **Minor Patch** (data shape 변경 + UI 강화, ADR 발의 불필요) |
| 적용일 | 2026-05-03 |
| 부모 | `prd-v1.6.md` + v1.6.1/v1.6.2/v1.6.3 patches |
| 영향 | §8 `/api/v1/clusters/[id]` response shape 변경, §1.3 Layer 3 detail 강화 |
| 호환성 | **Breaking on detail endpoint** (P0w 단계 클라이언트는 우리 detail page뿐 → 안전). 위젯 endpoint는 영향 없음 |

---

## 변경 사유

T-W04 직전 사용자 피드백: "AI 요약" 한 단락은 클릭 후 가치 부족. 사용자가 detail 페이지에 머무는 5~10초 안에 다음 3가지가 명시적으로 보여야 후킹 → 매체 클릭 funnel이 살아남.

1. **이게 누구·무엇인가?** (subject) — 인물·단체·사건이라면 1줄 정의 (위키피디아 thumbnail 수준)
2. **왜 지금 떴는가?** (why_trending) — 트리거 이벤트 (발표/사건/기자회견)
3. **매체는 어떻게 다뤘는가?** (coverage_summary) — 핵심 사실 + 진영 간 입장 차이

기존 단일 `ai_summary`는 셋이 섞여 있어 스캔 비용이 높음. 분리하면 **눈으로 5초 만에 3개 박스를 훑고 매체 리스트로 내려갈 수 있음**.

---

## 5가지 변경

- **A-1 Schema 변경**: `ClusterDetailResponseSchema.ai_summary: string` → `ai_analysis: { subject?, why_trending, coverage_summary }` (subject만 optional)
- **A-2 Mock 재작성**: 15개 cluster마다 3-section 구조로 다시 작성. 인물·단체·사건이 명확한 cluster는 subject 채움 (8건 예상), 정책·이슈는 subject 생략 (7건)
- **A-3 UI 변경**: detail page의 "AI 요약" 단일 카드 → 3-stack:
  - subject 카드 (있을 때만, slate-900 + 작은 헤더 "🪪 정체")
  - why_trending 카드 (teal 액센트 헤더 "🚀 왜 지금 떴는가")
  - coverage_summary 카드 (slate 헤더 "📰 매체는 어떻게 다뤘나")
- **A-4 Copy guard 강화**: subject 박스에 "여기는 P0w mock입니다 — P0a Wikipedia/공공DB 연동" 주석 (assert-monetization-claims 정신 확장)
- **A-5 Forward-compat note**: P0a (T-005) Claude Haiku prompt도 같은 3-section JSON output을 강제하도록 prompt template 업데이트 (이번 patch는 mock 단계라 prompt는 미수정)

---

## Schema diff

```diff
 export const ClusterDetailResponseSchema = z.object({
   cluster_id: z.string().uuid(),
   title: z.string().min(1).max(60),
   category: CategorySchema,
   coverage: CoverageCountsSchema,
   sample_quality: SampleQualitySchema,
-  ai_summary: z.string().min(1).max(800),
+  ai_analysis: z.object({
+    subject: z.string().min(1).max(200).optional(),
+    why_trending: z.string().min(1).max(500),
+    coverage_summary: z.string().min(1).max(800),
+  }),
   outlets: z.array(OutletReportSchema).min(1).max(20),
   methodology_version: z.string(),
   updated_at: z.string(),
 })
```

---

## UI 정책 매트릭스 (v1.6.4 변경 행)

| 영역 | AI 분석 |
|---|---|
| `/widget` Top 10 | ❌ (위젯에는 detail 분석 안 노출 — v1.6.2 §C-2 정책) |
| `/embed/iframe` | ❌ (embed는 paint surface) |
| **`/cluster/[id]` (v1.6.4)** | **✅ 3-stack: subject? + why_trending + coverage_summary** |
| `/api/v1/widget/top` | ❌ 필드 없음 |
| `/api/v1/clusters/[id]` (v1.6.4) | ✅ `ai_analysis` 객체 |

---

## Subject 분류 가이드 (mock 작성용)

**Subject 채움 (인물·단체·사건이 명확)**
- OpenAI · 카카오 · 삼성전자 · 현대차 · 쿠팡 · KBO · 한국석유공사 → 단체 정의
- 제주 해녀 · 칸 영화제 → 사건/이벤트 정의

**Subject 생략 (정책·통계·외교 이벤트)**
- 미 연준 금리 · 국민연금 개편 · 서울 청년 월세 · 의대 정원 합의 · 북한 미사일 · 미세먼지 → 이슈는 why_trending이 곧 정체성

---

## Forward Compatibility

- **P0a T-005**: Claude Haiku prompt를 다음 JSON schema로 강제 → `{subject?, why_trending, coverage_summary}`. Copy ratio 검증은 `coverage_summary`에만 적용 (subject는 정의문이라 출처 ≠ 본문).
- **B2B Lite (V0.5)**: 기업 모니터링 대시보드도 동일 3-section 표시 → 일관성.
- **Native Widget V1**: small/medium widget에는 `why_trending` 한 줄만 노출 가능 (compact form).

---

## Verification

- [ ] `cluster-schemas.ts`에 `AiAnalysisSchema` + 통합 → `ClusterDetailResponseSchema`
- [ ] `cluster-details.ts` 15개 cluster 3-section 재작성 (8건 subject / 7건 생략)
- [ ] `/api/v1/clusters/[id]` 응답이 새 shape으로 emit
- [ ] `/cluster/[id]` page가 3-stack 카드로 렌더 (subject 카드는 있을 때만)
- [ ] `harness:realtime-naming` + `harness:widget-contract` 통과
- [ ] 5 cluster_id 직접 방문: politics(002, 007 — subject 없음), economy(006 — Samsung subject), tech(004 — OpenAI subject), culture(005 — 해녀 subject), 사건(009 — subject 없음)

---

**End of v1.6.4 patch — 2026-05-03**
