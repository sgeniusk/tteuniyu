# TTEUN-IYU Engineering Rules v1.7.2

> **Source of Truth**: `docs/prd-v1.7.md` + `docs/prd-v1.7.1-patch.md` + `docs/prd-v1.7.2-patch.md` (확정)
> **Lawyer-mandated**: `docs/legal/2026-05-10-legal-response-opinion.md` (740줄, 변호사 자문 회신)
> **This file**: Non-negotiable constraints for Claude Code and all contributors
> **Last updated**: 2026-05-10
> **Harness count**: 21 (enforced via `pnpm harness:all`, +1 in v1.7.2 — `harness:investment-language-block`)

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

13. **Affiliate Data Ephemerality + Multi-touchpoint Disclosure (v1.7.2)**: Never store coupang / 11st / amazon product data (title, image, price, stock, reviews, description) in any database table. Runtime API call only, no cache, no log of raw payload. Manual curation in `config/affiliate_manual_curation.yaml` only. **Disclosure must appear at THREE positions** — 카드 상단 라벨 ("광고·제휴") + CTA 근처 (수수료 문구) + 카드 하단 (제휴 플랫폼명). hover tooltip 또는 약관 내부에만 숨기는 방식 금지. **18+ 민감 카테고리 자동 제외** (정치/선거/사고/재해/의료 + 종교/성범죄/사망/금융·투자/부동산/노동/법적분쟁/외교/젠더/공중보건). See `docs/adr/ADR-007-affiliate-commerce-data-boundary.md` (+ Amendment 1).

14. **Native Widget Entry Condition**: Swift / Kotlin / Xcode files (`*.swift`, `*.xcodeproj`, `Info.plist`) may not be committed unless `harness:native-widget-entry-condition` verifies that P0w Exit metrics are met via PostHog API (Paid Intent Rate ≥ 4% AND Waitlist ≥ 100). See `docs/adr/ADR-006-native-widget-staged-entry.md`.

### Trust Signal & Investment Risk + Lawyer-mandated Language (v1.7.1 + v1.7.2)

15. **Trust Signal & Investment Risk Layer** (variant 명시, 변호사 권고 v1.7.2 반영).

    **Internal field 4종만 허용** (임의 추가 금지) — `hoax` / `clickbait` / `low_confidence` / `investment`.

    **UI 표시 라벨은 변호사 권고 매핑만 사용** (v1.7.2 ADR-015 Amendment 2).
    - `hoax` → "검증 필요" (red-600)
    - `clickbait` → "제목-본문 괴리 가능성" (red-600)
    - `low_confidence` → "표본 부족" (amber-500)
    - `investment` → 🏢 "기업 관련 이슈" (amber-500)

    **카드 컴포넌트 — `<InvestmentImpactCard />` 폐기 (v1.7.2)**. `<IssueContextCard />` 또는 `<CompanyContextCard />` 만 사용. Pro+ 게이트 필수 (서버 응답에서 tier 검증 401/402/200). 분석가 의견 요약 P0a에서 X.

    **가격·시세·차트·매수/매도/보유/비중·수익률·전망·목표가 일체 금지** (V0.5+ ADR-016 별도 발의 후).

    **LLM output validator로 hard-block 40+ 단어 0건 강제** (Naming Ban List 참조).

    **자본시장법 신규 표준 고지 문구** (모든 표시 위치 필수, v1.7.2).
    - "이 카드는 이슈 이해를 돕기 위해 공개 보도·공시·발표자료를 요약한 것입니다. 금융투자상품의 가치, 가격, 매매 시점, 취득·처분 판단을 제공하지 않습니다."
    - Pro 카드 하단 — "본 분석은 공개 보도·공시·발표자료를 요약한 것이며, 매매 권유가 아닙니다."

    **매체 dot 색상은 `slate-400` 단일** (4색·이념 분류 일체 금지).

    **만 14세 미만 가입 차단** (P0a 대기자 폼부터, PIPA §22-2).

    **PostHog autocapture 비활성화** + 직접 식별자 (email/name/company) 전송 금지.

    **`<TrustTag>`는 `<AdZone>` 안에 절대 렌더 금지**.

    Enforced by `harness:no-stance-color` + `harness:trust-tag-presence` + `harness:investment-language-block` (신규 v1.7.2). See `docs/adr/ADR-015-trust-signal-and-investment-risk-layer.md` (+ Amendment 2) + `docs/adr/ADR-009-ideological-labeling-as-auxiliary.md` (Amendment 1) + `docs/adr/ADR-011-hybrid-coin-subscription-monetization.md` (+ Amendment 1) + `docs/legal/2026-05-10-legal-response-opinion.md`.

---

## Naming Ban List

The following expressions are **forbidden** in code, UI, comments, test fixtures, commit messages, PR descriptions, and documentation. `harness:realtime-naming` + `harness:investment-language-block` enforce this.

