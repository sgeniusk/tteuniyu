# ADR-011: Hybrid Coin + Subscription Monetization Model

| 항목 | 내용 |
|---|---|
| 상태 | Accepted (v1.7 candidate, P0w 검토 종료 후 정식 채택 예정) |
| 결정일 | 2026-05-03 |
| 결정자 | 태욱 (Founder) |
| 참조 | PRD v1.6 §10 (현 단일 Pro 모델), 외부 자문 (Gemini + ChatGPT 2026-05-03) |
| 대체 | PRD v1.6 §10 — 단일 Pro ₩6,900 단가 |
| 구현 시작 | P0w mock UX (T-W04 통합), 실 결제는 P0b (T-B01) |

---

## Context

PRD v1.6의 단일 Pro ₩6,900/월 모델은 두 가지 한계가 명확:

1. **한국 사용자 결제 마찰 큼**: 로이터 Digital News Report 2025 — 한국 온라인 뉴스 유료 결제 경험률 19%, 뉴스 신뢰도 31%. "월 구독" 언어로는 설득력 약함.
2. **Creator/B2B와 B2C 단가 차이 부재**: 단일 가격은 헤비 유저(IR·트레이더·크리에이터)와 라이트 유저(시민) 모두에게 어색.

외부 자문 (Gemini + ChatGPT) 종합 + 사용자(태욱)의 한국 모바일 게임 결제 패턴 적용 의지로 **이중 모델** 결정:

- **Free 사용자**: 코인 시스템 (광고 시청·일일 보상으로 적립 또는 패키지 구매)
- **유료 사용자**: 3 tier 구독 (Pro / Creator / Leader, Creator 전환이 핵심 KPI)
- **구독자도 한도 초과 시 코인 사용** — 광고 없는 환경 유지하면서 추가 분석 가능

이 모델의 강점:
- 한국 모바일 게임 결제 패턴 익숙 (코인 + 광고 + 구독 사다리는 검증된 UX)
- 광고를 "마찰"이 아닌 "획득 수단"으로 변환 (광고 = 코인 = AI 분석)
- "쓸모를 확인한 뒤 잠금 해제" UX — ChatGPT 권장 접근
- Creator $9.99/월에 사다리의 sweet spot 배치 (광고 없음 + 충분한 한도)

---

## Decision

**Free 코인 시스템 + 3 tier 구독 동시 운영. 모든 결제 단가는 글로벌 $ 표시 (App Store/Play Store 자동 ₩ 환산).**

### 1. 코인 시스템 (Free 사용자 + 구독자 한도 초과)

**획득 경로**

| 행동 | 코인 |
|---|---|
| 일일 앱 열기 (1일 1회) | 1 |
| 광고 클릭 | 2 (일 최대 5회 = 10코인 cap) |
| 광고 풀시청 (~30초) | 10 (일 최대 5회 = 50코인 cap) |

→ **광고 시청 일일 적립 한도 60코인** (어뷰징 방지, 광고주 ROI 보호).

**소비 경로**

| 사용처 | 코인 차감 |
|---|---|
| AI 분석 1건 (entity_card + trend + 매체별 분석 모두 포함) | **10** |

→ 광고 풀시청 1회 = 1건 분석 가능. 일일 무료 1코인은 누적해야 의미 (10일 = 1건).

**코인 패키지** (in-app purchase)

| 패키지 | 가격 | 코인 | 보너스 | 분석 가능 |
|---|---|---|---|---|
| Starter | $0.99 | 100 | 0 | 10건 |
| Plus | $4.99 | 600 | +100 | 70건 |
| Heavy | $9.99 | 1,300 | +300 | 160건 |
| Mega | $19.99 | 3,000 | +1,000 | 400건 |
| Whale | $49.99 | 8,000 | +3,000 | 1,100건 |

가격 곡선: 패키지가 커질수록 코인당 단가 하락 (한국 모바일 게임 표준 — 결제 유도).

### 2. 3 tier 구독 (Creator 전환이 KPI)

