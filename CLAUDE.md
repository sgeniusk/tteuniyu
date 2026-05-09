# TTEUN-IYU Engineering Rules v1.7.1

> **Source of Truth**: `docs/prd-v1.7.md` + `docs/prd-v1.7.1-patch.md` (확정)
> **This file**: Non-negotiable constraints for Claude Code and all contributors
> **Last updated**: 2026-05-09
> **Harness count**: 20 (enforced via `pnpm harness:all`, +2 in v1.7.1)

---

## Non-negotiable Constraints (15조)

### Data & Privacy (v1.3)

1. **Never store Naver Search API results** in `articles`, `clusters`, `trends`, `summaries`, or `embeddings`. Discovery-only usage permitted.
2. **Never store article body text.** Only titles, URLs, abstractive summaries (≤ 15% copy ratio).
3. **Never store image URLs, thumbnails, favicons, or media logos** in P0. Text-only references.
4. **Never expose `bias_score`, `factuality_score`, `embedding`, `embedding_provider`, `embedding_model`, or `source_score_evidence` raw fields** through public API responses.

### UI & Language (v1.3)

5. **Public UI must use "Coverage Distribution" / "보도 분포"**. Do not use "Bias Distribution" or "편향" in visible copy.
6. **Disputes must always start with `status='open'`.** Server-enforced, never accepts client-specified status.

### Ingestion & Licensing (v1.3)

7. **Only sources with `tos_confirmed=true` AND `ingestion_enabled=true`** may be ingested. Both flags required.
8. **P0 uses one embedding provider only.** No alternate-dimension fallback. Failed embeddings go to retry queue.
9. **All LLM calls must log `prompt_version`, `model`, `input_hash`, `output_hash`.** No exceptions.

### Engineering Discipline (v1.3)

10. **Any feature without a failing test first should be paused and converted into a test.** TDD discipline.
11. **Clients must not use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for table access.** All public data flows through `/api/v1/*` Next.js routes with `service_role`.

### Revenue & Widget (v1.6)

12. **Revenue Zone Isolation (P12)**: `<AdZone>`, `<AffiliateCard>`, `<SponsoredCard>` must NEVER be rendered inside `<CoverageArea>`, `<CoverageBar>`, `<MethodologyPage>`, `<DisputePanel>`, `<OutletCompare>`, or `<OGCardCanvas>`. Enforced by `harness:ad-zone-boundary`. See `docs/adr/ADR-005-ad-zone-separation.md`.

13. **Affiliate Data Ephemerality**: Never store coupang / 11st / amazon product data (title, image, price, stock, reviews, description) in any database table. Runtime API call only, no cache, no log of raw payload. Manual curation in `config/affiliate_manual_curation.yaml` only. See `docs/adr/ADR-007-affiliate-commerce-data-boundary.md`.

14. **Native Widget Entry Condition**: Swift / Kotlin / Xcode files (`*.swift`, `*.xcodeproj`, `Info.plist`) may not be committed unless `harness:native-widget-entry-condition` verifies that P0w Exit metrics are met via PostHog API (Paid Intent Rate ≥ 4% AND Waitlist ≥ 100). See `docs/adr/ADR-006-native-widget-staged-entry.md`.

### Trust Signal & Investment Risk (v1.7.1)

15. **Trust Signal & Investment Risk Layer**: `<TrustTag>` 태그는 `hoax`/`clickbait`/`low_confidence`/`investment` 4종만 허용 (임의 추가 금지). `<InvestmentImpactCard>`는 Pro+ 게이트 필수 (서버 응답에서 tier 검증 401/402/200). 가격·시세·차트·매수/매도 추천 일체 금지 (V0.5+ ADR-016 별도 발의 후). 매체 dot 색상은 `slate-400` 단일이며 4색·이념 분류 일체 금지. 자본시장법 고지 ("투자 자문 X / 본인 책임")는 모든 `<InvestmentWarning>` / `<InvestmentImpactCard>` 표시 위치에서 필수. `<TrustTag>`는 `<AdZone>` 안에 절대 렌더 금지. Enforced by `harness:no-stance-color` + `harness:trust-tag-presence`. See `docs/adr/ADR-015-trust-signal-and-investment-risk-layer.md` + `docs/adr/ADR-009-ideological-labeling-as-auxiliary.md` (Amendment 1).

