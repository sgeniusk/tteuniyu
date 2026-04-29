/**
 * In-memory embed-install tracker (P0w only).
 *
 * Replaced by Supabase `embed_installations` table in Sprint 0 / P0a.
 * Migration is already drafted at `supabase/migrations/00010_embed_installations.sql`
 * — once supabase init lands, swap this module's exports for a service_role
 * client call without changing any caller.
 *
 * Caveats:
 * - Map lives in the Node process. Serverless cold starts reset counts.
 * - Rate limiter is per-IP, per-minute, soft (60-entry rolling window).
 * - PostHog event mirroring lands in T-W05.
 */

interface InstallRecord {
  host: string
  size: 'small' | 'medium' | 'large'
  install_count: number
  installed_at: string
  last_seen_at: string
}

const installs = new Map<string, InstallRecord>()

function key(host: string, size: string): string {
  return `${host}::${size}`
}

export function recordInstall(host: string, size: 'small' | 'medium' | 'large'): InstallRecord {
  const k = key(host, size)
  const now = new Date().toISOString()
  const existing = installs.get(k)
  if (existing) {
    existing.install_count += 1
    existing.last_seen_at = now
    installs.set(k, existing)
    return existing
  }
  const fresh: InstallRecord = {
    host,
    size,
    install_count: 1,
    installed_at: now,
    last_seen_at: now,
  }
  installs.set(k, fresh)
  return fresh
}

export function listInstalls(): InstallRecord[] {
  return Array.from(installs.values()).sort((a, b) => b.install_count - a.install_count)
}

// --- Rate limiter (very soft, P0w-only) ---

interface RateBucket {
  windowStart: number
  count: number
}
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 100
const buckets = new Map<string, RateBucket>()

export function checkRateLimit(ip: string, now: number = Date.now()): boolean {
  const bucket = buckets.get(ip)
  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    buckets.set(ip, { windowStart: now, count: 1 })
    return true
  }
  bucket.count += 1
  if (bucket.count > RATE_LIMIT_MAX) return false
  return true
}

/** Test/debug helper — wipe all in-memory state. Not exported in prod paths. */
export function _resetForTests(): void {
  installs.clear()
  buckets.clear()
}
