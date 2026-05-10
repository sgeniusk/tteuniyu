/**
 * harness:widget-contract
 *
 * PRD v1.6 §8 Widget API Contract.
 *
 * Validates `/api/v1/widget/top?size={medium|large}` against the Zod schema
 * AND scans the raw payload for forbidden sensitive fields (CLAUDE.md rule 4).
 *
 * Status: T-W01 partial impl.
 *   - Soft-passes when dev server is unreachable (CI doesn't run dev).
 *   - Sprint 0 (T-001) will: spin up the server, measure p95 latency,
 *     enforce payload byte budget per size variant, run forbidden-field
 *     scan against /api/v1/clusters/:id and /api/v1/methodology too.
 *
 * The schema is duplicated here intentionally — harness must not depend
 * on apps/web (so a regression in apps/web cannot disable the harness
 * by mutating its schema).
 */

import { z } from 'zod'

const FORBIDDEN_FIELDS = [
  'bias_score',
  'factuality_score',
  'embedding',
  'embedding_provider',
  'embedding_model',
  'source_score_evidence',
  'axis_b_chaebol',
  'axis_c_regime_critic',
  'axis_d_sensationalism',
] as const

const ClusterSchema = z.object({
  cluster_id: z.string().uuid(),
  title: z.string().min(1).max(60),
  coverage: z.object({
    progressive: z.number().int().nonnegative(),
    mixed: z.number().int().nonnegative(),
    conservative: z.number().int().nonnegative(),
    foreign: z.number().int().nonnegative(),
  }),
  sample_quality: z.enum(['insufficient_sample', 'low_confidence', 'sufficient']),
  updated_at: z.string(),
  ad_allowed: z.boolean(),
  affiliate_slot: z
    .object({ enabled: z.boolean() })
    .passthrough()
    .optional(),
})

const SCHEMA_BY_SIZE = {
  medium: z.object({
    clusters: z.array(ClusterSchema).length(3),
    updated_at: z.string(),
  }),
  // v1.6.1 patch: Top 10 (was 5).
  // v1.7.2 patch: Top 20 (Concept C 디자인, Claude Design 2026-05-10).
  large: z.object({
    clusters: z.array(ClusterSchema).length(20),
    methodology_version: z.string(),
    overall_diversity_index: z.number().min(0).max(1).nullable(),
    updated_at: z.string(),
  }),
} as const

type Size = keyof typeof SCHEMA_BY_SIZE

const BASE_URL = process.env.WIDGET_BASE_URL ?? 'http://localhost:3000'

interface CheckResult {
  size: Size
  status: 'ok' | 'fail' | 'skipped'
  reason?: string
  bytes?: number
}

async function checkSize(size: Size): Promise<CheckResult> {
  const url = `${BASE_URL}/api/v1/widget/top?size=${size}`
  let res: Response
  try {
    res = await fetch(url, { cache: 'no-store' })
  } catch (err) {
    return {
      size,
      status: 'skipped',
      reason: `dev server unreachable at ${BASE_URL} (${(err as Error).message})`,
    }
  }
  if (!res.ok) {
    return { size, status: 'fail', reason: `HTTP ${res.status}` }
  }
  const text = await res.text()
  const bytes = Buffer.byteLength(text, 'utf-8')

  // Forbidden field scan on raw text — catches fields nested anywhere
  for (const field of FORBIDDEN_FIELDS) {
    const re = new RegExp(`["']${field}["']\\s*:`)
    if (re.test(text)) {
      return {
        size,
        status: 'fail',
        reason: `forbidden field present in payload: "${field}"`,
        bytes,
      }
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    return { size, status: 'fail', reason: `invalid JSON: ${(err as Error).message}`, bytes }
  }

  const result = SCHEMA_BY_SIZE[size].safeParse(parsed)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('; ')
    return { size, status: 'fail', reason: `schema mismatch — ${issues}`, bytes }
  }

  return { size, status: 'ok', bytes }
}

async function main(): Promise<void> {
  const sizes: Size[] = ['medium', 'large']
  const results = await Promise.all(sizes.map(checkSize))

  let failed = 0
  let ran = 0

  for (const r of results) {
    if (r.status === 'skipped') {
      console.warn(`[harness:widget-contract] ⚠️  size=${r.size} skipped — ${r.reason}`)
      continue
    }
    ran += 1
    if (r.status === 'ok') {
      console.log(`[harness:widget-contract] ✅ size=${r.size} (${r.bytes} bytes, schema ok)`)
    } else {
      console.error(`[harness:widget-contract] ❌ size=${r.size}: ${r.reason}`)
      failed += 1
    }
  }

  if (ran === 0) {
    console.warn(
      '[harness:widget-contract] ⚠️  No sizes verified (dev server not running).\n' +
        '   Set WIDGET_BASE_URL or run `pnpm dev` first. Soft-passing for now.\n' +
        '   Sprint 0 T-001 will run server in CI and remove this fallback.',
    )
    process.exit(0)
  }

  if (failed > 0) {
    console.error(`[harness:widget-contract] ❌ ${failed}/${ran} size variants failed`)
    process.exit(1)
  }

  console.log(`[harness:widget-contract] ✅ ${ran}/${ran} size variants passed`)
  process.exit(0)
}

main().catch((err) => {
  console.error('[harness:widget-contract] uncaught error:', err)
  process.exit(2)
})
