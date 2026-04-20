# T-W01: Widget Web MVP Scaffold

| 항목 | 내용 |
|---|---|
| Phase | P0w |
| Day | D0~D1 (2026-04-21 ~ 2026-04-22) |
| 목적 | `/widget` 페이지 + `/api/v1/widget/top` API 최소 구조 |
| PRD 참조 | v1.6 §7.1 F-P0w-1, F-P0w-2, §8 Widget API Contract |
| ADR 참조 | ADR-005 (AdZone), ADR-002 (Public API via Next Route) |
| 선행 티켓 | 없음 (최초 티켓) |
| 후속 티켓 | T-W02 Embed Script |

---

## Claude Code 프롬프트

다음을 Claude Code 세션에서 복사하여 사용. 이 티켓은 GitHub repo `tteuniyu/tteuniyu`가 초기화된 직후 첫 번째 작업.

```
Read the following files fully before coding:
- docs/prd-v1.6.md (full)
- docs/adr/ADR-005-ad-zone-separation.md
- docs/harness-roadmap-v1.6.md section "T-W01"

Do NOT implement Coverage Distribution analysis, clustering, or RSS ingestion
in this ticket. This ticket is ONLY the widget surface scaffold with mock data.

## Scope
PRD v1.6 §7.1 F-P0w-1 + F-P0w-2 + §8.

## Stack
- Next.js 14 App Router, TypeScript strict
- Tailwind CSS + shadcn/ui
- Zod for schema validation
- Supabase JS SDK (anon for readonly demo, real reads via service_role in routes)
- Pretendard Variable (Google Fonts or self-host) for Korean text

## 1. Page `apps/web/app/widget/page.tsx`
- Server Component (not Client)
- Fetch `/api/v1/widget/top?size=medium` at render (internal fetch)
- Render `<IssueCard>` × 5 in responsive grid
  - mobile: 1 column
  - md+: 2 columns
- Dark mode default (tailwind `bg-slate-950 text-slate-50`)
- Header: "실시간 이슈 · 뜬이유" + updated_at 상대 시간
- Footer: Pro CTA / Creator Embed / B2B links (links are placeholder hrefs for now; T-W03 wires them up)
- NO `<AdZone>` in this ticket — that's T-W04
- Mobile-first breakpoints from PRD §8.2 (v1.4): sm 360 / md 768 / lg 1024 / xl 1440

## 2. Component `apps/web/components/IssueCard.tsx`
- Props: `cluster_id`, `title`, `coverage {progressive, mixed, conservative, foreign}`, `sample_quality`, `updated_at`
- Visual:
  - Title (display-md = Pretendard Bold 32px)
  - mini Coverage Bar: horizontal bar with 4 colored segments proportional to counts
    - progressive: teal-500 #14B8A6
    - mixed: slate-400 #94A3B8
    - conservative: amber-600 #D97706
    - foreign: violet-500 #8B5CF6
  - Numeric labels: JetBrains Mono Bold (data tone)
  - Meta: total count "N=16" and relative time "3분 전"
- Sample quality handling:
  - If sample_quality === 'insufficient_sample': grey bar + "표본 부족" badge, NO numeric labels
- Click → navigate `/cluster/:id` (route placeholder, actual page in T-007)

## 3. API Route `apps/web/app/api/v1/widget/top/route.ts`
- GET handler only
- Query param: `size` ∈ {small, medium, large}, default medium
- Return mock data for P0w (5 clusters hardcoded)
  - Use mixed realistic Korean titles: "미국 금리 동결 발표", "국민연금 개편안 발표" etc.
- Response schemas from `apps/web/lib/api/widget-schemas.ts`
- Validate response with Zod before returning
- Headers: `Cache-Control: public, max-age=900, s-maxage=900` (15 min)

## 4. Zod Schemas `apps/web/lib/api/widget-schemas.ts`
Based on PRD v1.6 §8.2 EXACT schema:
- WidgetSmallResponse { cluster_id, title, coverage, sample_quality, updated_at, ad_allowed, affiliate_slot? }
- WidgetMediumResponse { clusters: WidgetSmallResponse × 3, updated_at }
- WidgetLargeResponse { clusters: WidgetSmallResponse × 5, methodology_version, overall_diversity_index, updated_at }
- `ad_allowed: z.boolean()` always present — set to `true` for this endpoint
- `affiliate_slot: z.object({...}).optional()` — always undefined for now (T-W04 fills this)

## 5. Layout `apps/web/app/layout.tsx`
- `<html lang="ko" className="dark">` for default dark mode
- Font: Pretendard Variable (local or next/font)
- metadata:
  - title: "뜬이유 — 실시간 이슈"
  - description: "한국 언론의 실시간 이슈와 보도 분포를 5초에 파악하세요."
  - openGraph fallback image (placeholder for now, real OG in P0a)

## 6. Tailwind Config `apps/web/tailwind.config.ts`
Install design tokens from PRD v1.6 §12.1 (=v1.4 §8.1):
- colors: slate-950 / 900 / 800 / 400 / 50, teal-500, amber-600, violet-500
- fontFamily: pretendard, inter, jetbrainsMono
- spacing: 4px base scale
- fontSize with line-height: display-md, heading-md, body-md, mono-md

## 7. Pnpm Workspace Setup
If `package.json` doesn't exist yet:
- Monorepo: `apps/web` + `apps/worker` (Python, skip for now) + `harness/` + `config/`
- pnpm workspace declared in `pnpm-workspace.yaml`
- Root `package.json` with scripts:
  - `dev`: `pnpm --filter @tteuniyu/web dev`
  - `build`: `pnpm --filter @tteuniyu/web build`
  - `typecheck`: `pnpm -r typecheck`
  - `lint`: `pnpm -r lint`
  - `test`: `pnpm -r test`
  - `harness:realtime-naming`: `tsx harness/checks/assert-realtime-naming.ts`
  - `harness:widget-contract`: `tsx harness/checks/assert-widget-contract.ts`

## 8. Minimal Harness Stubs (for this ticket only)
Do NOT implement full 18 harness checks — that's Sprint 0 (T-001).
Create minimal stubs for:
- `harness/checks/assert-realtime-naming.ts` — actually working:
  - grep through apps/web/**/*.{ts,tsx} for ban list: "실시간 검색어", "실검", "인기 검색어", "Trending Keywords"
  - exit 1 on match
- `harness/checks/assert-widget-contract.ts` — partial:
  - HTTP GET localhost /api/v1/widget/top?size=medium
  - validate response against Zod schema
  - assert no bias_score / factuality_score / embedding in payload
  - exit 1 on violation

## 9. README.md initial version
- Project overview (1 paragraph from PRD §1.1-1.2)
- Stack summary
- How to run: `pnpm install && pnpm dev`
- Link to `docs/prd-v1.6.md`

## Constraints (from CLAUDE.md)
- NEVER use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for direct table access in client
- NEVER expose bias_score, factuality_score, embedding in public responses
- NEVER use "실시간 검색어" / "실검" / "인기 검색어" anywhere
- Use "Coverage Distribution" / "보도 분포" only
- All Zod schemas validated at API boundary
- No `SELECT *` (even in mock, follow the pattern)

## Testing Order
1. `pnpm install` — success
2. `pnpm typecheck` — 0 errors
3. `pnpm dev` — server on :3000
4. Open `http://localhost:3000/widget` — 5 mock cards rendered, dark mode
5. `curl http://localhost:3000/api/v1/widget/top?size=medium | jq` — Zod-valid JSON with 3 clusters
6. `pnpm harness:realtime-naming` — pass (no ban words)
7. `pnpm harness:widget-contract` — pass (schema valid, no sensitive fields)
8. Intentional regression test:
   - Add `bias_score: 0.5` to mock data
   - `pnpm harness:widget-contract` — FAIL as expected
   - Revert

