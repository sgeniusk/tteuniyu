/**
 * POST /api/v1/waitlist/creator
 *
 * Creator Embed early-access waitlist (T-W03 / PRD v1.6 §7.1 F-P0w-5).
 *
 * Behavior:
 * - Validates CreatorEmbedInput (email + site_url + visitors + topic).
 * - Upserts to in-memory store (P0w; Supabase in P0a).
 * - Sends confirmation email with install hint (Resend in P0a).
 * - Fires `creator_waitlist_submitted` (server-side stub).
 * - Enumeration-safe response (always 200 with same shape on success).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { CreatorEmbedInputSchema } from '@/lib/api/waitlist-schemas'
import { upsertEntry, checkRateLimit } from '@/lib/waitlist/store'
import { creatorEmbedConfirmation, sendEmail } from '@/lib/email/templates'
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
  let h = 2166136261
  for (const ch of email.toLowerCase()) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return `creator-${(h >>> 0).toString(36)}`
}

function siteDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown'
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request)
  if (!checkRateLimit(ip, 'creator')) {
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

  const parsed = CreatorEmbedInputSchema.safeParse(body)
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

  const { email, site_url, monthly_visitors, topic_interest, willingness_to_pay } = parsed.data

  upsertEntry({
    email,
    waitlist_type: 'creator_embed',
    metadata: {
      site_url,
      monthly_visitors,
      topic_interest,
      willingness_to_pay: willingness_to_pay ?? null,
    },
  })

  const rendered = creatorEmbedConfirmation(email, site_url)
  await sendEmail(email, rendered)

  trackServer(emailHash(email), EVENTS.CREATOR_WAITLIST_SUBMITTED, {
    site_domain: siteDomain(site_url),
    monthly_visitors_bucket: monthly_visitors,
    has_wtp: typeof willingness_to_pay === 'number',
  })

  return NextResponse.json(
    { ok: true, message: '얼리 액세스 안내 메일을 보냈습니다.' },
    { status: 200, headers: CORS_HEADERS },
  )
}
