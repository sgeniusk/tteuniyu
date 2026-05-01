/**
 * In-memory waitlist store (P0w only).
 *
 * Replaced by Supabase `waitlist` table in Sprint 0 / P0a — migration
 * drafted at `supabase/migrations/00011_waitlist_expansion.sql`. Once
 * supabase init lands, swap upsertEntry/getEntry for service_role
 * client calls without changing route handlers.
 *
 * Caveats:
 * - Map lives in the Node process. Serverless cold starts reset state.
 * - Rate limiter is per-IP, per-minute, soft (5-entry rolling window).
 * - Privacy: response shape never leaks whether email pre-existed
 *   (Codex Task B / enumeration safety) — caller decides UX message.
 */

import type { WaitlistType } from '@/lib/api/waitlist-schemas'

export interface WaitlistEntry {
  email: string
  waitlist_type: WaitlistType
  intent_score: number | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

const entries = new Map<string, WaitlistEntry>()

function key(email: string, type: WaitlistType): string {
  return `${type}::${email.toLowerCase()}`
}

/**
 * Upsert an entry. Returns the resulting record but does not signal
 * "was this new or existing" — callers must respond identically either
 * way to avoid email enumeration.
 */
export function upsertEntry(input: {
  email: string
  waitlist_type: WaitlistType
  intent_score?: number | null
  metadata: Record<string, unknown>
}): WaitlistEntry {
  const k = key(input.email, input.waitlist_type)
  const now = new Date().toISOString()
  const existing = entries.get(k)
  const next: WaitlistEntry = {
    email: input.email.toLowerCase(),
    waitlist_type: input.waitlist_type,
    intent_score: input.intent_score ?? existing?.intent_score ?? null,
    metadata: { ...(existing?.metadata ?? {}), ...input.metadata },
    created_at: existing?.created_at ?? now,
    updated_at: now,
  }
  entries.set(k, next)
  return next
}

export function listEntries(type?: WaitlistType): WaitlistEntry[] {
  const all = Array.from(entries.values())
  return type ? all.filter((e) => e.waitlist_type === type) : all
}

export function countByType(): Record<WaitlistType, number> {
  const out: Record<WaitlistType, number> = {
    pro_preorder: 0,
    creator_embed: 0,
    b2b_inquiry: 0,
  }
  for (const e of entries.values()) out[e.waitlist_type] += 1
  return out
}

// --- Rate limiter (very soft, P0w-only) ---

interface RateBucket {
  windowStart: number
  count: number
}
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5
const buckets = new Map<string, RateBucket>()

export function checkRateLimit(ip: string, route: string, now: number = Date.now()): boolean {
  const k = `${route}::${ip}`
  const bucket = buckets.get(k)
  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    buckets.set(k, { windowStart: now, count: 1 })
    return true
  }
  bucket.count += 1
  return bucket.count <= RATE_LIMIT_MAX
}

/** Test helper — wipe all in-memory state. */
export function _resetForTests(): void {
  entries.clear()
  buckets.clear()
}
