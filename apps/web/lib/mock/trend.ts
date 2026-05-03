/**
 * Mock keyword trend generator — v1.6.5 patch.
 *
 * Deterministic 4-window time series per cluster_id. Same input →
 * same output (cache-friendly). P0a swaps for real reads from
 * `keyword_trends` table populated by background workers (ADR-008).
 *
 * Values are normalized 0..100 (ADR-008 — never raw query counts,
 * preserving DataLab/GTrends ToS).
 *
 * Window grid:
 *   7d  → 168 hourly buckets
 *   30d → 30 daily buckets
 *   6m  → 26 weekly buckets
 *   1y  → 52 weekly buckets
 *
 * Shape: baseline sin/cos drift + cluster-specific phase + an "ignite"
 * spike near the most recent buckets so a cluster currently in the
 * widget Top 10 visibly shows the surge.
 */

import type {
  TrendAnalysis,
  TrendBucket,
  TrendWindow,
} from '@/lib/api/cluster-schemas'

const MS_PER_MINUTE = 60_000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR
const MS_PER_WEEK = 7 * MS_PER_DAY

interface WindowSpec {
  window: TrendWindow['window']
  bucketSizeMs: number
  count: number
}

const WINDOW_SPECS: readonly WindowSpec[] = [
  { window: '7d', bucketSizeMs: MS_PER_HOUR, count: 168 },
  { window: '30d', bucketSizeMs: MS_PER_DAY, count: 30 },
  { window: '6m', bucketSizeMs: MS_PER_WEEK, count: 26 },
  { window: '1y', bucketSizeMs: MS_PER_WEEK, count: 52 },
]

function hash(...nums: number[]): number {
  let h = 2166136261
  for (const n of nums) {
    h ^= n
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Convert cluster_id last hex chunk to a deterministic positive seed. */
function seedFromClusterId(clusterId: string): number {
  const tail = clusterId.replace(/-/g, '').slice(-8)
  return Number.parseInt(tail || '0', 16) || 1
}

function clamp01to100(v: number): number {
  return Math.max(0, Math.min(100, v))
}

function generateWindow(
  spec: WindowSpec,
  seed: number,
  now: Date,
  source: string,
): TrendWindow {
  const base = 30 + (hash(seed, 1) % 20) // baseline 30~50
  const amplitude = 15 + (hash(seed, 2) % 20) // 15~35
  const frequency = 0.15 + (hash(seed, 3) % 20) / 100 // 0.15~0.35 rad/bucket

  // Bucket alignment — last bucket end at the current hour/day/week boundary.
  const nowMs = now.getTime()
  const lastBucketStart = Math.floor(nowMs / spec.bucketSizeMs) * spec.bucketSizeMs

  const buckets: TrendBucket[] = []
  for (let i = 0; i < spec.count; i += 1) {
    const offset = spec.count - 1 - i
    const t = new Date(lastBucketStart - offset * spec.bucketSizeMs).toISOString()

    // Smooth wave + small per-bucket noise
    const wave = amplitude * Math.sin(frequency * i + (hash(seed, 4) % 100) / 100)
    const noise = ((hash(seed, i, 5) % 100) - 50) / 10 // ±5

    // "Ignite" spike: scaling factor ramps up exponentially in the last
    // ~5% of buckets so the visible surge matches "지금 뜨는 이슈".
    const tailFraction = Math.max(0, (i - spec.count * 0.95) / (spec.count * 0.05))
    const spike = tailFraction > 0 ? Math.pow(tailFraction, 2) * 35 : 0

    const v = clamp01to100(base + wave + noise + spike)
    buckets.push({ t, v: Number(v.toFixed(1)) })
  }

  return {
    window: spec.window,
    buckets,
    source,
    computed_at: now.toISOString(),
  }
}

/**
 * Build a complete TrendAnalysis (4 windows) for a given cluster.
 *
 * @param clusterId  UUID — used as deterministic seed.
 * @param now        Current time (defaults to new Date()).
 * @param source     Provenance string (default 'p0w-mock'); P0a will
 *                   pass per-window source ('datalab'|'gtrends'|...) and
 *                   set `cached: true`.
 */
export function generateTrend(
  clusterId: string,
  now: Date = new Date(),
  source = 'p0w-mock',
): TrendAnalysis {
  const seed = seedFromClusterId(clusterId)
  return {
    windows: WINDOW_SPECS.map((spec) => generateWindow(spec, seed, now, source)),
    cached: false,
  }
}

/** Convenience helper for tests / sparkline pre-compute. */
export function trendValues(window: TrendWindow): number[] {
  return window.buckets.map((b) => b.v)
}
