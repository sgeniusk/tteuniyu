# P0w State of the System — 2026-05-03

> v1.7 발의 전 의사결정 base 문서.
> 모든 결정·외부 의견·미해결 항목을 한 곳에 정리한다.
> 작성: P0w D5 시점 (T-W04 직전, v1.6.5 patch + ADR-011 직후).

---

## 0. Executive Summary

뜬이유 P0w 단계는 D5 시점에 7/8 분기 완료 (87.5% 진척, 일정 양호).
완료된 것은 **시각·계약·비협상 원칙**이고, 보류된 것은 **포지셔닝·정체성·수익 모델 본격화**다.

핵심 수렴 신호 3가지:
- **두 외부 AI(Gemini + ChatGPT)와 사용자가 한국 시장 핵심 진단에서 80%+ 일치** — 단일 ₩6,900 모델은 약함, "이슈 분석 도구" 포지셔닝, B2B PR/홍보 1순위
- **이중 결제 모델 (코인 + 3 tier 구독)** 채택 — 한국 모바일 게임 결제 패턴 + Creator 전환 KPI 명확
- **이념 라벨링(4색 분포)이 가장 큰 미해결 결정** — ADR-009 발의 시급, 해결 전까지 v1.7 발의 어려움

지금 결정 가장 시급한 1개: **ADR-009 이념 라벨링** (다른 7개 v1.7 항목에 모두 영향).

---

## 1. P0w 진척 현황

### 1.1 Timeline 실측

```
D0 (4/21)  T-W01 widget MVP scaffold + v1.6.1 patch  ✅ merged
D1~D3      T-W02 Creator Embed Script                 ✅ merged
D3~D4      v1.6.2 categories + hide bar + trend       ✅ merged
D3~D4      T-W03 Pro/Creator/B2B 폼                   ✅ merged
D4         v1.6.3 mock-rich detail page                ✅ merged
D5         v1.6.4 structured AI analysis               ✅ merged
D5 (5/3)   v1.6.5 reorder + entity + trend + YouTube  ⏳ PR #7 green awaiting merge
D5 (5/3)   ADR-011 hybrid coin + subscription          ✅ written
D6~D7      T-W04 AdZone + 수동 큐레이션               다음
D7         T-W05 Analytics + Exit Dashboard            대기
```

예정 D7 P0w Exit Review 무리 없는 페이스.

### 1.2 누적 자산

