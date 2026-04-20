# Harness Catalog v1.6

18 harness checks enforce PRD v1.6 (확정본) constraints.

> **Actual TypeScript implementations will be created in Sprint 0 (T-001, D7~D10).**
> This README catalogs the intent, input, and expected behavior of each check so
> Claude Code can scaffold them deterministically.

---

## How to Run

```bash
# All 18 checks
pnpm harness:all

# Individual checks (see table below for each command)
pnpm harness:<name>

# Adversarial regression test (intentional violation → expect fail)
pnpm harness:regression-suite
```

## Harness Categories

- **Data Protection** (1-4, 10): prevents data leaks and license violations
- **UI Language** (5-7, 11-12): enforces Coverage/naming/sample quality copy
- **Ingestion Contract** (7-8): source whitelist + embedding provider
- **LLM & Engineering** (9-10): prompt versioning + TDD discipline
- **API Contract** (8-9, 15): Zod response schemas + Widget API
- **Revenue & Widget** (16-18): v1.6 additions — Ad Zone, Affiliate, Native Widget

---

## Catalog Table (18)

| # | Name | Source | Category | PR Block on Fail |
|---|---|---|---|---|
| 1 | assert-no-public-sensitive-fields | v1.3 | Data | Yes |
| 2 | assert-no-naver-storage | v1.3 | Data | Yes |
| 3 | assert-no-image-storage | v1.3 | Data | Yes |
| 4 | assert-tos-whitelist | v1.3 | Ingestion | Yes |
| 5 | assert-public-copy-wording | v1.3 | UI Lang | Yes |
| 6 | assert-dispute-status-server-only | v1.3 | Data | Yes |
| 7 | assert-summary-copy-rate | v1.3 | UI Lang | Yes |
| 8 | assert-db-grants.sql | v1.3 | Data | Yes |
| 9 | assert-widget-contract | v1.5 | API | Yes |
| 10 | assert-source-provenance | v1.5 | Ingestion | Yes |
| 11 | assert-realtime-naming | v1.5 | UI Lang | Yes |
| 12 | assert-sample-quality-copy | v1.5 | UI Lang | Yes |
| 13 | assert-monetization-claims | v1.5 | UI Lang | Yes |
| 14 | assert-analytics-events | v1.5 | Engineering | Warn only (P0w), block from P0a |
| 15 | assert-surface-consistency | v1.5 | API | Yes |
| 16 | **assert-ad-zone-boundary** | **v1.6** | Revenue | **Yes (critical)** |
| 17 | **assert-affiliate-link-provenance** | **v1.6** | Revenue | **Yes (critical)** |
| 18 | **assert-native-widget-entry-condition** | **v1.6** | Widget | **Yes (critical)** |

---

## v1.3 Harnesses (1~8)

### 1. `assert-no-public-sensitive-fields.ts`
**Intent**: Ensure public API responses never leak `bias_score`, `factuality_score`, `embedding`, `embedding_provider`, `embedding_model`, `source_score_evidence`, `axis_b_chaebol`, `axis_c_regime_critic`, `axis_d_sensationalism`.

**Method**:
1. Parse all Zod schemas in `apps/web/lib/api/*-schemas.ts`
2. Reject if any schema includes banned field names
3. Regex scan API route files for `.select('...')` and literal column names

**Expected Output**:
```
✓ 24 schemas validated, 0 sensitive field exposures
```

**Violation Exit Code**: 1

### 2. `assert-no-naver-storage.ts`
**Intent**: Prevent Naver Search API results from being persisted to `articles`, `clusters`, `trends`, `summaries`, `embeddings`.

**Method**:
1. SQL grep: search for `INSERT INTO articles` where nearby code path originates from `naver_search` module
2. Check `articles.ingestion_source` CHECK constraint excludes `naver_search`
3. Runtime: proxy Supabase `insert()` calls; reject if `ingestion_source === 'naver_search'`