### Korean (한글) — 실검·이념 분류 (v1.7.1)
- 실시간 검색어
- 실검
- 인기 검색어
- 실시간 순위
- 실시간 인기어
- 보수 매체 / 진보 매체 / 중도 매체 / 공영 매체 (분류 표현, v1.7.1)
- 이념 분류 / 이념 분포 / 성향 분류 / 진영 라벨 (v1.7.1)
- 좌파 매체 / 우파 매체 (v1.7.1)

### Korean (한글) — 투자판단성 표현 40+ (v1.7.2 변호사 권고)

**투자행동성** — 매수, 매도, 보유, 진입, 청산, 비중확대, 비중축소, 손절, 익절, 물타기, 관망

**가격·수익성** — 목표가, 수익률, 상승 여력, 하락 위험, 급등, 급락, 반등, 조정, 상방, 하방

**가치판단성** — 호재, 악재, 저평가, 고평가, 유망, 모멘텀, 리레이팅, 촉매, 예측, 추천, 전망

### English — search + stance + investment (v1.7.1 + v1.7.2)

- Trending Keywords
- Real-time Search
- Hot Search
- Real-time Ranking
- stance / ideology / ideological (v1.7.1)
- bias-color / stance-color (v1.7.1)
- left-leaning / right-leaning / left-wing / right-wing (v1.7.1)
- buy / sell / hold (v1.7.2)
- overweight / underweight (v1.7.2)
- outperform / underperform (v1.7.2)
- target price (v1.7.2)
- upside / downside (v1.7.2)
- alpha (v1.7.2)

### CSS classes/tokens — stance dots (v1.7.1)

- `stance-conservative` / `stance-progressive` / `stance-neutral` / `stance-public`
- `bias-color-*` / `ideology-*`
- `--color-stance-*` (디자인 토큰)

### Component / label names — 폐기 (v1.7.2)

- `<InvestmentImpactCard />` → 폐기 (Lawyer-mandated)
- "투자 정보" / "투자 영향" → 폐기 → "기업 관련 이슈" / "이슈 맥락 요약"
- "관련 종목" → "이슈에 언급된 상장사"
- "분석가 의견" → P0a에서 사용 X (P1 이후 "외부 매체 보도 인용"만)

### Approved Alternatives

- **실시간 이슈** / **Rising Issues** (formal)
- **급상승 이슈** (velocity emphasis)
- **지금 뜨는 이유** (branded signature phrase)
- **보도 분포** / **Coverage Distribution** (v1.6 유지)
- **매체별 보도** / **외신 비교** (출처 표시 기반, v1.7.1 OK)
- **이슈에 언급된 상장사** (v1.7.2 변호사 권고)
- **공개자료 요약** / **공시·보도 맥락** / **출처별 사실관계** / **이슈 타임라인** (v1.7.2)

---

## Workflow

### Before Editing

1. Read the relevant ADR (`docs/adr/ADR-*.md`) — 특히 변호사 권고가 들어간 amendments 우선
2. Read the relevant ticket (`docs/tickets/T-*.md`)
3. Verify PRD section reference in ticket Scope block

### While Editing

- Make small changes (one PR ≤ 500 lines)
- Run `pnpm harness:all` after every feature (21 checks)
- Use `service_role` only in server routes, never client
- Validate API responses with Zod before return
- Fire appropriate PostHog events (see `apps/web/lib/analytics/events.ts`)
- **PostHog autocapture 비활성화 확인** + 직접 식별자 전송 금지 (v1.7.2)
- **Trust Tag UI 라벨은 변호사 권고 매핑만 사용** (검증 필요/제목-본문 괴리 가능성/표본 부족/기업 관련 이슈)
- **자본시장법 신규 고지 문구 사용** (v1.7.2)

### Before Committing

- `pnpm lint && pnpm typecheck && pnpm test`
- `pnpm harness:all` (21 checks, all must pass)
- If touching revenue: reference ADR-005/006/007 (+ Amendments) in commit message
- If touching Trust Tag / Investment / Stance: reference ADR-015 Amendment 2
- If touching coin / subscription: reference ADR-011 Amendment 1
- If touching Swift/iOS: verify `harness:native-widget-entry-condition`
- If touching LLM prompts: confirm hard-block 40+ words 0 hit (`harness:investment-language-block`)

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
- `<AffiliateCard>` (manual curation, runtime API, multi-touchpoint disclosure)
- `<SponsoredCard>` (V0.5 ad network)

### Forbidden Inside AdZone Component
- Any component that reads `bias_score`, `factuality_score`, `embedding`, or other sensitive fields
- Any `<CoverageBar>` / `<CoverageArea>` (reverse nesting check)
- `<TrustTag>` (P12 격리 — Trust Tag는 분석 영역만)

