/**
 * GET /api/v1/affiliate/lookup?title=<cluster title>
 *
 * Standalone affiliate lookup endpoint (T-W04 / ADR-007).
 *
 * The widget API (`/api/v1/widget/top`) already inlines the affiliate_slot
 * via `lookupAffiliateForTitle`, so this endpoint is a debugging /
 * preview surface (used by /admin/affiliate page in V0.5 to test new
 * curation entries before saving).
 *
 * Constraints:
 * - GET only (no DB writes — ADR-007 §Storage Prohibition).
 * - `Cache-Control: no-store` (curation is volatile; per-call lookup).
 * - No third-party API call (P0w manual curation only).
 * - CORS allow-all so /admin or browser devtools can call it.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { lookupAffiliateForTitle } from '@/lib/affiliate/curation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
} as const

const QuerySchema = z.object({
  title: z.string().min(1).max(120),
})

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title')
  const parsed = QuerySchema.safeParse({ title })
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid_query',
        message: 'title parameter required (1..120 chars)',
      },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const slot = lookupAffiliateForTitle(parsed.data.title)
  if (!slot) {
    return NextResponse.json(
      { ok: true, slot: null, matched: false },
      { status: 200, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    { ok: true, slot, matched: true },
    { status: 200, headers: CORS_HEADERS },
  )
}
