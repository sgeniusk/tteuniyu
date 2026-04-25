/**
 * P0w mock cluster pool — 15 hardcoded items + time-based rotation.
 *
 * Replaced by real RSS-based clustering in T-006 (Python worker, P0a).
 *
 * Rotation strategy (deterministic, no randomness):
 * - Slice start index advances by 1 every minute (epoch-based).
 * - Wrap-around so Top 10 always returns 10 distinct clusters.
 * - Each minute, each cluster's coverage counts get a small jitter
 *   (-2..+2 per channel, deterministic per (minute, cluster_id, channel)).
 *
 * Result: same minute → same payload (cache-friendly). New minute →
 * order rotates by 1, counts shift slightly. Visually mimics a live feed.
 */

import type { WidgetCluster, CoverageCounts } from '@/lib/api/widget-schemas'

interface SeedCluster {
  cluster_id: string
  title: string
  base_coverage: CoverageCounts
  sample_quality: WidgetCluster['sample_quality']
  /** v1.6 §9.7: politics/election → no ads/affiliate even in AdZone routes. */
  ad_allowed: boolean
}

const POOL: readonly SeedCluster[] = [
  {
    cluster_id: '00000000-0000-4000-8000-000000000001',
    title: '미국 연준 5월 금리 동결 시사',
    base_coverage: { progressive: 4, mixed: 6, conservative: 5, foreign: 3 },
    sample_quality: 'sufficient',
    ad_allowed: true,
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000002',
    title: '국민연금 개편안 4분의 1 가입자 영향',
    base_coverage: { progressive: 8, mixed: 4, conservative: 3, foreign: 1 },
    sample_quality: 'sufficient',
    ad_allowed: false, // 정치/연금 정책 — 광고 제외
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000003',
    title: '서울시 청년 월세 지원 확대 발표',
    base_coverage: { progressive: 5, mixed: 7, conservative: 6, foreign: 0 },
    sample_quality: 'sufficient',
    ad_allowed: true,
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000004',
    title: 'OpenAI 신규 한국어 모델 공개',
    base_coverage: { progressive: 2, mixed: 3, conservative: 1, foreign: 9 },
    sample_quality: 'low_confidence',
    ad_allowed: true,
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000005',
    title: '제주 해녀 문화 유네스코 추가 등재 추진',
    base_coverage: { progressive: 3, mixed: 4, conservative: 2, foreign: 1 },
    sample_quality: 'sufficient',
    ad_allowed: true,
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000006',
    title: '삼성전자 1분기 반도체 흑자 전환',
    base_coverage: { progressive: 6, mixed: 9, conservative: 7, foreign: 4 },
    sample_quality: 'sufficient',
    ad_allowed: true,
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000007',
    title: '의대 정원 증원 분쟁 6개월 합의안 도출',
    base_coverage: { progressive: 5, mixed: 6, conservative: 7, foreign: 1 },
    sample_quality: 'sufficient',
    ad_allowed: false, // 의료 정책 — 광고 제외 (감수성)
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000008',
    title: '카카오 신규 AI 비서 베타 공개',
    base_coverage: { progressive: 4, mixed: 5, conservative: 3, foreign: 2 },
    sample_quality: 'sufficient',
    ad_allowed: true,
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000009',
    title: '북한 단거리 미사일 동해 발사',
    base_coverage: { progressive: 3, mixed: 5, conservative: 8, foreign: 6 },
    sample_quality: 'sufficient',
    ad_allowed: false, // 국방/안보 — 광고 제외
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000010',
    title: '현대차 신형 전기차 사전예약 첫날 흥행',
    base_coverage: { progressive: 4, mixed: 8, conservative: 5, foreign: 3 },
    sample_quality: 'sufficient',
    ad_allowed: true,
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000011',
    title: '봄철 미세먼지 농도 평년 대비 30% 증가',
    base_coverage: { progressive: 5, mixed: 6, conservative: 4, foreign: 1 },
    sample_quality: 'sufficient',
    ad_allowed: true,
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000012',
    title: '쿠팡 새벽배송 권역 전국 9개 도시 확대',
    base_coverage: { progressive: 3, mixed: 6, conservative: 4, foreign: 1 },
    sample_quality: 'low_confidence',
    ad_allowed: true,
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000013',
    title: '한국 영화 칸 영화제 경쟁 부문 2편 진출',
    base_coverage: { progressive: 5, mixed: 4, conservative: 3, foreign: 7 },
    sample_quality: 'sufficient',
    ad_allowed: true,
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000014',
    title: 'KBO 흥행 5년 만에 최다 관중 경신',
    base_coverage: { progressive: 4, mixed: 5, conservative: 4, foreign: 0 },
    sample_quality: 'sufficient',
    ad_allowed: true,
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000015',
    title: '동해 심해 가스전 시추 결과 공식 발표',
    base_coverage: { progressive: 1, mixed: 2, conservative: 1, foreign: 0 },
    sample_quality: 'insufficient_sample',
    ad_allowed: true,
  },
] as const

