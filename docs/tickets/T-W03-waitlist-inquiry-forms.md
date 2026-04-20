# T-W03: Pro / Creator / B2B Waitlist & Inquiry Forms

| 항목 | 내용 |
|---|---|
| Phase | P0w |
| Day | D3~D4 (2026-04-24 ~ 2026-04-25) |
| 목적 | 3개 수익 의향 수집 폼 + 서버 라우트 + 확인 이메일 |
| PRD 참조 | v1.6 §7.1 F-P0w-4, F-P0w-5, F-P0w-6 |
| ADR 참조 | ADR-002 (public API via next route), ADR-005 (수익 영역 분리) |
| 선행 티켓 | T-W01, T-W02 |
| 후속 티켓 | T-W04 AdZone |

---

## Claude Code 프롬프트

```
Read before coding:
- docs/prd-v1.6.md §7.1 F-P0w-4,5,6, §9 Monetization Strategy
- docs/harness-roadmap-v1.6.md "T-W03"
- Previous PRs: T-W01, T-W02

## Scope
Three forms for early revenue intent capture:
1. Pro Preorder (B2C subscription intent, 5-point Likert scale)
2. Creator Embed Waitlist (newsletter/blog operator interest)
3. B2B / API Inquiry (enterprise lead)

## 1. Supabase Migration

`supabase/migrations/00011_waitlist_expansion.sql`:
```sql
-- Extend or create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  waitlist_type TEXT NOT NULL CHECK (waitlist_type IN ('pro_preorder', 'creator_embed', 'b2b_inquiry')),
  intent_score INT CHECK (intent_score BETWEEN 1 AND 5),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_verified_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(email, waitlist_type)
);

CREATE INDEX idx_waitlist_type_created ON waitlist(waitlist_type, created_at DESC);
CREATE INDEX idx_waitlist_intent_score ON waitlist(waitlist_type, intent_score) WHERE intent_score >= 4;

REVOKE ALL ON waitlist FROM anon, authenticated;
```

## 2. Zod Schemas `apps/web/lib/api/waitlist-schemas.ts`

```typescript
export const ProPreorderInput = z.object({
  email: z.string().email(),
  intent_score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  price_feedback: z.enum(['too_cheap', 'fair', 'too_expensive']).optional(),
})

export const CreatorEmbedInput = z.object({
  email: z.string().email(),
  site_url: z.string().url(),
  monthly_visitors: z.enum(['<1k', '1k-10k', '10k-100k', '>100k']),
  topic_interest: z.string().max(200),
  willingness_to_pay: z.number().int().min(0).max(30000).optional(), // KRW
})

