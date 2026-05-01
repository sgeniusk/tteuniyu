# PRD v1.6.2 — Minor Patch (Categories + Hidden Coverage + Rank Trend)

| 항목 | 내용 |
|---|---|
| 종류 | **Minor Patch** (ADR 발의 불필요, 데이터 모델 확장 + UI 숨김 결정) |
| 적용일 | 2026-04-27 |
| 부모 | `prd-v1.6.md` (확정본) + `prd-v1.6.1-patch.md` |
| 영향 | §1.3, §6.4, §7.1 F-P0w-1, §8.2 schema, §12.1 component spec |
| 호환성 | API 응답에 `category` + `previous_rank` 필드 추가 — **forward-compatible** (구 클라이언트는 무시) |

---

## 변경 사유

T-W02 시각 검증 + 사용자 피드백 (실검위젯 앱 4-screenshot reference):

1. **Coverage Bar가 위젯 카드에서 클릭 의사 결정에 노이즈**
   진보/중도/보수 분포가 첫 진입 surface에 보이면 사용자는 "내 진영" 카드를 우선 클릭. **클릭률·다양성 모두 왜곡 가능**. 분포는 클릭 후 detail 페이지에서 보여주는 게 다양성 회복에 유리.

2. **카테고리에 따라 Coverage 의미가 다름**
   "OpenAI 한국어 모델" 같은 IT 이슈에 진보/중도/보수 분류 무의미. **정치·사회 카테고리에서만** 진영 분포가 의미 있음. 다른 카테고리는 다른 시각화(외신 비중·매체 다양도 지수)가 필요 — V0.5에서 결정.

3. **사용자 선호 가중**
   관심 분야(경제·국제·문화 등) 가중치를 순위에 반영하면 진입 surface 가치 강화. 개인화 첫 단계 — 데이터 구조만 P0w에, 알고리즘은 V0.5.

4. **Rank trend ↑↓→**
   분 단위 회전 시 화살표로 "지금 뜨는 이슈" 직관 강화 (실검위젯 앱 reference). minute 경계 회전이 자연스럽게 trend 데이터를 만들어냄.

---

## 7가지 변경

- **C-1 카테고리 7개 enum**: `politics / society / economy / international / tech_science / culture_sports / lifestyle`. 정치·사회 분리(사용자 선택안 B).
- **C-2 위젯/임베드 카드에서 Coverage Bar UI 숨김**: API 응답엔 유지, `/cluster/[id]` detail(T-007)에서만 노출.
- **C-3 Coverage 분포 의미는 `politics` + `society` 카테고리에서만**: detail 페이지에서 카테고리 검사 후 렌더 (V0.5에서 다른 카테고리용 시각화 검토).
- **C-4 Rank trend ↑↓→ 표시**: `cluster.previous_rank` 필드 추가. 위젯 카드 우측에 화살표 (실검위젯 앱 패턴).
- **C-5 사용자 선호 hook**: `useCategoryPrefs()` localStorage 기반 가중치(0~1.5), **UI 노출 X** (T-W04+ 또는 V0.5에서 settings 페이지).
- **C-6 카테고리는 데이터만, UI 미표시**: 위젯/임베드에 카테고리 라벨/탭 노출 X. 향후 settings/필터에서 사용.
- **C-7 광고 슬롯 placeholder 위치 예약**: `RisingIssuesList`의 5번/6번 카드 사이에 AdZone marker (T-W04에서 채움).

---

## 데이터 모델 변경

### `WidgetClusterSchema` 확장 (apps/web/lib/api/widget-schemas.ts)

```diff
 const ClusterCore = z.object({
   cluster_id: z.string().uuid(),
   title: z.string().min(1).max(60),
   coverage: CoverageCountsSchema,
   sample_quality: SampleQualitySchema,
   updated_at: z.string(),
   ad_allowed: z.boolean(),
   affiliate_slot: AffiliateSlotSchema.optional(),
+  category: CategorySchema.optional(),         // C-1
+  previous_rank: z.number().int().min(1).max(50).nullable().optional(),  // C-4
 })
```

### `CategorySchema` 신규

```ts
export const CategorySchema = z.enum([
  'politics',
  'society',
  'economy',
  'international',
  'tech_science',
  'culture_sports',
  'lifestyle',
])

export const COVERAGE_RELEVANT_CATEGORIES = ['politics', 'society'] as const
```

### Mock 분류 (mock pool 15개)

| Category | Count | 예시 |
|---|---|---|
| `politics` | 2 | 국민연금 개편, 의대 정원 합의 |
| `society` | 2 | 서울 청년 월세 지원, 미세먼지 |
| `economy` | 5 | 연준 금리, 삼성 반도체, 현대차 EV, 쿠팡 새벽배송, 동해 가스전 |
| `international` | 1 | 북한 미사일 |
| `tech_science` | 2 | OpenAI 한국어 모델, 카카오 AI 비서 |
| `culture_sports` | 3 | 제주 해녀 유네스코, 칸 영화제, KBO 흥행 |
| `lifestyle` | 0 | (mock에 없음, 향후 RSS에서 자연 발생) |

---

## UI 정책 매트릭스 (v1.6.2 기준)

| 영역 | 카테고리 표시 | Coverage Bar | Rank Trend | AdZone |
|---|---|---|---|---|
| `/widget` Top 10 | ❌ | ❌ (숨김) | ✅ | T-W04 |
| `/embed/iframe` | ❌ | ❌ (숨김) | ✅ | 영구 X (호스트 컨텍스트) |
| `/cluster/[id]` (T-007) | ✅ | ✅ politics/society만 | — | ❌ (P12) |
| `/api/v1/widget/top` | ✅ (필드) | ✅ (필드) | ✅ (필드) | T-W04 |

---

## 변경하지 않는 것

- v1.6 §4 P12 수익 영역 분리 — 그대로
- ADR-005/006/007 — 그대로
- 18종 하네스 카탈로그 — 그대로 (단 `harness:widget-contract`는 새 필드 forward-compatible 검증)
- `/api/v1/widget/top` 사이즈별 length (small=1 / medium=3 / large=10) — 그대로
- 일정·예산·진입 조건 — 그대로

---

## Forward Compatibility

- **Embed iframe**: `category` / `previous_rank` 필드 무시해도 됨 (현재 사용 안 함)
- **iOS Native Widget** (T-B05 조건부): 향후 카테고리 필터링·UI에 활용
- **Creator Pro tier** (V0.5): 카테고리별 embed 필터링 가능 (`<script data-categories="economy,tech_science">`)
- **B2B Lite API** (V0.5): 카테고리별 키워드 알림

---

## Verification

- [ ] `WidgetClusterSchema`에 `category`, `previous_rank` (둘 다 optional 1차)
- [ ] Mock 15개 cluster에 `category` 부여
- [ ] `rotateClusters(now, count)`가 `previous_rank` 계산 (이전 minute에서 동일 cluster 위치)
- [ ] `/widget` 카드: CoverageBar 미렌더, ↑↓→ 화살표 렌더
- [ ] `/embed/iframe`: CoverageBar 미렌더, 화살표 렌더
- [ ] `/cluster/[id]` placeholder 그대로 (T-007에서 카테고리 검사)
- [ ] `useCategoryPrefs()` read/write 동작 (UI는 미노출)
- [ ] AdZone slot marker 위치 예약 (5/6번 사이) — 빈 div로 T-W04 대비
- [ ] `harness:realtime-naming` + `harness:widget-contract` 통과
- [ ] 분 경계에서 화살표 시각 변화

---

**End of v1.6.2 patch — 2026-04-27**
