/**
 * useAdZoneVisibility — route-based AdZone visibility hook (T-W04 / P12).
 *
 * PRD v1.6 §4 P12 (Revenue Zone Isolation): `<AdZone>` is permitted only
 * on entry surfaces (/, /widget, /trends, /embed/iframe). It MUST be
 * structurally absent from Coverage Distribution surfaces (/cluster/[id],
 * /methodology, /dispute, /outlet-compare, /admin/**, /cluster/[id]/og).
 *
 * Default policy: deny. Unknown routes are NOT shown ads — the harness
 * (assert-ad-zone-boundary) is the secondary backstop, this hook is the
 * runtime first line.
 *
 * v1.6.5 + ADR-009 reminder: detail surfaces never show ads regardless of
 * what `ad_allowed` returns from the API.
 */

'use client'

import { usePathname } from 'next/navigation'

const ALLOWED_ROUTES = new Set(['/', '/widget', '/trends', '/embed/iframe'])

const BLOCKED_PREFIXES = [
  '/cluster/',
  '/methodology',
  '/dispute',
  '/outlet-compare',
  '/admin',
] as const

export function useAdZoneVisibility(): boolean {
  const pathname = usePathname()
  if (!pathname) return false
  if (BLOCKED_PREFIXES.some((p) => pathname.startsWith(p))) return false
  if (ALLOWED_ROUTES.has(pathname)) return true
  return false // default deny
}
