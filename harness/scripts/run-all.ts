/**
 * run-all.ts
 *
 * Executes all 18 harness checks sequentially. Fails on first non-zero exit.
 *
 * Used by: `pnpm harness:all` / CI workflow.
 */

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const checksDir = join(__dirname, '..', 'checks')

const checks = readdirSync(checksDir)
  .filter((f) => f.startsWith('assert-') && f.endsWith('.ts'))
  .sort()

const startedAt = Date.now()
let failed = 0

console.log(`[harness:all] Running ${checks.length} checks...\n`)

for (const check of checks) {
  const checkPath = join(checksDir, check)
  const name = check.replace('.ts', '')
  const result = spawnSync('tsx', [checkPath], { stdio: 'inherit' })
  if (result.status !== 0) {
    console.error(`❌ ${name} FAILED (exit ${result.status})`)
    failed += 1
  }
}

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2)

if (failed > 0) {
  console.error(`\n[harness:all] ${failed}/${checks.length} checks FAILED (${elapsed}s)`)
  process.exit(1)
}

console.log(`\n[harness:all] ✅ All ${checks.length} checks passed (${elapsed}s)`)
process.exit(0)
