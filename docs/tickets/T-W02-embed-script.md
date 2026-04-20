# T-W02: Creator Embed Script

| 항목 | 내용 |
|---|---|
| Phase | P0w |
| Day | D1~D3 (2026-04-22 ~ 2026-04-24) |
| 목적 | 외부 사이트용 `<script src>` 한 줄 임베드 + iframe 위젯 |
| PRD 참조 | v1.6 §7.1 F-P0w-3 |
| ADR 참조 | ADR-002 (Public API), ADR-005 (AdZone는 embed에서도 허용 영역) |
| 선행 티켓 | T-W01 (widget 페이지 완성) |
| 후속 티켓 | T-W03 (대기자 폼) |

---

## Claude Code 프롬프트

```
Read before coding:
- docs/prd-v1.6.md §7.1 F-P0w-3, §8 Widget API Contract
- docs/harness-roadmap-v1.6.md "T-W02"
- Previous PR: T-W01 widget scaffold

Do NOT modify the existing `/widget` page or API schema. This ticket adds
an external embeddable script, not a redesign.

## Scope
PRD v1.6 §7.1 F-P0w-3 Creator Embed Script.

## 1. `apps/web/public/embed/widget.js`

Vanilla JavaScript (no framework), served as static asset.

Functionality:
- On load, scan `document.querySelectorAll('script[data-tteuniyu-widget]')`
- For each matched script tag:
  - Read `data-size` attribute (small/medium/large, default medium)
  - Read `data-host` attribute (optional, for installer identification)
  - Create an iframe element with:
    - src = `https://<our-origin>/embed/iframe?size=<size>&host=<host>`
    - width/height based on size:
      - small: 300×180
      - medium: 400×320
      - large: 500×480
    - style: `border: 0; border-radius: 12px; overflow: hidden;`
    - loading: 'lazy'
    - referrerpolicy: 'origin'
  - Insert iframe immediately after the script tag
- Post-install: POST to `/api/v1/embed/install` with {host, size, user_agent}
  - Fire and forget, no await

Constraints:
- Vanilla JS only, no dependencies
- Must work with `<script async>`
- Max 5KB minified
- No inline styles on iframe beyond the minimum above (let iframe page set dark mode)
- Handle script being included multiple times on one page (idempotent)

## 2. `apps/web/app/embed/iframe/page.tsx`

Server Component, similar to `/widget` but:
- Single size-specific render (from query param)
- No header "실시간 이슈 · 뜬이유" text (replaced with "Powered by 뜬이유" footer)
- No Pro CTA / Creator / B2B footer links
- Click on card: use `<a target="_blank" rel="noopener">` to open in new tab
- Dark mode default (inherit from layout)
- CSP headers set to allow framing from any origin (P0w; V1 whitelist)

Query params:
- `size`: small | medium | large (default medium)
- `host`: host domain for analytics (optional)

## 3. `apps/web/app/api/v1/embed/install/route.ts`

POST handler:
- Body schema (Zod): { host: string, size: enum, user_agent: string }
- Insert row into `embed_installations` table (create migration in this PR):
  - id UUID PK
  - host TEXT NOT NULL
  - size TEXT NOT NULL
  - user_agent TEXT
  - installed_at TIMESTAMPTZ DEFAULT now()
  - install_count INT DEFAULT 1 (UPSERT increments on conflict host+size)
- Return 200 OK
- Rate limit: 100 inserts/minute per IP (simple in-memory for P0w)
- No PII stored

## 4. Supabase Migration

`supabase/migrations/00010_embed_installations.sql`:
```sql
CREATE TABLE embed_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host TEXT NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
  user_agent TEXT,
  install_count INT NOT NULL DEFAULT 1,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(host, size)
);

CREATE INDEX idx_embed_installations_host ON embed_installations(host);
REVOKE ALL ON embed_installations FROM anon, authenticated;
```

## 5. Demo Page `apps/web/app/embed/demo/page.tsx`

