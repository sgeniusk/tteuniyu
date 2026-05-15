// Custom Topic in-memory store (P0a UX skeleton — Supabase swap 후속 PR)
//
// Replaced by Supabase `user_topics` table — migration:
// supabase/migrations/00031_adr018_user_topics.sql.
//
// 비협상.
//   ADR-018 §2.1 Tier 한도 — Free 0 / Pro 5 / Creator 20 / Leader 50.
//   본 store는 단일 mock_user 기준 (P0a 인증 합류 전).

import { z } from 'zod'

export const TopicSchema = z.object({
  topic_id: z.string().uuid(),
  user_id: z.string(),
  keyword: z.string().min(1).max(40),
  matching_mode: z.enum(['exact', 'similar', 'learned']),
  active: z.boolean().default(true),
  created_at: z.string(),
  match_count: z.number().int().nonnegative().default(0),
})

export type Topic = z.infer<typeof TopicSchema>

export const TIER_LIMITS = {
  free: 0,
  pro: 5,
  creator: 20,
  leader: 50,
} as const

export type Tier = keyof typeof TIER_LIMITS

const topics = new Map<string, Topic>()

// P0a UX skeleton — 모든 사용자가 'mock-user' 단일 사용자로 통합 (인증 합류 전)
export const MOCK_USER_ID = 'mock-user-creator'
export const MOCK_USER_TIER: Tier = 'creator' // 시연용 — 실제는 auth + subscription에서

function uuid(): string {
  // crypto.randomUUID()는 Edge runtime + node 둘 다 지원
  return crypto.randomUUID()
}

export function listTopics(userId: string = MOCK_USER_ID): Topic[] {
  return Array.from(topics.values())
    .filter((t) => t.user_id === userId && t.active)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function countActive(userId: string = MOCK_USER_ID): number {
  return listTopics(userId).length
}

export function tierLimit(tier: Tier): number {
  return TIER_LIMITS[tier]
}

export function canAddMore(
  userId: string = MOCK_USER_ID,
  tier: Tier = MOCK_USER_TIER,
): boolean {
  return countActive(userId) < tierLimit(tier)
}

export function addTopic(input: {
  user_id?: string
  keyword: string
  matching_mode?: 'exact' | 'similar' | 'learned'
}): Topic {
  const userId = input.user_id ?? MOCK_USER_ID
  const topic: Topic = {
    topic_id: uuid(),
    user_id: userId,
    keyword: input.keyword.trim(),
    matching_mode: input.matching_mode ?? 'similar',
    active: true,
    created_at: new Date().toISOString(),
    match_count: 0,
  }
  topics.set(topic.topic_id, topic)
  return topic
}

export function deactivateTopic(topicId: string, userId: string = MOCK_USER_ID): boolean {
  const topic = topics.get(topicId)
  if (!topic || topic.user_id !== userId) return false
  topics.set(topicId, { ...topic, active: false })
  return true
}

// 시연용 seed — P0a 미인증 단계에서 빈 화면 회피
export function seedMockTopics(): void {
  if (topics.size > 0) return
  for (const kw of ['삼성전자 반도체', 'AI 규제', '대선']) {
    addTopic({ keyword: kw, matching_mode: 'similar' })
  }
}
