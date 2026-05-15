/**
 * GET /api/v1/widget/top?size=small|medium|large
 *
 * PRD v1.6 §8 Widget API Contract (v1.6.1 patch: large = 10, v1.7.2: large = 20).
 *
 * - p95 ≤ 300ms (Sprint 0 will measure)
 * - `ad_allowed` per cluster (false for politics/military/medical per §9.7)
 * - No bias_score / factuality_score / embedding (rule 4)
 *
 * 데이터 소스 — Supabase clusters 테이블 우선, 부족분은 mock으로 padding.
 * cluster-pending 워커가 아직 충분한 cluster를 만들지 못한 단계 (P0a Foundation)에서
 * 자연스러운 transition 보장. clusters 테이블 ≥ 20건 도달 시 100% 실데이터.
 *
 * Cache-Control 60s — Supabase 부담 완화 + edge cache 활용.
 */

import { NextResponse, type NextRequest } from 'next/server'
import {
  WidgetSizeSchema,
  WidgetSmallResponseSchema,
  WidgetMediumResponseSchema,
  WidgetLargeResponseSchema,
  type WidgetCluster,
} from '@/lib/api/widget-schemas'
import {
  rotateClusters,
  rotationUpdatedAt,
  rotationDiversityIndex,
  METHODOLOGY_VERSION,
} from '@/lib/mock/clusters'
import { lookupAffiliateForTitle } from '@/lib/affiliate/curation'
import { fetchClustersWithMockFallback } from '@/lib/clusters/from-supabase'

/**
 * v1.6.5+ T-W04: enrich each cluster with `affiliate_slot` from manual
 * curation (ADR-007). Politics/military/medical clusters carry
 * `ad_allowed=false` (PRD §9.7) so they NEVER receive an affiliate slot
 * even if keyword matches — defense in depth at the API boundary.
 */
function enrichWithAffiliate(cluster: WidgetCluster, now: Date): WidgetCluster {
  if (!cluster.ad_allowed) return cluster
  const slot = lookupAffiliateForTitle(cluster.title, now)
  if (!slot) return cluster
  return { ...cluster, affiliate_slot: slot }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COMMON_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
  'X-Methodology-Version': METHODOLOGY_VERSION,
} as const

export async function GET(request: NextRequest) {
  const sizeParam = request.nextUrl.searchParams.get('size') ?? 'medium'
  const sizeResult = WidgetSizeSchema.safeParse(sizeParam)
  if (!sizeResult.success) {
    return NextResponse.json(
      { error: 'invalid_size', allowed: ['small', 'medium', 'large'] },
      { status: 400 },
    )
  }

  const now = new Date()
  const updated_at = rotationUpdatedAt(now)

  if (sizeResult.data === 'small') {
    const mockSeed = rotateClusters(now, 1)
    const { clusters } = await fetchClustersWithMockFallback(1, mockSeed, updated_at)
    const first = clusters[0]
    if (!first) {
      return NextResponse.json({ error: 'no_clusters' }, { status: 503 })
    }
    const enriched = enrichWithAffiliate(first, now)
    const payload = WidgetSmallResponseSchema.parse(enriched)
    return NextResponse.json(payload, { headers: COMMON_HEADERS })
  }

  if (sizeResult.data === 'medium') {
    const mockSeed = rotateClusters(now, 3)
    const { clusters } = await fetchClustersWithMockFallback(3, mockSeed, updated_at)
    const enriched = clusters.map((c) => enrichWithAffiliate(c, now))
    const payload = WidgetMediumResponseSchema.parse({ clusters: enriched, updated_at })
    return NextResponse.json(payload, { headers: COMMON_HEADERS })
  }

  // large — Top 20 (v1.7.2 Concept C 디자인, Claude Design 2026-05-10)
  // Supabase 우선 + mock padding으로 schema .length(20) 보장.
  const mockSeed = rotateClusters(now, 20)
  const { clusters, supabase_count } = await fetchClustersWithMockFallback(
    20,
    mockSeed,
    updated_at,
  )
  const enriched = clusters.map((c) => enrichWithAffiliate(c, now))
  const payload = WidgetLargeResponseSchema.parse({
    clusters: enriched,
    methodology_version: METHODOLOGY_VERSION,
    overall_diversity_index: rotationDiversityIndex(now),
    updated_at,
  })
  // 운영 가시성 — 실데이터 비율 헤더로 노출 (X-Live-Cluster-Count).
  return NextResponse.json(payload, {
    headers: { ...COMMON_HEADERS, 'X-Live-Cluster-Count': String(supabase_count) },
  })
}
