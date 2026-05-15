# ADR-017 — Daily Digest Email (Pro+)

> **Status**: Accepted (2026-05-12, P0a 진입 직전)
> **Decider**: 태욱 (Founder)
> **Related**: ADR-014 (LLM 비용 파이프라인), ADR-016 (Privacy & Data Boundary), ADR-018 (Custom Topic Tracking)
> **Source**: `docs/research/syft-benchmark.md` §1 강점 2

---

## 1. Context

Syft AI 벤치마크 결과 일일 다이제스트가 retention의 핵심으로 확인됨. 뜬 이유 Pro+ 차별화 + Creator 페르소나 #1 (김크리에이터) JTBD "5분 안에 콘텐츠 소재 결정"과 직결.

현 상태에서는 사용자가 매일 `/widget` 페이지를 직접 방문해야만 정보 습득. 매일 push factor 없으면 retention 자연 감소. 이메일 다이제스트는 가장 검증된 Korean SaaS retention 채널.

---

## 2. Decision

Pro 이상 사용자에게 매일 09:00 KST 자동 이메일 다이제스트를 발송한다.

### 2.1 발송 조건

- Pro / Creator / Leader 활성 구독자만 (Free 제외)
- PIPA 마케팅 수신 동의 + Daily Digest 별도 동의 둘 다 받은 경우만
- 만 14세 미만 발송 X (ADR-016 §5.4)
- 사용자가 일일 1회 발송 한도 (다이제스트 + 알림 합산 1회)

### 2.2 콘텐츠 구성 (HTML)

```
[헤더 - 뜬 이유 로고 (teal mono)]
🌅 어제 한국 이슈 다이제스트 — 2026-05-12

[Trust Tag 카드 — 어제 24h 중 hoax/clickbait/low_confidence 부여된 클러스터 우선 표시]
🔴 검증 필요 ─ 동해 심해 가스전 시추 결과 (4개 매체)

[Custom Topic 매칭 (ADR-018 합류 후)]
🔍 추적 중인 키워드 매칭 — "삼성전자 반도체"
   삼성전자 1분기 반도체 흑자 전환 (26개 매체) →

[Top 5 카테고리별]
📰 경제 — 미국 연준 금리 동결 / 코스피 3,127 돌파 / ...
🏛 정치 — 국민연금 개편안 ...
🌐 국제 — 한미 관세 협상 ...
[등 6 카테고리]

[Frame Clash 미니 — 매체간 단어 차이 1건]

[푸터 — 수신거부 링크 + 회사 정보]
```

### 2.3 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 발송 시각 | 매일 09:00 KST (00:00 UTC) | GHA cron `0 0 * * *` |
| Worker | Python apps/worker/digest.py | 새 모듈 |
| 이메일 provider | Resend (1순위) / SendGrid (대안) | Korean reputation 검토 후 |
| HTML 템플릿 | Jinja2 + inline CSS (Pretendard) | Gmail 호환성 |
| 발신자 | `noreply@tteuniyu.com` | SPF/DKIM/DMARC 셋업 (도메인 확정 후) |
| 데이터 source | Supabase clusters table (어제 24h) | T-006 워커 합류 후 |

### 2.4 비용 추정

- Resend Free — 일 100건 + 월 3,000건
- Resend Pro $20/월 — 월 50,000건 + Custom domain
- 추정 — Pro+ 사용자 1,000명 × 30일 = 월 30,000건 → Resend Pro 충분

---

## 3. PIPA + 정통망법 정합 (ADR-016 보강)

### 3.1 동의 분리 (필수)

```
[ ] 필수 — 개인정보 수집·이용 (가입 자체)
[ ] 선택 — 마케팅·이벤트 수신 동의 (이메일·SMS·푸시)
[ ] 선택 — Daily Digest 수신 동의 (별도)
```

3개 모두 분리. Daily Digest는 마케팅 수신 동의의 sub-set이 아닌 독립 항목 (사용자가 마케팅 거부해도 다이제스트는 받을 수 있도록 — 단 "정보 제공 메일"로 분류).

### 3.2 수신거부 (정통망법 §50)

- 모든 이메일 footer에 1-click 수신거부 링크 필수
- `https://tteuniyu.com/unsubscribe?token=<JWT>` — 로그인 없이 동작
- 수신거부 시점 즉시 다음 발송 큐에서 제외 (cron 다음 회차 반영)
- 수신거부 history 보존 (audit_logs)

### 3.3 발송 시간 제한