## Output to verify in PR
1. File tree
2. Screenshot of `/widget` page (mobile + desktop)
3. `curl` output of API
4. `pnpm harness:realtime-naming` stdout
5. `pnpm harness:widget-contract` stdout

## PR Title
T-W01 widget web MVP scaffold (P0w D0-D1)

## PR Description
- PRD sections: v1.6 §7.1 F-P0w-1, F-P0w-2, §8
- Requirement IDs: F-P0w-1, F-P0w-2
- ADR references: ADR-005 (AdZone boundaries respected — no AdZone in this ticket), ADR-002 (public API via Next route)
- Safety checklist: all 14 CLAUDE.md items reviewed
- Out of scope: Coverage detail page, RSS ingestion, clustering worker, AdZone, embed script

Request @codex review on PR.
```

---

## Codex 검증 프롬프트

PR 댓글에 붙일 것:

```
@codex review

You are the independent verifier for PRD v1.6 (확정본).

Review this PR against the following non-negotiable constraints from CLAUDE.md:

1. No public API response may include bias_score, factuality_score, embedding.
2. All Zod schemas must be validated at API route boundary, before return.
3. No "실시간 검색어" / "실검" / "인기 검색어" / "Trending Keywords" anywhere.
4. Widget API payload must include `ad_allowed` field (PRD §8.2).
5. Dark mode must be default (html className="dark").
6. All Korean text must use Pretendard, data numbers must use JetBrains Mono.
7. Mobile breakpoints must match PRD §12.2 (sm 360 / md 768 / lg 1024 / xl 1440).

## Adversarial tasks

Task A: Can you construct a PR that adds `factuality_score` to
WidgetSmallResponse and still passes `harness:widget-contract`? If yes,
harness has a false negative.

Task B: Can you find a code path where `ad_allowed` is false but
`<AdZone>` would still render (dangerous for future AdZone)? The AdZone
isn't implemented yet, but the ad_allowed contract must be robust.

Task C: Can you get "실검" to appear in the codebase (e.g., in a
comment, in a commented-out code block, in a test fixture) without
harness:realtime-naming catching it? The harness must scan comments too.

Task D: Does the Pretendard font load fail gracefully without blocking
the page? (Critical for first-paint in poor network conditions.)

If any of A/B/C/D reveals a false negative, report as BLOCKING.

Return blocking issues first, then nitpicks.
```

---

## 완료 기준 (태욱 merge 전 수동 확인)

- [ ] `pnpm dev` + localhost:3000/widget 모바일 + 데스크톱 시각 확인
- [ ] Vercel preview URL 배포 성공
- [ ] `/api/v1/widget/top?size=medium` 직접 호출 JSON 응답 올바름
- [ ] `pnpm harness:realtime-naming` 통과
- [ ] `pnpm harness:widget-contract` 통과 + 의도 반례 FAIL 확인
- [ ] Codex review 통과 (blocking 0)
- [ ] README.md에 링크 · 스택 · 실행법 포함
- [ ] Lighthouse 모바일 85+ (dev mode 기준, 참고용)

## 예상 소요 시간
- Claude Code 실행: 2~3시간 (첫 setup 포함)
- Codex 대응: 30~60분
- 태욱 수동 검토: 30분
- 총 ~4시간 (D0 오후 ~ D1 오전)
