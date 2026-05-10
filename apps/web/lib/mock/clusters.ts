/**
 * P0w mock cluster pool — 15 hardcoded items + time-based rotation.
 *
 * Replaced by real RSS-based clustering in T-006 (Python worker, P0a).
 *
 * Rotation strategy (deterministic, no randomness):
 * - Slice start index advances by 1 every minute (epoch-based).
 * - Wrap-around so Top N always returns N distinct clusters.
 * - Each minute, each cluster's coverage counts get a small jitter
 *   (-2..+2 per channel, deterministic per (minute, cluster_id, channel)).
 * - v1.6.2: each cluster carries `category`, and `previous_rank` is
 *   computed against the previous minute's slice (null = newly entered top N).
 *
 * Result: same minute → same payload (cache-friendly). New minute →
 * order rotates by 1, counts shift slightly, trend arrows re-evaluate.
 */

import type {
  WidgetCluster,
  CoverageCounts,
  Category,
  TrustTag,
} from '@/lib/api/widget-schemas'

export interface SeedCluster {
  cluster_id: string
  title: string
  base_coverage: CoverageCounts
  sample_quality: WidgetCluster['sample_quality']
  /** v1.6 §9.7: politics/military/medical → no ads/affiliate even in AdZone routes. */
  ad_allowed: boolean
  /** v1.6.2 patch — required for routing rendering decisions. */
  category: Category
  /**
   * v1.7.2 — 클러스터 단위 Trust Tag (변호사 권고 ADR-015 Amendment 2).
   * P0w mock — 임의 부여로 시각 변별. P0a — LLM 워커 trust_signal_v1 산출.
   * UI 라벨 매핑은 components/TrustTag.tsx TRUST_TAG_CONFIG 참조.
   *  hoax / clickbait → "검증 필요" / "제목-본문 괴리 가능성" (red-600)
   *  low_confidence → "표본 부족" (amber-500)
   *  investment → "기업 관련 이슈" (amber-500)
   */
  trust_tags?: TrustTag[]
}

