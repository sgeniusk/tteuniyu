/**
 * GET /api/v1/clusters/[id]
 *
 * Cluster Distribution detail — v1.6.5 patch.
 *
 * P0w returns mock content joined from:
 *   - lib/mock/clusters.ts        → SeedCluster (title, category, sample_quality)
 *   - lib/mock/clusters.ts        → clusterCoverageAt (minute-jittered counts)
 *   - lib/mock/cluster-details.ts → ai_analysis (why/coverage/entity_card?), outlet_reports, youtube_news?
 *   - lib/mock/outlets.ts         → outlet metadata (name, stance, base_url)
 *   - lib/mock/trend.ts           → 4-window time series (deterministic, ADR-008 mock)
 *
 * P0a (T-005/T-006/T-007) swaps mock joins for real Supabase reads:
 *   - articles + sources joined to cluster_id
 *   - summaries row by cluster_id (Claude Haiku output, prompt_version logged)
 *   - keyword_trends rows from background worker (ADR-008)
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
  type AiAnalysis,
  type OutletReport,
} from '@/lib/api/cluster-schemas'
import {
  findSeedById,
  clusterCoverageAt,
  METHODOLOGY_VERSION,
} from '@/lib/mock/clusters'
import { getClusterDetail } from '@/lib/mock/cluster-details'
import { findOutlet } from '@/lib/mock/outlets'
import { generateTrend } from '@/lib/mock/trend'
import { fetchClusterDetailFromSupabase } from '@/lib/clusters/detail-from-supabase'

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

  const now = new Date()
  const updated_at = now.toISOString()

  // ── Path 1: mock pool ───────────────────────────────────
  const seed = findSeedById(id)
  const detail = getClusterDetail(id)
  if (seed && detail) {
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

    const trend = generateTrend(seed.cluster_id, now)
    const ai_analysis: AiAnalysis = {
      why_trending: detail.ai_analysis.why_trending,
      coverage_summary: detail.ai_analysis.coverage_summary,
      deep: { entity_card: detail.ai_analysis.entity_card, trend },
    }
    const payload = ClusterDetailResponseSchema.parse({
      cluster_id: seed.cluster_id,
      title: seed.title,
      category: seed.category,
      coverage: clusterCoverageAt(seed, now),
      sample_quality: seed.sample_quality,
      ai_analysis,
      youtube_news: detail.youtube_news,
      outlets,
      methodology_version: METHODOLOGY_VERSION,
      updated_at,
    })
    return NextResponse.json(payload, { headers: COMMON_HEADERS })
  }

  // ── Path 2: Supabase fallback ───────────────────────────
  const live = await fetchClusterDetailFromSupabase(id)
  if (!live || live.outlets.length === 0) {
    return NextResponse.json(
      { error: 'not_found', message: 'cluster not in mock pool nor Supabase' },
      { status: 404 },
    )
  }

  // PR #45 Gemini 요약 머지 전엔 summaries 비어있음 → placeholder ai_analysis.
  // entity_card는 schema-required이므로 최소 형태로 채움 (실데이터는 PR #45에서).
  const why_trending =
    live.why_trending ??
    `${live.outlets.length}개 매체에서 동시에 보도된 주제입니다.`
  const coverage_summary =
    live.coverage_summary ??
    '본 클러스터의 종합 분석은 LLM 요약 워커가 활성화된 후 자동 갱신됩니다.'
  const ai_analysis: AiAnalysis = {
    why_trending,
    coverage_summary,
    deep: {
      entity_card: {
        definition: live.title,
        domain_facts: [
          { label: '매체 수', value: `${live.outlets.length}개` },
          { label: '클러스터 품질', value: live.sample_quality },
        ],
      },
      // ADR-008 keyword_trends 워커 미가동 — 임시로 mock trend 재사용 (deterministic).
      trend: generateTrend(live.cluster_id, now),
    },
  }

  const payload = ClusterDetailResponseSchema.parse({
    cluster_id: live.cluster_id,
    title: live.title,
    category: live.category,
    coverage: live.coverage,
    sample_quality: live.sample_quality,
    ai_analysis,
    outlets: live.outlets,
    methodology_version: METHODOLOGY_VERSION,
    updated_at,
  })
  return NextResponse.json(payload, {
    headers: { ...COMMON_HEADERS, 'X-Cluster-Source': 'supabase' },
  })
}
