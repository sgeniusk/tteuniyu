/**
 * AdZone — wrapper component enforcing P12 Revenue Zone Isolation
 * (T-W04 / PRD v1.6 §4 P12 / ADR-005).
 *
 * Renders a slate-bordered slot above its children with a "Sponsored" or
 * "연관 상품·서비스" label, but only on routes whitelisted by
 * `useAdZoneVisibility()`. On Coverage / methodology / dispute /
 * outlet-compare / admin routes, the hook returns false and this
 * component renders null — the harness (assert-ad-zone-boundary)
 * additionally scans the AST to catch placement violations at build time.
 *
 * Design tokens: border-slate-800 + slate-400 label, no animation
 * (prefers-reduced-motion safe).
 *
 * Children are typically <AffiliateCard /> or (V0.5) <SponsoredCard />.
 */

'use client'

import { type ReactNode } from 'react'
import { useAdZoneVisibility } from '@/hooks/useAdZoneVisibility'
import { cn } from '@/lib/utils'

interface AdZoneProps {
  children: ReactNode
  slot: 'affiliate' | 'sponsored'
  cluster_id?: string
  className?: string
}

const SLOT_LABEL = {
  affiliate: '연관 상품·서비스',
  sponsored: 'Sponsored',
} as const

export function AdZone({ children, slot, cluster_id, className }: AdZoneProps) {
  const visible = useAdZoneVisibility()
  if (!visible) return null

  return (
    <aside
      data-ad-zone={slot}
      data-cluster-id={cluster_id}
      aria-label={SLOT_LABEL[slot]}
      className={cn(
        'mt-3 flex flex-col gap-2 border-t border-slate-800 pt-3',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-body-sm uppercase tracking-wide text-slate-500">
          {SLOT_LABEL[slot]}
        </span>
      </div>
      {children}
    </aside>
  )
}
