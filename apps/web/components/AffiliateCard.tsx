/**
 * AffiliateCard — clickable affiliate link card (T-W04 / ADR-007).
 *
 * P0w: data comes from `config/affiliate_manual_curation.yaml` via
 * `/api/v1/affiliate/lookup`, attached to widget responses as
 * `cluster.affiliate_slot`. NO product image is loaded (ADR-007 +
 * CLAUDE.md rule 13 — no coupang/11st/amazon image storage). A slate
 * placeholder block stands in for the image.
 *
 * Click behavior:
 * - Fires `affiliate_link_clicked` analytics event (server stub in P0w,
 *   PostHog in T-W05).
 * - window.open with target="_blank" rel="noopener noreferrer" to avoid
 *   tabnabbing.
 * - URL is the publisher-curated affiliate URL (lptag/afId/tag= already
 *   embedded by curator; harness:affiliate-link-provenance verifies).
 *
 * MUST be rendered inside <AdZone> (assert-ad-zone-boundary verifies in
 * Sprint 0). On non-allowed routes, AdZone returns null so this never
 * paints.
 */

'use client'

import type { AffiliateSlot } from '@/lib/api/widget-schemas'
import { track, EVENTS } from '@/lib/analytics/events'

interface AffiliateCardProps {
  slot: AffiliateSlot
  cluster_id: string
}

export function AffiliateCard({ slot, cluster_id }: AffiliateCardProps) {
  if (!slot.enabled || !slot.affiliate_url) return null

  function handleClick() {
    track(EVENTS.AFFILIATE_LINK_CLICKED, {
      cluster_id,
      partner: slot.partner,
      product_title: slot.product_title,
      label: slot.label,
    })
    window.open(slot.affiliate_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-start gap-3 rounded-md border border-slate-800 bg-slate-900 p-3 text-left transition-colors duration-fast hover:border-slate-700 hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      aria-label={`${slot.product_title ?? '제휴 상품'} — 외부 링크 새 탭으로 열기`}
    >
      {/* Product image is NEVER loaded externally (ADR-007). Placeholder only. */}
      <div
        aria-hidden="true"
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-slate-800 text-body-sm text-slate-600"
      >
        🛍
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-body-md font-medium text-slate-50">
          {slot.product_title ?? '연관 상품'}
        </p>
        <p className="mt-0.5 text-body-sm text-slate-500">
          {slot.label === 'Sponsored' ? 'Sponsored' : '연관 상품'} · 외부 링크
        </p>
        <p className="mt-2 text-body-sm text-teal-500">상품 보러가기 →</p>
      </div>
    </button>
  )
}
