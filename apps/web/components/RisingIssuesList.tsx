/**
 * Client-side polling list for /widget — Concept C 디자인 (v1.7.2, 2026-05-10).
 *
 * SSR delivers initial Top 20 (instant first paint, SEO).
 * Then polls /api/v1/widget/top?size=large every 60s (PRD v1.6 §6.1).
 *
 * Concept C 디자인 변경 (Claude Design 2026-05-10).
 *  - Top 10 → Top 20 (사용자 요청, 카드 압축으로 한 화면 적합)
 *  - 카드 컴포넌트 — IssueCard → ConceptCCard (rank column + content)
 *  - AdZone 1개 → 3개 (rank 6/7, 12/13, 16/17 사이)
 *  - 매체 dot slate-400 단일 (ADR-009 Amendment 1)
 *  - TrustTag UI 라벨 변호사 권고 매핑 (ADR-015 Amendment 2)
 *
 * Polling pauses while the tab is hidden (Page Visibility API).
 *
 * Defer to PR #21 / P0a — 카테고리 탭 필터 (6 tabs), 폴링 셔플 시뮬레이션.
 */

'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  WidgetLargeResponseSchema,
  type WidgetLargeResponse,
  type WidgetCluster,
} from '@/lib/api/widget-schemas'
import { ConceptCCard } from '@/components/ConceptCCard'
import { AdZone } from '@/components/AdZone'
import { AffiliateCard } from '@/components/AffiliateCard'
import { relativeTime } from '@/lib/format'

interface RisingIssuesListProps {
  initial: WidgetLargeResponse
  intervalMs?: number
}

const DEFAULT_INTERVAL_MS = 60_000

/** AdZone 삽입 위치 — rank 6/7, 12/13, 16/17 사이 (Claude Design 권고). */
const AD_INSERT_AFTER_RANKS = [6, 12, 16] as const

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

  /**
   * 3 AdZones — 첫 번째 affiliate_slot.enabled 클러스터 1건을 모든 슬롯에 재사용.
   * (P0w mock — 운영자 수동 큐레이션 1일 1회 한정. P0a 워커는 슬롯별 다른 매물).
   * ADR-007 + PRD §9.7 — politics/military/medical은 ad_allowed=false → API에서
   * 이미 affiliate_slot 미부여 → defense in depth.
   */
  const adClusterForSlot = useMemo<WidgetCluster | undefined>(
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
        aria-label="실시간 이슈 Top 20"
        className="grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-x-3 md:gap-y-1"
      >
        {data.clusters.map((cluster, idx) => {
          const rank = idx + 1
          const showAd =
            AD_INSERT_AFTER_RANKS.includes(rank as 6 | 12 | 16) &&
            adClusterForSlot?.affiliate_slot
          return (
            <Fragment key={cluster.cluster_id}>
              <li>
                <ConceptCCard cluster={cluster} rank={rank} />
              </li>
              {showAd && adClusterForSlot?.affiliate_slot && (
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
          )
        })}
      </ol>
    </>
  )
}