const POOL: readonly SeedCluster[] = [
  {
    cluster_id: '00000000-0000-4000-8000-000000000001',
    title: '미국 연준 5월 금리 동결 시사',
    base_coverage: { progressive: 4, mixed: 6, conservative: 5, foreign: 3 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'economy',
    trust_tags: ['investment'],
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000002',
    title: '국민연금 개편안 4분의 1 가입자 영향',
    base_coverage: { progressive: 8, mixed: 4, conservative: 3, foreign: 1 },
    sample_quality: 'sufficient',
    ad_allowed: false,
    category: 'politics',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000003',
    title: '서울시 청년 월세 지원 확대 발표',
    base_coverage: { progressive: 5, mixed: 7, conservative: 6, foreign: 0 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'society',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000004',
    title: 'OpenAI 신규 한국어 모델 공개',
    base_coverage: { progressive: 2, mixed: 3, conservative: 1, foreign: 9 },
    sample_quality: 'low_confidence',
    ad_allowed: true,
    category: 'tech_science',
    trust_tags: ['low_confidence'],
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000005',
    title: '제주 해녀 문화 유네스코 추가 등재 추진',
    base_coverage: { progressive: 3, mixed: 4, conservative: 2, foreign: 1 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'culture_sports',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000006',
    title: '삼성전자 1분기 반도체 흑자 전환',
    base_coverage: { progressive: 6, mixed: 9, conservative: 7, foreign: 4 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'economy',
    trust_tags: ['investment'],
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000007',
    title: '의대 정원 증원 분쟁 6개월 합의안 도출',
    base_coverage: { progressive: 5, mixed: 6, conservative: 7, foreign: 1 },
    sample_quality: 'sufficient',
    ad_allowed: false,
    category: 'politics',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000008',
    title: '카카오 신규 AI 비서 베타 공개',
    base_coverage: { progressive: 4, mixed: 5, conservative: 3, foreign: 2 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'tech_science',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000009',
    title: '북한 단거리 미사일 동해 발사',
    base_coverage: { progressive: 3, mixed: 5, conservative: 8, foreign: 6 },
    sample_quality: 'sufficient',
    ad_allowed: false,
    category: 'international',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000010',
    title: '현대차 신형 전기차 사전예약 첫날 흥행',
    base_coverage: { progressive: 4, mixed: 8, conservative: 5, foreign: 3 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'economy',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000011',
    title: '봄철 미세먼지 농도 평년 대비 30% 증가',
    base_coverage: { progressive: 5, mixed: 6, conservative: 4, foreign: 1 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'society',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000012',
    title: '쿠팡 새벽배송 권역 전국 9개 도시 확대',
    base_coverage: { progressive: 3, mixed: 6, conservative: 4, foreign: 1 },
    sample_quality: 'low_confidence',
    ad_allowed: true,
    category: 'economy',
    trust_tags: ['clickbait'],
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000013',
    title: '한국 영화 칸 영화제 경쟁 부문 2편 진출',
    base_coverage: { progressive: 5, mixed: 4, conservative: 3, foreign: 7 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'culture_sports',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000014',
    title: 'KBO 흥행 5년 만에 최다 관중 경신',
    base_coverage: { progressive: 4, mixed: 5, conservative: 4, foreign: 0 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'culture_sports',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000015',
    title: '동해 심해 가스전 시추 결과 공식 발표',
    base_coverage: { progressive: 1, mixed: 2, conservative: 1, foreign: 0 },
    sample_quality: 'insufficient_sample',
    ad_allowed: true,
    category: 'economy',
    trust_tags: ['hoax'],
  },
  // v1.7.2 — Concept C 디자인 Top 20을 위해 추가 (Claude Design 2026-05-10).
  {
    cluster_id: '00000000-0000-4000-8000-000000000016',
    title: '코스피 3,127 — 14개월 만에 3,100 재돌파',
    base_coverage: { progressive: 5, mixed: 9, conservative: 8, foreign: 5 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'economy',
    trust_tags: ['investment'],
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000017',
    title: '한미 관세 협상 잠정 타결 — 15%→8% 인하',
    base_coverage: { progressive: 6, mixed: 8, conservative: 5, foreign: 9 },
    sample_quality: 'sufficient',
    ad_allowed: false,
    category: 'international',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000018',
    title: '부동산 PF 정상화 기금 5조 조성',
    base_coverage: { progressive: 4, mixed: 7, conservative: 5, foreign: 2 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'economy',
    trust_tags: ['investment'],
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000019',
    title: 'KSTAR 핵융합 30초 운전 신기록 달성',
    base_coverage: { progressive: 2, mixed: 3, conservative: 1, foreign: 4 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'tech_science',
  },
  {
    cluster_id: '00000000-0000-4000-8000-000000000020',
    title: '개인정보보호위, 빅테크 과징금 1,200억 부과',
    base_coverage: { progressive: 4, mixed: 5, conservative: 3, foreign: 6 },
    sample_quality: 'sufficient',
    ad_allowed: true,
    category: 'society',
  },
] as const

export const METHODOLOGY_VERSION = 'v0.1-p0w-mock'
export const OVERALL_DIVERSITY_INDEX = 0.62
export const POOL_SIZE = POOL.length

const MS_PER_MINUTE = 60_000

function minuteEpoch(now: Date): number {
  return Math.floor(now.getTime() / MS_PER_MINUTE)
}

/** Tiny deterministic int hash. */
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
 * For a given minute and cluster_id, returns the cluster's 1-based rank
 * within the top `count` slice — or null if it wasn't in that slice.
 *
 * Used to compute `previous_rank` (v1.6.2 patch) so the UI can render
 * ↑/↓/→/NEW trend arrows.
 */
function rankAt(minute: number, clusterId: string, count: number): number | null {
  const start = ((minute % POOL_SIZE) + POOL_SIZE) % POOL_SIZE
  for (let i = 0; i < count; i += 1) {
    if (POOL[(start + i) % POOL_SIZE]!.cluster_id === clusterId) {
      return i + 1
    }
  }
  return null
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
    const cov = applyJitter(seed.base_coverage, minute, i)
    out.push({
      cluster_id: seed.cluster_id,
      title: seed.title,
      coverage: cov,
      sample_quality: seed.sample_quality,
      updated_at,
      ad_allowed: seed.ad_allowed,
      category: seed.category,
      previous_rank: rankAt(minute - 1, seed.cluster_id, count),
      // v1.7.2 — Concept C 디자인용 신규 필드.
      trust_tags: [...(seed.trust_tags ?? [])],
      outlets_count: cov.progressive + cov.mixed + cov.conservative + cov.foreign,
    })
  }
  return out
}

/** Minute-aligned timestamp shared across the response. */
export function rotationUpdatedAt(now: Date): string {
  return new Date(minuteEpoch(now) * MS_PER_MINUTE).toISOString()
}

/**
 * Diversity index drifts ±0.05 per minute (clamped to [0.4, 0.85]) so
 * the methodology label feels alive without flickering.
 */
export function rotationDiversityIndex(now: Date): number {
  const minute = minuteEpoch(now)
  const drift = ((hash(minute, 999) % 100) - 50) / 1000
  const v = OVERALL_DIVERSITY_INDEX + drift
  return Math.max(0.4, Math.min(0.85, Number(v.toFixed(3))))
}

/**
 * Lookup a SeedCluster by id (used by /api/v1/clusters/[id], v1.6.3).
 * Returns undefined if no match.
 */
export function findSeedById(id: string): SeedCluster | undefined {
  return POOL.find((s) => s.cluster_id === id)
}

/**
 * Compute jittered coverage for a given cluster at the current minute,
 * using the same hash basis as rotateClusters so detail page numbers
 * match the widget surface.
 */
export function clusterCoverageAt(
  seed: SeedCluster,
  now: Date = new Date(),
): CoverageCounts {
  const minute = minuteEpoch(now)
  // Use cluster_id-based index seed so detail counts don't shift with rank.
  const idIdx = Number.parseInt(seed.cluster_id.slice(-6), 16) % POOL_SIZE
  return applyJitter(seed.base_coverage, minute, idIdx)
}
