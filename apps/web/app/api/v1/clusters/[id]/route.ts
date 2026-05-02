/**
 * GET /api/v1/clusters/[id]
 *
 * Cluster Distribution detail — v1.6.3 patch.
 *
 * P0w returns mock content joined from:
 *   - lib/mock/clusters.ts        → SeedCluster (title, category, sample_quality)
 *   - lib/mock/clusters.ts        → clusterCoverageAt (minute-jittered counts)
 *   - lib/mock/cluster-details.ts → ai_summary + outlet_reports
 *   - lib/mock/outlets.ts         → outlet metadata (name, stance, base_url)
 *
 * P0a (T-006/T-007) swaps mock joins for real Supabase reads:
 *   - articles + sources joined to cluster_id
 *   - summaries row by cluster_id (Claude Haiku output, prompt_version logged)
 *
 * Constraints (CLAUDE.md):
 * - rule 4: NEVER include bias_score / factuality_score / embedding /
 *   per-outlet score raw fields. Only aggregate `coverage` counts +
 *   per-outlet `stance` (illustrative, AllSides/Ad Fontes mapping in P0a).
 * - rule 11: Zod-validated response BEFORE return.
 * - rule 12 (P12): no `affiliate_slot` / `ad_allowed` fields here. This
 *   endpoint represents the Coverage Distribution surface — AdZone is
 *   structurally absent.
 */

import { NextResponse, type NextRequest } from 'next/server'
import {
  ClusterDetailResponseSchema,
  type OutletReport,
} from '@/lib/api/cluster-schemas'
import {
  findSeedById,
  clusterCoverageAt,
  METHODOLOGY_VERSION,
} from '@/lib/mock/clusters'
import { getClusterDetail } from '@/lib/mock/cluster-details'
import { findOutlet } from '@/lib/mock/outlets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COMMON_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
  'X-Methodology-Version': METHODOLOGY_VERSION,
} as const

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id

  if (!isUuid(id)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'cluster_id must be a UUID' },
      { status: 400 },
    )
  }

  const seed = findSeedById(id)
  const detail = getClusterDetail(id)
  if (!seed || !detail) {
    return NextResponse.json(
      { error: 'not_found', message: 'cluster not in P0w mock pool' },
      { status: 404 },
    )
  }

  const now = new Date()
  const updated_at = now.toISOString()

  // Compose outlet reports (mock) — drop entries whose outlet_slug isn't
  // in the registered pool so we never emit dangling references.
  const outlets: OutletReport[] = detail.outlet_reports
    .map((r): OutletReport | null => {
      const meta = findOutlet(r.outlet_slug)
      if (!meta) return null
      const published = new Date(now.getTime() - r.minutes_ago * 60_000).toISOString()
      return {
        outlet_slug: r.outlet_slug,
        outlet_name: r.outlet_name,
        stance: r.stance,
        headline: r.headline,
        published_at: published,
        outlet_url: `${meta.base_url}${r.path}`,
      }
    })
    .filter((r): r is OutletReport => r !== null)

  if (outlets.length === 0) {
    return NextResponse.json({ error: 'no_outlets' }, { status: 503 })
  }

  const payload = ClusterDetailResponseSchema.parse({
    cluster_id: seed.cluster_id,
    title: seed.title,
    category: seed.category,
    coverage: clusterCoverageAt(seed, now),
    sample_quality: seed.sample_quality,
    ai_analysis: detail.ai_analysis,
    outlets,
    methodology_version: METHODOLOGY_VERSION,
    updated_at,
  })

  return NextResponse.json(payload, { headers: COMMON_HEADERS })
}
