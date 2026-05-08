/**
 * harness:ad-zone-boundary
 *
 * PRD v1.6 §4 P12 (Revenue Zone Isolation) + ADR-005.
 *
 * Enforces that <AdZone>, <AffiliateCard>, <SponsoredCard> components
 * are NEVER imported or rendered inside Coverage Distribution surfaces:
 *   - /cluster/[id] and all sub-routes
 *   - /methodology
 *   - /dispute
 *   - /outlet-compare
 *   - /cluster/[id]/og
 *   - Coverage* / MethodologyPage / DisputePanel / OutletCompare / OGCardCanvas components
 *
 * P0w status: grep-based partial impl (file-path + literal regex).
 *   Sprint 0 (T-001) replaces with @babel/parser AST traversal so the
 *   harness catches:
 *     - Wrapper components (<DetailWrapper><AdZone/></DetailWrapper>)
 *     - Re-exports (export { AdZone as Foo } from '@/components/AdZone')
 *     - Conditional renders behind feature flags
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from 'glob'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')

/** AdZone-family components that must obey P12 boundaries. */
const AD_COMPONENTS = ['AdZone', 'AffiliateCard', 'SponsoredCard'] as const

/**
 * Forbidden path globs — Coverage Distribution surfaces where AdZone-family
 * MUST NOT appear. /admin/affiliate is the curation page and is allowed.
 */
const FORBIDDEN_PATHS = [
  'apps/web/app/cluster/**/*.{ts,tsx}',
  'apps/web/app/methodology/**/*.{ts,tsx}',
  'apps/web/app/dispute/**/*.{ts,tsx}',
  'apps/web/app/outlet-compare/**/*.{ts,tsx}',
  'apps/web/components/Coverage*.{ts,tsx}',
  'apps/web/components/MethodologyPage.{ts,tsx}',
  'apps/web/components/DisputePanel.{ts,tsx}',
  'apps/web/components/OutletCompare.{ts,tsx}',
  'apps/web/components/OGCardCanvas.{ts,tsx}',
]

const IGNORE = ['**/node_modules/**', '**/.next/**', '**/dist/**']

interface Hit {
  relPath: string
  line: number
  match: string
  context: string
}

async function main(): Promise<void> {
  const seen = new Set<string>()
  const files: string[] = []
  for (const pattern of FORBIDDEN_PATHS) {
    const matches = await glob(pattern, {
      cwd: REPO_ROOT,
      ignore: IGNORE,
      nodir: true,
    })
    for (const m of matches) {
      const abs = join(REPO_ROOT, m)
      if (!seen.has(abs)) {
        seen.add(abs)
        files.push(abs)
      }
    }
  }

  const hits: Hit[] = []
  for (const file of files) {
    let content: string
    try {
      content = readFileSync(file, 'utf-8')
    } catch {
      continue
    }
    const lines = content.split(/\r?\n/)
    lines.forEach((line, idx) => {
      for (const component of AD_COMPONENTS) {
        const jsxRegex = new RegExp(`<${component}[\\s/>]`)
        const importRegex = new RegExp(`\\b${component}\\b[^\\n]*from\\s+['"]`)
        if (jsxRegex.test(line) || importRegex.test(line)) {
          hits.push({
            relPath: file.replace(REPO_ROOT + '/', ''),
            line: idx + 1,
            match: component,
            context: line.trim().slice(0, 200),
          })
        }
      }
    })
  }

  if (hits.length > 0) {
    console.error(
      `[harness:ad-zone-boundary] ❌ ${hits.length} P12 violation(s) — AdZone family in Coverage surface`,
    )
    for (const hit of hits) {
      console.error(`  ${hit.relPath}:${hit.line}  <${hit.match}>  → ${hit.context}`)
    }
    console.error(
      '\nADR-005 Revenue Zone Isolation: AdZone/AffiliateCard/SponsoredCard MUST NOT render inside\n' +
        '/cluster/**, /methodology, /dispute, /outlet-compare, or Coverage*/MethodologyPage/\n' +
        'DisputePanel/OutletCompare/OGCardCanvas components.',
    )
    process.exit(1)
  }

  console.log(
    `[harness:ad-zone-boundary] ✅ Scanned ${files.length} forbidden-zone files, 0 P12 violations.`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error('[harness:ad-zone-boundary] uncaught error:', err)
  process.exit(2)
})
