// /api/v1/topics — Custom Topic CRUD (ADR-018)
//
// 비협상.
//   - rule 11 — 클라이언트가 직접 Supabase 접근 X. 본 route handler 경유.
//   - 변호사 §1.3 — POST 시 keyword hard-block 40+ 단어 server-side 재검증.
//   - ADR-018 §2.1 — Tier 한도 enforcement.
//
// P0a UX skeleton — in-memory store. Supabase 합류는 후속 PR.

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { validateKeyword } from '@/lib/keyword-validator'
import {
  addTopic,
  canAddMore,
  countActive,
  deactivateTopic,
  listTopics,
  MOCK_USER_TIER,
  seedMockTopics,
  tierLimit,
} from '@/lib/topics/store'

export const dynamic = 'force-dynamic'

const PostBodySchema = z.object({
  keyword: z.string().min(1).max(40),
  matching_mode: z.enum(['exact', 'similar', 'learned']).optional(),
})

export async function GET() {
  seedMockTopics()
  const items = listTopics()
  return NextResponse.json(
    {
      topics: items,
      tier: MOCK_USER_TIER,
      limit: tierLimit(MOCK_USER_TIER),
      used: countActive(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  )
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const parsed = PostBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // 변호사 §1.3 server-side 재검증
  const validation = validateKeyword(parsed.data.keyword)
  if (!validation.accepted) {
    return NextResponse.json(
      {
        error: 'Keyword rejected',
        reason: validation.reason,
        blocked_terms: validation.blockedTerms,
      },
      { status: 422, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // ADR-018 §2.1 Tier 한도
  if (!canAddMore()) {
    return NextResponse.json(
      {
        error: 'Tier limit exceeded',
        tier: MOCK_USER_TIER,
        limit: tierLimit(MOCK_USER_TIER),
        used: countActive(),
      },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const topic = addTopic({
    keyword: parsed.data.keyword,
    matching_mode: parsed.data.matching_mode,
  })

  return NextResponse.json(
    { topic },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const topicId = url.searchParams.get('id')
  if (!topicId) {
    return NextResponse.json(
      { error: 'Missing id query param' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const removed = deactivateTopic(topicId)
  if (!removed) {
    return NextResponse.json(
      { error: 'Topic not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
