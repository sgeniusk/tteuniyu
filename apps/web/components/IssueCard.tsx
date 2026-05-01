/**
 * Single issue card on /widget — minimalist click-driver.
 *
 * v1.6.2 patch: Coverage Bar removed from this surface. The bar is now
 * shown only on /cluster/[id] detail (T-007), and only for politics /
 * society categories (other categories get different visualizations).
 *
 * Visible on the card: rank + title + (optional) ↑ trend or NEW badge.
 * Compact rows so the 2-column × 5-row Top 10 grid stays scannable on
 * mobile (sm 360 → md+ 2-col).
 *
 * Click → /cluster/[id]. AdZone NEVER renders here (P12, ADR-005).
 */

import Link from 'next/link'
import type { Route } from 'next'
import type { WidgetCluster } from '@/lib/api/widget-schemas'
import { cn } from '@/lib/utils'

interface IssueCardProps {
  cluster: WidgetCluster
  rank?: number
}

type Trend = 'up' | 'down' | 'same' | 'new' | null

function trendKind(rank: number | undefined, previous: number | null | undefined): Trend {
  if (rank === undefined) return null
  if (previous === null) return 'new'
  if (previous === undefined) return null
  if (previous > rank) return 'up'
  if (previous < rank) return 'down'
  return 'same'
}

export function IssueCard({ cluster, rank }: IssueCardProps) {
  const href = `/cluster/${cluster.cluster_id}` as Route
  const trend = trendKind(rank, cluster.previous_rank)

  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-md border border-transparent',
        'transition-colors duration-fast ease-standard',
        'hover:border-slate-800 hover:bg-slate-900/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
      )}
      aria-label={`${cluster.title} — 상세 보기`}
    >
      <article className="flex items-center gap-3 px-3 py-3">
        {rank !== undefined && (
          <span
            aria-label={`순위 ${rank}위`}
            className={cn(
              'w-7 shrink-0 text-center font-mono text-mono-lg tabular-nums',
              rank <= 3 ? 'text-teal-400' : 'text-slate-500',
            )}
          >
            {rank}
          </span>
        )}

        <h2 className="flex-1 truncate text-body-md font-medium text-slate-50">
          {cluster.title}
        </h2>

        {trend === 'up' && (
          <span aria-label="상승" className="shrink-0 text-teal-500" title="순위 상승">
            <ArrowUp />
          </span>
        )}
        {trend === 'new' && (
          <span
            aria-label="신규 진입"
            className="shrink-0 rounded-sm bg-amber-500/15 px-1.5 py-0.5 font-mono text-body-sm text-amber-400"
            title="신규 진입"
          >
            NEW
          </span>
        )}
        {/* down / same: intentionally not rendered (간결성). Data still available. */}
      </article>
    </Link>
  )
}

function ArrowUp() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      <path d="M6 2 L10 8 L7 8 L7 11 L5 11 L5 8 L2 8 Z" fill="currentColor" />
    </svg>
  )
}