export const B2BInquiryInput = z.object({
  email: z.string().email(),
  company_name: z.string().min(1).max(100),
  contact_name: z.string().min(1).max(50),
  company_size: z.enum(['<10', '10-50', '50-200', '200-1000', '>1000']),
  use_case: z.enum(['monitoring', 'api_integration', 'research', 'other']),
  message: z.string().max(1000),
})
```

## 3. API Routes

### `apps/web/app/api/v1/waitlist/pro/route.ts`
- POST only
- Validate ProPreorderInput
- INSERT INTO waitlist (email, waitlist_type='pro_preorder', intent_score, metadata={comment, price_feedback})
- On UNIQUE conflict: UPDATE intent_score and metadata if newer
- Send verification email via Resend
- Fire PostHog event `pro_preorder_submitted` with intent_score property
- Return 200 { ok: true, message: "확인 이메일을 보냈습니다." }

### `apps/web/app/api/v1/waitlist/creator/route.ts`
- POST only
- Validate CreatorEmbedInput
- INSERT INTO waitlist (waitlist_type='creator_embed', metadata={site_url, monthly_visitors, topic_interest, willingness_to_pay})
- Send confirmation + early access info email
- Fire `creator_waitlist_submitted`

### `apps/web/app/api/v1/waitlist/b2b/route.ts`
- POST only
- Validate B2BInquiryInput
- INSERT INTO waitlist (waitlist_type='b2b_inquiry', metadata={company_name, contact_name, company_size, use_case, message})
- Send "문의가 접수되었습니다 + 24시간 내 회신" email
- Fire `b2b_inquiry_submitted`
- Also send notification email to founder@tteuniyu.com

## 4. UI Components

### `apps/web/components/ProWaitlistModal.tsx`
- shadcn/ui Dialog
- Fields:
  - Email input
  - "월 ₩6,900이면 가입 의향이 있습니까?" 5-point scale (radio)
  - (Optional) "한 줄 의견" textarea
  - (Optional) price feedback select
- Submit button: "알림 받기"
- Label: "Pro 기능은 아직 출시 전입니다. 알림 받으실 분만 남겨주세요."
  (assert-monetization-claims 통과용)
- Success: show confirmation + close modal + PostHog capture

### `apps/web/components/CreatorWaitlistForm.tsx`
- Inline form or modal
- Label: "크리에이터 Embed 얼리 액세스"
- Fields per CreatorEmbedInput
- Submit: "얼리 액세스 신청"
- Success: confirmation message + share button to promote to fellow creators

### `apps/web/components/B2BInquiryForm.tsx`
- Inline form
- Label: "기업 · 기관 문의"
- Fields per B2BInquiryInput
- Submit: "문의하기"
- Success: "24시간 내 회신드립니다" message

## 5. Integration into `/widget` page

Update `apps/web/app/widget/page.tsx` footer:
- "Pro 출시 알림 받기" button → opens ProWaitlistModal
- Creator section with "Embed 얼리 액세스" card → opens CreatorWaitlistForm
- B2B section with "기업 문의" → opens B2BInquiryForm or inline accordion

## 6. Email Templates (Resend)

`apps/web/lib/email/templates.ts`:
- `proPreorderConfirmation(email, intentScore)`: Korean, warm tone, mention "~% 지불 의향" 감사 + "출시 전 70% 할인 우선 코드" 예고
- `creatorEmbedConfirmation(email, siteUrl)`: "Embed 설치 가이드 먼저 보내드릴게요" + 로드맵 링크
- `b2bInquiryConfirmation(email, companyName)`: 공식 톤, 24시간 회신 약속
- Include unsubscribe link in all emails (전자상거래법 준수)

## 7. Rate Limiting

- POST rate limit: 5/min per IP (per route)
- Email rate limit: 1 same-email-same-waitlist-type per 24h

## 8. Harness Integration

Ensure these keep passing:
- `harness:realtime-naming` — no "실검" in form labels
- `harness:widget-contract` — no impact
- `harness:monetization-claims` — "Pro 기능은 아직 출시 전입니다" 라벨 강제

Add new partial harness:
- `harness/checks/assert-waitlist-intent-score.ts`:
  - Scan API route code for intent_score field
  - Verify all intent_score INSERTs include CHECK bounds validation
  - Ensure metadata JSONB never includes "bias_score" or similar leaks

## 9. Analytics Events

PostHog events added this ticket:
- `pro_preorder_submitted` properties: {intent_score, has_comment}
- `creator_waitlist_submitted` properties: {site_domain, monthly_visitors_bucket}
- `b2b_inquiry_submitted` properties: {company_size, use_case}
- `pricing_cta_clicked` properties: {plan_type} (fire on any form open)

## 10. Testing

Unit:
- Zod validation happy/sad paths for each schema
- Email template renders (Korean) without mojibake

Integration:
- POST each route → DB row created + PostHog event captured
- Duplicate email + same waitlist_type → UPDATE not duplicate INSERT
- Rate limit enforced

E2E Playwright:
- Fill Pro form with score 5 → submit → confirmation visible
- Check DB via Supabase client (service_role in test) → row exists

## Constraints (CLAUDE.md)
- No PII beyond email + company_name/contact_name
- All INSERTs via server route with service_role (no client-side Supabase writes)
- Email validation at BOTH Zod + server side
- Unsubscribe compliance

## Testing Order
1. `supabase db reset` → migration applies
2. `pnpm dev` + fill each form
3. Verify DB rows created
4. Verify Resend test email received
5. `pnpm harness:all` (partial) passes
6. `pnpm test` unit + integration

## Output
- Screenshots of 3 forms (success + error states)
- DB query showing 3 row types inserted
- Sample Resend email screenshots (3 templates)

## PR Title
T-W03 pro/creator/b2b waitlist forms (P0w D3-D4)

## PR Description
- PRD: v1.6 §7.1 F-P0w-4,5,6
- Requirement IDs: F-P0w-4, F-P0w-5, F-P0w-6
- ADR: ADR-002, ADR-005
- Out of scope: Actual Pro payment flow (P0b T-B01), Creator paid conversion (P0b), B2B contract signing (P0b)
```

---

## Codex 검증 프롬프트

```
@codex review

Adversarial tasks:

Task A: Attempt to submit form with manipulated intent_score=999 via
direct API call — does server-side Zod catch it?

Task B: Can attacker enumerate emails by POSTing many emails and
observing "duplicate" vs "new" responses differently? (Should return
same 200 OK regardless, never leak existence.)

Task C: SQL injection in company_name / message fields?

Task D: Can attacker bypass rate limit via IPv6 rotation? Are we using
X-Forwarded-For correctly?

Task E: Does "Pro 기능 출시 예정" copy trigger
assert-monetization-claims correctly? Try adding misleading copy like
"지금 가입하면 평생 무료" — should fail harness.

Task F: Email template — do unsubscribe links work? (전자상거래법)

Task G: Can bias_score accidentally be logged into metadata JSONB?
Check all INSERT paths.

Report blocking issues first.
```

## 완료 기준
- [ ] 3개 폼 모두 로컬에서 동작
- [ ] DB row 저장 + Resend 이메일 수신
- [ ] 중복 제출 시 UPDATE 동작
- [ ] Rate limit 작동
- [ ] 3종 PostHog 이벤트 발화 확인
- [ ] assert-monetization-claims 통과
- [ ] Codex blocking 0

## 예상 소요 시간
Claude Code 4시간 + Codex 1시간 = 거의 하루 (D3 ~ D4 오전)
