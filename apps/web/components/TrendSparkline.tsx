/**
 * TrendSparkline — inline SVG sparkline (v1.6.5).
 *
 * Zero deps, ~60 lines. Linear interpolation between points + area fill.
 * Color defaults to design-token teal-500 (#14B8A6); pass `color` to override.
 *
 * Accessibility: requires aria-label so screen readers announce the trend
 * (e.g., "지난 7일 트렌드, 최근 값 78").
 *
 * Future swap: if hover/tooltip becomes a need (V0.5), replace internals
 * with Recharts <Sparklines> while keeping the same prop shape.
 */

interface TrendSparklineProps {
  data: readonly number[]
  width?: number
  height?: number
  color?: string
  ariaLabel: string
  /** Mark last point with a small dot (default true). */
  showLastDot?: boolean
}

const TEAL_500 = '#14B8A6'

export function TrendSparkline({
  data,
  width = 200,
  height = 40,
  color = TEAL_500,
  ariaLabel,
  showLastDot = true,
}: TrendSparklineProps) {
  if (data.length < 2) {
    return (
      <div
        role="img"
        aria-label={ariaLabel}
        style={{ width, height }}
        className="rounded-sm bg-slate-800/40"
      />
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2
  const usableHeight = height - 2 * padding
  const stepX = width / (data.length - 1)

  const points: Array<readonly [number, number]> = data.map((v, i) => {
    const x = i * stepX
    const y = padding + usableHeight - ((v - min) / range) * usableHeight
    return [x, y] as const
  })

  const pathD = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')

  const areaD = `${pathD} L ${width.toFixed(2)} ${(height - padding).toFixed(2)} L 0 ${(height - padding).toFixed(2)} Z`

  const lastPoint = points[points.length - 1]!

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
      style={{ display: 'block' }}
    >
      <path d={areaD} fill={color} fillOpacity="0.15" />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showLastDot && (
        <circle
          cx={lastPoint[0].toFixed(2)}
          cy={lastPoint[1].toFixed(2)}
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  )
}
