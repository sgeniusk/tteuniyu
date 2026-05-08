/**
 * harness:affiliate-link-provenance
 *
 * PRD v1.6 §6.4 + ADR-007 (Affiliate Commerce Data Boundary).
 *
 * Three checks:
 *   1) Curation source — every affiliate_url in `apps/web/lib/affiliate/curation.ts`
 *      contains a partner tracking parameter (lptag / afId / tag=).
 *   2) No DB persistence — no SQL INSERT statements anywhere in the repo
 *      mention coupang/11st/amazon product fields (title/image/price).
 *   3) No-store contract — `app/api/v1/affiliate/lookup/route.ts` declares
 *      `Cache-Control: no-store` (caller never caches affiliate data).
 *
 * P0w status: regex-based partial impl. Sprint 0 (T-001) will add:
 *   - Zod parse on YAML/TS source
 *   - AST-level Supabase `.insert()` call inspection
 *   - Runtime sandbox test that calls lookup with poison input
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from 'glob'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')

const CURATION_FILE = 'apps/web/lib/affiliate/curation.ts'
const LOOKUP_ROUTE = 'apps/web/app/api/v1/affiliate/lookup/route.ts'

const TRACKING_PATTERNS = [/lptag=/, /afId=/, /tag=/]

interface Failure {
  rule: string
  message: string
  file?: string
  line?: number
}

function checkCurationTracking(): Failure[] {
  const fullPath = join(REPO_ROOT, CURATION_FILE)
  let content: string
  try {
    content = readFileSync(fullPath, 'utf-8')
  } catch {
    return [
      {
        rule: 'curation-source',
        message: `curation file missing: ${CURATION_FILE}`,
      },
    ]
  }

  const failures: Failure[] = []
  const urlRegex = /affiliate_url:\s*['"`]([^'"`]+)['"`]/g
  let match: RegExpExecArray | null
  while ((match = urlRegex.exec(content)) !== null) {
    const url = match[1] ?? ''
    if (!TRACKING_PATTERNS.some((p) => p.test(url))) {
      const lineIdx = content.slice(0, match.index).split(/\r?\n/).length
      failures.push({
        rule: 'curation-source',
        message: `affiliate_url missing tracking param (lptag/afId/tag=): ${url}`,
        file: CURATION_FILE,
        line: lineIdx,
      })
    }
  }
  if (!/affiliate_url:/.test(content)) {
    failures.push({
      rule: 'curation-source',
      message: `no affiliate_url entries found in ${CURATION_FILE}`,
      file: CURATION_FILE,
    })
  }
  return failures
}

async function checkNoDbInsert(): Promise<Failure[]> {
  const failures: Failure[] = []
  const sqlInsertPattern =
    /\binsert\s+into\b[\s\S]{0,200}?(coupang|11st|amazon|product_title)/i
  const supabaseInsertWithBrand =
    /\.from\(['"`](?:articles|clusters|summaries|trends|og_cards)['"`]\)\.insert\(/i

  const patterns = [
    'apps/web/**/*.{ts,tsx,sql}',
    'supabase/**/*.sql',
    'config/**/*.{ts,yaml,yml}',
  ]
  const seen = new Set<string>()
  for (const pat of patterns) {
    const matches = await glob(pat, {
      cwd: REPO_ROOT,
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
      nodir: true,
    })
    for (const m of matches) seen.add(m)
  }

  for (const rel of seen) {
    const abs = join(REPO_ROOT, rel)
    let content: string
    try {
      content = readFileSync(abs, 'utf-8')
    } catch {
      continue
    }
    if (sqlInsertPattern.test(content)) {
      failures.push({
        rule: 'no-db-insert',
        message: 'SQL INSERT mentioning coupang/11st/amazon/product_title',
        file: rel,
      })
    }
    if (supabaseInsertWithBrand.test(content) && /(coupang|11st|amazon)/i.test(content)) {
      failures.push({
        rule: 'no-db-insert',
        message:
          'Supabase .from(articles|clusters|summaries|trends|og_cards).insert() co-located with affiliate brand reference',
        file: rel,
      })
    }
  }

  return failures
}

function checkLookupNoStore(): Failure[] {
  const fullPath = join(REPO_ROOT, LOOKUP_ROUTE)
  let content: string
  try {
    content = readFileSync(fullPath, 'utf-8')
  } catch {
    return [
      {
        rule: 'no-store-contract',
        message: `lookup route missing: ${LOOKUP_ROUTE}`,
      },
    ]
  }
  if (!/Cache-Control[\s\S]*no-store/i.test(content)) {
    return [
      {
        rule: 'no-store-contract',
        message: `${LOOKUP_ROUTE} must declare 'Cache-Control: no-store' (ADR-007 §Storage Prohibition)`,
        file: LOOKUP_ROUTE,
      },
    ]
  }
  return []
}

async function main(): Promise<void> {
  const failures: Failure[] = [
    ...checkCurationTracking(),
    ...(await checkNoDbInsert()),
    ...checkLookupNoStore(),
  ]

  if (failures.length > 0) {
    console.error(
      `[harness:affiliate-link-provenance] ❌ ${failures.length} ADR-007 violation(s)`,
    )
    for (const f of failures) {
      const loc = f.file ? `  ${f.file}${f.line ? `:${f.line}` : ''}` : ''
      console.error(`  [${f.rule}] ${f.message}${loc}`)
    }
    console.error(
      '\nADR-007 Affiliate Commerce Data Boundary:\n' +
        '  - Manual curation entries MUST carry partner tracking params.\n' +
        '  - coupang/11st/amazon product data MUST NOT be stored in any DB table.\n' +
        '  - /api/v1/affiliate/lookup MUST send Cache-Control: no-store.',
    )
    process.exit(1)
  }

  console.log('[harness:affiliate-link-provenance] ✅ ADR-007 invariants verified.')
  process.exit(0)
}

main().catch((err) => {
  console.error('[harness:affiliate-link-provenance] uncaught error:', err)
  process.exit(2)
})
