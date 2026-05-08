/**
 * Affiliate manual curation — T-W04 (PRD v1.6 §6.4 / ADR-007).
 *
 * P0w: hardcoded entries (mirrors `config/affiliate_manual_curation.yaml`
 * for visual checks; the YAML file is the operator-facing source of truth
 * and will be runtime-parsed by P0a workers).
 *
 * Constraints (CLAUDE.md rule 13 + ADR-007):
 * - NEVER stores coupang/11st/amazon product responses in any DB.
 * - Entries are static curated text — no third-party API call at lookup time.
 * - All affiliate_url MUST contain the partner tracking parameter
 *   (lptag / afId / tag=). Validated by Zod refine + harness.
 * - Max 5 active entries (P0w policy).
 * - Politics/military/medical/accident/disaster categories: caller MUST
 *   skip even if keyword matches (PRD v1.6 §9.7) — enforced upstream by
 *   `cluster.ad_allowed === false` from the widget API.
 */

import { z } from 'zod'
import { type AffiliateSlot } from '@/lib/api/widget-schemas'

const PartnerSchema = z.enum(['coupang', '11st', 'amazon'])

export const AffiliateCurationEntrySchema = z.object({
  id: z.string().min(1).max(40),
  issue_keyword: z.string().min(2).max(40),
  partner: PartnerSchema,
  product_title: z.string().min(1).max(100),
  affiliate_url: z
    .string()
    .url()
    .refine((url) => /lptag=|afId=|tag=/.test(url), {
      message: 'Affiliate URL must contain partner tracking parameter (lptag / afId / tag=)',
    }),
  label: z.enum(['Sponsored', 'Related']),
  valid_until: z.string().datetime(),
  created_by: z.string().min(1).max(40),
  notes: z.string().optional(),
})
export type AffiliateCurationEntry = z.infer<typeof AffiliateCurationEntrySchema>

export const AffiliateCurationConfigSchema = z.object({
  entries: z.array(AffiliateCurationEntrySchema).max(5),
})

/**
 * Mock curation entries — mirrors config/affiliate_manual_curation.yaml.
 * P0a swaps for runtime YAML parse via worker.
 */
const ENTRIES_RAW: readonly AffiliateCurationEntry[] = [
  {
    id: '2026-05-04-001',
    issue_keyword: '미세먼지',
    partner: 'coupang',
    product_title: '공기청정기 헤파 13등급',
    affiliate_url: 'https://link.coupang.com/a/MOCK01?lptag=AFmock01',
    label: 'Related',
    valid_until: '2026-08-31T23:59:59Z',
    created_by: 'taewook',
    notes: '봄철 미세먼지 30% 이슈 자연 매칭',
  },
  {
    id: '2026-05-04-002',
    issue_keyword: 'KBO',
    partner: 'coupang',
    product_title: 'KBO 응원 굿즈 티셔츠',
    affiliate_url: 'https://link.coupang.com/a/MOCK02?lptag=AFmock02',
    label: 'Related',
    valid_until: '2026-10-31T23:59:59Z',
    created_by: 'taewook',
    notes: 'KBO 흥행 이슈와 굿즈 연결',
  },
  {
    id: '2026-05-04-003',
    issue_keyword: '현대차',
    partner: 'coupang',
    product_title: '전기차 휴대용 충전기',
    affiliate_url: 'https://link.coupang.com/a/MOCK03?lptag=AFmock03',
    label: 'Related',
    valid_until: '2026-08-31T23:59:59Z',
    created_by: 'taewook',
    notes: '현대 EV 사전예약 흥행 이슈와 자연 매칭',
  },
  {
    id: '2026-05-04-004',
    issue_keyword: 'OpenAI',
    partner: 'coupang',
    product_title: '생성 AI 활용 입문서',
    affiliate_url: 'https://link.coupang.com/a/MOCK04?lptag=AFmock04',
    label: 'Related',
    valid_until: '2026-08-31T23:59:59Z',
    created_by: 'taewook',
    notes: 'OpenAI 한국어 모델 발표 이슈 — 학습 콘텐츠 매칭',
  },
]

const CURATION = AffiliateCurationConfigSchema.parse({ entries: ENTRIES_RAW })

/**
 * Lookup: case-insensitive substring match on `issue_keyword` against the
 * cluster title. Returns first non-expired entry as an AffiliateSlot, or
 * null when no match (or all matches expired).
 *
 * Caller is responsible for skipping when `cluster.ad_allowed === false`
 * (PRD v1.6 §9.7 — politics/military/medical/etc. excluded).
 */
export function lookupAffiliateForTitle(
  title: string,
  now: Date = new Date(),
): AffiliateSlot | null {
  const t = title.toLowerCase()
  for (const entry of CURATION.entries) {
    if (!t.includes(entry.issue_keyword.toLowerCase())) continue
    if (new Date(entry.valid_until).getTime() < now.getTime()) continue
    return {
      enabled: true,
      partner: entry.partner,
      product_title: entry.product_title,
      affiliate_url: entry.affiliate_url,
      valid_until: entry.valid_until,
      label: entry.label,
    }
  }
  return null
}

/**
 * Reserved for V0.5 — runtime Coupang Open API call. P0w throws to make
 * accidental adoption obvious in logs.
 */
export async function fetchCoupangRuntime(_keyword: string): Promise<AffiliateSlot | null> {
  throw new Error(
    'V0.5 feature: Coupang runtime API not enabled in P0w (manual curation only).',
  )
}

/** Test helper — read all entries (for harness regression suite). */
export function _allEntriesForTests(): readonly AffiliateCurationEntry[] {
  return CURATION.entries
}
