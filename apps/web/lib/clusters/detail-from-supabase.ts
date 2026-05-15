// Supabase clusters/cluster_articles/summaries → ClusterDetailResponse 매핑
//
// 비협상 (CLAUDE.md).
//   rule 4 — bias_score, factuality_score, embedding 컬럼 SELECT 금지.
//             명시 화이트리스트만.
//   rule 11 — service_role only (server-only).
//   rule 12 — affiliate_slot/ad_allowed 응답 X (CoverageDistribution surface).
//
// summaries 테이블이 비어있는 P0a Foundation 단계 — ai_analysis는 placeholder
// (PR #45 Gemini 요약 머지 후 실데이터로 자동 전환).

import 'server-only'

import { getServerClient } from '@/lib/supabase/server'
import { findOutlet } from '@/lib/mock/outlets'
import type { OutletReport, OutletStance } from '@/lib/api/cluster-schemas'
import type { Category, CoverageCounts, SampleQuality } from '@/lib/api/widget-schemas'

export interface SupabaseClusterDetail {
  cluster_id: string
  title: string
  category: Category | undefined
  sample_quality: SampleQuality
  coverage: CoverageCounts
  outlets: OutletReport[]
  /** summaries 행 — 없으면 caller가 placeholder ai_analysis 생성. */
  why_trending: string | null
  coverage_summary: string | null
  updated_at: string
}

const VALID_CATEGORIES = new Set([
  'politics',
  'society',
  'economy',
  'international',
  'tech_science',
  'culture_sports',
  'lifestyle',
])

interface ClusterRow {
  id: string
  title: string
  category: string | null
  sample_quality: SampleQuality
  coverage: CoverageCounts | null
  updated_at: string
}

interface ArticleJoinRow {
  article: {
    id: string
    headline: string
    url: string
    published_at: string
    source_slug: string
    sources: { name: string } | { name: string }[] | null
  }
}

interface SummaryRow {
  why_trending: string
  coverage_summary: string
}

/**
 * Supabase에서 cluster detail fetch. 미존재 시 null.
 * stance는 mock outlets 메타에서 lookup, 등록 안 된 매체는 'mixed' default.
 */
export async function fetchClusterDetailFromSupabase(
  clusterId: string,
): Promise<SupabaseClusterDetail | null> {
  const supabase = getServerClient()
  if (!supabase) return null

  // 1) clusters 행
  const { data: clusterData, error: clusterErr } = await supabase
    .from('clusters')
    .select('id, title, category, sample_quality, coverage, updated_at')
    .eq('id', clusterId)
    .maybeSingle()

  if (clusterErr || !clusterData) return null
  const cluster = clusterData as ClusterRow

  // 2) cluster_articles + articles + sources JOIN
  const { data: joinData } = await supabase
    .from('cluster_articles')
    .select(
      'article:articles!inner(id, headline, url, published_at, source_slug, sources!inner(name))',
    )
    .eq('cluster_id', clusterId)

  const outlets: OutletReport[] = ((joinData ?? []) as unknown as ArticleJoinRow[])
    .map((row): OutletReport | null => {
      const a = row.article
      if (!a) return null
      const src = Array.isArray(a.sources) ? a.sources[0] : a.sources
      const meta = findOutlet(a.source_slug)
      const stance: OutletStance = (meta?.stance as OutletStance | undefined) ?? 'mixed'
      return {
        outlet_slug: a.source_slug,
        outlet_name: src?.name ?? a.source_slug,
        stance,
        headline: a.headline.slice(0, 120),
        published_at: a.published_at,
        outlet_url: a.url,
      }
    })
    .filter((r): r is OutletReport => r !== null)

  // 3) summaries (optional — PR #45 머지 전엔 비어있음)
  const { data: sumData } = await supabase
    .from('summaries')
    .select('why_trending, coverage_summary')
    .eq('cluster_id', clusterId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const summary = sumData as SummaryRow | null

  return {
    cluster_id: cluster.id,
    title: cluster.title,
    category:
      cluster.category && VALID_CATEGORIES.has(cluster.category)
        ? (cluster.category as Category)
        : undefined,
    sample_quality: cluster.sample_quality,
    coverage: cluster.coverage ?? { progressive: 0, mixed: 0, conservative: 0, foreign: 0 },
    outlets,
    why_trending: summary?.why_trending ?? null,
    coverage_summary: summary?.coverage_summary ?? null,
    updated_at: cluster.updated_at,
  }
}
