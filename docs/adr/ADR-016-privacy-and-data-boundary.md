# ADR-016 — Privacy & Data Boundary (PIPA + PostHog 단계적 정비)

> **Status**: Accepted (2026-05-10, P0w D7+2)
> **Decision date**: 2026-05-10
> **Decider**: 태욱 (Founder)
> **Driving source**: `docs/legal/2026-05-10-legal-response-opinion.md` §5 (line 466-573)
> **Related**: ADR-007 Amendment 1 (제휴 데이터 경계), ADR-014 (LLM 비용·캐시), CLAUDE.md 비협상 15조

---

## 1. Context

변호사 자문 의견서 §5는 개인정보 영역에 대해 다음과 같이 결론을 내렸다.

- 개인정보 영역은 "동의 구조 전 출시 보류" 사유 X (의견서 line 469-471)
- 대신 **P0a 단계에서 우선 정비할 compliance checklist**로 관리
- 실사용자 데이터 수집 시작 시 다음 최소 장치 필요 (line 472-478)
  - 개인정보 수집·이용 고지
  - 국외 이전 관련 고지/동의
  - 분석 이벤트 수집 고지
  - 마케팅 수신 동의 분리
  - 만 14세 미만 차단 또는 법정대리인 동의
  - 보유 기간·파기 기준 명시

PostHog Cloud (US 리전) 사용으로 발생하는 PIPA §28-8 국외 이전 이슈를 단계화한다. P0a에서는 **수집 최소화 + 식별자 전송 금지 + 고지/동의 정비** 3가지를 즉시 적용하고, P1에서 동의 항목 분리 + event allowlist + retention 정합성 점검을 보강한다.

본 ADR은 ADR-007 (제휴 데이터 경계)과 짝을 이루며, 사용자 데이터(개인정보)와 운영자 데이터(제휴)의 경계 원칙을 일관되게 정의한다.

---

## 2. Decision

### 2.1 P0a 즉시 적용 (출시 차단 X — checklist 형태)

#### A. 만 14세 미만 가입 차단

- 가입·대기자 폼에 "만 14세 이상만 가입할 수 있습니다." 명시
- 생년월일 입력 필수, 14세 미만 자동 거부
- 14세 ~ 19세 미만 — P0b 결제 화면에서 법정대리인 동의 절차 (PG 제공)
- 근거 — PIPA §22-2 (만 14세 미만 법정대리인 동의)

#### B. 개인정보 수집·이용 고지

대기자 폼 하단에 다음 3가지 고지 체크박스.

1. **[필수] 개인정보 수집·이용 안내** (이메일·회사명/도메인·사용 케이스·이용 의향 점수 — 보유 1년 또는 동의 철회 시까지)
2. **[선택] 제품 소식 및 마케팅 수신 동의** (이메일 — 거부 시에도 등록 가능)
3. **[안내/동의] 개인정보 국외 이전** (PostHog Inc. 미국 — IP·UA·페이지 URL·클릭 이벤트·브라우저/기기 — 13개월)

전체 표준 문구는 `docs/privacy-policy-draft.md` 참조.

#### C. PostHog autocapture 비활성화 + 직접 식별자 전송 금지

```ts
// apps/web/lib/analytics/posthog.ts
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: 'https://us.i.posthog.com',
  autocapture: false,                   // form input 자동 capture X
  capture_pageview: true,               // 페이지뷰만
  session_recording: { enabled: false }, // session replay X
  property_blacklist: [
    'email', 'name', 'company', 'phone', 'address',
    '$current_url',  // URL query string에 token 노출 방지
  ],
  loaded: (ph) => {
    // 14세 미만은 PostHog 로딩 자체 X
    if (window.localStorage.getItem('age_under_14') === 'true') {
      ph.opt_out_capturing()
    }
  },
})
```

### 2.2 P1 (P0a 안정화) 보강

- 국외 이전 동의 항목 분리 (3 체크박스 → 4 체크박스 — 국외 이전 별도)
- event property allowlist 적용 (whitelist 방식 — 명시 안 된 property는 자동 차단)
- session replay 비활성화 강제 (명시적 enabled: false 외에 SDK option 차단)
- retention setting과 실제 파기 cron 정합성 점검 (분기 1회)

### 2.3 V0.5+ 보강

- 외부 감사 (BSI/IAPP 인증 검토)
- 자동 파기 cron의 audit log + 분기 보고서 자동 생성
- 사용자 self-serve 데이터 export / 삭제 (GDPR Right to be Forgotten 준비)

---

## 3. Implementation Plan

### 3.1 신규 파일

- `docs/privacy-policy-draft.md` — 개인정보 처리방침 v1.0 초안 (사용자가 변호사 검토 후 정식)
- `apps/web/lib/analytics/posthog.ts` — autocapture 비활성화 설정 (P0a 진입 시 신규)
- `apps/web/components/PrivacyConsent.tsx` — 대기자 폼 하단 고지 체크박스 3개 (P0a)

### 3.2 신규 harness

- `harness:posthog-autocapture-off` — `posthog.init` 호출에 `autocapture: false` + `property_blacklist` 검증
- `harness:age-gate-presence` — 모든 가입·대기자 폼에 `<AgeGate min={14} />` 또는 동등 검증 컴포넌트 존재 확인

### 3.3 schema (P0a Sprint 0)

