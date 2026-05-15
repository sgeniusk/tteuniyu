# PRD v1.7.3 Patch — Pro+ 가치 재정의 (Daily Digest + Custom Topic + 외신 자동 번역)

> **Status**: Accepted (2026-05-12, P0a 진입 직전)
> **Base**: PRD v1.7 + v1.7.1 + v1.7.2 patches
> **Driving ADRs**: ADR-017 Daily Digest, ADR-018 Custom Topic, ADR-019 외신 자동 번역 (예정 — T-006 합류)
> **Source**: `docs/research/syft-benchmark.md`
> **Decider**: 태욱 (Founder)

---

## 0. 1줄 요약

Syft AI 벤치마크 + ADR-017/018 발의 결과 — Pro+ 가치 재정의. Free → Pro 결제 동기 명확화 + Creator $9.99 핵심 차별화 보강 + Leader $19.99 가치 정합.

---

## 1. 변경 요약

| § | 변경 | ADR 출처 |
|---|---|---|
| §9.2 3 Tier 차별화 | Daily Digest + Custom Topic + 외신 번역 합류 | ADR-017/018/019 |
| §9.5 Free → Pro 전환 동기 | Daily Digest = 결제 즉시 가치 | ADR-017 |
| §11 Success Metrics | 4 신규 지표 (Digest open rate / Topic 등록률 / 외신 번역 클릭률 / Creator $9.99 전환율) | ADR-017/018 |
| §3 Persona 1 (Creator) | Custom Topic + Daily Digest로 JTBD fit 강화 | ADR-018 |

---

## 2. §9.2 3 Tier 가치 재정의

### 2.1 Free

기존 가치 유지.
- /widget 메인 화면 Top 20 + 카테고리 탭 6개
- /cluster/[id] detail (entity_card + trend sparkline + 매체별 보도)
- 코인 충전 (광고 시청 무료 적립 / 광고 클릭 보상)
- Trust Tag 4종 표시 (변호사 권고)
- 위젯 Embed iframe (외부 사이트 삽입)

신규 — 없음 (결제 동기 보존).

### 2.2 Pro $4.99

기존 가치.
- Frame Clash (매체간 단어 차이)
- Timeline overlay (보도·검색·발표 한 축)
- 무엇이 새로워졌나
- 다음에 볼 신호
- IssueContextCard (변호사 권고 라벨, 자본시장법 준수)

**v1.7.3 신규 — Daily Digest (ADR-017) + Custom Topic 5개 (ADR-018)**.
- 매일 09:00 KST 이메일 — 어제 24h Top + Trust Tag 우선
- Custom Topic 5개 등록 → 매칭 클러스터 우선 노출
- 매칭 모드 — 일치 + 동의어 (단순)

가치 카피.
> "매일 5분 안에 한국 이슈 정리. 본인 추적 키워드 5개 매칭 우선."

### 2.3 Creator $9.99 ⭐ 핵심 차별화

기존 가치.
- Pro 전체 +
- OG 카드 무제한 다운로드
- 임베드 위젯 customization
- Creator 분석 dashboard

**v1.7.3 신규**.
- **Custom Topic 20개** (ADR-018) — 4배 확장
- **의미적 매칭** (cosine ≥ 0.7) — Pro 단순 매칭 대비 정확도 ↑
- **Daily Digest 강화** — Frame Clash 미니 + 매칭 키워드 별도 섹션
- **외신 자동 번역** (ADR-019, T-006 합류 후) — Reuters/AP/BBC 한국어

가치 카피.
> "콘텐츠 소재 발굴 도구. 20개 키워드 의미적 추적 + 외신 자동 번역 + 매일 다이제스트."

Persona 1 (김크리에이터) JTBD "5분 안에 콘텐츠 소재 결정" 직결.

### 2.4 Leader $19.99

기존 가치.
- Creator 전체 +
- 우선 응답 SLA 24h
- 변호사 자문 dial 1회/월 (사용자가 요청 시 변호사 1차 답변 연결)
- Slack 통합 (V0.5+)

**v1.7.3 신규**.
- **Custom Topic 50개** — 2.5배 확장
- **Ask 뜬 이유** (V0.5+ ADR-021 발의 예정) — 대화형 Q&A
- **TTS Podcast** (V0.5+ ADR-020 발의 예정) — 다이제스트 음성 변환

가치 카피.
> "B2B PR/IR/대관 실무 도구. 50개 키워드 추적 + Ask + Podcast (V0.5+) + 변호사 자문."

---

## 3. §9.5 Free → Pro 전환 동기 명확화

### 3.1 결제 trigger

기존 (v1.7) — Frame Clash, Timeline, 무엇이 새로워졌나, 다음에 볼 신호 (Pro 차별화 카드 4종).

v1.7.3 추가 — **Daily Digest (ADR-017) — 매일 도착 = 매일 결제 가치 인지**.

전환 funnel.
1. Free 사용자 — 가입 + 마케팅 수신 동의 (대기자 폼 시점)
2. Onboarding — "Daily Digest를 받으려면 Pro 가입" CTA 노출
3. /widget — Top 20 카드 위에 "Pro로 매일 다이제스트 받기" 배너 (1주 1회)
4. /cluster/[id] — Pro 차별화 카드 클릭 시 결제 게이트
5. 결제 — Stripe + Toss + KakaoPay (P0b 결제 모듈 합류)