---

## Naming Ban List

The following expressions are **forbidden** in code, UI, comments, test fixtures, commit messages, PR descriptions, and documentation. `harness:realtime-naming` enforces this.

### Korean (한글) — 실검·이념 분류 (v1.7.1 추가)
- 실시간 검색어
- 실검
- 인기 검색어
- 실시간 순위
- 실시간 인기어
- 보수 매체 / 진보 매체 / 중도 매체 / 공영 매체 (분류 표현, v1.7.1)
- 이념 분류 / 이념 분포 / 성향 분류 / 진영 라벨 (v1.7.1)
- 좌파 매체 / 우파 매체 (v1.7.1)

### English — search + stance (v1.7.1 added)
- Trending Keywords
- Real-time Search
- Hot Search
- Real-time Ranking
- stance / ideology / ideological (v1.7.1)
- bias-color / stance-color (v1.7.1)
- left-leaning / right-leaning / left-wing / right-wing (v1.7.1)

### CSS classes/tokens — stance dots (v1.7.1)
- `stance-conservative` / `stance-progressive` / `stance-neutral` / `stance-public`
- `bias-color-*` / `ideology-*`
- `--color-stance-*` (디자인 토큰)

### Approved Alternatives
- **실시간 이슈** / **Rising Issues** (formal)
- **급상승 이슈** (velocity emphasis)
- **지금 뜨는 이유** (branded signature phrase)
- **보도 분포** / **Coverage Distribution** (v1.6 유지)
- **매체별 보도** / **외신 비교** (출처 표시 기반, v1.7.1 OK)

---

## Workflow

### Before Editing
1. Read the relevant ADR (`docs/adr/ADR-*.md`)
2. Read the relevant ticket (`docs/tickets/T-*.md`)
3. Verify PRD section reference in ticket Scope block

### While Editing
- Make small changes (one PR ≤ 500 lines)
- Run `pnpm harness:all` after every feature
- Use `service_role` only in server routes, never client
- Validate API responses with Zod before return
- Fire appropriate PostHog events (see `apps/web/lib/analytics/events.ts`)

### Before Committing
- `pnpm lint && pnpm typecheck && pnpm test`
- `pnpm harness:all` (18 checks, all must pass)
- If touching revenue: reference ADR-005/006/007 in commit message
- If touching Swift/iOS: verify `harness:native-widget-entry-condition`

### After Committing
- Create PR with `.github/pull_request_template.md` filled
- Request `@codex review`
- Do not merge until Codex blocking issues are 0

---

## Revenue Zone Boundary Reference

### Allowed Ad/Affiliate Routes
- `/` (landing)
- `/widget` (실시간 이슈 dashboard)
- `/trends` (trend list)
- `/embed/iframe` (external embed)

### Forbidden Ad/Affiliate Routes
- `/cluster/[id]` and all sub-routes
- `/methodology`
- `/dispute`, `/cluster/[id]/dispute`
- `/outlet-compare`
- `/cluster/[id]/og` (OG card rendering)
- `/admin/**` (except `/admin/affiliate` curation page itself)

### Allowed Inside AdZone Component
- `<AffiliateCard>` (manual curation, runtime API)
- `<SponsoredCard>` (V0.5 ad network)

### Forbidden Inside AdZone Component
- Any component that reads `bias_score`, `factuality_score`, `embedding`, or other sensitive fields
- Any `<CoverageBar>` / `<CoverageArea>` (reverse nesting check)