| Tier | 월 | 연간 (10개월 가격) | 광고 | AI 분석 한도/일 | 추가 혜택 |
|---|---|---|---|---|---|
| Free | $0 | $0 | 노출 + 코인 적립 가능 | 코인으로 결제 | — |
| **Pro** | **$4.99** | **$49.90** | **제거** | **10건/일** | 키워드 알림 5개, PDF 다운로드 |
| **Creator** | **$9.99** | **$99.90** | 제거 | **100건/일** | Embed 무제한, 워터마크 제거, 키워드 알림 20개 |
| **Leader** | **$19.99** | **$199.90** | 제거 | **무제한 (soft limit ~500/일)** | API key (rate-limited), Slack/메일 자동 발송, B2B Lite 베타 |

**연간 결제 할인**: 10개월 가격으로 12개월 (17% 할인). 한국 SaaS 표준.

### 3. 구독자 한도 초과 시 코인 사용 (Hybrid)

- Pro가 11번째 분석 → "오늘 한도 초과 — 코인 10개로 추가 분석 또는 Creator 업그레이드?" 모달
- Creator가 101번째 분석 → "코인 10개로 추가 또는 Leader 업그레이드?" 모달
- Leader 무제한이지만 ~500/일 soft limit (어뷰징 차단)

**광고 시청 옵션**: Pro/Creator 사용자는 광고 없는 환경 유지하지만, 한도 초과 시 자발적 광고 시청 옵션 제공:
- "광고 보고 +10 코인 받기" 버튼 노출 (강제 X)
- 사용자 선택 시 광고 노출 → 코인 적립 → 분석 사용

### 4. Creator 전환 강조 UX (사용자 명시 KPI)

- 결제 화면 비교 표에 **Creator 강조 배지** ("이번 달 가장 인기")
- Pro 한도 도달 시 모달: "Creator는 100건/일 (10배). +$5/월"
- 첫 결제 시 default 선택 = Creator (사용자가 Pro·Leader는 명시 변경)

### 5. Trial / 첫 결제 정책

**무료 체험 미운영** — 코인 시스템이 본질적 무료 체험. 한국 2025-02-14 자동전환 추가 동의 의무 회피.

- 첫 진입: 코인 0 + 광고 시청으로 무료 분석 가능
- 결제 결정: "광고 없는 환경 + 한도" 가치를 충분히 느낀 사용자만
- 직접 구독 결제 (체험 → 정가 자동전환 없음)

### 6. 가격 표시

- **글로벌 $ 표시** (App Store/Play Store 자동 ₩ 환산)
- 추가로 ₩ 보조 표기 (₩6,500 / ₩12,900 / ₩25,900 등) — 사용자 즉시 인지

---

## Implementation Contract

### Coin economy

```typescript
// lib/coins/balance.ts (P0w mock — localStorage)
export const COIN_PER_ANALYSIS = 10
export const COIN_DAILY_LOGIN = 1
export const COIN_AD_CLICK = 2
export const COIN_AD_FULL_VIEW = 10

export const AD_DAILY_CAP_COIN = 60 // 광고 적립 일일 최대

// P0a swap → Supabase `user_coins` table
export interface CoinBalance {
  user_id: string
  balance: number
  last_daily_login_at: string | null
  ad_coin_earned_today: number
  ad_coin_reset_at: string
}
```

### Subscription tier

```typescript
export type SubscriptionTier = 'free' | 'pro' | 'creator' | 'leader'

export interface TierLimits {
  ads_visible: boolean
  daily_analysis_limit: number | null // null = unlimited (soft cap)
  keyword_alerts_max: number
  embed_watermark_removed: boolean
  api_access: boolean
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: { ads_visible: true, daily_analysis_limit: 0, keyword_alerts_max: 0, embed_watermark_removed: false, api_access: false },
  pro: { ads_visible: false, daily_analysis_limit: 10, keyword_alerts_max: 5, embed_watermark_removed: false, api_access: false },
  creator: { ads_visible: false, daily_analysis_limit: 100, keyword_alerts_max: 20, embed_watermark_removed: true, api_access: false },
  leader: { ads_visible: false, daily_analysis_limit: 500, keyword_alerts_max: 100, embed_watermark_removed: true, api_access: true },
}
```