- 정통망법 §50의2 — 야간 (21:00-08:00) 광고성 정보 발송 X
- 09:00 KST 발송 — 안전 시간대
- 단 다이제스트는 "정보 제공" 성격 — 광고성 분류 모호. 변호사 자문 시 안전 측 (광고성으로 분류 가정) 권고

---

## 4. 구현 단계 (Phased PRs)

| PR | 범위 | LOC 추정 |
|---|---|---|
| #27 (이번) | ADR-017 정식 ADR (docs only) | ~250 |
| #28 | Supabase migration `digest_subscriptions` 테이블 + harness | ~150 |
| #29 | Python worker `digest.py` 모듈 + Resend SDK 통합 | ~400 |
| #30 | HTML 템플릿 (Jinja2) + Pretendard inline + Gmail 호환성 | ~300 |
| #31 | GHA cron 활성화 + 테스트 발송 (사용자 본인 1명) | ~50 |
| #32 | PRD v1.7.3 patch §9 Pro+ 가치 재정의 | ~200 |

총 약 1,350 LOC, 6 PR. P0a 안정화 ~2주.

---

## 5. Pro+ 가치 강화 (Monetization)

| Tier | Daily Digest |
|---|---|
| Free | X |
| Pro $4.99 | ✅ 6 카테고리 Top 5 + Trust Tag 우선 |
| Creator $9.99 | ✅ + Custom Topic 매칭 (ADR-018) + Frame Clash 미니 |
| Leader $19.99 | ✅ + 외신 자동 번역 (ADR-019) + 더 많은 키워드 |

PRD v1.7.3 patch에서 정식 반영.

---

## 6. Risks

### 6.1 스팸 폴더 진입

- 첫 발송 시 Gmail/Naver Mail에서 스팸으로 분류될 위험
- 완화 — SPF/DKIM/DMARC 정합 + 발송량 점진적 증가 (warm-up) + 사용자 명시 동의 받은 경우만 발송

### 6.2 이메일 콘텐츠가 변호사 권고 단어 위반

- LLM이 클러스터 요약 시 "추천", "전망" 같은 단어 포함 가능
- 완화 — 다이제스트 worker가 발송 전 hard-block 단어 final scan + 위반 시 해당 클러스터 제외

### 6.3 발송 비용 초과 (1만 명 이상 시)

- Resend Pro $20/월 한도 초과 시 단가 $0.001/건
- 1만명 × 30일 = 30만건 = 추가 $300/월
- 완화 — 사용자 1만 명 도달 시점에 SES (AWS) 또는 Postmark 비교 후 마이그

### 6.4 정통망법 §50의2 위반

- 다이제스트가 "광고성 정보"로 분류될 시 야간 발송 위반 가능
- 변호사 자문 시 명확한 답 필요 — 안전 측은 광고성 가정 + 09:00 KST 발송 유지

---

## 7. Alternatives Rejected

### 7.1 Push 알림 우선

- 거부 — 모바일 앱 (iOS/Android) 미가동. Push는 V0.5+
- 채택 — 이메일이 가장 검증된 채널 + 모든 사용자 즉시 도달

### 7.2 Slack 통합 (B2B Leader 전용)

- 거부 (시점) — Leader 사용자 0명 단계, ROI 불확실
- 채택 (V0.5+ 검토) — Leader $19.99 차별화 후보

### 7.3 RSS feed 발급

- 거부 — 사용자 정의 가능성 X (Custom Topic 매칭 어려움)
- 채택 (V0.5+) — Creator 부가 기능 가능

---

## 8. Decision Log

| 날짜 | 항목 | 결정 |
|---|---|---|
| 2026-05-12 | 발송 시각 | 09:00 KST (안전 시간대) |
| 2026-05-12 | 이메일 provider | Resend 1순위, SendGrid 대안 |
| 2026-05-12 | Pro Free 차별화 | Free X — 결제 동기 |
| 2026-05-12 | Custom Topic 매칭 | ADR-018 합류 후 추가 |
| 2026-05-12 | 정통망법 야간 제한 | 안전 측 — 광고성 가정, 09:00 발송 |

---

## 9. References

- `docs/research/syft-benchmark.md` §1 강점 2 (Daily Digest)
- ADR-014 (LLM 비용 파이프라인) — 다이제스트 LLM 호출 비용 통합
- ADR-016 (Privacy & Data Boundary) — 마케팅 수신 동의 + 보유 13개월
- 정통망법 §50 (수신거부) + §50의2 (야간 발송)
- 변호사 의견서 §5.3 (마케팅 동의 분리)

---

**End of ADR-017 — 2026-05-12**