### Category Exclusions (within AdZone)
- **Politics/Elections**: no ads/affiliate (represented by cluster tag `politics` or `election`)
- **Insufficient sample**: no ads when `sample_size < 5`
- **Accidents/Disasters/Medical**: no auto-matching (manual curation still allowed with care)

---

## Harness Catalog (20)

See `harness/checks/README.md` for full catalog and execution instructions.

Quick reference:
```bash
pnpm harness:all                              # run all 20
pnpm harness:ad-zone-boundary                 # v1.6 critical
pnpm harness:affiliate-link-provenance        # v1.6 critical
pnpm harness:native-widget-entry-condition    # v1.6 critical
pnpm harness:realtime-naming                  # naming ban list (v1.7.1 extended)
pnpm harness:widget-contract                  # Widget API p95 + Zod
pnpm harness:analytics-events                 # 11 required events
pnpm harness:no-stance-color                  # v1.7.1 critical (ADR-015)
pnpm harness:trust-tag-presence               # v1.7.1 critical (ADR-015)
```

---

## ADR References (필독 순서)

Read these before implementing anything in the respective domains.

| ADR | Topic | Trigger |
|---|---|---|
| ADR-001 | Data Licensing | RSS ingestion, source whitelist |
| ADR-002 | Public API via Next Route | Any new `/api/v1/*` route |
| ADR-003 | Embedding Provider | Embedding, clustering worker |
| ADR-004 | P0a/P0b Scope | Scope decisions |
| **ADR-005** | **Ad Zone Separation** | Any `<AdZone>`, `<AffiliateCard>`, `<SponsoredCard>` work |
| **ADR-006** | **Native Widget Staged Entry** | Any Swift/Kotlin/Xcode work |
| **ADR-007** | **Affiliate Commerce Data Boundary** | Any coupang/11st/amazon integration |
| ADR-009 (Amendment 1) | Ideological Labeling Deprecation | Removing `<AuxiliaryStancePanel>`, dot color cleanup |
| ADR-010 | Issue Risk OS Positioning | Persona / copy / IA decisions |
| ADR-011 | Hybrid Coin + Subscription | Pricing, payment, tier gates |
| ADR-013 | Headline Body Extraction | "본론 보기" toggle |
| ADR-014 | Cost-Optimized AI Summary Pipeline | LLM worker, cache, monthly cap |
| **ADR-015** | **Trust Signal & Investment Risk Layer** | Any `<TrustTag>`, `<InvestmentImpactCard>`, stance color removal |

---

## Escalation

### If a harness seems overly restrictive
- **Do not bypass.** Open an ADR amendment PR instead.
- Rationale: the harness reflects a considered design decision recorded in an ADR. If the decision is wrong, update the ADR + harness together.

### If PostHog API is down during `harness:native-widget-entry-condition`
- CI will fail-safe (exit 1). This is intentional.
- Do not set `POSTHOG_BYPASS=true` without Slack alert to founder + ADR amendment rationale.

### If you find a false negative in a harness (constraint violated but harness passed)
- File as BLOCKING issue in current PR
- Write failing test first (that would have caught it)
- Fix harness
- Only then fix the underlying violation

---

## Files Claude Code Should Read First on Fresh Session

1. `CLAUDE.md` (this file)
2. `docs/prd-v1.7.md` + `docs/prd-v1.7.1-patch.md`
3. Relevant ADR(s) per ticket (especially ADR-009 Amendment 1 + ADR-015 for trust/investment work)
4. The specific ticket in `docs/tickets/`
5. `docs/harness-roadmap-v1.6.md` for sprint context (v1.7.1 roadmap update pending)

---

## Contact

Founder / Final Merger: 태욱 (taewook@tteuniyu.com — placeholder until domain confirmed)
Codex Verifier: GitHub App installed on repo
CI: GitHub Actions `.github/workflows/p0w-harness.yml`
Dashboard: PostHog Cloud (us.posthog.com, project `tteuniyu-prod`)

**End of CLAUDE.md v1.7.1**