### 3. `assert-no-image-storage.ts`
**Intent**: P0 bars storage of image URLs (thumbnail, favicon, logo, media brand).

**Method**:
1. Scan migration SQL for columns named `image_url`, `thumbnail`, `favicon`, `logo`
2. Scan ingestion code for `.image` field assignments
3. DB schema snapshot comparison against allowed column set

### 4. `assert-tos-whitelist.ts`
**Intent**: Only sources with `tos_confirmed=true AND ingestion_enabled=true` may be used in ingest.

**Method**:
1. Load `config/sources_whitelist.yaml`
2. For each `source` row with ingest attempts in `ingestion_runs`, verify both flags true
3. Test fixture: attempt INSERT from source with `tos_confirmed=false` → reject

### 5. `assert-public-copy-wording.ts`
**Intent**: UI uses "Coverage Distribution" / "보도 분포"; never "Bias Distribution" / "편향".

**Method**:
1. Grep UI files (`apps/web/app/**`, `apps/web/components/**`) for banned Korean/English strings
2. Allow only in internal code comments (prefixed `// INTERNAL:`)

### 6. `assert-dispute-status-server-only.ts`
**Intent**: User-submitted disputes always start with `status='open'`; clients cannot set status.

**Method**:
1. Parse `/api/v1/disputes/route.ts`
2. Verify server forces `status = 'open'` before INSERT, regardless of request body
3. Adversarial fixture: POST with `{"status": "published"}` → server should ignore, insert as `open`

### 7. `assert-summary-copy-rate.ts`
**Intent**: Abstractive summaries must have ≤ 15% copy ratio vs original article.

**Method**:
1. Run `prompts/evals/summary.golden.jsonl` through current prompt version
2. For each output, compute copy ratio (sliding window overlap)
3. Fail if any ratio > 0.15

### 8. `assert-db-grants.sql`
**Intent**: `anon` and `authenticated` roles have ZERO `GRANT`s on public schema tables.

**Method**: Execute SQL:
```sql
SELECT count(*) FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated') AND table_schema = 'public';
-- Expected: 0
```

---

## v1.5 Harnesses (9~15)

### 9. `assert-widget-contract.ts`
**Intent**: `/api/v1/widget/top` response is Zod-valid, within payload size, and hits p95 ≤ 300ms.

**Method**:
1. HTTP GET `/api/v1/widget/top?size=medium` (local or staging)
2. Zod parse response
3. Assert byte size: Small ≤ 768B (v1.6), Medium ≤ 3KB, Large ≤ 5KB
4. Run 100 requests, compute p95 — fail if > 300ms

### 10. `assert-source-provenance.ts`
**Intent**: Every `articles` row has traceable source via `source_id FK`, and `sources.tos_confirmed=true`.

**Method**:
1. `SELECT * FROM articles WHERE source_id IS NULL` — expect 0
2. `SELECT * FROM articles a JOIN sources s ON a.source_id = s.id WHERE NOT s.tos_confirmed OR NOT s.ingestion_enabled` — expect 0
3. Sample 10 articles, HEAD request to original URL to check liveness (non-blocking warn)

### 11. `assert-realtime-naming.ts`
**Intent**: Forbid "실시간 검색어" and variants (see CLAUDE.md Naming Ban List).

**Method**:
1. Walk repo (excluding `node_modules`, `dist`, `.next`, `.git`)
2. Match banned strings in source files, Markdown, JSON, YAML, comments
3. Also scan commit messages in latest branch commit range

**Ban List**:
- 실시간 검색어, 실검, 인기 검색어, 실시간 순위, 실시간 인기어
- Trending Keywords, Real-time Search, Hot Search, Real-time Ranking

### 12. `assert-sample-quality-copy.ts`
**Intent**: When `sample_size < 5`, UI renders "표본 부족" badge and does NOT render the Coverage Bar numerics.