### Category Exclusions (within AdZone) — 18+ (v1.7.2 변호사 권고)

기존 5개 — Politics/Elections, Insufficient sample (`sample_size < 5`), Accidents/Disasters/Medical.

추가 13개 (v1.7.2).
- 종교·이단·사이비
- 성범죄·아동·학교폭력·미성년자
- 사망·자살·실종
- 금융·투자·보험·대출·가상자산
- 부동산·전세·임대차 분쟁
- 노동쟁의·파업·산재
- 법적 분쟁·수사·재판
- 외교·국방·안보
- 젠더·혐오·차별
- 공중보건·감염병

---

## Harness Catalog (21)

See `harness/checks/README.md` for full catalog and execution instructions.

Quick reference:
```bash
pnpm harness:all                              # run all 21
pnpm harness:ad-zone-boundary                 # v1.6 critical
pnpm harness:affiliate-link-provenance        # v1.6 critical (multi-touchpoint v1.7.2)
pnpm harness:native-widget-entry-condition    # v1.6 critical
pnpm harness:realtime-naming                  # naming ban (v1.7.1 + v1.7.2 extended)
pnpm harness:widget-contract                  # Widget API p95 + Zod
pnpm harness:analytics-events                 # 11 required events
pnpm harness:no-stance-color                  # v1.7.1 critical (ADR-015)
pnpm harness:trust-tag-presence               # v1.7.1 critical (ADR-015)
pnpm harness:investment-language-block        # v1.7.2 critical (ADR-015 Amendment 2) — 신규
```

---

## ADR References (필독 순서)

Read these before implementing anything in the respective domains. **Amendments는 본문과 같이 읽어야 한다**.

| ADR | Topic | Trigger |
|---|---|---|
| ADR-001 | Data Licensing | RSS ingestion, source whitelist |
| ADR-002 | Public API via Next Route | Any new `/api/v1/*` route |
| ADR-003 | Embedding Provider | Embedding, clustering worker |
| ADR-004 | P0a/P0b Scope | Scope decisions |
| **ADR-005** | **Ad Zone Separation** | Any `<AdZone>`, `<AffiliateCard>`, `<SponsoredCard>` work |
| **ADR-006** | **Native Widget Staged Entry** | Any Swift/Kotlin/Xcode work |
| **ADR-007 (+ Amendment 1)** | **Affiliate Commerce Data Boundary + Multi-touchpoint** | Any coupang/11st/amazon integration, 18+ 민감 카테고리 자동 제외 |
| ADR-009 (Amendment 1) | Ideological Labeling Deprecation | Removing `<AuxiliaryStancePanel>`, dot color cleanup |
| ADR-010 | Issue Risk OS Positioning | Persona / copy / IA decisions |
| **ADR-011 (+ Amendment 1)** | **Hybrid Coin + Subscription + Lawyer-mandated** | Pricing, payment, tier gates, 코인 ledger 차감 순서, 자동전환 30일 분리, 만 14세 미만 차단 |
| ADR-013 | Headline Body Extraction | "본론 보기" toggle |
| ADR-014 | Cost-Optimized AI Summary Pipeline | LLM worker, cache, monthly cap |
| **ADR-015 (+ Amendment 2)** | **Trust Signal & Investment Risk Layer + Lawyer-mandated** | Any `<TrustTag>`, `<IssueContextCard>`, `<CompanyContextCard>`, stance color removal, hard-block 40+ |

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

### If LLM output contains hard-block 40+ word

- 즉시 LLM 출력 차단 (validator 거부)
- prompt_version 갱신 + 새 LLM 호출
- 반복 발생 시 prompt 자체 amendment + ADR-015 amendment 검토

---

## Files Claude Code Should Read First on Fresh Session

1. `CLAUDE.md` (this file)
2. `docs/prd-v1.7.md` + `docs/prd-v1.7.1-patch.md` + `docs/prd-v1.7.2-patch.md`
3. `docs/legal/2026-05-10-legal-response-opinion.md` (변호사 자문 회신, 740줄 — 자본시장법/제휴/코인/PIPA 작업 시 필수)
4. Relevant ADR(s) per ticket (특히 ADR-015 Amendment 2 + ADR-007 Amendment 1 + ADR-011 Amendment 1)
5. The specific ticket in `docs/tickets/`
6. `docs/harness-roadmap-v1.6.md` for sprint context (v1.7.2 roadmap update pending)

---

## Contact

Founder / Final Merger: 태욱 (sgeniusk@gmail.com)
Codex Verifier: GitHub App installed on repo
CI: GitHub Actions `.github/workflows/p0w-harness.yml`
Dashboard: PostHog Cloud (us.posthog.com, project `tteuniyu-prod`) — autocapture 비활성화

**End of CLAUDE.md v1.7.2**