| 카테고리 | 개수 | 상세 |
|---|---|---|
| **PR merged** | 6 | T-W01·W02·W03 + v1.6.1·v1.6.2·v1.6.3·v1.6.4 |
| **PR awaiting merge** | 1 | v1.6.5 (PR #7) |
| **ADR** | 9 | ADR-001~007 (v1.6 확정) + ADR-008 (Trend Pipeline) + ADR-011 (Coin/Subscription) |
| **PRD patches** | 5 | v1.6.1 ~ v1.6.5 |
| **외부 자문** | 2 | Gemini + ChatGPT (2026-05-03) |
| **CI 통과 회수** | 7 | 모든 PR ~50초 green |
| **harness 종류** | 18 (16 placeholder + 2 실 구현) | realtime-naming, widget-contract |

### 1.3 코드 자산

```
apps/web/
├── app/
│   ├── widget/page.tsx                Server Component shell
│   ├── cluster/[id]/page.tsx          Detail page (v1.6.5 reorder)
│   ├── embed/{iframe,demo}/           Creator Embed surface
│   └── api/v1/{widget,clusters,embed,waitlist}/  6 endpoints
├── components/
│   ├── RisingIssuesList               60s polling, AdZone slot marker
│   ├── IssueCard                      rank + trend ↑/NEW
│   ├── CoverageBar                    4-color + colorblind patterns
│   ├── EmbedRow                       Embed iframe row (Coverage hidden)
│   ├── TrendSparkline                 inline SVG, 0KB deps
│   ├── YouTubeEmbed                   Lite pattern (thumbnail → iframe)
│   ├── Modal                          native <dialog>
│   ├── PreorderCallouts               3-up footer
│   └── forms/{Pro,Creator,B2B}        Zod-validated waitlist
├── lib/
│   ├── api/{widget,cluster,waitlist,embed}-schemas    Zod
│   ├── mock/{clusters,cluster-details,trend,outlets}  P0w data
│   ├── waitlist/store                 in-memory (P0w)
│   ├── embed/install-store            in-memory
│   ├── prefs/categories               localStorage hook (no UI)
│   ├── analytics/events               EVENTS registry + console stub
│   ├── format / utils                 helpers
│   └── email/templates                console stub (Resend → P0a)
└── public/embed/widget.js             vanilla 4KB
```

---

## 2. 확정된 결정 (ADR + PRD)

### 2.1 ADR (9개)

| ADR | 결정 | 적용 단계 |
|---|---|---|
| ADR-001 | Data Licensing — RSS 30개 매체 whitelist + Naver Search 저장 금지 | P0a |
| ADR-002 | Public API via Next Route — service_role + Zod | P0w (적용 중) |
| ADR-003 | Embedding Provider — OpenAI text-embedding-3-small 단일 | P0a |
| ADR-004 | P0a/P0b Scope — Coverage Distribution 1.0 | P0a |
| ADR-005 | Ad Zone Separation (P12) — 광고 영역 구조적 분리 | P0w (T-W04) |
| ADR-006 | Native Widget Staged Entry — iOS Small P0b 조건부 | P0b |
| ADR-007 | Affiliate Commerce Data Boundary — 저장 금지, 런타임 호출만 | P0w (T-W04) |
| ADR-008 | Trend Time-Series Pipeline — keyword_trends DB + 워커 cadence | P0a (T-006) |
| **ADR-011** | **Hybrid Coin + Subscription Monetization** — Free 코인 + 3 tier | P0w mock + P0b 결제 |

### 2.2 PRD patches (5개)

| Patch | 핵심 변경 | 영향 |
|---|---|---|
| v1.6.1 | Top 5 → 10 + 60s client polling + minute rotation | /widget |
| v1.6.2 | Category 7개 enum + Coverage Bar 위젯에서 숨김 + ↑/NEW trend | /widget·/embed·/cluster |
| v1.6.3 | mock-rich detail page (15 cluster × 30 outlet 매트릭스) | /cluster/[id] 신규 |
| v1.6.4 | ai_analysis 3-section structure (subject + why + coverage) | /api/v1/clusters |
| v1.6.5 | 카드 reorder + entity_card + trend sparkline + YouTube Lite Embed | /cluster/[id] 재구성 |

### 2.3 비협상 14조 일관 준수 (CLAUDE.md)

P0w 5번 patch + 3번 티켓 동안 14조 위반 0건:
- Rule 4 (sensitive fields): 모든 Zod schema strict, 실 grep 검증
- Rule 5 (보도 분포 wording): 일관 사용
- Rule 11 (Zod boundary): 모든 API route 적용
- **Rule 12 (P12 Revenue Zone Isolation)**: `<AdZone>` import 0건 (T-W04에서 첫 도입)
- Rule 14 (Native Widget Entry): N/A (Swift 미작성)

---

## 3. 외부 자문 종합 (Gemini + ChatGPT 2026-05-03)

### 3.1 두 AI 강력 합의 (5가지)

| # | 합의 결론 | PRD/제품 충격 |
|---|---|---|
| 1 | **"뉴스 앱" 포지셔닝 약함 → "이슈 분석 도구"/"리스크 OS"** | v1.6 §1.1 Vision 재작성 — **ADR-010 후보** |
| 2 | **B2C ₩6,900 단독 약함** — 한국 결제 마찰 | ADR-011로 해결 ✅ |
| 3 | **"진보/보수" 직접 라벨 = 한국 정치적 공격 위험** | Coverage Distribution 4색 정체성 — **ADR-009 후보** |
| 4 | **B2B Lite/PR SaaS 시장 실재** — 월 9~20만원 (뉴스럴 시세 매칭) | ADR-011로 해결 (Leader $19.99 + Enterprise) ✅ |
| 5 | **Frame Clash + Timeline overlay = 진짜 차별점** | v1.7 신규 카드 후보 |

### 3.2 두 AI 차이점 → 사용자가 ADR-011로 결정

| 영역 | Gemini | ChatGPT | 사용자 결정 (ADR-011) |
|---|---|---|---|
| 1순위 페르소나 | 단기 트레이더 | PR/홍보 실무자 | (보류 — v1.7에서 결정) |
| 핵심 포지셔닝 | "투자 리서치 도구" | "이슈 리스크 OS" | (보류 — ADR-010) |
| B2B 가격 | 월 ₩500k~1M | 월 ₩99k~199k | **Leader $19.99 (₩25,900) + Enterprise는 별도** ✅ |
| 검증 방식 | 콜드 메일 | 첫 달 5만원 유료 PoC | (보류 — 외부 인터뷰) |
| 진영 라벨 표현 | 사안별 동적 | "매체군 분포" + 6 방어 UX | (보류 — ADR-009) |

### 3.3 두 AI 공통 권장 — v1.7 후보 신규 카드 4개

- 🔍 **Frame Clash** (단어 하이라이팅 비교)
- 🕒 **Timeline overlay** (보도/검색/공식발표 한 축)
- 🆕 **무엇이 새로워졌나** (기존 vs 이번 보도 차이)
- 📅 **다음에 볼 신호** (후속 일정·국회·실적·법원·플랫폼)

### 3.4 ChatGPT 추가 인사이트

- **6개 신뢰 방어 UX**: 분류 근거 공개·신뢰도 배지·표본 수 표시·중립 과대포장 금지·기사 단위 판단 금지·정정 로그
- **검증 4지표 (MAU 대신)**: Pro 분석 카드 클릭 후 결제 전환율·키워드 등록률·공유 횟수·B2B PoC 전환수
- **무료/유료 paywall 위치**: 무료 = 위젯 + 1줄 요약 + 비율 막대 / 유료 = Frame 비교·헤드라인 차이·Trend 30d+

---

## 4. 사용자 (태욱) 결정 사항 — 2026-05-03 회의

### 4.1 ADR-011 채택

7가지 핵심 결정 (ADR-011 §Decision 참조):
- Free 코인 시스템 + 3 tier 구독
- AI 분석 1건 = 10 코인
- 코인 패키지 5단 ($0.99 ~ $49.99)
- 구독: Pro $4.99 / Creator $9.99 / Leader $19.99
- 연간 = 10개월 가격 (17% 할인)
- 한도 초과 시 코인 사용 + 자발적 광고 옵션
- Trial 미운영 (코인이 본질적 무료 체험)

### 4.2 추가 기능 결정

- **날씨 + 미세먼지 + 비 경고** 위젯 통합
  - 위치: 헤더 옆 한 줄 (사용자 결정 A)
  - 미세먼지 심한 경우 마스크 아이콘, 좋은 경우 깨끗한 아이콘
  - iOS 네이티브 위젯은 크기에 따라 분배
  - 데이터: 기상청 동네예보 (P0a 워커 통합)
  - 위치 결정: 서울 default
  - **구현 시점**: v1.7 patch 후보

### 4.3 진행 방식 결정

- ADR-011 완료 후 v1.7 candidate 작성 전 "현재 상태 정리" 우선
- **본 문서가 그 정리** — 검토 후 v1.7 발의 항목 결정 → 그 후 v1.7 patch

---

## 5. 미해결 결정 (Open Questions)

### 5.1 ADR 발의 후보 (3개)

| ADR | 주제 | 시급도 | 영향 범위 |
|---|---|---|---|
| **ADR-009** | 이념 라벨링 정체성 (4색 → 매체 A군/B군 + 사안별 동적?) | 🔴 최고 | sparkline 색상·widget·embed·detail Coverage Bar 모두 |
| **ADR-010** | 포지셔닝 ("이슈 리스크 OS" 채택?) | 🔴 최고 | 모든 카피·페르소나·가격 |
| ADR-012 후보 | 날씨/미세먼지/비 경고 통합 (mini ADR로 가능) | 🟢 중 | /widget 헤더, iOS 위젯 |

### 5.2 ADR-011에서 떠오른 5개 Open Questions

1. 코인 명칭 (코인/포인트/크레딧/분석권 — 게임산업법 회피)
2. 광고 SDK (AdMob vs 카카오 애드핏 vs 듀얼)
3. 구독자 광고 시청 일일 한도
4. Leader soft limit 정확 수치 (500/일?)
5. 연간 환불 정책

### 5.3 v1.7 candidate 8개 항목 (외부 AI 기반)

| # | 항목 | 결정 형태 | 시급도 |
|---|---|---|---|
| 1 | ADR-009 이념 라벨링 | ADR | 🔴 |
| 2 | ADR-010 포지셔닝 | ADR | 🔴 |
| 3 | 페르소나 재배치 (PR/홍보 1순위) | PRD §3 | 🟡 |
| 4 | Pro 요금 6단 → ADR-011로 해결 ✅ | — | — |
| 5 | Paywall trigger UX (코인 차감 위치) | PRD §10 | 🟡 |
| 6 | 신규 분석 카드 4개 (Frame Clash + Timeline + 새로워졌나 + 다음 신호) | PRD §1.3 | 🟢 |
| 7 | 6개 신뢰 방어 UX | PRD §13 | 🟢 |
| 8 | 검증 4지표 (MAU 대신) | PRD §11 | 🟢 |

→ ADR-011로 #4 해결, 나머지 7개 미결.

---

## 6. 이슈 분석 시스템 현황

### 6.1 현재 mock 분석 (15 cluster)

각 cluster당:
- ✅ ai_analysis.why_trending (200~400자)
- ✅ ai_analysis.coverage_summary (300~500자)
- ✅ entity_card (9 cluster — definition + 4~5 domain_facts with source)
- ✅ outlet_reports (4~7개, stance 4색)
- ✅ youtube_news (11 cluster — placeholder ID + fallback)
- ✅ trend (모든 cluster — 4 windows × 30~168 buckets, deterministic)

### 6.2 신규 분석 카드 후보 (외부 AI)

| 카드 | 가치 | 구현 비용 | 우선도 |
|---|---|---|---|
| 🔍 Frame Clash | "킬러 차별점" (ChatGPT) — 단어 하이라이팅으로 매체간 차이 즉시 인지 | 중 (NLP 토큰화 + UI) | 🔴 |
| 🕒 Timeline overlay | sparkline 진화형 — 보도/검색/공식발표 한 축 겹치기 | 중 (Recharts/D3 조합) | 🟡 |
| 🆕 무엇이 새로워졌나 | 같은 cluster의 기존 vs 이번 보도 차이 (diff) | 높음 (cluster history DB) | 🟢 |
| 📅 다음에 볼 신호 | 후속 일정·국회·실적·법원·플랫폼 — 정책/이슈에 핵심 | 높음 (외부 일정 DB 연동) | 🟢 |

### 6.3 카테고리별 분석 차등화 (ChatGPT 표)

| 카테고리 | 현재 mock | ChatGPT 권장 추가 |
|---|---|---|
| 정치·사회 | ✅ Coverage Bar + 매체별 stance | Frame Clash + Historical Analogies |
| 경제·산업 | entity_card | **Related Sectors/Tickers + Global Sentiment** ← 트레이더 페르소나 |
| 사건·사고 | why + coverage | 확인된 사실/미확인 주장 분리 + 정정 이력 |
| 엔터·문화 | entity_card (KBO/칸) | 팬덤 반응 흐름 + 플랫폼 확산 경로 |
| 국제·외교 | coverage_summary | 한국 매체 vs 외신 프레임 비교 |
| 의료·과학 | (광고 제외) | 근거 수준 + 규제 상태 + 전문가 발언 |
| 법률·수사 | (mock에 없음) | 사실/주장/전망 분리 + 판례·법 조항 |

→ 카테고리별 differentiation은 v1.7 PRD에 핵심 결정.

### 6.4 검토 6 angle (이전 메시지 framework)

| Angle | 현재 상태 | 결정 필요 |
|---|---|---|
| 1. 현재 카드 적정성 | mock 시각 검증 OK | 200~400자 적정한가, sparkline 4 windows 다 보여주는 게 맞나 |
| 2. 신규 카드 4개 | 미구현 | 어느 것 채택? (Frame Clash 가장 강함) |
| 3. 카테고리별 차등화 | 미구현 | 7 카테고리 × 분석 카드 매트릭스 결정 |
| 4. paywall 위치 | ADR-011로 일부 해결 | 구체적 trigger 위치 (Free → 코인 차감 시점) |
| 5. 신뢰 방어 UX 6개 | 미구현 | ADR-009 결정 후 통합 |
| 6. ADR-009 라벨 정합성 | 미결 | 4색 vs A군/B군 vs 동적 |

---

## 7. 검증 결과

### 7.1 시각 검증 (사용자 직접)

- v1.6.1 Top 10 + 트렌드 화살표 → ✅
- v1.6.4 3-section AI → ✅ (사용자 피드백: 더 풍부한 분석 필요 → v1.6.5)
- v1.6.5 카드 reorder + entity + trend + YouTube → 시각 검증 가능 (PR #7 dev)
- 시각 우려: YouTube 썸네일 fallback 디자인, sparkline 4개 동시 표시 정보 과다 가능성

### 7.2 시스템 검증 (CI + harness)

- typecheck (web + harness): 모든 PR pass
- harness:realtime-naming: 69 files / 0 banned (마지막 측정)
- harness:widget-contract: 2/2 sizes 응답 검증 OK (medium ~870B / large ~3,200B)
- harness 실 구현 2개 / 16 placeholder
- CI: 모든 PR ~50초 green
- 테스트 파일: 0 (Sprint 0 T-001로 미룸)

### 7.3 외부 검증 부재 (가장 큰 위험)

- **B2B 잠재 고객 인터뷰 0회** — Gemini·ChatGPT 모두 "콜드 메일 + 샘플 PDF" 검증 권고
- **트레이더·크리에이터 페르소나 검증 0회** — 가설만 존재
- **결제 의향 데이터 0** — Pro/Creator/Leader $4.99/$9.99/$19.99 가격 가설 미검증

→ P0w D7 Exit 전 **최소 PR/홍보 실무자 1~2명 인터뷰** 필요.

---

## 8. 다음 의사결정 우선순위

### Tier 1: 가장 시급 (blocking 다른 결정)

1. **ADR-009 이념 라벨링** — v1.7 다른 7개 항목에 모두 영향. T-W04 (AdZone) 광고 제외 카테고리 정의도 영향
   - 옵션 A: 4색 분포 유지
   - 옵션 B: 매체 A군/B군 단순화
   - 옵션 C: 사안별 동적 라벨 (성장/분배 등)
   - 옵션 D: B + C 결합 (위젯은 A군/B군, detail은 동적)
   - **외부 AI 종합 권장: D**

### Tier 2: 빠르게 결정 가능 (단독 진행 가능)

2. **ADR-010 포지셔닝** — "이슈 리스크 OS" 채택? 모든 카피 영향
   - 단순 결정: yes/no, 추가 카피 변경
3. **페르소나 재배치** — PR/홍보 1순위, Pro/Creator CTA 카피 변경
4. **검증 4지표 채택** — MAU 대신 conversion 등으로 P0w Exit Criteria 변경

### Tier 3: 결정 자체보다 자료 수집 필요

5. **B2B PoC 인터뷰** — PR/홍보 실무자 1~2명 직접 콜드 메일
6. **변호사 자문** — ADR-011 코인 명칭 + 광고 보상 + 미성년자 흐름
7. **트레이더 인터뷰 1명** — Gemini 1순위 가설 검증

### Tier 4: v1.7 patch 작업

8. **신규 분석 카드 4개 채택 결정** (Frame Clash 우선)
9. **카테고리별 분석 차등화** (7 카테고리 × 카드 매트릭스)
10. **6개 신뢰 방어 UX** (ADR-009 결정 후)
11. **날씨/미세먼지/비 통합** (간단)
12. **Paywall trigger 구체 위치** (코인 차감 시점)

---

## 9. P0w D7 Exit 권장 행동

1. **PR #7 (v1.6.5) merge** — 즉시
2. **ADR-009 결정 회의** (Tier 1) — 사용자 + 본 문서 검토 후
3. **Tier 2 ADR-010·페르소나·검증지표** 빠르게 결정 (각 30분 회의)
4. **T-W04 진행** — ADR-009 결정 후 광고 제외 카테고리 정확하게 반영
5. **T-W05 진행** — 검증 4지표 + 코인 시스템 이벤트 통합
6. **외부 인터뷰 1명** — PR/홍보 실무자 LinkedIn 콜드 메일
7. **변호사 자문 발송** — ADR-011 코인 명칭 + 광고 보상

D7 Exit Review에서 검증할 4지표:
- Pro 분석 카드 클릭 후 결제 전환율 (mock 단계 — UI funnel 행동 추적)
- 키워드 등록률
- 공유 횟수
- B2B PoC 응답 수 (외부 인터뷰 기반)

---

## 10. v1.7 발의 시점 권장

**조건**: Tier 1 (ADR-009) + Tier 2 (ADR-010, 페르소나, 검증지표) 결정 완료.

**시점 예측**: P0w D7 Exit 직후 (5/7 ± 1일).

**v1.7 발의 시 포함될 항목** (preview):
- ADR-009 / ADR-010 / ADR-011 정식 채택
- 페르소나 5명 → PR/홍보 1순위 재배치
- 검증 4지표 변경
- 신규 분석 카드 4개 (Frame Clash 필수, 나머지 선택)
- 카테고리별 분석 차등화 매트릭스
- 6개 신뢰 방어 UX
- 날씨/미세먼지/비 통합
- Paywall trigger 위치 명세
- B2B 인터뷰 결과 (있다면)

---

---

## 11. 사용자 결정 — 2026-05-03 회의 후속 (본 문서 작성 직후)

본 종합 문서를 검토한 직후 사용자(태욱)가 다음 결정을 내림:

### 11.1 ADR-009 (이념 라벨링) — 채택
- **결정**: 이념 라벨링은 보조적 정보로만, AI 정밀 분석 카드 안의 mini panel로 이동
- 위젯·임베드: 변화 없음
- /cluster/[id] "📰 매체" 카드: Coverage Bar 제거 → "🧠 AI 정밀 분석" 안 mini panel로 이동
- 매체 row 색깔 dot: 단순 회색 또는 outline (정치적 라벨 인지 X)
- 카피: "보도 분포 (Coverage Distribution)" → "📊 매체 진영 분포 (보조 통계)"
- ADR-009 작성 완료 → `docs/adr/ADR-009-ideological-labeling-as-auxiliary.md`

### 11.2 ADR-010 (포지셔닝) — 채택
- **결정**: "이슈 리스크 OS — 크리에이터·연구자·PR을 위한 소재·리스크 인프라"
- 사용자 명시 의도: "크리에이터 같은 애들이 소재를 뽑을 수 있게"
- 3-layer 가치: 소재 발굴 (Source) / 리스크 모니터링 (Risk) / 연구·검증 (Research)
- 페르소나 5명 재배치:
  1. 김크리에이터 (1순위) — Creator $9.99 매핑
  2. 박홍보 — Leader $19.99 또는 Enterprise
  3. 이연구 — Pro $4.99
  4. 최트레이더 — Pro $4.99
  5. 취준생 — Pay-per-issue $0.99
- Hero 카피: "한국 이슈 리스크 OS — 5초에 파악, 깊이로 활용"
- ADR-010 작성 완료 → `docs/adr/ADR-010-positioning-issue-risk-os.md`

### 11.3 외부 검증 (Tier 3 5번·6번·7번) — Codex + Gemini 자문 대체
- **결정**: B2B PoC 인터뷰 + 변호사 자문 + 트레이더 인터뷰 → Codex + Gemini 시뮬레이션 + 자문서 정제로 대체
- 자문 프롬프트 3 섹션 (A/B/C) 작성 완료 → `docs/research/external-validation-prompts.md`
- 사용자가 Codex Chat / Gemini Advanced에 그대로 붙여넣어 답변 수집
- 답변 종합 후 v1.7 candidate 정식 작성
- 변호사 자문서는 Section B 답변 받은 후 발송 (₩100~300만 / 1~2주)

---

## 12. 업데이트된 결정 우선순위 (Tier 정리 후)

### Tier 1 (가장 시급) — ✅ 모두 결정됨
1. ✅ ADR-009 (이념 라벨링 보조화) — 작성 완료
2. ✅ ADR-010 (포지셔닝 "이슈 리스크 OS") — 작성 완료
3. ✅ ADR-011 (Hybrid Coin + Subscription) — 작성 완료

### Tier 2 (단독 결정 가능) — 부분 결정
4. ✅ 페르소나 재배치 (ADR-010 §3에 통합) — Creator 1순위
5. ⏳ 검증 4지표 채택 (PR 분석 클릭→결제·키워드 등록·공유·B2B PoC) — v1.7 §11에서 결정

### Tier 3 (외부 검증) — Codex/Gemini 자문으로 대체
6. ⏳ Codex/Gemini에 Section A·B·C 프롬프트 자문 → 답변 수집
7. ⏳ Section B 답변 후 변호사 자문서 발송

### Tier 4 (v1.7 patch 작업) — Tier 3 답변 받은 후 진행
8. ⏳ 신규 분석 카드 4개 (Frame Clash 우선 — ADR-010 1순위 페르소나 가치와 직접 정합)
9. ⏳ 카테고리별 분석 차등화 (Section A·C 답변 반영)
10. ⏳ 6개 신뢰 방어 UX (ADR-009 결정 반영하여 통합)
11. ⏳ 날씨/미세먼지/비 통합 (간단 — v1.7 patch 또는 mini ADR-012)
12. ⏳ Paywall trigger 구체 위치 (ADR-011 §Implementation Contract와 통합)

---

## 13. 즉시 실행 가능한 행동 (다음 24시간)

### A. PR #7 (v1.6.5) merge — 즉시
- 모든 검증 통과, awaiting merge

### B. T-W04 진행 시작
- ADR-009 결정 반영: 광고 제외 카테고리 (정치·국방·의료) 정확히 정의
- ADR-011 통합: 코인 시스템 mock UX (CoinBalance·EarnCoinsModal·TierBadge·PaywallTrigger·TierComparisonModal)
- 우선 작업: AdZone + 코인 mock + tier 비교 모달

### C. 외부 자문 발송 (병렬, 사용자 직접)
- Codex / Gemini에 Section A 프롬프트 — B2B PoC 시뮬레이션
- Codex / Gemini에 Section B 프롬프트 — 변호사 자문서 정제
- Codex / Gemini에 Section C 프롬프트 — 트레이더 적합성

### D. 다음 회의에서 결정할 항목
- Section A·B·C 답변 종합 분석
- 검증 4지표 채택 여부
- v1.7 PRD 정식 발의 (ADR-009/010/011 + 페르소나 재배치 + 신규 카드 + 검증 지표 통합)

---

## 14. 파일 일람 (P0w D5 시점)

### PRD (6 documents)
- `docs/prd-v1.6.md` — 확정본
- `docs/prd-v1.6.1-patch.md` (Top 10 + polling)
- `docs/prd-v1.6.2-patch.md` (categories + hide bar)
- `docs/prd-v1.6.3-patch.md` (mock-rich detail)
- `docs/prd-v1.6.4-patch.md` (3-section AI)
- `docs/prd-v1.6.5-patch.md` (reorder + entity + trend + YouTube)

### ADR (11 documents)
- `docs/adr/ADR-001-data-licensing.md`
- `docs/adr/ADR-002-public-api-via-next-route.md`
- `docs/adr/ADR-003-embedding-provider.md`
- `docs/adr/ADR-004-p0a-p0b-scope.md`
- `docs/adr/ADR-005-ad-zone-separation.md`
- `docs/adr/ADR-006-native-widget-staged-entry.md`
- `docs/adr/ADR-007-affiliate-commerce-data-boundary.md`
- `docs/adr/ADR-008-trend-time-series-pipeline.md`
- `docs/adr/ADR-009-ideological-labeling-as-auxiliary.md` ← 신규
- `docs/adr/ADR-010-positioning-issue-risk-os.md` ← 신규
- `docs/adr/ADR-011-hybrid-coin-subscription-monetization.md` ← 신규

### Research (3 documents)
- `docs/research/p0w-state-of-the-system.md` ← 본 문서
- `docs/research/external-validation-prompts.md` ← 신규
- (예정) `docs/research/feedback/` 디렉토리 — Codex/Gemini 답변 아카이브

---

**End of P0w State of the System — 2026-05-03 (rev. 1, post-ADR-009/010/011 decisions)**

**다음 작업**: T-W04 시작 (ADR-009/010/011 통합) + 외부 자문 발송 (사용자 직접)
