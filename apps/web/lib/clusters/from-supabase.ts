// Supabase clusters → WidgetCluster 매핑 + mock fallback
//
// 비협상.
//   rule 4 — bias_score, factuality_score, embedding 등 민감 컬럼 select X.
//             명시적 화이트리스트만.
//   rule 11 — service_role only (server-only).
//
// 데이터 누적 단계 — clusters 테이블이 N개 미만이면 부족분을 mock으로 padding.
// 이렇게 해야 WidgetLargeResponseSchema(.length(20)) 검증 통과 + 실데이터로 자연스러운 transition.

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { getServerClient } from '@/lib/supabase/server'
import type { WidgetCluster } from '@/lib/api/widget-schemas'

interface SupabaseClusterRow {
  id: string
  title: string
  category: string | null
  sample_quality: 'insufficient_sample' | 'low_confidence' | 'sufficient'
  trust_tags: string[] | null
  ad_allowed: boolean
  outlets_count: number | null
  coverage: { progressive: number; mixed: number; conservative: number; foreign: number } | null
  updated_at: string
}

type LatestArticle = { headline: string; published_at: string }

const VALID_TRUST_TAGS = new Set(['hoax', 'clickbait', 'low_confidence', 'investment'])
const VALID_CATEGORIES = new Set([
  'politics',
  'society',
  'economy',
  'international',
  'tech_science',
  'culture_sports',
  'lifestyle',
])

function mapRow(row: SupabaseClusterRow, latest?: LatestArticle): WidgetCluster {
  const trustTags = (row.trust_tags ?? []).filter((t) => VALID_TRUST_TAGS.has(t)) as WidgetCluster['trust_tags']
  const category =
    row.category && VALID_CATEGORIES.has(row.category) ? (row.category as WidgetCluster['category']) : undefined
  return {
    cluster_id: row.id,
    title: row.title,
    coverage: row.coverage ?? { progressive: 0, mixed: 0, conservative: 0, foreign: 0 },
    sample_quality: row.sample_quality,
    updated_at: row.updated_at,
    ad_allowed: row.ad_allowed,
    category,
    previous_rank: null,
    trust_tags: trustTags,
    outlets_count: row.outlets_count ?? 0,
    latest_article: latest
      ? { headline: latest.headline.slice(0, 300), published_at: latest.published_at }
      : undefined,
  }
}

/**
 * 여러 cluster의 "최신 전개" — 각 cluster 소속 기사 중 가장 최근 발행 1건.
 * cluster_articles + articles JOIN 단일 IN 쿼리 → cluster별 published_at 최댓값.
 */
async function fetchLatestArticleByCluster(
  supabase: SupabaseClient,
  clusterIds: string[],
): Promise<Map<string, LatestArticle>> {
  const map = new Map<string, LatestArticle>()
  if (clusterIds.length === 0) return map

  const { data, error } = await supabase
    .from('cluster_articles')
    .select('cluster_id, article:articles!inner(headline, published_at)')
    .in('cluster_id', clusterIds)

  if (error) {
    console.error('[from-supabase] latest article fetch failed:', error.message)
    return map
  }

  const nowIso = new Date().toISOString()
  for (const row of data ?? []) {
    const r = row as { cluster_id: string; article: unknown }
    const art = (Array.isArray(r.article) ? r.article[0] : r.article) as
      | { headline?: string; published_at?: string }
      | null
    if (!art?.headline || !art.published_at) continue
    // 미래 시각(RSS 노이즈)은 "최신"으로 뽑히지 않도록 제외.
    if (art.published_at > nowIso) continue
    const prev = map.get(r.cluster_id)
    if (!prev || art.published_at > prev.published_at) {
      map.set(r.cluster_id, {
        headline: art.headline,
        published_at: art.published_at,
      })
    }
  }
  return map
}

/**
 * Supabase에서 최신 cluster N개 fetch.
 *
 * 정렬 — outlets_count DESC (multi-outlet 우선) → updated_at DESC.
 * 의미있는 cluster (여러 매체 동시 보도)가 위로 올라옴.
 */
export async function fetchTopClustersFromSupabase(
  limit: number,
): Promise<WidgetCluster[]> {
  const supabase = getServerClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('clusters')
    .select(
      // rule 4 — 민감 컬럼 (hoax_likelihood, clickbait_score 등 raw score) 제외.
      'id, title, category, sample_quality, trust_tags, ad_allowed, outlets_count, coverage, updated_at',
    )
    // velocity_score(최근 12h 활동량) 우선 — "지금 뜨는" 순위.
    // 동률 시 outlets_count(누적 보도 매체 수), 그 다음 최신순.
    .order('velocity_score', { ascending: false })
    .order('outlets_count', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[from-supabase] cluster fetch failed:', error.message)
    return []
  }

  const rows = (data ?? []) as SupabaseClusterRow[]
  // 각 cluster의 최신 전개 기사 1건 — 단일 IN 쿼리로 일괄 조회.
  const latestMap = await fetchLatestArticleByCluster(
    supabase,
    rows.map((r) => r.id),
  )
  return rows.map((row) => mapRow(row, latestMap.get(row.id)))
}

/**
 * Supabase 실데이터 + mock padding으로 정확히 N개 cluster 반환.
 * Supabase 부족 시 mock으로 채워 schema validation 통과.
 *
 * mock 항목엔 cluster_id를 'mock-' prefix로 부여해 detail 페이지에서 분기 가능.
 */
export async function fetchClustersWithMockFallback(
  limit: number,
  mockFallback: WidgetCluster[],
  updated_at: string,
): Promise<{ clusters: WidgetCluster[]; supabase_count: number }> {
  const live = await fetchTopClustersFromSupabase(limit)
  if (live.length >= limit) {
    return { clusters: live.slice(0, limit), supabase_count: limit }
  }
  const needed = limit - live.length
  const padding = mockFallback.slice(0, needed).map((c) => ({ ...c, updated_at }))
  return {
    clusters: [...live.map((c) => ({ ...c, updated_at })), ...padding],
    supabase_count: live.length,
  }
}
