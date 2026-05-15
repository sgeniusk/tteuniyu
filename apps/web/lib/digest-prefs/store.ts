// Daily Digest preferences in-memory store (P0a UX skeleton — Supabase 후속 PR)
//
// Replaced by Supabase `digest_subscriptions` table — migration:
// supabase/migrations/00030_adr017_digest_subscriptions.sql.
//
// 비협상 (변호사 §5.3 + 정통망법 §50).
//   digest_consent + marketing_consent 분리.
//   unsubscribe_token + 1-click 수신거부.

import { z } from 'zod'

export const DigestPrefsSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  digest_consent: z.boolean(),
  marketing_consent: z.boolean(),
  preferred_categories: z.array(
    z.enum([
      'politics',
      'society',
      'economy',
      'international',
      'tech_science',
      'culture_sports',
      'lifestyle',
    ]),
  ),
  include_custom_topics: z.boolean(),
  include_frame_clash: z.boolean(),
  include_intl_translation: z.boolean(),
  unsubscribe_token: z.string().optional(),
  updated_at: z.string(),
})

export type DigestPrefs = z.infer<typeof DigestPrefsSchema>

export const MOCK_USER_ID = 'mock-user-creator'
export const MOCK_USER_EMAIL = 'creator@example.com'

const prefsByUser = new Map<string, DigestPrefs>()

function defaultPrefs(userId: string, email: string): DigestPrefs {
  return {
    user_id: userId,
    email,
    digest_consent: false,
    marketing_consent: false,
    preferred_categories: [],
    include_custom_topics: true,
    include_frame_clash: false,
    include_intl_translation: false,
    unsubscribe_token: 'mock-' + Math.random().toString(36).slice(2, 14),
    updated_at: new Date().toISOString(),
  }
}

export function getPrefs(
  userId: string = MOCK_USER_ID,
  email: string = MOCK_USER_EMAIL,
): DigestPrefs {
  let p = prefsByUser.get(userId)
  if (!p) {
    p = defaultPrefs(userId, email)
    prefsByUser.set(userId, p)
  }
  return p
}

export function updatePrefs(
  userId: string,
  patch: Partial<Omit<DigestPrefs, 'user_id' | 'updated_at' | 'unsubscribe_token'>>,
): DigestPrefs {
  const current = getPrefs(userId)
  const next: DigestPrefs = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  }
  prefsByUser.set(userId, next)
  return next
}

/** 정통망법 §50 1-click 수신거부. */
export function unsubscribeByToken(token: string): boolean {
  for (const [uid, p] of prefsByUser.entries()) {
    if (p.unsubscribe_token === token) {
      prefsByUser.set(uid, {
        ...p,
        digest_consent: false,
        marketing_consent: false,
        updated_at: new Date().toISOString(),
      })
      return true
    }
  }
  return false
}
