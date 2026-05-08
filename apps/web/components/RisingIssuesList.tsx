/**
 * Client-side polling list for /widget.
 *
 * SSR delivers initial Top 10 (instant first paint, SEO).
 * Then polls /api/v1/widget/top?size=large every 60s (PRD v1.6 §6.1).
 *
 * Polling pauses while the tab is hidden (Page Visibility API) to spare
 * server resources during idle browser tabs.
 */

'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  WidgetLargeResponseSchema,
  type WidgetLargeResponse,
} from '@/lib/api/widget-schemas'
import { IssueCard } from '@/components/IssueCard'
import { AdZone } from '@/components/AdZone'
import { AffiliateCard } from '@/components/AffiliateCard'
import { relativeTime } from '@/lib/format'

interface RisingIssuesListProps {
  initial: WidgetLargeResponse
  intervalMs?: number
}

const DEFAULT_INTERVAL_MS = 60_000

export function RisingIssuesList({
  initial,
  intervalMs = DEFAULT_INTERVAL_MS,
}: RisingIssuesListProps) {
  const [data, setData] = useState<WidgetLargeResponse>(initial)
  const [now, setNow] = useState<Date>(() => new Date())
  const [refreshing, setRefreshing] = useState(false)
  const inFlight = useRef(false)

  // Refresh data when tab is visible
  useEffect(() => {
    let cancelled = false

    async function refresh() {
      if (inFlight.current || document.hidden) return
      inFlight.current = true
      setRefreshing(true)
      try {
        const res = await fetch('/api/v1/widget/top?size=large', { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: unknown = await res.json()
        const parsed = WidgetLargeResponseSchema.parse(json)
        if (!cancelled) setData(parsed)
      } catch {
        // Silent fail — keep last good data, retry on next tick.
      } finally {
        inFlight.current = false
        if (!cancelled) setRefreshing(false)
      }
    }

    const dataTimer = setInterval(refresh, intervalMs)
    const onVisible = () => {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(dataTimer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])

  // Tick `now` every 15s so "X분 전" labels stay fresh between data refreshes
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(t)
  }, [])

  // T-W04: pick the first cluster (by rank) whose affiliate_slot is enabled
  // for the inline AdZone shown between rank 5 and 6.
  // ADR-007 + PRD §9.7: API has already enforced ad_allowed=false for
  // politics/military/medical, so this find naturally skips them.
  const adClusterForSlot = useMemo(
    () => data.clusters.find((c) => c.affiliate_slot?.enabled),
    [data.clusters],
  )

  return (
    <>
      <div className="flex items-center justify-between text-body-sm text-slate-400">
        <span>
          마지막 업데이트{' '}
          <time dateTime={data.updated_at}>{relativeTime(data.updated_at, now)}</time>
          {' · '}방법론{' '}
          <code className="font-mono">{data.methodology_version}</code>
          {data.overall_diversity_index !== null && (
            <>
              {' · '}다원성 지수{' '}
              <span className="font-mono">{data.overall_diversity_index.toFixed(2)}</span>
            </>
          )}
        </span>
        <span
          className={`inline-flex items-center gap-1 transition-opacity duration-fast ${
            refreshing ? 'opacity-100' : 'opacity-0'
          }`}
          aria-live="polite"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
          새로고침 중
        </span>
      </div>

      <ol
        aria-label="실시간 이슈 Top 10"
        className="grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-x-4 md:gap-y-1"
      >
        {data.clusters.map((cluster, idx) => (
          <Fragment key={cluster.cluster_id}>
            <li>
              <IssueCard cluster={cluster} rank={idx + 1} />
            </li>
            {/*
              T-W04: AdZone between rank 5 and 6 (replaces v1.6.2 hidden marker).
              Renders only when a curated affiliate slot is available;
              spans both grid columns on md+ for visual separation.
            */}
            {idx === 4 && adClusterForSlot?.affiliate_slot && (
              <li className="md:col-span-2">
                <AdZone
                  slot="affiliate"
                  cluster_id={adClusterForSlot.cluster_id}
                >
                  <AffiliateCard
                    slot={adClusterForSlot.affiliate_slot}
                    cluster_id={adClusterForSlot.cluster_id}
                  />
                </AdZone>
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </>
  )
}
