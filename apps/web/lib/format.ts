/**
 * Locale-aware formatting helpers.
 *
 * Korean relative time + Coverage Distribution arithmetic.
 */

const RTF = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' })

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = now.getTime() - then
  const minutes = Math.round(diffMs / 60_000)
  if (Math.abs(minutes) < 60) return RTF.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return RTF.format(-hours, 'hour')
  const days = Math.round(hours / 24)
  return RTF.format(-days, 'day')
}

export interface CoverageLike {
  progressive: number
  mixed: number
  conservative: number
  foreign: number
}

export function totalCoverage(c: CoverageLike): number {
  return c.progressive + c.mixed + c.conservative + c.foreign
}