### Analytics events (T-W05 + 신규)

```
coin_earned        { source: 'daily_login' | 'ad_click' | 'ad_full_view' | 'purchase', amount }
coin_spent         { destination: 'analysis', cluster_id, amount }
coin_purchase      { package: 'starter' | 'plus' | 'heavy' | 'mega' | 'whale', amount }
analysis_paywall_hit { tier, daily_used, daily_limit }
analysis_unlocked  { tier, source: 'tier_quota' | 'coin' | 'ad_view' }
ad_view_completed  { coin_earned }
tier_upgraded      { from, to, trigger: 'daily_limit_modal' | 'pricing_page' | 'embed_watermark' }
subscription_started { tier, billing_cycle: 'monthly' | 'yearly', price_usd }
subscription_cancelled { tier, reason }
```

### Paywall trigger 위치 (코인 차감 또는 한도 도달 시점)

| 시점 | 동작 |
|---|---|
| Free가 cluster detail 진입 | AI 분석 카드 lazy show + "10 코인 사용 또는 광고 시청" 버튼 |
| Free가 광고 미시청 + 코인 0 | "광고 1번 보면 +10 코인 받기" 버튼만 활성 |
| Pro 한도 도달 (11번째 분석) | 모달 — "Creator로 ($5/월 추가) 또는 코인 사용" |
| Creator 한도 도달 (101번째) | 모달 — "Leader 또는 코인" |
| Embed iframe 카드 클릭 (워터마크) | "Creator 업그레이드 시 워터마크 제거" 안내 |
| API 키 요청 | "Leader 구독 또는 Enterprise 문의" |

---

## P0w mock 구현 범위 (T-W04에 통합)

P0w는 실제 결제·광고 SDK 미통합. 다음 mock UX만 시연:

- [ ] `lib/coins/balance.ts` — localStorage 기반 잔액
- [ ] `<CoinBalance>` 컴포넌트 — 헤더 우측 표시 ("🪙 35")
- [ ] `<TierBadge>` 컴포넌트 — Free/Pro/Creator/Leader 표시
- [ ] `<EarnCoinsModal>` — "광고 보고 +10 코인" mock (실제 광고 SDK 없음, 5초 progress bar로 시뮬)
- [ ] `<TierComparisonModal>` — Pro/Creator/Leader 비교 표 (Creator 강조)
- [ ] `<PaywallTrigger>` — 한도 도달 또는 Free 분석 진입 시 노출
- [ ] AI 분석 카드 lazy 렌더 (Free는 "🔓 잠금 해제" 버튼 클릭 후 노출)
- [ ] mock tier 전환 (개발자 도구로 Free/Pro/Creator/Leader 강제 변경 가능)

P0a/P0b 본격 구현:
- Supabase `user_coins` + `subscriptions` 테이블
- Toss/Stripe Korea 결제 통합 (T-B01)
- AdMob 또는 카카오 애드핏 SDK 통합 (T-B05+)
- 한국 자동전환 추가 동의 회피 — 직접 구독 결제만

---

## Consequences

### Positive

- **결제 마찰 우회**: 광고 시청 → 코인 → 분석으로 무료 사용자도 즉시 가치 체감
- **Creator 전환 sweet spot 명확**: $9.99/월에 광고 없음 + 100건/일 = 다른 tier 대비 가성비 가장 좋게 설계 → 사용자 명시 KPI 달성 경로
- **헤비 유저 대응**: Leader $19.99에 무제한 + API + Slack 통합 = 트레이더·리서처·B2B 헤비 사용자 흡수
- **광고 수익화 + 구독 수익화 동시 운영**: 한 모델이 다른 모델을 갉아먹지 않음 (Pro 이상은 광고 무관, Free는 광고가 가치)
- **한국 모바일 게임 결제 UX 친숙**: 학습 곡선 0
- **글로벌 가격 일관성**: $ 표시는 App Store/Play Store 자동 환산 → 운영 단순

