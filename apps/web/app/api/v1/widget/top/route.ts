/**
 * GET /api/v1/widget/top?size=small|medium|large
 *
 * PRD v1.6 §8 Widget API Contract (v1.6.1 patch: large = 10).
 *
 * - p95 ≤ 300ms (Sprint 0 will measure)
 * - `ad_allowed` per cluster (false for politics/military/medical per §9.7)
 * - No bias_score / factuality_score / embedding (rule 4)
 *
 * Mock data rotates every minute (deterministic — see lib/mock/clusters).
 * Cache-Control aligned to 60s so the CDN edge serves the same payload
 * within a minute and refreshes when rotation advances.
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
    const [first] = rotateClusters(now, 1)
    if (!first) {
      return NextResponse.json({ error: 'no_clusters' }, { status: 503 })
    }
    const enriched = enrichWithAffiliate({ ...first, updated_at }, now)
    const payload = WidgetSmallResponseSchema.parse(enriched)
    return NextResponse.json(payload, { headers: COMMON_HEADERS })
  }

  if (sizeResult.data === 'medium') {
    const clusters = rotateClusters(now, 3).map((c) =>
      enrichWithAffiliate({ ...c, updated_at }, now),
    )
    const payload = WidgetMediumResponseSchema.parse({ clusters, updated_at })
    return NextResponse.json(payload, { headers: COMMON_HEADERS })
  }

  // large — Top 20 (v1.7.2 Concept C 디자인, Claude Design 2026-05-10)
  const clusters = rotateClusters(now, 20).map((c) =>
    enrichWithAffiliate({ ...c, updated_at }, now),
  )
  const payload = WidgetLargeResponseSchema.parse({
    clusters,
    methodology_version: METHODOLOGY_VERSION,
    overall_diversity_index: rotationDiversityIndex(now),
    updated_at,
  })
  return NextResponse.json(payload, { headers: COMMON_HEADERS })
}
