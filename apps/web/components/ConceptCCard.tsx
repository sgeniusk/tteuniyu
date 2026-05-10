/**
 * ConceptCCard — /widget Top 20 카드 (Claude Design Concept C, 2026-05-10).
 *
 * Layout — rank column (40-44px, category icon + rank number + trend) | content (title + bottom row).
 * Bottom row — 매체 dot ●●●● + (TrustTag OR "N개 매체") + spacer + relative time.
 *
 * 변호사 권고 (ADR-015 Amendment 2 + PRD v1.7.2) 적용.
 *  - TrustTag UI 라벨 매핑 (검증 필요/제목-본문 괴리 가능성/표본 부족/기업 관련 이슈)
 *  - hoax/clickbait 제목 색상 red-300 (다크 배경 가독성)
 *  - 매체 dot slate-400 단일 (4색 분류 X)
 *
 * Hover/click — Link로 /cluster/[id] 이동. AdZone 안에 절대 렌더 X (P12).
 */

import Link from 'next/link'
import type { Route } from 'next'
import type { WidgetCluster } from '@/lib/api/widget-schemas'
import {
  TrustTag,
  pickTrustTag,
  headlineColorClass,
} from '@/components/TrustTag'
import { CategoryIcon } from '@/components/CategoryIcon'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ConceptCCardProps {
  cluster: WidgetCluster
  rank: number
}

type Trend = 'up' | 'down' | 'same' | 'new' | null

function trendKind(rank: number, previous: number | null | undefined): Trend {
  if (previous === null) return 'new'
  if (previous === undefined) return null
  if (previous > rank) return 'up'
  if (previous < rank) return 'down'
  return 'same'
}

const TREND_GLYPH: Record<Exclude<Trend, null>, { glyph: string; cls: string }> = {
  up: { glyph: '↑', cls: 'text-teal-400' },
  down: { glyph: '↓', cls: 'text-slate-500' },
  new: { glyph: 'NEW', cls: 'text-amber-400' },
  same: { glyph: '—', cls: 'text-slate-700' },
}

/** ADR-015 Amendment 2 — 매체 dot은 slate-400 단일 회색. 4색 분류 일체 금지. */
function MediaDots({ count, max = 4 }: { count: number; max?: number }) {
  const visible = Math.min(count, max)
  const overflow = count > max ? count - max : 0
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: visible }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="block h-1 w-1 shrink-0 rounded-full bg-slate-400"
        />
      ))}
      {overflow > 0 && (
        <span className="ml-0.5 text-[9px] text-slate-500">+{overflow}</span>
      )}
    </span>
  )
}

export function ConceptCCard({ cluster, rank }: ConceptCCardProps) {
  const href = `/cluster/${cluster.cluster_id}` as Route
  const trend = trendKind(rank, cluster.previous_rank)
  const trustTag = pickTrustTag(cluster.trust_tags ?? [])
  const titleColor = headlineColorClass(trustTag)

  // 보도한 매체 수 — outlets_count 우선, fallback으로 coverage 합산.
  const outletsCount =
    cluster.outlets_count ||
    cluster.coverage.progressive +
      cluster.coverage.mixed +
      cluster.coverage.conservative +
      cluster.coverage.foreign

  return (
    <Link
      href={href}
      aria-label={`${rank}위 — ${cluster.title} 상세 보기`}
      className={cn(
        'group flex items-stretch overflow-hidden rounded-sm border border-slate-800/80 bg-slate-900/30',
        'transition-colors duration-fast hover:border-slate-700 hover:bg-teal-500/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
        'border-l-[3px] border-l-transparent hover:border-l-teal-500',
      )}
    >
      {/* Rank column — category icon + rank number + trend */}
      <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-slate-800/60 bg-slate-950/50 px-1 py-1.5 md:w-11">
        {cluster.category && (
          <CategoryIcon
            category={cluster.category}
            size={12}
            color="currentColor"
            className="text-slate-600 transition-colors duration-fast group-hover:text-teal-400"
          />
        )}
        <span
          className={cn(
            'font-mono text-base font-bold leading-none transition-colors duration-fast',
            'text-slate-700 group-hover:text-teal-400',
          )}
        >
          {String(rank).padStart(2, '0')}
        </span>
        {trend && (
          <span
            aria-label={`순위 변동 ${trend}`}
            className={cn(
              'font-mono font-bold leading-none',
              trend === 'new' ? 'text-[7px]' : 'text-[10px]',
              TREND_GLYPH[trend].cls,
            )}
          >
            {TREND_GLYPH[trend].glyph}
          </span>
        )}
      </div>

      {/* Content — title (2-line clamp) + bottom row */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-2.5 py-1.5">
        <p
          className={cn(
            'line-clamp-2 break-keep text-[13px] font-semibold leading-snug',
            titleColor,
          )}
        >
          {cluster.title}
        </p>
        <div className="flex items-center gap-1.5 text-[10px]">
          <MediaDots count={outletsCount} />
          {trustTag ? (
            <TrustTag tag={trustTag} />
          ) : (
            <span className="font-mono text-slate-500">{outletsCount}개 매체</span>
          )}
          <span className="ml-auto font-mono text-slate-500">
            {relativeTime(cluster.updated_at)}
          </span>
        </div>
      </div>

      {/* Affordance */}
      <span
        aria-hidden="true"
        className="hidden shrink-0 items-center pr-3 text-slate-700 group-hover:text-teal-500 md:flex"
      >
        ↗
      </span>
    </Link>
  )
}