### Negative

- **이중 모델 복잡도**: 코인 잔액 + 구독 tier + 한도 추적 동시 관리 → 백엔드 schema·UX 양쪽 복잡
- **광고 SDK 통합 부담**: P0b 이후 AdMob 또는 카카오 애드핏 통합 시 PIPA·표시광고법 동시 검토
- **Creator 전환 가설 미검증**: $9.99이 sweet spot이 맞는지 P0b 결제 데이터 후 확인 필요. 가설 틀리면 가격 재조정
- **코인 환산 비율 변경 어려움**: 일단 1건=10코인으로 출시 후 변경하면 사용자 반발 (잔액 보유자 보상 필요)
- **Free 사용자가 분석 못 보는 충격**: Free 첫 진입 시 코인 0 → 즉시 paywall. "위젯은 무료, 분석은 잠금" 인지 마찰 가능
- **한국 게임산업법 회피 책임**: 코인을 게임 머니로 분류되면 등급 분류 + 청소년 보호 의무 추가. 명칭 신중

### Neutral

- 결제 통합 P0b까지 미루므로 P0w mock 단계에서 가설 검증 일부만 가능 (실 결제 의향은 P0b T-B01 후)
- 광고 시청 보상 일일 한도 60 코인은 사용자 만족도 vs 광고주 ROI tradeoff — 데이터 후 조정

---

## Alternatives Considered

### Alt-A: 단일 Pro $4.99 (현 PRD v1.6 단순 단가)
- **Pro**: 가장 단순
- **Con**: 한국 결제 마찰, B2B/Creator/Leader 페르소나 미커버, 광고 수익화 부재
- **Reject**: 외부 AI 두 답변 모두 단일 단가 모델은 한국에서 약하다고 지적

### Alt-B: 구독만 6 tier (코인 없음)
- **Pro**: 운영 단순, 광고 SDK 안 써도 됨
- **Con**: 결제 마찰 우회 수단 부재, "쓸모 확인 후 잠금 해제" UX 불가
- **Reject**: ChatGPT 분석 — 한국 사용자는 월 구독 결제 직전 마찰이 결정적

### Alt-C: 코인만 (구독 없음)
- **Pro**: 가장 friction-free
- **Con**: 헤비 유저(B2B IR·크리에이터)가 매번 코인 충전하는 부담, 정기 수익 불안정
- **Reject**: B2B 페르소나가 코인 결제로 운영 부서 회계 통과 어려움

### Alt-D: 사용자가 코인 ↔ 구독 자동 전환 (e.g., 코인 잔액 X 이상 모이면 구독 무료 1개월)
- **Pro**: 두 시스템 통합 매력
- **Con**: 회계·반환 복잡, 사용자 혼란
- **Reject**: 운영 부담 큼, P0b에 본격 결제 시작 후 V0.5에 검토 가능

**결론**: 코인 + 3 tier 구독의 hybrid가 한국 사용자 패턴 + Creator KPI + 결제 마찰 회피의 최적 균형.

---

## 한국 법무 / 정책 위험 + 대응

