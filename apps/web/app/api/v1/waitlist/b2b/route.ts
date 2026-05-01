/**
 * POST /api/v1/waitlist/b2b
 *
 * B2B / API enterprise inquiry intake (T-W03 / PRD v1.6 §7.1 F-P0w-6).
 *
 * Behavior:
 * - Validates B2BInquiryInput (email + company + contact + size + use_case + message).
 * - Upserts to in-memory store (P0w; Supabase in P0a).
 * - Sends confirmation email to inquirer + notification email to founder.
 * - Fires `b2b_inquiry_submitted` (server-side stub) and, when
 *   use_case === 'api_integration', also `api_key_requested`.
 * - Enumeration-safe response.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { B2BInquiryInputSchema } from '@/lib/api/waitlist-schemas'
import { upsertEntry, checkRateLimit } from '@/lib/waitlist/store'
import {
  b2bInquiryConfirmation,
  b2bInquiryFounderNotification,
  sendEmail,
  FOUNDER_EMAIL,
} from '@/lib/email/templates'
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
  return `b2b-${(h >>> 0).toString(36)}`
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request)
  if (!checkRateLimit(ip, 'b2b')) {
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

  const parsed = B2BInquiryInputSchema.safeParse(body)
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

  const { email, company_name, contact_name, company_size, use_case, message } = parsed.data

  upsertEntry({
    email,
    waitlist_type: 'b2b_inquiry',
    metadata: {
      company_name,
      contact_name,
      company_size,
      use_case,
      message,
    },
  })

  // Inquirer confirmation
  const ack = b2bInquiryConfirmation(email, company_name)
  await sendEmail(email, ack)

  // Founder notification (separate channel)
  const notify = b2bInquiryFounderNotification({
    email,
    company_name,
    contact_name,
    company_size,
    use_case,
    message,
  })
  await sendEmail(FOUNDER_EMAIL, notify)

  const distinctId = emailHash(email)
  trackServer(distinctId, EVENTS.B2B_INQUIRY_SUBMITTED, {
    company_size,
    use_case,
    message_length: message.length,
  })
  if (use_case === 'api_integration') {
    trackServer(distinctId, EVENTS.API_KEY_REQUESTED, { company_size })
  }

  return NextResponse.json(
    { ok: true, message: '24시간 안에 회신드리겠습니다.' },
    { status: 200, headers: CORS_HEADERS },
  )
}