- Publicly accessible demo showing `<script>` installation
- Includes code snippet that visitors can copy:
  ```html
  <script async
    src="https://tteuniyu.com/embed/widget.js"
    data-tteuniyu-widget
    data-size="medium"></script>
  ```
- Live embed of itself (recursive for self-test)
- Install instructions in Korean

## 6. CORS Configuration

`apps/web/middleware.ts` or route-level headers:
- `/api/v1/widget/top` → `Access-Control-Allow-Origin: *` (public read)
- `/api/v1/embed/install` → `Access-Control-Allow-Origin: *` (needed for cross-origin POST)
- `/embed/iframe` → `X-Frame-Options: ALLOWALL` (or omit; P0w permissive, V1 whitelist)
- CSP: `frame-ancestors *;` for embed/iframe route only

## 7. Testing

`apps/web/tests/embed.test.ts`:
- Parse embed/widget.js and verify max size ≤ 5KB
- Verify iframe creation logic with JSDOM
- Verify install POST happens once even with duplicate script tags

E2E via Playwright:
- Spin up local server
- Create a minimal HTML page with the `<script>` tag
- Serve that page on different origin (port 3001)
- Visit port 3001, verify iframe renders with widget content
- Verify `embed_installations` row created

## 8. Analytics

Add PostHog events:
- `embed_script_loaded` (from embed/widget.js)
- `embed_iframe_mounted` (from /embed/iframe page)
- `embed_card_clicked` (from inside iframe, include host in properties)

## Constraints (CLAUDE.md)
- Embed must not leak sensitive fields (same as /widget)
- Embed iframe page is READ-ONLY — no AdZone in this ticket (T-W04)
- Host domains stored are not PII, but be cautious with user_agent length (truncate to 255)
- No cookies set by embed (avoid tracking consent complexity)

## Testing Order
1. `pnpm typecheck`, `pnpm lint`
2. `pnpm build` succeeds
3. `supabase db reset` runs the new migration
4. Local demo page renders embedded widget
5. External port 3001 test: iframe appears with 5 mock issues
6. `SELECT * FROM embed_installations` shows inserted row
7. `pnpm harness:widget-contract` still passes
8. `pnpm harness:realtime-naming` still passes
9. Minified embed/widget.js ≤ 5KB

## Output
- File tree
- Screenshot of demo page with embedded iframe
- curl POST to install endpoint
- SQL query result of embed_installations

## PR Title
T-W02 creator embed script (P0w D1-D3)

## PR Description
- PRD: v1.6 §7.1 F-P0w-3
- Requirement IDs: F-P0w-3
- ADR: ADR-002 (public API)
- Safety checklist
- Out of scope: custom styling per installer (V1), auth/domain whitelist (V1)
```

---

## Codex 검증 프롬프트

```
@codex review

Adversarial tasks:

Task A: Can the embed/widget.js be abused to inject arbitrary content
into the installer's site (XSS via iframe src manipulation)?

Task B: Can you trigger a self-DDoS by putting the script tag inside
the iframe page itself (recursive embed)? Verify idempotency guard.

Task C: Can you read bias_score from inside the iframe via some
side-channel (postMessage, document.referrer, etc.)?

Task D: Does `/embed/iframe` accidentally render `<AdZone>` even though
T-W04 hasn't added it yet? The hook should already be in place to
prevent accidental inclusion later.

Task E: CSP misconfiguration — can a malicious site frame `/widget`
(not `/embed/iframe`) and steal credentials?

Task F: Install endpoint abuse — can attacker flood the
embed_installations table?

Report blocking issues first.
```

## 완료 기준
- [ ] `<script>` 한 줄로 외부 사이트에 위젯 삽입 동작
- [ ] 5KB 이하 minified
- [ ] `embed_installations` 테이블 UPSERT 정상
- [ ] CSP 설정으로 `/embed/iframe`만 iframe 허용 확인
- [ ] Codex blocking 0

## 예상 소요 시간
Claude Code 3~4시간 + Codex 1시간 + 수동 1시간 = 반일 (D1 오후 ~ D2)
