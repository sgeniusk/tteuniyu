# T-W04: AdZone + Manual Affiliate Curation

| 항목 | 내용 |
|---|---|
| Phase | P0w |
| Day | D4~D6 (2026-04-25 ~ 2026-04-27) |
| 목적 | `<AdZone>` + `<AffiliateCard>` + 수동 큐레이션 시스템 + 쿠팡 API 런타임 호출 |
| PRD 참조 | v1.6 §4 P12, §6.4, §7.1 F-P0w-8, §9.6, §11.3.1~11.3.2 |
| ADR 참조 | **ADR-005 (필독), ADR-007 (필독)** |
| 선행 티켓 | T-W01, T-W02, T-W03 |
| 후속 티켓 | T-W05 Analytics + Exit Dashboard |

---

## Claude Code 프롬프트

```
Read before coding (CRITICAL):
- docs/prd-v1.6.md §4 P12, §6.4, §7.1 F-P0w-8, §9.6, §11.3.1, §11.3.2
- docs/adr/ADR-005-ad-zone-separation.md (full)
- docs/adr/ADR-007-affiliate-commerce-data-boundary.md (full)
- docs/harness-roadmap-v1.6.md "T-W04"
- Previous PRs: T-W01, T-W02, T-W03

This ticket implements the CORE of PRD v1.6 — the revenue zone
isolation contract (P12). Any violation undermines the entire
positioning of 뜬이유. Read ADR-005 and ADR-007 line by line.

## Scope
- `<AdZone>` component with route-based visibility
- `<AffiliateCard>` component with runtime-only data
- `<SponsoredCard>` placeholder (actual ad network in V0.5)
- Manual curation config + admin page
- Runtime affiliate API route (no storage)
- AdZone harness (ad-zone-boundary) full implementation

## 1. `<AdZone>` Wrapper Component

`apps/web/components/AdZone.tsx`:
```tsx
'use client'

import { ReactNode } from 'react'
import { useAdZoneVisibility } from '@/hooks/useAdZoneVisibility'

interface AdZoneProps {
  children: ReactNode
  slot: 'affiliate' | 'sponsored'
  cluster_id?: string
}

export function AdZone({ children, slot, cluster_id }: AdZoneProps) {
  const visible = useAdZoneVisibility()
  if (!visible) return null

  return (
    <div
      data-ad-zone={slot}
      data-cluster-id={cluster_id}
      className="mt-4 border-t border-slate-800 pt-4"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-slate-400">
          {slot === 'sponsored' ? 'Sponsored' : '연관 상품·서비스'}
        </span>
      </div>
      {children}
    </div>
  )
}
```

## 2. Route Visibility Hook

`apps/web/hooks/useAdZoneVisibility.ts`:
```tsx
'use client'

import { usePathname } from 'next/navigation'

const ALLOWED_ROUTES = ['/', '/widget', '/trends', '/embed/iframe']
const BLOCKED_PREFIXES = [
  '/cluster/',
  '/methodology',
  '/dispute',
  '/outlet-compare',
  '/admin',
]

export function useAdZoneVisibility(): boolean {
  const pathname = usePathname()

  if (BLOCKED_PREFIXES.some(p => pathname.startsWith(p))) return false
  if (ALLOWED_ROUTES.includes(pathname)) return true
  return false  // default deny
}
```

## 3. `<AffiliateCard>` Component

`apps/web/components/AffiliateCard.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { AffiliateSlot } from '@/lib/api/widget-schemas'
import posthog from 'posthog-js'

interface AffiliateCardProps {
  slot: AffiliateSlot
  cluster_id: string
}

