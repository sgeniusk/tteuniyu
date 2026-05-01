/**
 * POST /api/v1/waitlist/pro
 *
 * B2C Pro preorder intent collection (T-W03 / PRD v1.6 §7.1 F-P0w-4).
 *
 * Behavior:
 * - Validates ProPreorderInput (Zod, email + intent_score 1..5).
 * - Upserts to in-memory store (P0w; Supabase in P0a — see
 *   supabase/migrations/00011_waitlist_expansion.sql).
 * - Sends confirmation email (console stub in P0w; Resend in P0a).
 * - Fires PostHog event `pro_preorder_submitted` (server-side stub).
 * - Returns same shape regardless of whether email pre-existed
 *   (enumeration-safe).
 *
 * Privacy / Safety:
 * - email + optional comment + price_feedback only. No IP stored.
 * - Rate limit 5/min per IP per route.
 * - CORS allow-all (P0w; tighten in V1).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { ProPreorderInputSchema } from '@/lib/api/waitlist-schemas'
import { upsertEntry, checkRateLimit } from '@/lib/waitlist/store'
import { proPreorderConfirmation, sendEmail } from '@/lib/email/templates'
import { trackServer, EVENTS } from '@/lib/analytics/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
} as const

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown'
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function emailHash(email: string): string {
  // Simple non-reversible distinct_id for analytics (server-side only).
  let h = 2166136261
  for (const ch of email.toLowerCase()) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return `pro-${(h >>> 0).toString(36)}`
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request)
  if (!checkRateLimit(ip, 'pro')) {
    return NextResponse.json(
      { error: 'rate_limited', retry_after_seconds: 60 },
      { status: 429, headers: CORS_HEADERS },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: CORS_HEADERS })
  }

  const parsed = ProPreorderInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid_input',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const { email, intent_score, comment, price_feedback } = parsed.data

  upsertEntry({
    email,
    waitlist_type: 'pro_preorder',
    intent_score,
    metadata: {
      comment: comment ?? null,
      price_feedback: price_feedback ?? null,
    },
  })

  const rendered = proPreorderConfirmation(email, intent_score)
  await sendEmail(email, rendered)

  trackServer(emailHash(email), EVENTS.PRO_PREORDER_SUBMITTED, {
    intent_score,
    has_comment: Boolean(comment),
    has_price_feedback: Boolean(price_feedback),
  })

  return NextResponse.json(
    { ok: true, message: '확인 이메일을 보냈습니다.' },
    { status: 200, headers: CORS_HEADERS },
  )
}
