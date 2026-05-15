// GET /api/v1/articles/recent — 최근 ingest된 기사 목록 (진단/검증용)
//
// 비협상 (CLAUDE.md rule 4) — bias_score, factuality_score, embedding 등
// 민감 컬럼 절대 노출 금지. select 컬럼을 명시적으로 화이트리스트.
//
// 운영 — Supabase 미설정 시 503 반환 (mock fallback X — 진단 페이지 본질이
// '실데이터 흐르는지' 검증이라 mock 의미 없음).

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { getServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RecentArticleSchema = z.object({
  id: z.string().uuid(),
  source_slug: z.string(),
  source_name: z.string(),
  url: z.string().url(),
  headline: z.string(),
  published_at: z.string(),
  ingested_at: z.string(),
})

export type RecentArticle = z.infer<typeof RecentArticleSchema>

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export async function GET(request: NextRequest) {
  const queryResult = QuerySchema.safeParse({
    limit: request.nextUrl.searchParams.get('limit'),
  })
  if (!queryResult.success) {
    return NextResponse.json(
      { error: 'invalid_query', details: queryResult.error.flatten() },
      { status: 400 },
    )
  }

  const supabase = getServerClient()
  if (!supabase) {
    return NextResponse.json(
      {
        error: 'supabase_not_configured',
        hint: 'apps/web/.env.local에 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 설정 필요.',
      },
      { status: 503 },
    )
  }

  // FK join — sources.name까지 함께 가져오기. RLS는 service_role 우회이므로
  // 명시적 컬럼 select로 rule 4 민감 필드 노출 차단.
  const { data, error } = await supabase
    .from('articles')
    .select(
      'id, source_slug, url, headline, published_at, ingested_at, sources!inner(name)',
    )
    .order('ingested_at', { ascending: false })
    .limit(queryResult.data.limit)

  if (error) {
    return NextResponse.json(
      { error: 'supabase_query_failed', message: error.message },
      { status: 500 },
    )
  }

  // sources join 평탄화
  const flattened = (data ?? []).map((row) => {
    // supabase-js v2 nested select은 sources를 배열 또는 객체로 반환 가능
    const src = Array.isArray(row.sources) ? row.sources[0] : row.sources
    return {
      id: row.id,
      source_slug: row.source_slug,
      source_name: src?.name ?? row.source_slug,
      url: row.url,
      headline: row.headline,
      published_at: row.published_at,
      ingested_at: row.ingested_at,
    }
  })

  return NextResponse.json(
    { count: flattened.length, articles: flattened },
    {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60',
      },
    },
  )
}
