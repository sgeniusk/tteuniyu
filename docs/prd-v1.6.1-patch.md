# PRD v1.6.1 — Minor Patch (Top 10 + Live Simulation)

| 항목 | 내용 |
|---|---|
| 종류 | **Minor Patch** (ADR 발의 불필요, schema capacity 확장만) |
| 적용일 | 2026-04-25 |
| 부모 | `prd-v1.6.md` (확정본) |
| 영향 | §1.3, §7.1 F-P0w-1, §8.2 WidgetLargeResponseSchema |
| 호환성 | 위젯/Embed/Native 클라이언트는 모두 추가 cluster 5개를 무시 가능 (forward-compatible) |

---

## 변경 사유

T-W01 1차 데모에서 사용자(태욱) 피드백:
1. **클릭 유도 surface가 약함** — Top 5만 보여주면 "내 관심 이슈"가 들어올 확률이 절반. 위젯의 본질은 진입 surface 가치이므로 노출량을 2배로.
2. **데이터가 정적이면 위젯이 죽어 보임** — mock이라도 시간 흐름에 맞춰 변동되어야 "실시간 이슈" 약속과 정합.

---

## 변경 사항

### 1) `WidgetLargeResponseSchema` capacity 5 → 10

```diff
 export const WidgetLargeResponseSchema = z.object({
-  clusters: z.array(WidgetClusterSchema).length(5),
+  clusters: z.array(WidgetClusterSchema).length(10),
   methodology_version: z.string(),
   overall_diversity_index: z.number().min(0).max(1).nullable(),
   updated_at: z.string(),
 })
```

영향:
- `/widget` 페이지: Top 10 노출 (2열 × 5행)
- 모바일 widget large 위젯: 향후 스크롤 또는 페이지네이션 처리 (Sprint 0 / V0.5)
- payload 예산: 5KB → ~10KB로 상향 (Sprint 0의 `harness:widget-contract` 한도 갱신)

### 2) Mock data rotation (P0w mock 전용)

`apps/web/lib/mock/clusters.ts`:
- Pool 5개 → **15개**로 확장 (정치·경제·IT·사회·국제·문화 카테고리 균형)
- `rotateClusters(now, count)` 함수: 매 1분마다 시작 인덱스 회전
- `applyJitter(coverage, minute, idx)`: counts에 deterministic ±2 jitter
- 같은 분 → 같은 응답 (CDN cache friendly), 분 변경 → 순위 1칸 회전 + 미세 변동

### 3) 클라이언트 60초 polling (`<RisingIssuesList>`)

PRD v1.6 §6.1에 명시된 "SWR 60초 polling"의 자체 구현 버전 (외부 의존성 없음):
- Server Component: SSR 초기 fetch (instant first paint)
- Client island: `setInterval` 60초 + Page Visibility API (탭 숨김 시 일시 중단)
- 마지막 갱신 시각 + "새로고침 중" pulse 표시

### 4) `/api/v1/widget/top` Cache-Control 15분 → 60초

분 단위 rotation에 맞춰 CDN cache TTL 단축. `stale-while-revalidate=30` 추가로 사용자 체감 지연 최소화.

### 5) `ad_allowed` per cluster

15개 mock 중 정치·국방·의료 카테고리 4개는 `ad_allowed: false`로 설정 (PRD v1.6 §9.7 정치 카테고리 광고 제외 규칙 사전 검증).

---

## 변경하지 않는 것

- v1.6 §4 P12 수익 영역 분리 원칙 — 그대로
- ADR-005/006/007 — 그대로
- 18종 하네스 카탈로그 — 그대로 (단 `harness:widget-contract` 검증 length만 5→10 수정)
- 일정·예산·진입 조건 (ADR-006) — 그대로

---

## Verification

- [x] `apps/web/lib/api/widget-schemas.ts` Large length 10
- [x] `apps/web/lib/mock/clusters.ts` rotation + 15-pool
- [x] `/api/v1/widget/top?size=large` 응답 cluster 10개
- [x] `/widget` 페이지 60초 polling 시각 확인
- [ ] `harness/checks/assert-widget-contract.ts` length(10) 검증 갱신 (T-W01 PR에 포함)
- [ ] 분 경계에서 응답 변화 확인 (`curl` 두 번, 1분 간격)

---

## Forward Compatibility

- Embed Script (T-W02): Medium만 사용 → 영향 없음
- iOS Small Widget (T-B05 조건부): Small만 사용 → 영향 없음
- B2B API (V0.5): Large 응답 길이 가변으로 대응 — 본 patch가 그 첫 단계

**End of PRD v1.6.1 patch — 2026-04-25**
