/**
 * POST /api/v1/embed/install
 *
 * Tracks Creator Embed installations (host + size).
 * Called by /embed/widget.js as fire-and-forget (sendBeacon or keepalive fetch).
 *
 * P0w: in-memory store + soft rate limit (100/min/IP).
 * P0a: swap to Supabase `embed_installations` (migration drafted).
 *
 * Constraints:
 * - No PII (host = domain string, user_agent truncated 255)
 * - No cookies, no IP storage (only used transiently for rate limit)
 * - CORS allow-all (P0w; V1 will whitelist installer domains)
 */

import { NextResponse, type NextRequest } from 'next/server'
import { EmbedInstallInputSchema } from '@/lib/embed/schemas'
import { recordInstall, checkRateLimit } from '@/lib/embed/install-store'

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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request)
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'rate_limited', retry_after_seconds: 60 },
      { status: 429, headers: CORS_HEADERS },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const parsed = EmbedInstallInputSchema.safeParse(body)
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

  const record = recordInstall(parsed.data.host, parsed.data.size)
  return NextResponse.json(
    {
      ok: true,
      host: record.host,
      size: record.size,
      install_count: record.install_count,
    },
    { status: 200, headers: CORS_HEADERS },
  )
}
