## Scope
- PRD section:
- Requirement IDs:
- Ticket: T-XXX
- Related ADRs: ADR-001 / ADR-002 / ADR-003 / ADR-004 / ADR-005 / ADR-006 / ADR-007 (delete non-applicable)
- Out of scope:

## Safety constraints (CLAUDE.md v1.6 — 14조)

### Data & Privacy (v1.3)
- [ ] No public sensitive fields (1)
- [ ] No Naver Search storage (2)
- [ ] No image/logo storage (3)
- [ ] No `bias_score` / `factuality_score` / `embedding` in public response (4)

### UI & Language (v1.3)
- [ ] "Coverage Distribution" / "보도 분포" wording only (5)
- [ ] Disputes server-enforced `status='open'` (6)

### Ingestion & Engineering (v1.3)
- [ ] Only `tos_confirmed=true AND ingestion_enabled=true` sources ingested (7)
- [ ] Single embedding provider, no fallback (8)
- [ ] All LLM calls log `prompt_version` / `model` / hashes (9)
- [ ] Failing test written first for new feature (10)
- [ ] No `NEXT_PUBLIC_SUPABASE_ANON_KEY` for table access (11)

### Revenue & Widget (v1.6)
- [ ] **Revenue Zone Isolation (12)** — `<AdZone>` outside Coverage/Methodology/Dispute
- [ ] **Affiliate Data Ephemerality (13)** — no coupang/11st/amazon data stored
- [ ] **Native Widget Entry Condition (14)** — Swift commits pass PostHog check

## Tests
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm harness:all` (18/18 pass)
- [ ] `supabase db reset` (if migrations)
- [ ] `playwright e2e` (if UI changes)

## Codex verification
- [ ] `@codex review` requested
- [ ] Blocking issues resolved
- [ ] Codex approved

## Revenue impact (check if applicable)
- [ ] No new AdZone outside allowed routes (`/`, `/widget`, `/trends`, `/embed/iframe`)
- [ ] Affiliate URL includes required tracking param (lptag / afId / tag=)
- [ ] PostHog events fire for new UI interactions
- [ ] "Sponsored" or "연관 상품·서비스" label on ad components