export function AffiliateCard({ slot, cluster_id }: AffiliateCardProps) {
  if (!slot.enabled || !slot.affiliate_url) return null

  const handleClick = () => {
    posthog.capture('affiliate_link_clicked', {
      cluster_id,
      partner: slot.partner,
      product_title: slot.product_title,
    })
    window.open(slot.affiliate_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-3 bg-slate-900 rounded-lg hover:bg-slate-800 transition"
    >
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 bg-slate-800 rounded flex items-center justify-center">
          {/* Placeholder — we do NOT load external product images (ADR-007) */}
          <span className="text-slate-500 text-xs">Product</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-50 truncate">{slot.product_title}</p>
          <p className="text-xs text-slate-400 mt-1">{slot.label === 'Sponsored' ? 'Sponsored' : '연관 상품'}</p>
          <p className="text-xs text-slate-500 mt-2">상품 보러가기 →</p>
        </div>
      </div>
    </button>
  )
}
```

## 4. Manual Curation Config

`config/affiliate_manual_curation.yaml`:
```yaml
# v1.6 P0w — manual curation only. Max 5 active entries.
# Schema validated by harness:affiliate-link-provenance
entries:
  - id: "2026-04-25-01"
    issue_keyword: "아이폰 발표"
    partner: coupang
    product_title: "iPhone 16 정품 케이스"
    affiliate_url: "https://link.coupang.com/a/XXXXX?lptag=AFYYYY"  # lptag required
    label: Related
    valid_until: "2026-05-25"
    created_by: "taewook"
    notes: "아이폰 출시 이슈와 자연스러운 매칭"
```

Schema validator `config/affiliate-curation-schema.ts`:
```ts
export const AffiliateCurationEntrySchema = z.object({
  id: z.string(),
  issue_keyword: z.string().min(2),
  partner: z.enum(['coupang', '11st', 'amazon']),
  product_title: z.string().min(1).max(100),
  affiliate_url: z.string().url().refine(
    (url) => {
      // coupang lptag, 11st afId, amazon tag=
      return /lptag=|afId=|tag=/.test(url)
    },
    { message: 'Affiliate URL must contain partner tracking parameter' }
  ),
  label: z.enum(['Sponsored', 'Related']),
  valid_until: z.string().datetime(),
  created_by: z.string(),
  notes: z.string().optional(),
})

export const AffiliateCurationConfigSchema = z.object({
  entries: z.array(AffiliateCurationEntrySchema).max(5),
})
```

## 5. Affiliate Lookup API

`apps/web/app/api/v1/affiliate/lookup/route.ts`:
- GET only
- Query: `partner`, `issue_keyword`, `cluster_id`
- Reads `config/affiliate_manual_curation.yaml` at runtime
- Matches by `issue_keyword` (case-insensitive substring)
- Returns first non-expired match, or null
- **NEVER** calls Coupang Open API in P0w (P0w uses curated links only)
- **NEVER** inserts to DB
- **NEVER** caches (no Vercel Edge Cache, no Redis)
- Headers: `Cache-Control: no-store`

For V0.5 readiness, write the function signature:
```ts
async function fetchCoupangRuntime(keyword: string): Promise<AffiliateSlot | null> {
  throw new Error('V0.5 feature: not enabled in P0w')
}
```

## 6. Update Widget API

`apps/web/app/api/v1/widget/top/route.ts`:
- After building each cluster response, call `lookupAffiliateForCluster(cluster)`
  - This reads curation config + matches by title keyword
- Attach `affiliate_slot` to WidgetSmallResponse if match
- Keep `ad_allowed: true` for this endpoint

## 7. Inject AdZone into IssueCard

`apps/web/components/IssueCard.tsx`:
```tsx
{cluster.affiliate_slot?.enabled && (
  <AdZone slot="affiliate" cluster_id={cluster.cluster_id}>
    <AffiliateCard slot={cluster.affiliate_slot} cluster_id={cluster.cluster_id} />
  </AdZone>
)}
```

## 8. Admin Curation Page

`apps/web/app/admin/affiliate/page.tsx`:
- Protected route (P0w: Basic Auth via middleware, V1: OAuth)
- Table of existing entries from yaml
- Form to add new entry (writes to yaml file directly OR creates PR)
  - P0w simplest: form outputs yaml text that founder copies and commits
- Expiry warnings (7 days before valid_until)

## 9. Harness Implementation (v1.6 신규 2종)

### `harness/checks/assert-ad-zone-boundary.ts`

```ts
// Core logic:
// 1. AST scan of apps/web/**/*.tsx for <AdZone>, <AffiliateCard>, <SponsoredCard>
// 2. For each match, walk up the tree to find parent component file
// 3. If parent resides in any of:
//    - apps/web/app/cluster/[id]/**
//    - apps/web/app/methodology/**
//    - apps/web/app/dispute/**
//    - apps/web/app/outlet-compare/**
//    - apps/web/app/cluster/[id]/og/**
//    - apps/web/components/Coverage*.tsx
//    - apps/web/components/MethodologyPage.tsx
//    - apps/web/components/DisputePanel.tsx
//    then exit 1 with file path + line number
//
// 4. API response scan: fetch /api/v1/clusters/:id and /api/v1/methodology
//    (mock/fixture responses) — assert no `affiliate_slot` field
```

Use `@babel/parser` + AST traversal.

### `harness/checks/assert-affiliate-link-provenance.ts`

```ts
// 1. Load config/affiliate_manual_curation.yaml
// 2. Validate against AffiliateCurationConfigSchema (Zod)
// 3. Check each affiliate_url has required tracking param (lptag / afId / tag=)
// 4. Check valid_until is in future
// 5. grep for "INSERT INTO articles" + /coupang|11st|amazon/ patterns
// 6. grep for coupang API response field names being stored
// 7. Exit 1 on violation
```

## 10. Testing

E2E Playwright:
- Visit `/widget` → AdZone visible if matching curation exists
- Visit `/cluster/test-id` (mock placeholder page for now, real in T-007)
  → AdZone NOT rendered
- Click AffiliateCard → window.open called + PostHog event fired

Harness:
- `pnpm harness:ad-zone-boundary` — pass
- `pnpm harness:affiliate-link-provenance` — pass
- Intentional violation: add `<AdZone>` to `/methodology/page.tsx` → CI fail
- Intentional violation: add entry without lptag → harness fail

## Constraints (CLAUDE.md)
- **Rule 12 (P12)**: `<AdZone>` placement contract
- **Rule 13**: No affiliate data in DB
- Manual curation max 5 entries
- No auto-matching in P0w

## Testing Order
1. `pnpm typecheck`, `pnpm lint`
2. `pnpm harness:ad-zone-boundary`, `pnpm harness:affiliate-link-provenance`
3. Visit `/widget` locally → see AdZone on matching cards
4. Visit `/cluster/fake-id` → AdZone absent (placeholder page)
5. Adversarial commit test (revert after):
   - Place `<AdZone>` in DisputePanel.tsx → CI fail verified
   - Add entry with non-lptag URL → CI fail verified

## Output
- Screenshots: /widget with AdZone visible, /cluster/* without AdZone
- Harness stdout (pass + intentional fail)
- yaml file content
- PostHog test event

## PR Title
T-W04 adzone + manual affiliate curation (P0w D4-D6)

## PR Description
- PRD: v1.6 §4 P12 (critical), §7.1 F-P0w-8, §9.6
- ADR: **ADR-005 (full)**, **ADR-007 (full)**
- Safety checklist: 14 items, especially rule 12 + 13
- Out of scope: Auto-matching (V0.5), Ad network SDK (V1), Coupang runtime API (V0.5)
```

---

## Codex 검증 프롬프트

```
@codex review

CRITICAL: This PR implements P12 Revenue Zone Isolation. A missed leak
undermines the entire 뜬이유 positioning. Be extra adversarial.

Adversarial tasks:

Task A (MUST TRY): Place `<AdZone>` inside `<CoverageArea>` component.
Does harness:ad-zone-boundary catch it? Test with both direct import
and via a wrapper component.

Task B (MUST TRY): Place `<AffiliateCard>` without AdZone wrapper on
/cluster/:id page — does any safety net catch this, or do we need a
second check?

Task C: Can `useAdZoneVisibility` be bypassed by manually setting
`display: block` via inline style?

Task D: AffiliateCurationEntry validation — can attacker insert
malicious JavaScript into product_title (XSS on /widget page)?

Task E: Manual curation config file writes — any path traversal or
injection via the admin page?

Task F: window.open target="_blank" without rel="noopener" — tabnabbing?

Task G: Does attempting to INSERT coupang response into Supabase
trigger harness:affiliate-link-provenance? Test with INSERT disguised
as harmless (e.g., stored in a "note" field).

Task H: Missing lptag — will rejecting fail gracefully or break the page?

Task I: What happens if config/affiliate_manual_curation.yaml is
corrupted? Does widget still render?

Report blocking issues first. Treat any ad-zone-boundary false
negative as BLOCKING.
```

## 완료 기준
- [ ] `/widget` 특정 이슈 카드에 AdZone + AffiliateCard 렌더
- [ ] `/cluster/:id` (mock) 에 AdZone 부재 확인
- [ ] 쿠팡 API 호출 경로 부재 (P0w는 큐레이션만) 검증
- [ ] DB INSERT 경로 부재 검증
- [ ] `harness:ad-zone-boundary` 통과 + 고의 반례 2종 실패 확인
- [ ] `harness:affiliate-link-provenance` 통과 + 고의 반례 실패 확인
- [ ] `affiliate_link_clicked` PostHog 이벤트 발화
- [ ] Codex blocking 0

## 예상 소요 시간
Claude Code 6~8시간 (Harness AST 구현 포함) + Codex 1~2시간 = 이틀 (D4 오후 ~ D6)