**Method**:
1. Fixture: mock cluster with sample_size=3
2. Playwright render `<IssueCard>` with fixture
3. Assert DOM contains "표본 부족" text
4. Assert Coverage Bar is grey/striped, no numeric labels

### 13. `assert-monetization-claims.ts`
**Intent**: Pre-launch features must have "출시 예정" / "알림 받기" / "대기자 등록" labels; no current-tense advertising of non-existent features.

**Method**:
1. Grep for Pro / Creator / B2B CTA copy
2. Assert each has a label from allowed list
3. Regex-detect claims like "무제한", "평생 무료", "즉시 이용 가능" — fail if not yet shipped

### 14. `assert-analytics-events.ts`
**Intent**: All 11+ required events (see `apps/web/lib/analytics/events.ts`) are actually fired at least once in code.

**Method**:
1. Parse `EVENTS` constant export
2. For each event name, grep for `posthog.capture('${NAME}')` or `captureEvent(EVENTS.XXX)`
3. Require ≥ 1 match per event (declaration-only does NOT count)

### 15. `assert-surface-consistency.ts`
**Intent**: Web / OG / Widget three surfaces show same data.

**Method**:
1. For a given `cluster_id`, fetch:
   - `/api/v1/clusters/:id/coverage` (Web)
   - `/cluster/:id/og` (OG image, parse coverage numbers from alt text)
   - `/api/v1/widget/top` (Widget, find matching cluster)
2. Assert coverage counts match across all three
3. Assert color tokens are identical hex values

---

## v1.6 Harnesses (16~18) — Critical

### 16. `assert-ad-zone-boundary.ts`

**Intent**: Enforce P12 Revenue Zone Isolation. `<AdZone>`, `<AffiliateCard>`, `<SponsoredCard>` must not appear inside Coverage / Methodology / Dispute / OutletCompare / OGCard regions.

**Method**:

```typescript
// Pseudocode
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { readFileSync } from 'fs'
import { glob } from 'glob'

const AD_COMPONENTS = ['AdZone', 'AffiliateCard', 'SponsoredCard']
const FORBIDDEN_PARENT_PATHS = [
  /apps\/web\/app\/cluster\/\[id\]/,
  /apps\/web\/app\/methodology/,
  /apps\/web\/app\/dispute/,
  /apps\/web\/app\/outlet-compare/,
  /apps\/web\/app\/cluster\/\[id\]\/og/,
]
const FORBIDDEN_PARENT_COMPONENTS = [
  'CoverageArea', 'CoverageBar', 'MethodologyPage',
  'DisputePanel', 'OutletCompare', 'OGCardCanvas',
]

for (const file of glob.sync('apps/web/**/*.{tsx,ts}')) {
  // Path check
  if (FORBIDDEN_PARENT_PATHS.some(p => p.test(file))) {
    // If this file uses AD_COMPONENTS, fail
    const content = readFileSync(file, 'utf-8')
    for (const component of AD_COMPONENTS) {
      if (content.includes(`<${component}`)) {
        fail(file, `${component} used in forbidden path`)
      }
    }
  }

  // AST: detect AD_COMPONENTS nested inside FORBIDDEN_PARENT_COMPONENTS
  const ast = parse(content, { sourceType: 'module', plugins: ['jsx', 'typescript'] })
  traverse(ast, {
    JSXElement(path) {
      const name = path.node.openingElement.name
      if (AD_COMPONENTS.includes(name)) {
        let parent = path.parent
        while (parent) {
          if (FORBIDDEN_PARENT_COMPONENTS.includes(parent.name)) {
            fail(file, `${name} nested inside ${parent.name}`)
          }
          parent = parent.parent
        }
      }
    }
  })
}

// API response check
const forbiddenRoutes = [
  '/api/v1/clusters/[id]',
  '/api/v1/methodology',
  '/api/v1/disputes',
]
for (const route of forbiddenRoutes) {
  const response = await fetch(`http://localhost:3000${route}`)
  const json = await response.json()
  if ('affiliate_slot' in json || 'ad_allowed' in json) {
    fail(route, 'AdZone-related fields must not appear in Coverage responses')
  }
}
```

**Expected Output**:
```
✓ Scanned 127 TSX files, 0 AdZone boundary violations
✓ Checked 3 forbidden API routes, 0 ad field leaks
```

### 17. `assert-affiliate-link-provenance.ts`

**Intent**: Enforce ADR-007. Manual curation config integrity + DB storage prevention.

**Method**:

```typescript
// 1. Load and validate config/affiliate_manual_curation.yaml
const config = yaml.parse(readFileSync('config/affiliate_manual_curation.yaml', 'utf-8'))
const parsed = AffiliateCurationConfigSchema.parse(config)