| 영역 | 위험 | 대응 |
|---|---|---|
| **게임산업법** | "코인" 명칭이 게임 머니로 분류 → 등급 분류 + 청소년 보호 의무 | 명칭 검토 — "포인트" / "크레딧" / "분석권" 등 비게임 용어. UI 노출 시 명칭 통일. ADR 비고. |
| **청소년보호법** | 미성년자 결제 한도 월 ₩70,000 | $49.99 = ₩64,900 → 안전. 단 본인 인증 + 미성년자 추가 동의 흐름 필요. |
| **표시광고법** | 보상형 광고 = "광고임을 명확 표시" 의무 | "이 영상은 광고입니다 + 시청 후 +10 코인" 명시 |
| **2025-02-14 자동전환 추가 동의** | 무료체험 → 유료 자동전환 시 추가 동의 | **무료체험 미운영**으로 회피 (코인 시스템이 무료 체험 역할) |
| **PIPA** | 광고 ID 수집 시 동의 필요 | 첫 진입 시 PIPA 동의 화면 + iOS ATT 트래킹 동의 |
| **방통위 보상형 광고 정책** | 강제 시청 부정행위 우려 | 사용자가 닫기 가능 옵션 제공 ("스킵하면 코인 0") |
| **소비자보호법** | 디지털 콘텐츠 환불 규정 | 코인 미사용분 결제 후 7일 내 환불 가능 정책 명시 |
| **부가가치세법** | 디지털 서비스 부가세 10% | App Store/Play Store가 처리 (자동) |

→ **Step 1 후속 작업**: 변호사 자문 (PRD v1.3 Q-?에 추가) — 코인 명칭, 광고 보상, 미성년자 흐름 검토.

---

## Verification

P0w mock 구현 후:
- [ ] `localStorage` 코인 잔액 read/write 확인
- [ ] tier mock 전환 (개발자 도구 Free → Pro → Creator → Leader) 시 한도·광고 노출 변화 정상
- [ ] 한도 도달 모달 + Creator 강조 배지 노출
- [ ] 광고 시청 mock (5초 progress bar) → +10 코인 적립
- [ ] AI 분석 lazy 렌더 (Free는 잠금, 코인 차감 시 unlock)
- [ ] Pro/Creator/Leader 한도 초과 시 코인 차감 또는 광고 옵션 노출

P0b 본격 구현 후 (T-B01 결제):
- [ ] Toss 또는 Stripe Korea 결제 흐름 (구독 + 코인 패키지)
- [ ] App Store / Play Store 인앱 결제 (코인 패키지)
- [ ] 첫 7일 Creator 전환율 측정 (KPI)
- [ ] 광고 SDK 통합 (AdMob 또는 카카오 애드핏)
- [ ] PIPA·표시광고법 동의 흐름

---

## Open Questions

1. **코인 명칭**: "코인" vs "포인트" vs "크레딧" vs "분석권" — 게임산업법 회피 + 한국 사용자 인지 균형. **D+7 변호사 자문 후 결정.**
2. **광고 SDK 선택**: AdMob (글로벌) vs 카카오 애드핏 (한국 특화) vs 듀얼 — eCPM·UX·결제 통합 비교. **P0b T-B05 결정.**
3. **구독자 광고 시청 옵션 — 일일 한도?**: Pro/Creator도 한도 초과 시 "광고 보고 +10 코인" 옵션 제공. 일일 시청 한도 둘지? — 시청 한도 없으면 광고주 ROI 우려, 있으면 사용자 자율성 침해. **P0b 광고 SDK 통합 시 결정.**
4. **Leader soft limit 정확 수치**: ~500/일이 합리적? 또는 1,000? — P0b 데이터 후 조정.
5. **연간 결제 환불 정책**: 6개월 사용 후 해지 시 잔여 환불? 또는 다음 갱신 미회수만? — 소비자보호법 검토.

---

## References

- 외부 자문 — Gemini 답변 (2026-05-03): "한국 모바일 결제 마찰 + Creator KPI 강조"
- 외부 자문 — ChatGPT 답변 (2026-05-03): "Pay-per-issue + 'Pro 4.9~6.9 / Team Lite 9.9~19.9' 가격 곡선"
- PRD v1.6 §10 (대체 대상)
- PRD v1.6 §13.4 Legal Compliance (확장)
- 한국 정통망법 / PIPA / 표시광고법 / 게임산업법 / 청소년보호법
- 로이터 Digital News Report 2025 (한국 결제 19%)
- 한국언론진흥재단 2024 언론수용자 조사

---

**End of ADR-011 — 2026-05-03**
