// Supabase server-only client — service_role 전용 (CLAUDE.md rule 11)
//
// 비협상.
//   rule 11 — anon/authenticated key는 client에서 절대 사용 금지.
//   본 모듈은 'server-only' import로 client bundle 진입 자동 차단.
//   환경변수 미설정 시 null 반환 → caller가 in-memory mock fallback 결정.

import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null | undefined

export function getServerClient(): SupabaseClient | null {
  if (cached !== undefined) return cached
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    cached = null
    return cached
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-client-info': 'tteuniyu-web/server' } },
  })
  return cached
}
