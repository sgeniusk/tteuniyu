// /api/v1/digest-prefs — Daily Digest 구독 설정 (ADR-017)
//
// 비협상.
//   - rule 11 — 클라이언트 직접 Supabase 접근 X
//   - 변호사 §5.3 — digest_consent + marketing_consent 분리

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getPrefs, updatePrefs } from '@/lib/digest-prefs/store'

export const dynamic = 'force-dynamic'

const PutBodySchema = z.object({
  digest_consent: z.boolean().optional(),
  marketing_consent: z.boolean().optional(),
  preferred_categories: z
    .array(
      z.enum([
        'politics',
        'society',
        'economy',
        'international',
        'tech_science',
        'culture_sports',
        'lifestyle',
      ]),
    )
    .optional(),
  include_custom_topics: z.boolean().optional(),
  include_frame_clash: z.boolean().optional(),
  include_intl_translation: z.boolean().optional(),
})

export async function GET() {
  const prefs = getPrefs()
  return NextResponse.json(prefs, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function PUT(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const parsed = PutBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const updated = updatePrefs('mock-user-creator', parsed.data)
  return NextResponse.json(updated, { headers: { 'Cache-Control': 'no-store' } })
}