// 2. Verify each affiliate_url has required tracking param
for (const entry of parsed.entries) {
  const patterns = {
    coupang: /lptag=[a-zA-Z0-9]+/,
    '11st': /afId=[a-zA-Z0-9]+/,
    amazon: /tag=[a-zA-Z0-9\-]+/,
  }
  if (!patterns[entry.partner].test(entry.affiliate_url)) {
    fail(`${entry.id}: missing tracking param for ${entry.partner}`)
  }
}

// 3. Verify valid_until is in future
const now = new Date()
for (const entry of parsed.entries) {
  if (new Date(entry.valid_until) < now) {
    fail(`${entry.id}: expired`)
  }
}

// 4. Scan codebase for DB insertion patterns with affiliate payload
const insertPatterns = [
  /INSERT INTO articles.*(coupang|11st|amazon)/i,
  /INSERT INTO clusters.*(coupang|11st|amazon)/i,
  /\.from\('(articles|clusters|summaries)'\)\.insert\(.*product/i,
]
for (const file of glob.sync('apps/web/**/*.{ts,tsx,sql}')) {
  const content = readFileSync(file, 'utf-8')
  for (const pattern of insertPatterns) {
    if (pattern.test(content)) {
      fail(file, 'Affiliate product data INSERT detected')
    }
  }
}

// 5. Check API route lookups have no caching
const lookupRoute = readFileSync('apps/web/app/api/v1/affiliate/lookup/route.ts', 'utf-8')
if (!lookupRoute.includes("Cache-Control") || !lookupRoute.includes("no-store")) {
  fail('affiliate lookup route missing no-store cache header')
}
```

### 18. `assert-native-widget-entry-condition.ts`

**Intent**: Enforce ADR-006. Swift / Kotlin / iOS / Android project files cannot be committed unless P0w Exit metrics are met.

**Method**:

```typescript
import { execSync } from 'child_process'

// 1. Detect native files in PR diff
const diffFiles = execSync('git diff --name-only origin/main...HEAD').toString().split('\n')
const nativeFilePatterns = [
  /\.swift$/,
  /\.xcodeproj/,
  /Info\.plist$/,
  /\.kt$/,
  /AndroidManifest\.xml$/,
  /\.gradle$/,
]
const nativeFiles = diffFiles.filter(f => nativeFilePatterns.some(p => p.test(f)))

if (nativeFiles.length === 0) {
  console.log('✓ No native widget files in diff')
  process.exit(0)
}

// 2. Bypass check
if (process.env.POSTHOG_BYPASS === 'true') {
  // Send Slack alert to founder
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 POSTHOG_BYPASS used for native widget PR — files: ${nativeFiles.join(', ')}`,
    }),
  })
  console.log('⚠️  POSTHOG_BYPASS engaged. Founder notified via Slack.')
  process.exit(0)
}

// 3. Fetch PostHog metrics
if (!process.env.POSTHOG_PERSONAL_API_KEY) {
  fail('POSTHOG_PERSONAL_API_KEY required when native files present')
}

const baseUrl = 'https://app.posthog.com/api/projects/PROJECT_ID'
const headers = { 'Authorization': `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}` }

// Paid Intent Rate
const paidIntentQuery = await fetch(`${baseUrl}/query`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    query: {
      kind: 'HogQLQuery',
      query: `
        SELECT
          countIf(event = 'pro_preorder_submitted' AND properties.intent_score >= 4) AS paid_intent,
          countDistinct(event = 'widget_viewed' AND properties.distinct_id) AS viewers
        FROM events
        WHERE timestamp >= toStartOfDay(now()) - INTERVAL 7 DAY
      `
    }
  })
})
const { paid_intent, viewers } = await paidIntentQuery.json()
const paidIntentRate = paid_intent / viewers

// Waitlist count
const waitlistQuery = await fetch(`${baseUrl}/query`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    query: {
      kind: 'HogQLQuery',
      query: `
        SELECT countDistinct(properties.email) AS waitlist_count
        FROM events
        WHERE event IN ('pro_preorder_submitted', 'creator_waitlist_submitted', 'b2b_inquiry_submitted')
          AND timestamp >= toStartOfDay(now()) - INTERVAL 30 DAY
      `
    }
  })
})
const { waitlist_count } = await waitlistQuery.json()

// 4. Gate
const threshold = { paidIntentRate: 0.04, waitlistCount: 100 }
if (paidIntentRate < threshold.paidIntentRate || waitlist_count < threshold.waitlistCount) {
  console.error(`❌ Native widget entry condition not met`)
  console.error(`  Paid Intent Rate: ${paidIntentRate.toFixed(3)} (required: ${threshold.paidIntentRate})`)
  console.error(`  Waitlist Count: ${waitlist_count} (required: ${threshold.waitlistCount})`)
  console.error(`  See ADR-006 for entry conditions and alternatives.`)
  process.exit(1)
}

console.log(`✓ Native widget entry condition met`)
console.log(`  Paid Intent Rate: ${paidIntentRate.toFixed(3)}`)
console.log(`  Waitlist Count: ${waitlist_count}`)
```

---

## Regression Suite

`harness/checks/regression-suite.ts` runs intentional violations in a sandbox to verify each harness catches them.

```bash
pnpm harness:regression-suite
```

Expected output:
```
Testing ad-zone-boundary:
  + Inject <AdZone> into MethodologyPage.tsx
  ✓ Caught: ad-zone-boundary violation in methodology
  - Revert

Testing affiliate-link-provenance:
  + Add INSERT INTO articles with coupang product title
  ✓ Caught: affiliate data INSERT detected
  - Revert

Testing native-widget-entry-condition:
  + Add TestWidget.swift with POSTHOG env unset
  ✓ Caught: missing POSTHOG_PERSONAL_API_KEY
  - Revert

All 18 harness regression tests: PASS
```

---

## CI Integration

`.github/workflows/p0w-harness.yml` runs `pnpm harness:all` on every PR. See `docs/harness-roadmap-v1.6.md §8.2` for full YAML.

Required GitHub Secrets:
- `POSTHOG_PERSONAL_API_KEY` (for harness 18)
- `SLACK_WEBHOOK_URL` (for POSTHOG_BYPASS alert)
- `SUPABASE_SERVICE_ROLE_KEY` (for DB grant check)
- `COUPANG_PARTNER_ID` (runtime affiliate API, V0.5)

---

## Implementation Order (Sprint 0 T-001)

Claude Code should implement in this order to maximize detecting issues early:

1. **Data/DB (1, 2, 3, 4, 6, 8)**: foundation for migration safety
2. **UI Language (5, 7, 11, 12, 13)**: prevents drift during feature work
3. **API (9, 14, 15)**: baseline for all endpoint work
4. **Engineering (10)**: source provenance integrity
5. **Revenue (16, 17)**: v1.6 critical — **must work before T-W04 merges**
6. **Widget (18)**: v1.6 critical — **must work before any Swift commit**

---

## Owner

These harnesses are non-optional. Disabling any requires ADR amendment + founder approval.

**End of harness/checks/README.md v1.6**