```sql
-- supabase/migrations/0042_privacy_consent.sql
CREATE TABLE IF NOT EXISTS user_consent (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  required_consent_version text NOT NULL,    -- '2026-05-10-v1'
  required_consent_at timestamptz NOT NULL,
  marketing_consent boolean DEFAULT false,
  marketing_consent_at timestamptz,
  posthog_overseas_consent boolean DEFAULT false,
  posthog_overseas_consent_at timestamptz,
  birth_year smallint NOT NULL,              -- 14세 미만 자동 거부
  withdrawn_at timestamptz                   -- 동의 철회 시점
);

CREATE INDEX user_consent_required_at ON user_consent(required_consent_at);
```

### 3.4 retention cron (P0a Sprint 1)

- 매일 03:00 KST 실행
- `user_consent.withdrawn_at + 30 days` 경과 사용자 자동 파기
- `user_consent.required_consent_at + 13 months` 경과 사용자 자동 파기 (대기자 운영 종료 후 1년)
- 파기 결과는 `audit_logs.retention_cron` 테이블에 기록

---

## 4. Migration Plan

### 4.1 P0w 단계 (현재)

- ADR-016 발의로 구조 확정
- `docs/privacy-policy-draft.md` 초안 작성 (변호사 검토 후 정식)
- 코드 변경 X — 실 사용자 0이라 PostHog autocapture 트리거 안 됨

### 4.2 P0a 단계 (D10~D24)

- `apps/web/lib/analytics/posthog.ts` 설정 적용 (autocapture 비활성화)
- `apps/web/components/PrivacyConsent.tsx` 대기자 폼에 합류
- `apps/web/components/AgeGate.tsx` 대기자 폼 + 가입 화면에 합류
- `harness:posthog-autocapture-off` + `harness:age-gate-presence` 구현
- `supabase/migrations/0042_privacy_consent.sql` 적용
- `docs/privacy-policy-draft.md` → `docs/privacy-policy-v1.0.md` 정식화 (변호사 사인오프 후)

### 4.3 P1 단계 (P0a 안정화 후)

- event property allowlist 적용
- 국외 이전 동의 별도 분리
- retention cron 가동
- 분기 1회 privacy checklist 점검 시작

### 4.4 V0.5+ 단계

- 외부 감사
- 사용자 self-serve 데이터 export / 삭제
- audit log + 분기 보고서 자동 생성

---

## 5. Risks

### 5.1 PostHog autocapture 비활성화로 분석 데이터 누락

- 위험 — autocapture 비활성화로 사용자 이벤트 수집 정확도 ↓
- 완화 — `capture_pageview: true` + 명시적 `posthog.capture('event_name', props)` 호출로 핵심 이벤트만 수집
- 완화 — `apps/web/lib/analytics/events.ts`의 11개 핵심 이벤트는 명시적 capture로 보장

### 5.2 14세 미만 자가신고 부정확

- 위험 — 사용자가 거짓 생년월일 입력 가능
- 완화 — 가입 시 한 번만 검증, 사후 적발 시 즉시 계정 차단 + 데이터 파기
- 완화 — 약관에 "허위 정보 입력 시 서비스 이용 정지" 명시

### 5.3 PostHog SDK 업데이트로 기본 동작 변경

- 위험 — PostHog SDK가 새 default를 활성화 (예 session replay)
- 완화 — `harness:posthog-autocapture-off` 가 명시적 false 설정 검증 → SDK 업데이트 시 즉시 알림
- 완화 — package.json에 PostHog SDK 버전 lock + 분기 1회 release notes 검토

### 5.4 retention cron 실패

- 위험 — cron 장애로 13개월 경과 데이터 파기 누락 → PIPA §21 위반
- 완화 — cron 실행 결과를 Slack 알림 + Supabase Function 모니터링
- 완화 — 분기 1회 manual check (privacy checklist 항목)

---

## 6. Alternatives Rejected

### 6.1 PIPA 영역을 출시 보류 사유로 본다

- 거부 이유 — 변호사 권고 (의견서 line 469) — "출시 보류 X"
- 채택 이유 — 단계적 정비로 P0a 진입 가능 + 우선 3가지 즉시 적용

### 6.2 PostHog 사용 자체를 폐기

- 거부 이유 — 분석 데이터 0이면 P0a/P0b 검증 불가
- 채택 이유 — autocapture 비활성화 + 명시적 capture만 + 직접 식별자 전송 금지로 위험 완화

### 6.3 자체 분석 시스템 구축

- 거부 이유 — P0w/P0a 단계에 비용·시간 부담, 외부 감사도 별도
- 채택 이유 — V1+ 검토 항목으로 보류

---

## 7. Sign-off

```
Decided ─ 2026-05-10 (P0w D7+2)
Decider ─ 태욱 (Founder)
Driving source ─ docs/legal/2026-05-10-legal-response-opinion.md §5
Status ─ Accepted (개인정보 처리방침 정식화는 P0a 변호사 사인오프 후)
```

---

## 8. References

- 변호사 자문 의견서 §5 (line 466-573)
- PIPA §21 (불필요한 개인정보 지체 없는 파기)
- PIPA §22-2 (만 14세 미만 법정대리인 동의)
- PIPA §28-8 (국외 이전 동의 요건)
- 정통망법 §44-2 (정정 요청권), §44-3 (임시조치)
- ADR-007 Amendment 1 (제휴 데이터 경계)
- ADR-014 (LLM 비용·캐시)
- CLAUDE.md 비협상 15조 (Trust Signal & Investment Risk + Lawyer-mandated)

**End of ADR-016 — 2026-05-10**
