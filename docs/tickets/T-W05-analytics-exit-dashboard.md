# T-W05: Analytics Events + P0w Exit Dashboard

| 항목 | 내용 |
|---|---|
| Phase | P0w |
| Day | D6~D7 (2026-04-27 ~ 2026-04-28) |
| 목적 | 11개 필수 이벤트 완성 + PostHog Exit 판정 대시보드 + Exit 체크리스트 문서화 |
| PRD 참조 | v1.6 §7.1 F-P0w-7, §10 Success Metrics, §11.3.3 |
| ADR 참조 | ADR-006 (Native Widget Entry Condition) |
| 선행 티켓 | T-W01~T-W04 |
| 후속 티켓 | T-001 Sprint 0 Harness Scaffold |

---

## Claude Code 프롬프트

```
Read before coding:
- docs/prd-v1.6.md §7.1 F-P0w-7, §10 Revenue Metrics table, §11.3.3
- docs/adr/ADR-006-native-widget-staged-entry.md
- docs/harness-roadmap-v1.6.md "T-W05" + "P0w Exit Review Gate"
- Previous PRs: T-W01 ~ T-W04

This ticket completes the P0w instrumentation and provides the
objective gate for:
- P0w Go/No-Go decision
- iOS Small Widget P0b activation (per ADR-006)

## Scope
- Centralize all 11 required events
- Ensure each event is wired in correct component
- Build PostHog dashboard (config in code for reproducibility)
- Implement `assert-analytics-events` harness (full)
- Implement `assert-native-widget-entry-condition` harness (partial — PostHog API reader)
- Exit checklist document for founder

## 1. Event Constants `apps/web/lib/analytics/events.ts`

```typescript
export const EVENTS = {
  // Widget viewing
  WIDGET_VIEWED: 'widget_viewed',
  CLUSTER_CARD_CLICKED: 'cluster_card_clicked',

  // Revenue intent
  PRICING_CTA_CLICKED: 'pricing_cta_clicked',
  PRO_PREORDER_SUBMITTED: 'pro_preorder_submitted',
  CREATOR_WAITLIST_SUBMITTED: 'creator_waitlist_submitted',
  B2B_INQUIRY_SUBMITTED: 'b2b_inquiry_submitted',

  // Embed tracking
  EMBED_SCRIPT_LOADED: 'embed_script_loaded',
  EMBED_IFRAME_MOUNTED: 'embed_iframe_mounted',
  EMBED_CARD_CLICKED: 'embed_card_clicked',
  EMBED_INSTALLED: 'embed_installed',  // server-side from install API

  // Monetization
  AFFILIATE_LINK_CLICKED: 'affiliate_link_clicked',
  AD_CLICKED: 'ad_clicked',

  // API / B2B leads
  API_KEY_REQUESTED: 'api_key_requested',  // same as b2b_inquiry with use_case='api_integration'
} as const

export type EventName = typeof EVENTS[keyof typeof EVENTS]
```

Export typed helpers:
```typescript
export function captureEvent<K extends EventName>(
  event: K,
  properties?: Record<string, unknown>
) {
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties)
  }
}
```

## 2. Wire Events into Components

Verify each event fires from the correct place:

| Event | Location | Trigger |
|---|---|---|
| widget_viewed | `app/widget/page.tsx` | On mount (client hook) |
| cluster_card_clicked | `components/IssueCard.tsx` | onClick |
| pricing_cta_clicked | `components/ProWaitlistModal.tsx` | onOpen |
| pro_preorder_submitted | `components/ProWaitlistModal.tsx` | onSubmit success |
| creator_waitlist_submitted | `components/CreatorWaitlistForm.tsx` | onSubmit success |
| b2b_inquiry_submitted | `components/B2BInquiryForm.tsx` | onSubmit success |
| embed_script_loaded | `public/embed/widget.js` | script init |
| embed_iframe_mounted | `app/embed/iframe/page.tsx` | useEffect mount |
| embed_card_clicked | `app/embed/iframe/page.tsx` | IssueCard onClick within iframe |
| embed_installed | `app/api/v1/embed/install/route.ts` | server-side posthog-node |
| affiliate_link_clicked | `components/AffiliateCard.tsx` | onClick |
| ad_clicked | (placeholder for V0.5 ad network) | — |
| api_key_requested | derivation from b2b_inquiry with use_case='api_integration' | — |

## 3. Server-side PostHog

`apps/web/lib/analytics/posthog-server.ts`:
```typescript
import { PostHog } from 'posthog-node'