export const METHODOLOGY_VERSION = 'v0.1-p0w-mock'
export const OVERALL_DIVERSITY_INDEX = 0.62
export const POOL_SIZE = POOL.length

const MS_PER_MINUTE = 60_000

function minuteEpoch(now: Date): number {
  return Math.floor(now.getTime() / MS_PER_MINUTE)
}

/**
 * Tiny deterministic int hash — used for per-(minute, cluster, channel)
 * jitter so the simulation looks alive without flickering randomly.
 */
function hash(...nums: number[]): number {
  let h = 2166136261
  for (const n of nums) {
    h ^= n
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function jitter(base: number, seed: number, range = 2): number {
  if (base === 0) return 0
  const offset = (hash(seed) % (range * 2 + 1)) - range
  return Math.max(0, base + offset)
}

function applyJitter(coverage: CoverageCounts, minute: number, idx: number): CoverageCounts {
  return {
    progressive: jitter(coverage.progressive, hash(minute, idx, 0)),
    mixed: jitter(coverage.mixed, hash(minute, idx, 1)),
    conservative: jitter(coverage.conservative, hash(minute, idx, 2)),
    foreign: jitter(coverage.foreign, hash(minute, idx, 3)),
  }
}

/**
 * Returns `count` clusters starting from a minute-rotated offset.
 * `count` must be ≤ POOL_SIZE; wraps around if beyond pool end.
 */
export function rotateClusters(now: Date, count: number): WidgetCluster[] {
  if (count > POOL_SIZE) {
    throw new Error(`requested ${count} > pool size ${POOL_SIZE}`)
  }
  const minute = minuteEpoch(now)
  const start = minute % POOL_SIZE
  const updated_at = new Date(minute * MS_PER_MINUTE).toISOString()

  const out: WidgetCluster[] = []
  for (let i = 0; i < count; i += 1) {
    const seed = POOL[(start + i) % POOL_SIZE]!
    out.push({
      cluster_id: seed.cluster_id,
      title: seed.title,
      coverage: applyJitter(seed.base_coverage, minute, i),
      sample_quality: seed.sample_quality,
      updated_at,
      ad_allowed: seed.ad_allowed,
    })
  }
  return out
}

/** Minute-aligned timestamp shared across the response. */
export function rotationUpdatedAt(now: Date): string {
  return new Date(minuteEpoch(now) * MS_PER_MINUTE).toISOString()
}

/**
 * Diversity index also drifts slightly per minute (±0.05) for visual feedback.
 * Stays clamped to [0.4, 0.85].
 */
export function rotationDiversityIndex(now: Date): number {
  const minute = minuteEpoch(now)
  const drift = ((hash(minute, 999) % 100) - 50) / 1000
  const v = OVERALL_DIVERSITY_INDEX + drift
  return Math.max(0.4, Math.min(0.85, Number(v.toFixed(3))))
}
