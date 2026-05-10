/**
 * harness:tos-whitelist
 *
 * Source — config/sources_whitelist.yaml.
 *
 * 비협상 (CLAUDE.md rule 7).
 *   tos_confirmed=true AND ingestion_enabled=true 두 플래그 모두여야 ingest 허용.
 *   본 harness는 yaml 자체의 정합성을 검증 (DB sync는 worker startup이 책임).
 *
 * 비협상 (ADR-009 Amendment 1).
 *   매체에 stance/ideology/leaning/political_orientation/bias 등 분류 키 절대 X.
 *
 * 검증 항목.
 *   1. yaml 파싱 + Zod schema 통과
 *   2. slug 중복 없음
 *   3. RSS URL이 https:// 시작 (cleartext http X)
 *   4. 모든 active source (tos_confirmed AND ingestion_enabled)에 contact_email 존재
 *   5. ADR-009 Amendment 1 — stance/ideology/leaning/bias 같은 분류 키 0개
 *   6. 30개 이상 등록 (PRD v1.7 §11 P0a Exit Criteria — RSS 매체 ≥ 15개)
 *
 * Status — 본격 구현 (T-006 P0a Foundation, 2026-05-10). 이전 placeholder 대체.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const WHITELIST_PATH = 'config/sources_whitelist.yaml'

/** ADR-009 Amendment 1 — 매체에 분류 키 절대 X. */
const FORBIDDEN_KEYS = [
  'stance',
  'ideology',
  'leaning',
  'political_orientation',
  'bias',
  'tilt',
  'orientation',
  'left_right',
] as const

const SourceEntrySchema = z
  .object({
    slug: z.string().min(1).max(40).regex(/^[a-z0-9_-]+$/),
    name: z.string().min(1).max(40),
    rss_url: z.string().url().startsWith('https://'),
    base_url: z.string().url().startsWith('https://'),
    contact_email: z.string().email().nullable().optional(),
    tos_confirmed: z.boolean(),
    ingestion_enabled: z.boolean(),
    confirmed_at: z.string().datetime().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .strict() // unknown 키 거부 — stance/ideology 등이 들어오면 즉시 실패

const WhitelistSchema = z.object({
  version: z.number().int().positive(),
  last_updated: z.string(),
  sources: z.array(SourceEntrySchema).min(15, {
    message: 'PRD v1.7 §11 — P0a Exit Criteria는 RSS 매체 ≥ 15개 요구',
  }),
})

interface Failure {
  rule: string
  message: string
  source?: string
}

async function main(): Promise<void> {
  const fullPath = join(REPO_ROOT, WHITELIST_PATH)
  let raw: string
  try {
    raw = readFileSync(fullPath, 'utf-8')
  } catch (err) {
    console.error(
      `[harness:tos-whitelist] ❌ whitelist file missing: ${WHITELIST_PATH}`,
    )
    console.error((err as Error).message)
    process.exit(1)
  }

  // 1. yaml 파싱
  let parsed: unknown
  try {
    parsed = parseYaml(raw)
  } catch (err) {
    console.error(
      `[harness:tos-whitelist] ❌ yaml parse error in ${WHITELIST_PATH}`,
    )
    console.error((err as Error).message)
    process.exit(1)
  }

  // 2. ADR-009 Amendment 1 — forbidden 키 사전 스캔 (Zod strict 외 추가 방어)
  const failures: Failure[] = []
  if (typeof parsed === 'object' && parsed !== null) {
    const sources = (parsed as { sources?: unknown[] }).sources
    if (Array.isArray(sources)) {
      for (const entry of sources) {
        if (typeof entry !== 'object' || entry === null) continue
        const slug = (entry as { slug?: unknown }).slug
        const slugStr = typeof slug === 'string' ? slug : '<unknown>'
        for (const key of FORBIDDEN_KEYS) {
          if (key in (entry as Record<string, unknown>)) {
            failures.push({
              rule: 'forbidden-classification-key',
              message: `매체에 분류 키 "${key}" 발견 — ADR-009 Amendment 1로 절대 금지`,
              source: slugStr,
            })
          }
        }
      }
    }
  }

  // 3. Zod schema 검증
  const zodResult = WhitelistSchema.safeParse(parsed)
  if (!zodResult.success) {
    for (const issue of zodResult.error.issues) {
      const path = issue.path.join('.') || '<root>'
      failures.push({
        rule: 'schema',
        message: `${path} — ${issue.message}`,
      })
    }
  }

  if (zodResult.success) {
    const { sources } = zodResult.data

    // 4. slug 중복 검사
    const seenSlugs = new Set<string>()
    for (const s of sources) {
      if (seenSlugs.has(s.slug)) {
        failures.push({
          rule: 'duplicate-slug',
          message: `중복 slug "${s.slug}"`,
          source: s.slug,
        })
      }
      seenSlugs.add(s.slug)
    }

    // 5. active source는 contact_email 필수 (ADR-015 A2.7 정정 채널)
    for (const s of sources) {
      const isActive = s.tos_confirmed && s.ingestion_enabled
      if (isActive && !s.contact_email) {
        failures.push({
          rule: 'active-needs-contact-email',
          message: `active source "${s.slug}"에 contact_email 부재 — 정정 요청 채널 필수 (ADR-015 A2.7)`,
          source: s.slug,
        })
      }
    }

    // 6. tos_confirmed=true인데 confirmed_at이 null인 경우 (audit log 부재)
    for (const s of sources) {
      if (s.tos_confirmed && !s.confirmed_at) {
        failures.push({
          rule: 'tos-confirmed-needs-timestamp',
          message: `tos_confirmed=true인데 confirmed_at 부재 — audit log 필수`,
          source: s.slug,
        })
      }
    }

    // 7. 정보 출력 (활성 source 통계)
    const activeCount = sources.filter(
      (s) => s.tos_confirmed && s.ingestion_enabled,
    ).length
    const stagedCount = sources.length - activeCount
    console.log(
      `[harness:tos-whitelist] info — total ${sources.length} sources, active ${activeCount}, staged ${stagedCount}`,
    )

    // P0a Exit Criteria 안내 (실패 X, 정보)
    if (activeCount < 15) {
      console.log(
        `[harness:tos-whitelist] note — active ${activeCount}/15. PRD v1.7 §11 P0a Exit는 ≥ 15 요구.`,
      )
    }
  }

  if (failures.length > 0) {
    console.error(
      `[harness:tos-whitelist] ❌ ${failures.length} violation(s) in ${WHITELIST_PATH}`,
    )
    for (const f of failures) {
      const src = f.source ? ` [${f.source}]` : ''
      console.error(`  [${f.rule}]${src} ${f.message}`)
    }
    console.error(
      '\n비협상 (CLAUDE.md rule 7) — tos_confirmed AND ingestion_enabled 둘 다여야 ingest 허용.',
    )
    console.error(
      '비협상 (ADR-009 Amendment 1) — 매체에 분류 키 (stance/ideology/leaning 등) 절대 X.',
    )
    process.exit(1)
  }

  console.log('[harness:tos-whitelist] ✅ whitelist 정합성 통과 (CLAUDE.md rule 7 + ADR-009 Amendment 1)')
  process.exit(0)
}

main().catch((err) => {
  console.error('[harness:tos-whitelist] uncaught error:', err)
  process.exit(2)
})
