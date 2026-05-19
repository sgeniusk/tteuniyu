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
import { isForeignSource } from '@/lib/clusters/foreign'

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

interface ClusterArticleMeta {
  /** cluster별 최신 발행 기사 1건. */
  latest: Map<string, LatestArticle>
  /** cluster별 국내 매체 기사 수. 외신 단독 클러스터 판별용. */
  domesticCount: Map<string, number>
  /** cluster_articles 조회 성공 여부. 실패 시 외신 필터를 적용하지 않음(안전 fallback). */
  ok: boolean
}

/**
 * 여러 cluster의 기사 메타 — cluster_articles + articles JOIN 단일 IN 쿼리.
 *   1. "최신 전개" — cluster별 published_at 최댓값 기사 1건.
 *   2. 국내 매체 기사 수 — 외신 단독 클러스터를 메인 순위에서 제외하기 위함.
 */
async function fetchClusterArticleMeta(
  supabase: SupabaseClient,
  clusterIds: string[],
): Promise<ClusterArticleMeta> {
  const latest = new Map<string, LatestArticle>()
  const domesticCount = new Map<string, number>()
  if (clusterIds.length === 0) return { latest, domesticCount, ok: true }

  const { data, error } = await supabase
    .from('cluster_articles')
    .select('cluster_id, article:articles!inner(headline, published_at, source_slug)')
    .in('cluster_id', clusterIds)

  if (error) {
    console.error('[from-supabase] cluster article meta fetch failed:', error.message)
    return { latest, domesticCount, ok: false }
  }

  const nowIso = new Date().toISOString()
  for (const row of data ?? []) {
    const r = row as { cluster_id: string; article: unknown }
    const art = (Array.isArray(r.article) ? r.article[0] : r.article) as
      | { headline?: string; published_at?: string; source_slug?: string }
      | null
    if (!art) continue

    // 국내 매체 기사 수 집계 — 외신 단독 클러스터 판별용.
    if (art.source_slug && !isForeignSource(art.source_slug)) {
      domesticCount.set(r.cluster_id, (domesticCount.get(r.cluster_id) ?? 0) + 1)
    }

    // 최신 전개 기사 — 미래 시각(RSS 노이즈)은 제외.
    if (!art.headline || !art.published_at) continue
    if (art.published_at > nowIso) continue
    const prev = latest.get(r.cluster_id)
    if (!prev || art.published_at > prev.published_at) {
      latest.set(r.cluster_id, {
        headline: art.headline,
        published_at: art.published_at,
      })
    }
  }
  return { latest, domesticCount, ok: true }
}

/**
 * Supabase에서 최신 cluster N개 fetch.
 *
 * 정렬 — velocity_score DESC → outlets_count DESC → updated_at DESC.
 * 외신 단독(국내 매체 기사 0건) 클러스터는 메인 순위에서 제외 — PRD §6,
 * 외신은 한국 이슈의 "외신 비교" 축이지 1차 순위 요소가 아님.
 * 제외 후에도 N개를 채우려 넉넉히 over-fetch.
 */
export async function fetchTopClustersFromSupabase(
  limit: number,
): Promise<WidgetCluster[]> {
  const supabase = getServerClient()
  if (!supabase) return []

  // 외신 단독 클러스터를 걸러낸 뒤에도 limit개를 채우기 위한 over-fetch.
  const overFetch = Math.max(limit * 4, limit + 20)

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
    .limit(overFetch)

  if (error) {
    console.error('[from-supabase] cluster fetch failed:', error.message)
    return []
  }

  const rows = (data ?? []) as SupabaseClusterRow[]
  // 각 cluster의 최신 전개 기사 + 국내 매체 기사 수 — 단일 IN 쿼리로 일괄 조회.
  const meta = await fetchClusterArticleMeta(
    supabase,
    rows.map((r) => r.id),
  )

  // 외신 단독(국내 매체 기사 0건) 클러스터 제외.
  // meta 조회 실패 시(ok=false)에는 필터를 적용하지 않음 — 안전 fallback.
  const visible = meta.ok
    ? rows.filter((r) => (meta.domesticCount.get(r.id) ?? 0) > 0)
    : rows

  return visible.slice(0, limit).map((row) => mapRow(row, meta.latest.get(row.id)))
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
