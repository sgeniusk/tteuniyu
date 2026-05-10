# PRD v1.7.2 Patch — 변호사 자문 반영 종합

> **Status**: Accepted (2026-05-10, P0w D7+2)
> **Base**: PRD v1.7 + v1.7.1 patch
> **Driving source**: `docs/legal/2026-05-10-legal-response-opinion.md` (740줄)
> **Driving ADR amendments**: ADR-015 Amendment 2 + ADR-007 Amendment 1 + ADR-011 Amendment 1
> **Decider**: 태욱 (Founder)

---

## 0. 1줄 요약

변호사 자문 의견서(740줄, 2026-05-10) 반영 종합 patch. **"투자 분석" 프레이밍을 "이슈 맥락 요약"으로 재정의**하고, Trust Tag UI 라벨 변경, Pro+ 가치 재정의, 제휴 표시 강화, 코인·구독 정비, 개인정보 단계적 정비를 단일 patch로 통합.

---

## 1. 변경 요약 매트릭스

| # | 영역 | 변경 | 영향 PRD 섹션 |
|---|---|---|---|
| 1 | 카드 명칭 | `<InvestmentImpactCard />` 폐기 → `<IssueContextCard />` / `<CompanyContextCard />` | §7 Features, §8 API |
| 2 | Pro+ 가치 | "투자 분석" 폐기 → "출처 깊이" (출처 무제한·원문 묶음·타임라인·외신·정정 이력·export·알림) | §9 Monetization |
| 3 | Trust Tag UI | hoax/clickbait/low_confidence/investment 외부 라벨 변경 (검증 필요/제목-본문 괴리 가능성/표본 부족/기업 관련 이슈) | §5 Naming, §7 Features |
| 4 | LLM hard-block | 6개 → 40+ 단어 (매수·매도·호재·악재·목표가·buy·sell 등) | §6 Data Source, §12 Harness |
| 5 | 종목 표현 | "관련 종목" → "이슈에 언급된 상장사" | §5 Naming, §7 Features |
| 6 | 제휴 표시 | 카드 하단 1곳 → 상단·CTA·하단 multi-touchpoint | §7.6 Affiliate, §15 Design |
| 7 | 민감 카테고리 | 제휴 자동 제외 5개 → 18+ | §6.4 Affiliate Boundary |
| 8 | 코인 차감 순서 | 명시 X → 무료/보너스 → 광고 → 유료 | §10 Coin Economy |
| 9 | 자동전환 | 7일 알림 1회 → 일반 7일 + 가격 증액·무료→유료 30일 별도 동의 | §10 Subscription |
| 10 | 만 14세 미만 | 14세+/19세- 법정대리인 → P0a 14세 미만 차단 | §11 Compliance |
| 11 | 자본시장법 고지 | 짧은 문구 → 표준 신규 문구 | §5 Naming |
| 12 | SNS 공유 카드 | 출처 권장 → 자동 삽입 강제 | §7.7 OG Card |
| 13 | 자체 모니터링 | 신고 의존 → risk-based 자동 사람 검토 큐 | §11 Compliance |
| 14 | 개인정보 (PIPA) | "출시 보류" 톤 → 단계적 정비 (P0a 우선 3가지) | §11 Privacy |
| 15 | 분석가 의견 요약 | Pro+ 카드 1 항목 | P0a에서 제외 또는 외부 매체 보도 간접 귀속만 | §7 Features |

---

## 2. §5 Naming & Language 갱신

### 2.1 §5.3 매체군 표현 (v1.7.1에서 유지)

(변경 없음 — 4분류 라벨 폐기, 매체 dot slate-400 단일)

### 2.2 §5.4 Trust Tag UI 라벨 (신규)

내부 field는 유지, **사용자 노출 라벨만 변경**.

| Internal field | Old UI label (v1.7.1) | **New UI label (v1.7.2)** |
|---|---|---|
| `hoax` | "⚠ 검증되지 않은 정보" | **"검증 필요"** |
| `clickbait` | "⚠ 낚시성 제목 가능성" | **"제목-본문 괴리 가능성"** |
| `low_confidence` | "⚠ 보도 출처 부족" | **"표본 부족"** |
| `investment` | "💰 투자 정보" | **🏢 "기업 관련 이슈"** |