### 3.2 Custom Topic 결제 동기 (Creator+)

기존 — 없음.
v1.7.3 신규 — Pro 5개 한도 도달 시 "Creator 가입으로 20개로 확장" upgrade 게이트.

---

## 4. §11 Success Metrics 4 신규 지표

| Metric | 목표 (P0a) | 목표 (P0b) | 측정 |
|---|---|---|---|
| **Daily Digest open rate** | 35% | 50% | Resend webhook |
| **Daily Digest CTR** | 8% | 15% | UTM tracking |
| **Custom Topic 등록률** (Pro+ 사용자 중) | 60% | 80% | Supabase user_topics count |
| **Pro → Creator upgrade rate** | 5% | 10% | Subscription tier change |

기존 v1.7 §11 4 검증 지표 (워커 캐시 hit / 본론 토글 / Creator 시드 / Coin 충전율) 유지 + 위 4 신규 추가.

---

## 5. §3 Persona 1 JTBD 보강

기존 — "오늘 다룰 소재 1개 + 어떻게 다룰지 각도 1개 5분 안에 결정"

v1.7.3 추가 path.
1. **수동 path** — 매일 /widget 직접 방문 + Top 20 스캐닝
2. **자동 path (신규)** — Daily Digest로 매칭 키워드 자동 도착 → 클릭 1회로 디테일

자동 path가 활성화되면 "5분"에서 "2분"으로 단축. Creator $9.99 retention 핵심.

---

## 6. v1.7.3 변경 영향 매트릭스

| 영역 | v1.7.2 | v1.7.3 | 변화 |
|---|---|---|---|
| Free 기능 | 위젯 + 코인 + Trust Tag | 동일 | 변화 X (의도) |
| Pro 차별화 카드 | 4종 (Frame Clash 등) | 4종 + Daily Digest + Custom Topic 5 | 가치 ↑ |
| Creator 차별화 | OG 카드 + customization | + Custom Topic 20 + 의미적 매칭 + 외신 번역 | 가치 ↑↑ |
| Leader 차별화 | 변호사 dial + Slack | + Custom Topic 50 + Ask (V0.5+) + Podcast (V0.5+) | 가치 ↑ |
| 결제 동기 | Pro 차별화 카드 | + Daily Digest 매일 가치 | 전환율 ↑ |

---

## 7. 구현 순서 (Phased PRs)

본 patch 머지 후.

| PR | 범위 | 시점 |
|---|---|---|
| C1 | T-006 Step 4 — embed.py + cluster.py (HDBSCAN) + cron 활성화 | 즉시 |
| C2 | T-006 Step 5 — summarize.py + trust_signal.py + audit log + cost cap | C1 후 |
| B | Supabase migration — digest_subscriptions + user_topics + RLS | C2 후 |
| 후속 | Resend SDK + digest.py worker + Jinja2 템플릿 | B 후 |
| 후속 | UI — "내 토픽" 탭 + 키워드 추가 화면 + Onboarding Pro CTA | apps/web |
| 후속 | iOS 앱 — Daily Digest 설정 화면 + Custom Topic 화면 | tteuniyu-ios |

---

## 8. 비협상 정합성 (CLAUDE.md 15조)

- **rule 2** — 본문 저장 X (Digest 콘텐츠는 cluster 메타만)
- **rule 4** — bias_score 등 raw 노출 X (Digest HTML 동일)
- **rule 9** — Digest 발송 시 Resend message_id audit log
- **rule 11** — Custom Topic CRUD는 service_role + RLS own data only
- **rule 15** — Trust Tag UI 라벨 변호사 권고 4종만 + 자본시장법 단어 0건

ADR-017 §3 + ADR-018 §4 (PIPA) + ADR-016 (Privacy) 모두 통합 정합.

---

## 9. Decision Log

| 날짜 | 항목 | 결정 |
|---|---|---|
| 2026-05-12 | Free Daily Digest | X (결제 동기 보존) |
| 2026-05-12 | Pro Custom Topic 한도 | 5개 (단순 매칭) |
| 2026-05-12 | Creator Custom Topic 한도 | 20개 (의미적 매칭, cosine ≥ 0.7) |
| 2026-05-12 | Leader Custom Topic 한도 | 50개 (학습 모드 V0.5+) |
| 2026-05-12 | Pro 결제 동기 핵심 | Daily Digest = 매일 도착 가치 |
| 2026-05-12 | 신규 지표 4개 | Open rate / CTR / Topic 등록률 / Pro→Creator 전환율 |

---

## 10. References

- `docs/research/syft-benchmark.md` — Syft AI 강점 7가지 + 흡수 plan
- ADR-017 Daily Digest (PR #27)
- ADR-018 Custom Topic Tracking (PR #27)
- ADR-019 외신 자동 번역 (예정 — T-006 합류 후)
- ADR-020 TTS Podcast (V0.5+, 예정)
- ADR-021 Ask 뜬 이유 (V0.5+, 예정)
- 변호사 의견서 §1.3 (LLM hard-block 40+) + §5 (PIPA)

---

**End of PRD v1.7.3 Patch — 2026-05-12**