export const posthogServer = new PostHog(
  process.env.POSTHOG_PROJECT_API_KEY!,
  { host: 'https://app.posthog.com' }
)

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  posthogServer.capture({ distinctId, event, properties })
  await posthogServer.shutdown()
}
```

Use for `embed_installed` in install route.

## 4. `assert-analytics-events.ts` Harness

```typescript
// 1. Load EVENTS constants from apps/web/lib/analytics/events.ts
// 2. For each event, grep apps/web/**/*.{ts,tsx} + public/embed/widget.js
//    for `posthog.capture('${EVENT_NAME}')` or `captureEvent(EVENTS.XYZ)`
// 3. If any event has 0 matches, exit 1 with missing event name
// 4. Also detect typos: any posthog.capture(...) call with string literal
//    not in EVENTS constant → warn (not fail)
```

## 5. `assert-native-widget-entry-condition.ts` Harness (partial in T-W05)

```typescript
// P0w version: scaffold only, full implementation in Sprint 0 T-001
//
// 1. Detect if PR includes *.swift, *.xcodeproj, *.plist
// 2. If yes, require env POSTHOG_PERSONAL_API_KEY
// 3. Call PostHog API to get P0w Exit metrics:
//    - paid_intent_rate = count(intent_score ≥ 4) / count(widget_viewed)
//    - waitlist_count = distinct count(email) across all waitlist types
// 4. If paid_intent_rate < 0.04 OR waitlist_count < 100, exit 1
// 5. On `POSTHOG_BYPASS=true`, emit Slack webhook alert to founder
```

For P0w: implement the scaffold + env check + skip actual API call
(return pass without PostHog check). Full enforcement in T-001.

## 6. PostHog Dashboard Config

`config/posthog/dashboards/p0w-exit-gate.json`:
```json
{
  "name": "P0w Exit Gate",
  "tiles": [
    { "metric": "Waitlist Total", "formula": "distinct_count(email) WHERE waitlist_type IN ('pro_preorder', 'creator_embed', 'b2b_inquiry')" },
    { "metric": "Paid Intent Rate", "formula": "count(pro_preorder_submitted WHERE intent_score >= 4) / count(widget_viewed)" },
    { "metric": "Pro Preorder Count", "formula": "count(pro_preorder_submitted WHERE intent_score >= 4)" },
    { "metric": "Creator Waitlist", "formula": "count(creator_waitlist_submitted)" },
    { "metric": "B2B Inquiries", "formula": "count(b2b_inquiry_submitted)" },
    { "metric": "Affiliate + Ad Clicks", "formula": "count(affiliate_link_clicked) + count(ad_clicked)" },
    { "metric": "Embed Installs", "formula": "distinct_count(host) WHERE event = 'embed_installed'" }
  ],
  "exit_criteria": {
    "waitlist_total": 100,
    "paid_intent_count": 20,
    "creator_waitlist": 10,
    "b2b_inquiries": 3,
    "ad_affiliate_clicks": 20
  }
}
```

Commit this to repo so the dashboard can be recreated deterministically.

Create a helper script `scripts/posthog-dashboard-setup.ts` that reads
the JSON and provisions the PostHog dashboard via API (one-time setup).

## 7. Exit Checklist Document

`docs/p0w-exit-checklist.md`:

```markdown
# P0w Exit Review — 2026-04-28

## Automated Gates
- [ ] pnpm harness:all (partial, 4/18 for P0w)
  - assert-realtime-naming ✅/❌
  - assert-widget-contract ✅/❌
  - assert-monetization-claims ✅/❌
  - assert-analytics-events ✅/❌
  - assert-ad-zone-boundary ✅/❌
  - assert-affiliate-link-provenance ✅/❌

## Metric Gates (PostHog)
- [ ] 대기자 ≥ 100명 (현재: __)
- [ ] Pro Preorder (intent ≥ 4) ≥ 20건 (현재: __)
- [ ] Creator 대기자 ≥ 10명 (현재: __)
- [ ] B2B/API 문의 ≥ 3건 (현재: __)
- [ ] Ad/Affiliate 클릭 ≥ 20건 (현재: __)
- [ ] 광고 누수 0건 (Coverage 영역에서 ad_clicked 0회 — PostHog query)

## Legal / Ops Gates
- [ ] Naver 공식 문의 3건 발송 확인
- [ ] 법무 자문 1차 결과 수신 (Q-45)
- [ ] 15개 이상 매체 ToS 확인 진행 중