태그 tooltip 표준 — "이 표시는 개별 매체 평가가 아니라 수집된 보도 묶음에 대한 자동 분석 신호입니다."

### 2.3 §5.5 카드 명칭 (변경)

| Old | **New** |
|---|---|
| `<InvestmentImpactCard />` | **`<IssueContextCard />`** (일반 이슈) |
| (없음) | **`<CompanyContextCard />`** (기업 관련) |
| "투자 영향" | **"이슈 맥락 요약"** |
| "관련 종목" | **"이슈에 언급된 상장사"** |
| "투자 정보" | 🏢 **"기업 관련 이슈"** |

### 2.4 §5.6 LLM Hard-block 단어 (40+로 확장)

기존 6개 (예측·추천·전망·매수·매도·목표가)에 추가.

```
투자행동성 — 보유, 진입, 청산, 비중확대, 비중축소, 손절, 익절, 물타기, 관망
가격·수익성 — 수익률, 상승 여력, 하락 위험, 급등, 급락, 반등, 조정, 상방, 하방
가치판단성 — 호재, 악재, 저평가, 고평가, 유망, 모멘텀, 리레이팅, 촉매
영문 — buy, sell, hold, overweight, underweight, outperform, underperform,
       upside, downside, alpha
```

총 40+ 단어 LLM output validator로 0건 강제. `harness:investment-language-block` (PR #20 또는 Sprint 0) 신규.

### 2.5 §5.7 자본시장법 고지 표준 문구 (갱신)

기존 — "⚠ 자본시장법상 투자 자문이 아닙니다. 신중히 판단하세요."

신규 — "이 카드는 이슈 이해를 돕기 위해 공개 보도·공시·발표자료를 요약한 것입니다. 금융투자상품의 가치, 가격, 매매 시점, 취득·처분 판단을 제공하지 않습니다."

추가 (Pro 카드 하단) — "본 분석은 공개 보도·공시·발표자료를 요약한 것이며, 매매 권유가 아닙니다. 투자의 책임은 본인에게 있습니다."

---

## 3. §7 Feature Specifications 갱신

### 3.1 §7.1 Surface 매트릭스 갱신

| Surface | v1.7.1 | **v1.7.2 변화** |
|---|---|---|
| `/cluster/[id]` Pro panel | `<InvestmentImpactCard />` | **`<IssueContextCard />` / `<CompanyContextCard />`** (Pro+ 게이트, 자본시장법 신규 고지) |
| `/widget` 카드 Trust Tag | "⚠ 검증되지 않은 정보" 등 | **"검증 필요" 등 변호사 권고 라벨** |

### 3.2 §7.6 Trust Tag UI 라벨 (갱신)

```tsx
<TrustTag tag="hoax" />          // 🔴 "검증 필요"
<TrustTag tag="clickbait" />     // 🔴 "제목-본문 괴리 가능성"
<TrustTag tag="low_confidence" />// 🟡 "표본 부족"
<TrustTag tag="investment" />    // 🟡 🏢 "기업 관련 이슈"
```

색상 규칙 동일 (red-600 / amber-500 / WCAG AA).

### 3.3 §7.7 IssueContextCard / CompanyContextCard (신규, InvestmentImpactCard 폐기)

#### Free 사용자

- 🟡 노란 배지 "🏢 기업 관련 이슈"
- 카드 하단 고지 "이 카드는 이슈 이해를 돕기 위해 공개 보도·공시·발표자료를 요약한 것입니다..." (자본시장법 표준)
- "Pro에서 더 자세히 보기" CTA

#### Pro/Creator/Leader 사용자

`<IssueContextCard />` 또는 `<CompanyContextCard />` 표시. 분석 항목 (LLM 요약, 가격·시세 일체 X, 분석가 의견 P0a 제외).

- **이슈에 언급된 상장사** (텍스트만, 종목코드는 원문 공시·기사에 등장한 경우 보조 정보로만)
  - 예시 — "이슈에 언급된 상장사 — 삼성전자 (DART 공시 및 Reuters 보도에 언급됨)"
- **외신 비교** (Bloomberg/Reuters/FT 보도 요약, 출처 링크)
- **공시·발표 요약** (DART/SEC LLM 요약)

카드 하단 필수 고지 — "본 분석은 공개 보도·공시·발표자료를 요약한 것이며, 매매 권유가 아닙니다."

### 3.4 §7.8 SNS 공유 OG 카드 자동 삽입 (신규)

`/cluster/[id]/og` 렌더링 시 다음 요소 자동 포함 (시스템 강제, 사용자 끌 수 없음).

```
- "뜬이유 AI 공개자료 요약"
- 원출처 매체명
- 생성일시 (YYYY-MM-DD HH:mm)
- 원문 링크
- "투자판단 정보 아님" 고지
```

OG 카드 footer 표준 문구 — "이 콘텐츠는 공개 보도·공시·발표자료를 요약한 것이며, 금융투자상품의 가치·가격·매매판단을 제공하지 않습니다."

---

## 4. §9 Monetization 갱신 — Pro+ 가치 재정의

기존 — Pro+ 차별화 = `<InvestmentImpactCard />` (투자 분석)

신규 — Pro+ 차별화 = "출처 깊이" 7가지.

| 가치 | Free | Pro $4.99 | Creator $9.99 | Leader $19.99 |
|---|---|---|---|---|
| 더 많은 출처 보기 | 5개 | 무제한 | 무제한 | 무제한 |
| 원문 링크 묶음 export | X | OK | OK | OK |
| 공시·보도 타임라인 | X | OK | OK | OK |
| 외신 비교 카드 | 1건 | 무제한 | 무제한 | 무제한 |
| 정정·반박 이력 | X | OK | OK | OK |
| 요약 export (PDF/MD) | X | 월 10건 | 월 100건 | 무제한 |
| 키워드 알림 채널 수 | 1 | 5 | 20 | 무제한 |
| Daily digest 이메일 | X | X | OK | OK |
| OG 카드 다운로드 | 코인 | 일 5건 무료 | 무제한 | 무제한 |
| Slack/팀 알림 (B2B) | X | X | X | OK (5 시트) |
| 변호사 자문 dial 1회/월 | X | X | X | OK |

상세 — ADR-011 Amendment 1 §A1.1 참조.

---

## 5. §10 Coin Economy 갱신

### 5.1 차감 순서 (신규 명시)

```
1순위 — 무료·보너스 코인 (가입 환영 + 정기 보너스)
2순위 — 광고 획득 코인 (광고 시청 보상)
3순위 — 유료 코인 (결제로 충전한 코인)
```

근거 — 유료 코인 미사용 잔액 환불 산정 명확 + 소비자 유리 구조 → 분쟁 가능성 낮음 (변호사 의견서 §4.4).

### 5.2 자동전환 동의 분리 (신규)

| 시나리오 | 알림·동의 |
|---|---|
| 일반 갱신 (가격 동일) | 7일 전 알림 1회 (기존 유지) |
| **가격 증액** | 증액 전 **30일 이내 별도 동의 flow** |
| **무료 → 유료 전환** | 전환 전 **30일 이내 별도 동의 flow** |

근거 — 전자상거래법 시행령 2025-02-14 시행 취지 (변호사 의견서 §4.3).

### 5.3 사행성 회피 비협상 (강화)

UI·코드·이름 어디서도 다음 금지.
- "룰렛", "당첨", "잭팟", "뽑기" (단어·아이콘·애니메이션 모두)
- 랜덤 보상 / 확률형 / 현금화 / 양도 / 외부 전환 / 베팅 / 랭킹 보상

광고 시청은 고정 보상형만 (1회 = 정액 코인, 우연성 X).

---

## 6. §11 Compliance 갱신

### 6.1 §11.1 만 14세 미만 차단 (P0a 즉시)

- 가입·대기자 폼 — "만 14세 이상만 가입할 수 있습니다." 명시
- 생년월일 입력 필수, 14세 미만 자동 거부
- 14세 ~ 19세 미만 — P0b 결제 화면에서 법정대리인 동의 절차 (PG 제공)

근거 — PIPA §22-2 (변호사 의견서 §5.4).

### 6.2 §11.2 PostHog autocapture 제한 (P0a 즉시)

`apps/web/lib/analytics/posthog.ts` 설정.

```ts
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: 'https://us.i.posthog.com',
  autocapture: false,         // form input 자동 capture X
  capture_pageview: true,     // 페이지뷰만
  session_recording: false,   // session replay X
  property_blacklist: ['email', 'name', 'company'], // 직접 식별자 X
})
```

직접 식별자 (이메일·회사명·도메인) PostHog 전송 금지. URL query string에 token X.

### 6.3 §11.3 대기자 폼 개인정보 안내 (P0a 즉시)

표준 동의 문구 (변호사 권고).

```
[필수] 개인정보 수집·이용 안내
뜬이유는 베타 대기자 등록, 제품 안내, B2B 문의 응대 및 신청자 관리를 위해
이메일·회사명/도메인·사용 케이스·이용 의향 점수를 수집·이용합니다.
보유·이용 기간은 대기자 운영 종료 후 1년까지 또는 동의 철회 시까지입니다.
귀하는 동의를 거부할 수 있으나, 필수 항목 동의 거부 시 대기자 등록이 제한될 수 있습니다.

[선택] 제품 소식 및 마케팅 수신 동의
뜬이유는 신규 기능, 베타 초대, 제품 업데이트, 이벤트 안내를 위해 이메일을 사용할 수
있습니다. 동의하지 않아도 대기자 등록은 가능합니다.

[안내/동의] 개인정보 국외 이전
뜬이유는 제품 분석 및 서비스 개선을 위해 PostHog Inc.에 일부 분석 이벤트 정보를
이전할 수 있습니다. 이전 국가는 미국, 이전 항목은 IP·User-Agent·페이지 URL·클릭
이벤트·브라우저/기기 정보, 이전 시점은 서비스 이용 및 이벤트 발생 시, 보유 기간은
13개월 또는 목적 달성 시까지입니다.
```

### 6.4 §11.4 risk-based 자동 사람 검토 큐 (P0a)

다음 조건 시 자동으로 운영자 검토 큐에 진입.

- "검증 필요" 태그 (구 hoax)
- "제목-본문 괴리 가능성" 태그 (구 clickbait)
- 단일 출처
- 정치·선거·범죄·사망·재난·의료·금융 카테고리
- 매체·당사자 정정 요청 접수
- copy ratio 기준 (15%) 초과

운영자가 24h 내 검토 → 태그 유지 / 임시 숨김 / 삭제 결정. 모든 결정은 audit log 기록.

---

## 7. §15 Design System 갱신

### 7.1 색상 토큰 (v1.7.1 유지)

(변경 없음)

### 7.2 컴포넌트 추가/제거

**제거**.
- `<InvestmentImpactCard />` (v1.7.1에서 신규였으나 v1.7.2에서 폐기)

**신규**.
- `<IssueContextCard cluster={...} />` (Pro+ 게이트, 일반 이슈 맥락)
- `<CompanyContextCard cluster={...} entity={...} />` (Pro+ 게이트, 기업 관련 이슈)

**수정**.
- `<TrustTag tag={...} />` — UI 라벨 매핑 변경 (검증 필요/제목-본문 괴리 가능성/표본 부족/🏢 기업 관련 이슈)
- `<AffiliateCard />` — Multi-touchpoint 표시 (상단 라벨 + CTA + 하단)

---

## 8. CLAUDE.md 비협상 15조 amendment (PR #18 동반)

비협상 15조 본문 갱신 (v1.7.1 → v1.7.2).

```
15. Trust Signal & Investment Risk Layer (v1.7.1) + Lawyer-mandated language (v1.7.2 ADR-015 Amendment 2)

    - <TrustTag>는 hoax/clickbait/low_confidence/investment 4종만 허용 (내부 field).
    - **UI 표시 라벨은 변호사 권고 매핑만 사용** — 검증 필요 / 제목-본문 괴리 가능성 /
      표본 부족 / 🏢 기업 관련 이슈.
    - **<InvestmentImpactCard /> 폐기**, <IssueContextCard /> 또는 <CompanyContextCard />
      만 사용. 분석가 의견 요약 P0a에서 X.
    - <IssueContextCard /> / <CompanyContextCard />는 Pro+ 게이트 필수.
    - 가격·시세·차트·매수/매도/보유/비중·수익률·전망·목표가 일체 금지 (V0.5+ ADR-016).
    - LLM output validator로 hard-block 40+ 단어 0건 강제.
    - 매체 dot slate-400 단일.
    - 자본시장법 신규 표준 고지 ("이 카드는 이슈 이해를 돕기 위해...") 모든 표시 위치 필수.
    - <TrustTag>는 <AdZone> 안에 절대 렌더 금지.
    - 만 14세 미만 가입 차단 (P0a 대기자 폼부터).
    - PostHog autocapture 비활성화 + 직접 식별자 (email/name/company) 전송 금지.

    Enforced by harness:no-stance-color + harness:trust-tag-presence +
    harness:investment-language-block (신규).
    See ADR-015 (+ Amendment 2) + ADR-007 (+ Amendment 1) + ADR-011 (+ Amendment 1).
```

---

## 9. Migration Sequence

| PR | 범위 | 시점 |
|---|---|---|
| #15 | 변호사 회신 기록 + 의견서 원본 | 머지 ✅ |
| #16 | 3 ADR amendments | 진행 중 |
| **#17 (이번)** | PRD v1.7.2 patch | 본 PR |
| #18 | CLAUDE.md 비협상 15조 amendment + Naming Ban 확장 | 다음 |
| #19 | Privacy policy + ADR-016 Privacy & Data Boundary | 다음 |
| #20 | Widget Concept C 디자인 구현 (변호사 라벨 자동 적용) | 다음 |

---

## 10. Verification

### 10.1 PRD 검증

- [x] v1.7.2 patch 작성 — 변호사 권고 15개 영역 모두 반영
- [x] ADR-015/007/011 amendment와 정합성 (PR #16 동시)
- [x] CLAUDE.md 15조 amendment 초안 (PR #18에서 정식)
- [ ] 사용자(태욱) 사인오프 (PR body 확인)

### 10.2 비협상 정합성

- ADR-005 (P12 광고 격리) — `<TrustTag>`, `<IssueContextCard>`, `<CompanyContextCard>` 모두 `<AdZone>` 안에 금지 (harness 검증)
- ADR-007 Amendment 1 (제휴 multi-touchpoint) — 신규 표시 위치 정합
- ADR-009 Amendment 1 (이념 라벨 폐기) — 매체 dot slate-400 유지
- ADR-011 Amendment 1 (코인+구독 정비) — Pro+ 가치 재정의 정합
- ADR-013 (헤드라인 본론) — clickbait_score 결합 유지
- ADR-014 (LLM 비용) — `trust_signal_v1` + `issue_context_v1` 프롬프트 추가, $50/월 cap 내 안전
- ADR-015 Amendment 2 (변호사 반영) — 본 patch가 PRD 반영 정식

### 10.3 정치적 중립성

- 좌/우 색 0건 (v1.7.1 유지)
- Trust Tag UI 라벨이 "단정적 표현" 회피 (변호사 권고 — "검증 필요"는 단정 X, "제목-본문 괴리 **가능성**"은 가능성 표현, "표본 부족"은 사실)
- Investment 라벨이 "투자" 단어 회피 ("기업 관련 이슈"로 재정의)

---

## 11. Open Questions

1. v1.7.2의 `<IssueContextCard />` 와 `<CompanyContextCard />` 분리 기준 — 클러스터에 상장사 ≥ 1 매핑되면 Company, 아니면 Issue. P0a Sprint 0에서 분기 로직 결정.
2. 분석가 의견 요약 P1 합류 시점 — "외부 매체 보도 인용" 형태로만 가능. P0a 운영 데이터 후 재검토.
3. 자본시장법 신규 고지 문구의 OG 카드 + iframe + 모바일 위젯에서 공간 — 줄임 표시 가능 여부 P0a 디자인 검토.
4. PostHog property_blacklist에 추가할 직접 식별자 추가 후보 — phone, address, ip_geolocation 등. P0a 운영 시 점검.

---

## 12. Sign-off

```
Decided ─ 2026-05-10 (P0w D7+2)
Decider ─ 태욱 (Founder)
Driving source ─ docs/legal/2026-05-10-legal-response-opinion.md (740줄)
Driving ADR ─ ADR-015 Amendment 2 + ADR-007 Amendment 1 + ADR-011 Amendment 1
Status ─ Accepted (docs only, code 변경 PR #20 디자인 구현 합류)
```

**End of PRD v1.7.2 Patch — 2026-05-10**
