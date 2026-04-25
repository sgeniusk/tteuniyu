/**
 * harness:realtime-naming
 *
 * PRD v1.6 §5.1 + CLAUDE.md "Naming Ban List".
 *
 * Scans repo for forbidden phrases that imply Naver-style "실시간 검색어"
 * positioning. Catches comments, JSX text, fixtures — anywhere except the
 * declaration sites (this file, CLAUDE.md ban list, PRD changelogs).
 *
 * Status: T-W01 partial impl. Sprint 0 (T-001) will:
 *   - Replace file-level ignores with marker-based line-range ignores
 *   - Scan commit messages in PR diff range
 *   - Add CI annotations
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from 'glob'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')

/** Single source of truth — keep in sync with CLAUDE.md "Naming Ban List". */
const BANNED_PHRASES = [
  '실시간 검색어',
  '실검',
  '인기 검색어',
  '실시간 순위',
  '실시간 인기어',
  'Trending Keywords',
  'Real-time Search',
  'Hot Search',
  'Real-time Ranking',
] as const

const SCAN_GLOBS = [
  'apps/**/*.{ts,tsx,js,jsx,mjs,cjs,md,json,yaml,yml}',
  'harness/**/*.{ts,js,md}',
  'config/**/*.{yaml,yml,ts,json,md}',
  'supabase/**/*.{sql,ts,md}',
  'prompts/**/*.{ts,md,jsonl}',
  '.github/**/*.{yml,yaml,md}',
  'README.md',
]

/**
 * Files that legitimately contain banned phrases as declarations.
 * (Sprint 0 will replace with marker-based exclusion.)
 */
const IGNORE_PATHS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  // Self-references — declaration files
  'harness/checks/assert-realtime-naming.ts',
  'harness/checks/README.md',
]

interface Hit {
  relPath: string
  line: number
  match: string
  context: string
}

async function main(): Promise<void> {
  const seen = new Set<string>()
  const files: string[] = []

  for (const pattern of SCAN_GLOBS) {
    const matches = await glob(pattern, {
      cwd: REPO_ROOT,
      ignore: IGNORE_PATHS,
      nodir: true,
      dot: false,
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
      for (const term of BANNED_PHRASES) {
        if (line.includes(term)) {
          hits.push({
            relPath: file.replace(REPO_ROOT + '/', ''),
            line: idx + 1,
            match: term,
            context: line.trim().slice(0, 200),
          })
        }
      }
    })
  }

  if (hits.length > 0) {
    console.error(
      `[harness:realtime-naming] ❌ ${hits.length} banned phrase occurrence(s) in ${files.length} files scanned`,
    )
    for (const hit of hits) {
      console.error(`  ${hit.relPath}:${hit.line}  "${hit.match}"  → ${hit.context}`)
    }
    console.error('\nApproved alternatives: 실시간 이슈 / 급상승 이슈 / Rising Issues')
    console.error('See CLAUDE.md "Naming Ban List".')
    process.exit(1)
  }

  console.log(
    `[harness:realtime-naming] ✅ Scanned ${files.length} files, 0 banned phrases.`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error('[harness:realtime-naming] uncaught error:', err)
  process.exit(2)
})