## Decision
- [ ] Go → Sprint 0 착수
- [ ] Partial Go (6/8) → Sprint 0 + P0a 일정 1주 연장
- [ ] No-Go → v1.7 PRD 발의

## iOS Small Widget Activation (ADR-006)
- Paid Intent Rate ≥ 4% AND 대기자 ≥ 100?
  - [ ] YES → T-B05 활성화, Swift 학습 리소스 큐레이션 시작
  - [ ] NO → T-B05 skip, Creator Embed 고도화로 자원 전환

## Q-44 결정
- 조건 숫자 보수성: 현재 수치 기반 상향 필요 여부 결정
```

## 8. Update `/widget` page footer

Add discreet admin link (only visible via `?admin=1` query param or
specific cookie) to the exit checklist page for founder reference.

## 9. Testing

- Fire each event manually (click through UI) → verify PostHog dashboard
- Check EVENTS constant covers all 11 events
- `pnpm harness:analytics-events` — detects missing wiring
- Adversarial test: comment out `captureEvent(EVENTS.PRO_PREORDER_SUBMITTED)`
  → harness fail

## Constraints (CLAUDE.md)
- PostHog distinct_id must be anonymous (no email in distinct_id)
- Server-side PostHog uses POSTHOG_PROJECT_API_KEY (not Personal Key)
- Never log intent_score with email in same event payload (privacy)

## Testing Order
1. `pnpm typecheck`, `pnpm lint`
2. Run through all 11 user actions locally, verify PostHog ingests
3. `pnpm harness:analytics-events` pass
4. Adversarial: comment out one capture call → harness fail → restore
5. `assert-native-widget-entry-condition` stub runs without error

## Output
- PostHog dashboard screenshot with all metric tiles
- Event list with counts after 24h burn-in
- docs/p0w-exit-checklist.md content

## PR Title
T-W05 analytics events + p0w exit dashboard (P0w D6-D7)

## PR Description
- PRD: v1.6 §7.1 F-P0w-7, §10, §11.3.3
- Requirement IDs: F-P0w-7
- ADR: ADR-006 (Native Widget Entry scaffold)
- Safety checklist
- Out of scope: Full native-widget-entry-condition with live PostHog API (T-001 Sprint 0)
```

---

## Codex 검증 프롬프트

```
@codex review

Adversarial tasks:

Task A: Can events fire WITHOUT corresponding user action? Test each
event's trigger — are there any useEffect dependencies that could fire
without actual user interaction?

Task B: Can attacker abuse PostHog capture on client to inflate
metrics? (e.g., loop fire of pro_preorder_submitted)? Do we have
server-side verification for key Exit metrics?

Task C: Is `distinct_id` PII-safe? Check it's never set to email
directly.

Task D: `assert-analytics-events` — can attacker add the event to
EVENTS const but never call it, and harness pass? (If grep matches
only the declaration, we have a false positive.)

Task E: Server-side PostHog shutdown — do we await properly to avoid
lost events?

Task F: `assert-native-widget-entry-condition` stub — when Swift file
is added in a future PR, does the stub gracefully escalate (not silent
pass)?

Task G: Exit checklist manual items vs automated items — is the
boundary clear enough that founder won't confuse them?

Report blocking issues.
```

## 완료 기준
- [ ] 11개 이벤트 모두 트리거 확인 (PostHog 실시간)
- [ ] Dashboard 생성 완료 + 체크리스트 metrics 실시간 연동
- [ ] `assert-analytics-events` 통과 + 고의 반례 실패 확인
- [ ] `assert-native-widget-entry-condition` 스캐폴드 실행 가능 (full은 T-001)
- [ ] `docs/p0w-exit-checklist.md` 작성 완료
- [ ] Codex blocking 0

## 예상 소요 시간
Claude Code 3~4시간 + Codex 1시간 = 반일 (D6 오후 ~ D7)

---

## P0w Exit 의사결정 (D7 태욱 수행)

D7 자정 이후 아래 절차:

1. `pnpm harness:all` (partial, available 6종) 실행
2. PostHog P0w Exit Gate dashboard 스크린샷
3. `docs/p0w-exit-checklist.md` 항목별 채우기
4. **Go / Partial Go / No-Go 결정**
5. **iOS Small Widget 활성화 판정** (ADR-006)
6. 결정 결과를 `docs/journal/2026-04-28-p0w-exit.md`에 기록
7. Sprint 0 (T-001) 착수 OR v1.7 PRD 발의 진행
