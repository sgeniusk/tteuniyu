# PRD v1.6.3 — Minor Patch (Cluster Detail Page Mock-Rich)

| 항목 | 내용 |
|---|---|
| 종류 | **Minor Patch** (mock data 확장 + UI 추가, ADR 발의 불필요) |
| 적용일 | 2026-05-02 |
| 부모 | `prd-v1.6.md` + `prd-v1.6.1-patch.md` + `prd-v1.6.2-patch.md` |
| 영향 | §7.1 F-P0w 신규 산출물 추가 (`/cluster/[id]` mock-rich), §8 신규 endpoint `/api/v1/clusters/[id]` |
| 호환성 | 신규 endpoint + 기존 placeholder 페이지 교체. T-007 (P0a)에서 실데이터로 swap |

---

## 변경 사유

T-W03 PR #4 시각 검증에서 발견:
- 위젯 카드의 가치는 **클릭 후** 페이지에서 결정됨. 지금 `/cluster/[id]`는 placeholder 한 줄뿐 → 위젯의 후킹이 비어있음.
- 사용자 reference (실검위젯 앱 스크린샷): 위젯 키워드 클릭 → 검색 결과 + AI 요약 + 매체 리스트. 우리 PRD는 같은 funnel의 변형이지만 P0a (T-007) 일정.
- "수익 의향 검증" 단계에서 Coverage Distribution이 detail에서만 보이는 v1.6.2 정책의 첫 시연이 필요.

해결: T-007의 mock subset을 P0w에 끌어와 detail 페이지를 시각적으로 살아있게 만듦. **실 RSS·임베딩은 P0a (T-006) 그대로.**

---

## 6가지 변경

- **D-1 Mock 확장**: 15개 cluster마다 (a) AI 요약 한 단락, (b) 매체별 보도 5~10건 추가. 실 데이터는 T-006에서 `summaries` 테이블 + `articles` 테이블로 옮겨감.
- **D-2 신규 매체 데이터셋**: `lib/mock/outlets.ts` — 30개 매체 메타 (slug/name/category/url) + cluster별 매체 picking 로직.
- **D-3 신규 API endpoint**: `GET /api/v1/clusters/[id]` — Zod-validated, no forbidden fields, 60s CDN cache.
- **D-4 `/cluster/[id]` 페이지 풍부화**: 헤더 + AI 요약 카드 + (조건부) Coverage Bar + 매체 리스트 + placeholder CTA.
- **D-5 Coverage Bar는 politics/society 카테고리에만 노출** (v1.6.2 §C-3 첫 사용처). `isCoverageRelevant()` 활용.
- **D-6 P12 강제**: detail 페이지에 `<AdZone>` / `<AffiliateCard>` / `<SponsoredCard>` 절대 없음. 페이지 헤더 주석 + 향후 `harness:ad-zone-boundary` (T-W04 또는 Sprint 0)가 자동 검증.

---

## 데이터 모델 변경

### 신규 schema `apps/web/lib/api/cluster-schemas.ts`

```typescript
export const OutletStanceSchema = z.enum(['progressive', 'mixed', 'conservative', 'foreign'])

export const OutletReportSchema = z.object({
  outlet_slug: z.string(),
  outlet_name: z.string(),
  stance: OutletStanceSchema,
  headline: z.string().min(1).max(120),
  published_at: z.string(),
  outlet_url: z.string().url(),
})

export const ClusterDetailResponseSchema = z.object({
  cluster_id: z.string().uuid(),
  title: z.string().min(1).max(60),
  category: CategorySchema,
  coverage: CoverageCountsSchema,
  sample_quality: SampleQualitySchema,
  ai_summary: z.string().min(1).max(800),
  outlets: z.array(OutletReportSchema).min(1).max(20),
  methodology_version: z.string(),
  updated_at: z.string(),
})
```

### Mock 확장

각 cluster:
- `ai_summary`: 한 단락 (200~400자, 한국어)
- `outlet_reports`: 5~10건 (매체 다양성 보장 — 진보/중도/보수/외신 균형)

매체 풀 (`lib/mock/outlets.ts`): 30개 매체 메타. 기존 `config/sources_whitelist.yaml`(T-003 P0a 산출물 예정)의 mock 버전.

---

## UI 정책 매트릭스 (v1.6.3 추가 행)

| 영역 | 카테고리 표시 | Coverage Bar | Rank Trend | AdZone | AI 요약 | 매체 리스트 |
|---|---|---|---|---|---|---|
| `/widget` Top 10 | ❌ | ❌ | ✅ | T-W04 | ❌ | ❌ |
| `/embed/iframe` | ❌ | ❌ | ✅ | 영구 X | ❌ | ❌ |
| **`/cluster/[id]` (v1.6.3 mock)** | **✅** | **✅ politics/society만** | — | **❌ (P12)** | **✅ mock** | **✅ mock** |
| `/api/v1/widget/top` | ✅ | ✅ | ✅ | T-W04 | ❌ | ❌ |
| `/api/v1/clusters/[id]` (v1.6.3) | ✅ | ✅ | — | — | ✅ | ✅ |

---

## 변경하지 않는 것

- v1.6 §4 P12 수익 영역 분리 — **detail 페이지는 P12 강제 영역의 핵심**
- ADR-005/006/007 — 그대로
- 18종 하네스 카탈로그 — 그대로 (단 향후 `harness:ad-zone-boundary`가 detail 페이지를 자동 검증)
- T-006 (RSS + 임베딩) 일정 — P0a 그대로
- T-007 (실 detail page) 일정 — P0a 그대로 (mock을 그대로 swap)
- 18종 하네스 — 그대로

---

## Forward Compatibility

- T-006 (P0a): mock summaries → 실 LLM (Claude Haiku) 출력으로 swap. `prompt_version` 로깅 (CLAUDE.md 9).
- T-007 (P0a): 이의제기 패널 + 외신 비교 + 공유 OG 카드 추가. 본 patch의 layout 그대로 확장.
- T-005 (P0a): summary copy ratio ≤ 15% 검증 (`assert-summary-copy-rate`) — mock summaries는 검증 대상에서 제외.

---

## Verification

- [ ] `lib/mock/outlets.ts` 30개 매체 메타
- [ ] `lib/mock/clusters.ts` 15개 cluster마다 ai_summary + outlet_reports 5~10건
- [ ] `lib/api/cluster-schemas.ts` ClusterDetailResponseSchema
- [ ] `/api/v1/clusters/[id]` Zod-validated, 60s cache, no forbidden fields
- [ ] `/cluster/[id]` 페이지 — 헤더 + AI 요약 + 조건부 Coverage Bar + 매체 리스트 + placeholder CTA
- [ ] politics/society cluster → Coverage Bar 노출 / 다른 카테고리 → 미노출
- [ ] AdZone 컴포넌트 부재 검증 (페이지 코드 grep)
- [ ] `harness:realtime-naming` + `harness:widget-contract` 통과
- [ ] 5 cluster_id (politics/society/economy/tech/culture) 직접 방문 시각 확인

---

**End of v1.6.3 patch — 2026-05-02**
