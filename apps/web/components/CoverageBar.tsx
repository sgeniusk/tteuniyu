/**
 * Coverage Distribution mini bar — 4 segments per PRD v1.6 §12.1.
 *
 * Patterns + colors so colorblind users can distinguish segments
 * (PRD v1.6 §13.3 Accessibility).
 */

import { cn } from '@/lib/utils'
import type { CoverageCounts } from '@/lib/api/widget-schemas'
import { totalCoverage } from '@/lib/format'

interface CoverageBarProps {
  coverage: CoverageCounts
  insufficient?: boolean
  className?: string
}

const SEGMENTS = [
  {
    key: 'progressive' as const,
    label: '진보 성향',
    bg: 'bg-coverage-progressive',
    pattern:
      'bg-[image:repeating-linear-gradient(135deg,transparent_0_4px,rgba(255,255,255,0.18)_4px_5px)]',
  },
  {
    key: 'mixed' as const,
    label: '중도·혼합',
    bg: 'bg-coverage-mixed',
    pattern:
      'bg-[image:radial-gradient(circle,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[length:6px_6px]',
  },
  {
    key: 'conservative' as const,
    label: '보수 성향',
    bg: 'bg-coverage-conservative',
    pattern: '',
  },
  {
    key: 'foreign' as const,
    label: '외신',
    bg: 'bg-coverage-foreign',
    pattern:
      'bg-[image:repeating-linear-gradient(45deg,transparent_0_3px,rgba(255,255,255,0.22)_3px_4px)]',
  },
]

export function CoverageBar({ coverage, insufficient = false, className }: CoverageBarProps) {
  const total = totalCoverage(coverage)
  const ariaLabel = insufficient
    ? `보도 분포 표본 부족, 총 ${total}건`
    : `보도 분포: 진보 ${coverage.progressive}건, 중도·혼합 ${coverage.mixed}건, 보수 ${coverage.conservative}건, 외신 ${coverage.foreign}건`

  if (insufficient || total === 0) {
    return (
      <div
        role="img"
        aria-label={ariaLabel}
        className={cn('h-3 rounded-md bg-slate-800', className)}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn('flex h-3 w-full overflow-hidden rounded-md bg-slate-800', className)}
    >
      {SEGMENTS.map((segment) => {
        const value = coverage[segment.key]
        if (value === 0) return null
        const widthPct = (value / total) * 100
        return (
          <div
            key={segment.key}
            title={`${segment.label} ${value}건`}
            className={cn('h-full', segment.bg, segment.pattern)}
            style={{ width: `${widthPct}%` }}
          />
        )
      })}
    </div>
  )
}
