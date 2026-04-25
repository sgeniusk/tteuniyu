/**
 * Single issue card on /widget — clickable wrapper around CoverageBar
 * with title, sample-quality badge, numeric labels.
 *
 * Sample quality 'insufficient_sample' suppresses numeric labels and
 * shows a "표본 부족" badge per PRD v1.6 §11 / harness:sample-quality-copy.
 */

import Link from 'next/link'
import type { Route } from 'next'
import type { WidgetCluster } from '@/lib/api/widget-schemas'
import { relativeTime, totalCoverage } from '@/lib/format'
import { CoverageBar } from '@/components/CoverageBar'
import { cn } from '@/lib/utils'

interface IssueCardProps {
  cluster: WidgetCluster
  rank?: number
}

const QUALITY_LABEL = {
  insufficient_sample: '표본 부족',
  low_confidence: '초기 감지',
  sufficient: '안정 표본',
} as const

export function IssueCard({ cluster, rank }: IssueCardProps) {
  const insufficient = cluster.sample_quality === 'insufficient_sample'
  const total = totalCoverage(cluster.coverage)
  const href = `/cluster/${cluster.cluster_id}` as Route

  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-lg border border-slate-800 bg-slate-900 p-5',
        'transition-colors duration-fast ease-standard',
        'hover:border-slate-700 hover:bg-slate-900/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
      )}
    >
      <article className="flex flex-col gap-4">
        <header className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3">
            {rank !== undefined && (
              <span
                aria-label={`순위 ${rank}위`}
                className={cn(
                  'shrink-0 font-mono text-mono-lg tabular-nums',
                  rank <= 3 ? 'text-teal-500' : 'text-slate-500',
                )}
              >
                {String(rank).padStart(2, '0')}
              </span>
            )}
            <h2 className="text-heading-md font-pretendard text-slate-50">{cluster.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-body-sm text-slate-400">
            {insufficient ? (
              <span className="rounded-sm bg-amber-500/10 px-2 py-0.5 text-amber-500">
                {QUALITY_LABEL.insufficient_sample}
              </span>
            ) : cluster.sample_quality === 'low_confidence' ? (
              <span className="rounded-sm bg-sky-500/10 px-2 py-0.5 text-sky-500">
                {QUALITY_LABEL.low_confidence}
              </span>
            ) : null}
            <span>표본 N={total}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={cluster.updated_at}>{relativeTime(cluster.updated_at)}</time>
          </div>
        </header>

        <CoverageBar coverage={cluster.coverage} insufficient={insufficient} />

        {insufficient ? (
          <p className="text-body-sm text-slate-400">
            분포는 곧 형성됩니다. 표본이 5건을 넘으면 자동 갱신됩니다.
          </p>
        ) : (
          <dl className="grid grid-cols-4 gap-2 text-body-sm">
            <CoverageStat label="진보" value={cluster.coverage.progressive} colorClass="text-coverage-progressive" />
            <CoverageStat label="중도·혼합" value={cluster.coverage.mixed} colorClass="text-coverage-mixed" />
            <CoverageStat label="보수" value={cluster.coverage.conservative} colorClass="text-coverage-conservative" />
            <CoverageStat label="외신" value={cluster.coverage.foreign} colorClass="text-coverage-foreign" />
          </dl>
        )}
      </article>
    </Link>
  )
}

function CoverageStat({
  label,
  value,
  colorClass,
}: {
  label: string
  value: number
  colorClass: string
}) {
  return (
    <div>
      <dt className="text-body-sm text-slate-500">{label}</dt>
      <dd className={cn('font-mono text-mono-lg', colorClass)}>{value}</dd>
    </div>
  )
}
