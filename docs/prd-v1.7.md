# Product Requirements Document v1.7
# 뜬이유 (TTEUN-IYU) — 한국 이슈 리스크 OS

| 항목 | 내용 |
|---|---|
| 문서 버전 | **v1.7 (확정 — Issue Risk OS Pivot)** |
| 작성일 | 2026-05-09 |
| 이전 버전 | v1.6 + 5 patches (v1.6.1~v1.6.5) |
| 대상 | Engineering / Design / Codex / Claude Code / Legal / Business Development |
| 근거 자료 | prd-v1.6.md + 5 patches + ADR-001~014 + 외부 자문 (Gemini + ChatGPT 2026-05-03) + P0w 시각·계약 검증 |
| 코드네임 | TTEUN-IYU |
| 한국어 서비스명 | 뜬이유 |
| 영문 브랜드 | **Issue Risk OS** (서브타이틀, ADR-010) |
| 핵심 KPI | **Creator $9.99 전환율** (ADR-010 1순위 페르소나 + ADR-011 sweet spot) |
| Target MVP | **P0a: 2026-05-23 / P0b: 2026-06-09 / V0.5: 2026-08-08 / V1: 2026-11-06** |
| 변경 원칙 | **시민 인프라 → 업무 인프라. 분류 → 활용. 단가 강제 → 사다리 + 코인.** |
| 잠금 상태 | **확정 (변경 시 PRD v1.8 발의 필요)** |

---

## Changelog v1.6 → v1.7

### 1줄 요약
v1.6의 "한국 언론 보도 분포 가시화" 시민 캠페인 포지셔닝을 **"이슈 리스크 OS — 크리에이터·연구자·홍보를 위한 소재·리스크 인프라"로 전환**. 외부 자문 (Gemini + ChatGPT 2026-05-03) 종합과 P0w 시각·계약 검증 결과를 반영한 **확정 PRD**.

### 핵심 변화 8가지

- **C-1 포지셔닝 전환** (ADR-010): "한국 언론 분포 가시화" → "한국 이슈 리스크 OS". 3-layer 가치 = 소재 발굴(Source) / 리스크 모니터링(Risk) / 연구·검증(Research).
- **C-2 페르소나 재배치** (ADR-010 §3): 1순위 = 김크리에이터 (Creator $9.99 sweet spot 매핑). 2순위 = 박홍보 (Leader/Enterprise). 3·4순위 = 이연구·최트레이더 (Pro). 5순위 = 학생 (Pay-per-issue).
- **C-3 이념 라벨링 보조화** (ADR-009): 4색 분포 1차 surface 제거 → AI 정밀 분석 mini panel 보조 정보. 매체 row 색깔 dot → 회색. "진보/중도/보수/외신" → "매체군 A/B/C/외신".
- **C-4 결제 모델 전환** (ADR-011): 단일 ₩6,900 Pro → **Free 코인 + 3 tier (Pro $4.99 / Creator $9.99 / Leader $19.99) + 코인 패키지 5단**. Trial 미운영. 사용자 디바이스 호출 (BYOK) 거부.
- **C-5 신규 분석 카드 4종**: Frame Clash (단어 하이라이팅) / Timeline overlay / 무엇이 새로워졌나 / 다음에 볼 신호. ChatGPT 권장 "킬러 차별점 — Visualized Frame Clash" 채택.
- **C-6 헤드라인 본론 토글** (ADR-013): 매체 row "📝 본론 보기" 토글. 원본 헤드라인 보존 + AI 본론 요약 opt-in.
- **C-7 AI 비용 파이프라인** (ADR-014): 3-phase 진화 (Gemini 2.0 Flash → 맥미니 → GPU). 사용자별 호출 X. 월 cap $50 + Slack alert.
- **C-8 검증 4지표 (MAU 대신)**: Pro 분석 카드 클릭 후 결제 전환율 / 키워드 등록률 / 공유 횟수 / B2B PoC 전환수.

### 추가 변화

- **C-9 날씨/미세먼지/비 위젯 통합**: 헤더 옆 한 줄 (☀ 21°C · 미세먼지 좋음 / 마스크 아이콘 / ☔ 오후 1시) — 기상청 동네예보 + 에어코리아 (P0a T-006 워커 통합).
- **C-10 신뢰 방어 UX 6개** (ChatGPT 권장): 분류 근거 공개 / 신뢰도 배지 / 표본 수 / 정정 로그 / 기사 단위 판단 금지 / 중립 과대포장 금지.
- **C-11 카테고리별 분석 차등화**: 정치·사회 (Frame Clash + Historical) / 경제 (Ticker + Global Sentiment) / 엔터 (Sentiment Trend) / 사건 (사실/주장 분리) / 의료 (근거 수준) / 법률 (혐의/판례).
- **C-12 P0w Exit Criteria 재정의**: 마케팅 지표 (대기자 100명 등)는 P0a/P0b로 이동. P0w는 시각·계약·구조 검증으로 종결.

### v1.6에서 유지되는 것 (불변)

- **"실시간 검색어" 금지** + "실시간 이슈" 통일 (CLAUDE.md Naming Ban List)
- **P12 수익 영역 분리** (ADR-005)
- **Affiliate Data Ephemerality** (ADR-007)
- **Native Widget 단계적 진입** (ADR-006) — 단 진입 조건은 v1.7에서 수정 (ADR-011 페르소나 매핑 후)
- 디자인 시스템 토큰 6축 (색상·타이포·spacing·radius·shadow·motion)
- 다크모드 디폴트
- v1.6 18종 harness catalog (ADR-014 후 19종 후보 — assert-llm-call-logging)
- 비협상 14조 (ADR-013·014로 인해 일부 보강)
- **워커-캐시 패턴**: ADR-008 → ADR-013/014 동일 적용

---

## 1. Product Overview (재작성)

### 1.1 Vision (ADR-010 적용)
한국에서 이슈가 어떻게 만들어지고 누구에게 어떤 영향을 미치는지를 **5초에 파악하고, 5분에 분석하고, 5초 안에 콘텐츠로 만들 수 있는** 인프라를 만든다.

### 1.2 Mission (ADR-010 적용)
뜬이유는 한국 언론·검색·소셜에 흩어진 이슈를 **시간 흐름과 매체 다양성 측면에서 정리**해, 크리에이터·홍보·연구자·트레이더가 콘텐츠·리스크·연구·의사결정에 즉시 활용할 수 있게 한다.

> 가치 판단 도구가 아니다. 정확한 정보를 빠르게 활용 가능한 형태로 압축하는 도구다.

### 1.3 Product Identity — 3-Layer Brand (확장)

**Layer 1: 뜬이유 (서비스·브랜드)**
- 최상위 서비스명. 외부 커뮤니케이션 단일 창구.

**Layer 2: 실시간 이슈 위젯 (진입 Feature)**
- `/` (홈) = 실시간 이슈 위젯 대시보드 (Top 10).
- 수익화 요소(AdZone)가 렌더될 수 있는 유일한 영역.
- 진입 유도 목적 — 클릭 → Layer 3.

**Layer 3: AI 정밀 분석 + Coverage Distribution (본체 분석)**
- `/cluster/[id]`, `/methodology`, `/dispute`, `/outlet-compare`.
- 신뢰 인프라 핵심.
- AdZone family 절대 금지 (ADR-005 P12).
- ADR-009로 4색 분포는 보조 정보 영역으로 강등.

### 1.4 Success Definition (12개월, ADR-011 매핑)

| 지표 카테고리 | 지표 | 목표 |
|---|---|---|
| Product | MAU | (검증 4지표로 대체, §11 참조) |
| Revenue — B2C Pro | $4.99 구독자 | 500명 (~$2,495/월) |
| Revenue — Creator (KPI) | **$9.99 구독자** | **300명 (~$2,997/월)** |
| Revenue — Leader | $19.99 구독자 | 50명 (~$1,000/월) |
| Revenue — Coin | 패키지 평균 $4.99 × 활성 free 사용자 5% | 추가 ~$500/월 |
| Revenue — Enterprise | 협의 ($500+/월) | 5건 (~$2,500/월) |
| Revenue — Pay-per-issue | $0.99/건 × 단건 구매 | ~$300/월 |
| **MRR 합계 (12개월)** | **~$10,000** | |

### 1.5 Non-Goals (확장)

기존 v1.6 + 추가:
- ❌ **공정한 언론 평가 도구** (가치 판단 X, ADR-009)
- ❌ **정치적 중립 운동** (정치적 행위 X)
- ❌ **포털 뉴스 대체재** (네이버·카카오 무료 포털 대체 시도 X)
- ❌ **투자 추천 / 자문업** (Frame Clash·trend는 정보 제공, 투자 권유 X)
- ❌ **팩트체크 서비스** (사실/주장 분리는 정보 정리 도구일 뿐)
- ❌ **사용자 디바이스 LLM 호출 (BYOK)** (ADR-014 — 한국 마찰 + 캐시 불가)
- ❌ **DeepSeek 단독 사용** (ADR-014 — 데이터 주권 우려)
- ❌ **무료체험 자동전환** (ADR-011 — 한국 2025-02-14 추가 동의 의무 회피)

---

## 2. Problem Statement (JTBD 5종 + 신규 1종 추가)

### JTBD-1 (Functional, Source) — 콘텐츠 크리에이터
**When** 매주 뉴스레터·유튜브·블로그 콘텐츠 소재를 발굴해야 할 때,
**I want to** 오늘 한국에서 뜨는 이슈와 그 매체별 보도 흐름을 5초에 파악하고 AI 정밀 분석 + 본론 요약 + Embed 카드를 사용해,
**So I can** 4시간 걸리던 큐레이션을 30분으로 줄이고 콘텐츠 다양성 확보.

→ **Creator $9.99의 직접 JTBD**. ADR-010 1순위 페르소나.

### JTBD-2 (Functional, Risk) — PR/IR/홍보 실무자
**When** 자사·산업 관련 부정 이슈가 떠오를 때,
**I want to** 5분 안에 어느 매체가 어떤 각도로 보도하는지 + 시계열 흐름을 파악해,
**So I can** 본부장·대표에게 즉시 보고하고 대응 방향을 결정.

→ **Leader $19.99 / Enterprise**의 직접 JTBD. ADR-010 2순위.

### JTBD-3 (Functional, Research) — 정책·법무·대관·연구자
**When** 정책 이슈·소송·규제 동향을 추적해야 할 때,
**I want to** 6개월/1년 시계열 + 매체 분포 + entity_card 출처를 활용해,
**So I can** 보고서·논문·자료에 인용 가능한 형태로 즉시 활용.

→ **Pro $4.99 + Pay-per-issue + Weekly Report Pack**.

### JTBD-4 (Economic, Trader) — 단기·중기 투자자
**When** 산업·종목·정책 이슈가 트레이딩에 영향을 미칠 때,
**I want to** 경제 cluster의 ticker 영향 + Global Sentiment + Frame Clash를 5초에 보고,
**So I can** 매도·매수 의사결정 신호로 활용.

→ **Pro $4.99 + Leader $19.99 (자동 알림 + API)**. ADR-010 4순위. churn risk 큼.

### JTBD-5 (Functional, Discovery) — 일반 시민 (보존)
**When** 출퇴근·점심·저녁 윈도우에서,
**I want to** 지금 한국에서 뜨는 이슈 Top 10을 5초에 파악하고,
**So I can** 동료·단톡방에서 맥락 있는 시민으로 기능.

→ **Free 코인 시스템**. 광고 시청 → 코인 → AI 분석 잠금 해제.

### JTBD-6 (Social) — v1.6 유지

OG 카드 공유 (PR/홍보·크리에이터가 보고서·콘텐츠에 사용).

---

## 3. Target Users (Personas 5명 — ADR-010 §3 재배치)

### Persona 1 (1순위) — 김크리에이터 (32세, 1인 뉴스레터·유튜버)
- 매출: 월 ₩3~10M (광고·후원·강연)
- 페인: 매주 4시간 큐레이션, 균형 관점 확보, Embed 도구 부재
- 매핑: **Creator $9.99/월**
- 기대 가치: 100건/일 분석 + Embed + 워터마크 제거 → 콘텐츠 30분에 완성

### Persona 2 (2순위) — 박홍보 (38세, 스타트업 PR/IR 팀장)
- 매출: B2B 결제 결정자 (회사 카드)
- 페인: 매일 클리핑 4시간, 부정 이슈 조기 감지, 매체별 흐름 추적
- 매핑: **Leader $19.99/월** (개인) 또는 **Enterprise $500+/월** (회사)
- 기대 가치: 키워드 알림 + Slack 자동 발송 + 매일 8시 리포트

### Persona 3 (3순위) — 이연구 (45세, 협회·로펌 대관·법무 실무자)
- 매핑: **Pro $4.99/월** (개인) + **Weekly Report Pack $30/월** (회사 결제)
- 기대 가치: 6개월/1년 trend + entity_card 출처 + PDF 다운로드

### Persona 4 (4순위) — 최트레이더 (35세, 투자자·퀀트 리서치)
- 매핑: **Pro $4.99 → Leader $19.99** (성과에 따라 churn 가능)
- 기대 가치: 경제 cluster ticker 영향 + Frame Clash + API key
- 우려: churn risk 가장 큼 (한 번 손실 → 즉시 해지)

### Persona 5 (5순위) — 취준생/학생 (24세, 시사 면접·논술·리서치)
- 매핑: **Free 코인** (광고 시청) + **Pay-per-issue $0.99** + **Weekly Report Pack $30**
- 기대 가치: 양측 관점 정리 + 시사 이슈 요약 PDF

---

## 4. Product Principles (P1~P12 유지 + P13 신설)

### P1~P12 (v1.6 유지)
- P12 Revenue Zone Isolation (ADR-005) — **AdZone family 절대 금지 영역 + ADR-009 정신과 정합**

### P13. 활용 가능 정보 우선 (Actionable Information First) — 신규 (ADR-010)

뜬이유는 모든 분석·시각화·카피를 **"사용자가 5초 안에 무엇을 할 수 있는가"** 기준으로 설계한다. "이 이슈는 X군에 분류된다"가 아니라 "이 이슈를 너의 콘텐츠·보고서·트레이딩에 어떻게 쓸 수 있다"가 1차 메시지다.

분류·점수·등급 같은 평가 정보는 보조 영역(AI 정밀 분석)에서만 노출 — 1차 surface는 활용 가능성에 집중.

---

## 5. Naming & Language (v1.6 유지 + ADR-009/010 추가)

### 5.1 "실시간 이슈" 용어 (v1.6 유지)
허용: 실시간 이슈 / 급상승 이슈 / 지금 뜨는 이유 / Rising Issues
금지: 실시간 검색어 / 실검 / 인기 검색어 / 실시간 순위

### 5.2 Issue Risk OS 카피 표준 (ADR-010)
- Hero: "한국 이슈 리스크 OS — 5초에 파악, 깊이로 활용"
- Sub: "오늘 뜬 이유 + AI 정밀 분석 + 4-window 흐름"
- Tier: "Pro $4.99 / Creator $9.99 / Leader $19.99"
- Footer: "뜬이유는 가치 판단 도구가 아닙니다. 정확한 정보를 활용 가능한 형태로 제공합니다."

### 5.3 매체군 표현 (ADR-009)
공개: "매체군 A / 매체군 B / 매체군 C / 외신"
보조 영역(AI 정밀 분석 mini panel) 안: 진영 라벨 + AllSides·Ad Fontes 매핑 출처 명시
금지: "편향" / "Bias" / 1차 surface 4색 분포

### 5.4 코인·tier 용어 (ADR-011)
- Free: "코인" 또는 "분석권" (게임산업법 회피, 변호사 자문 후 확정)
- Pro / Creator / Leader: 단순 영문 표기
- 코인 패키지: Starter / Plus / Heavy / Mega / Whale ($0.99~$49.99)
- 광고: "📺 영상 보고 +10 코인" (강제 X, 옵트인)

### 5.5 헤드라인 본론 표현 (ADR-013)
허용: "📝 본론 보기" / "AI 추출 본론 요약"
금지: "낚시 정화" / "허위 부분 제거" / "자극도 점수"

---

## 6. Data Source Strategy (v1.6 유지 + ADR-014 추가)

### 6.1 4계층 데이터 (v1.6 §6 유지)
- 1차: RSS 30개 매체 (저장·가공)
- 2차: 외부 검증 (DataLab·GTrends·BIGKinds)
- 3차: 제품 내부 신호 (조회·공유·저장 등)
- 4차: 제휴 커머스 런타임 API (저장 X, ADR-007)

### 6.2 5계층 추가 — LLM 출력 캐시 (ADR-014)
- **`summaries`** 테이블 (cluster ai_analysis JSON)
- **`headline_summaries`** 테이블 (article body_summary, ADR-013)
- **`keyword_trends`** 테이블 (window별 시계열, ADR-008)
- **`llm_call_log`** 테이블 (prompt_version, model, cost, cache_hit — CLAUDE.md rule 9)

캐시 키: `(article_url, model, prompt_version)` — 모델 swap 시 prompt_version bump → 자동 재처리.

비용 cap: 월 $50 + Slack alert at 90% + hard-stop at 100%.

### 6.3 6계층 — 날씨·미세먼지 (C-9 신규)
- 기상청 OpenAPI 동네예보 (날씨·강수)
- 에어코리아 (미세먼지 PM2.5/PM10)
- 위치 default 서울, 사용자 도시 선택은 V0.5
- 워커 매 1시간 fetch + DB 적재 (`weather_snapshots` 테이블)

---

## 7. Feature Specifications (v1.6 §7 + 신규 4 카드 + 위젯 헤더 + 코인 UX)

### 7.1 Surface 매트릭스 (v1.6.5 + ADR-009/010/011/013/014 통합)

| 영역 | 카테고리 라벨 | Coverage Bar | Rank Trend | AdZone | YouTube | AI Analysis | Frame Clash (신규) | Timeline (신규) | 무엇이 새로워졌나 (신규) | 다음에 볼 신호 (신규) | 헤드라인 본론 (ADR-013) | Coin / Tier UI | 날씨 (C-9) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/widget` Top 10 | ❌ | ❌ | ✅ | T-W04 ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **CoinBalance + TierBadge** (v1.7 patch) | **헤더 한 줄** (v1.7 patch) |
| `/embed/iframe` | ❌ | ❌ | ✅ | 영구 X | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/cluster/[id]` | ✅ | **AI deep mini panel only** (politics/society) | — | ❌ (P12) | ✅ | ✅ (3-stack) | **신규 카드 1** | **신규 카드 2** | **신규 카드 3** | **신규 카드 4** | **OutletRow 토글** | ❌ | ❌ |
| `/api/v1/widget/top` | ✅ | ✅ (필드) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/api/v1/clusters/[id]` | ✅ | ✅ (필드) | — | ❌ | ✅ | ✅ | (필드 추가) | (필드 추가) | (필드 추가) | (필드 추가) | (필드 추가) | ❌ | ❌ |

### 7.2 신규 분석 카드 4종 (ChatGPT 권장, v1.7 patch)

#### 7.2.1 🔍 Frame Clash — 매체간 단어 차이
같은 cluster를 다룬 매체 2개를 좌우로 비교, 동일 사실에 대한 명사·형용사·동사 차이를 색상 하이라이팅.

예: "권력 남용" (좌) vs "적법 절차" (우)

→ "킬러 차별점" (ChatGPT 평가). Creator·연구자 페르소나 핵심.

#### 7.2.2 🕒 Timeline overlay — 보도/검색/공식발표 한 축
4-window sparkline의 진화형. 한 축에:
- 보도량 (RSS 누적)
- 검색량 (DataLab/GTrends)
- 공식 발표 (정부·기업 공시 — V0.5 통합)

→ 트레이더·연구자 페르소나 핵심.

#### 7.2.3 🆕 무엇이 새로워졌나 — 같은 cluster 기존 vs 이번 보도 차이
24시간 내 같은 cluster의 새 보도가 이전과 어떤 점이 다른가 (diff).

→ PR·연구자 페르소나 핵심.

#### 7.2.4 📅 다음에 볼 신호 — 후속 일정
국회 일정·실적 발표·법원 선고·플랫폼 공개일·기관 발표 일정.

→ 모든 페르소나에 가치, 특히 연구자·PR.

### 7.3 매체 row 헤드라인 본론 토글 (ADR-013, v1.7 patch)

```
🔘 [매체명] [매체군 라벨] · 3분 전
   원본: "충격! 삼성 1조 적자, 위기 신호"
   📝 본론 보기 ▼  (default closed)
   └─ "삼성전자 1Q 반도체 영업이익 1조원 감소 — 메모리 사이클 일시 둔화"
```

### 7.4 코인·Tier UI (ADR-011, v1.7 patch)

- `<CoinBalance>` — 헤더 우측 ("🪙 35")
- `<TierBadge>` — Free/Pro/Creator/Leader (Free는 익명, Pro+ 로그인 후)
- `<EarnCoinsModal>` — "광고 보고 +10 코인" mock (5초 progress)
- `<TierComparisonModal>` — Creator featured highlighting
- `<PaywallTrigger>` — Free 진입 또는 한도 도달 시
- AI 분석 카드 lazy 렌더 (Free는 잠금 해제 버튼)

### 7.5 날씨/미세먼지 위젯 헤더 (C-9, v1.7 patch)

```
실시간 이슈 · 뜬이유            ☀ 21°C · 😷 미세먼지 나쁨 · ☔ 오후 1시
한국 이슈 리스크 OS
```

미세먼지 임계값 (PM2.5 ≥ 75) 또는 강수 (≥ 5mm/h) 도달 시 상단 banner.

---

## 8. Widget API Contract (v1.6.5 유지 + 일부 확장)

### 8.1 `WidgetClusterSchema` 확장 (v1.7 patch)

```diff
 export const WidgetClusterSchema = ClusterCore // ...
 // category, previous_rank: 유지
 // affiliate_slot: 유지
+// (신규 필드는 cluster detail에만, 위젯에는 추가 X — payload 작게 유지)
```

### 8.2 `ClusterDetailResponseSchema` 확장 (v1.7 patch)

```diff
 export const ClusterDetailResponseSchema = z.object({
   // ... v1.6.5 유지
+  frame_clash: z.array(FrameClashSchema).max(3).optional(),    // 매체 비교 2~3쌍
+  timeline_overlay: TimelineOverlaySchema.optional(),         // 보도+검색+공식
+  whats_new: z.string().min(1).max(300).optional(),           // 24시간 내 차이
+  next_signals: z.array(NextSignalSchema).max(5).optional(),  // 후속 일정
   outlets: z.array(OutletReportSchema).min(1).max(20),       // body_summary 포함 (ADR-013)
   // ...
 })
```

---

## 9. Monetization Strategy (ADR-011 적용 정식)

### 9.1 Free + 코인 시스템
- 일일 1코인 + 광고 클릭 2 + 광고 풀시청 10 (일 적립 cap 60)
- 코인 사용: AI 분석 1건 = 10코인
- 패키지: $0.99 / $4.99 / $9.99 / $19.99 / $49.99

### 9.2 3 Tier 구독
- **Pro $4.99/월**: 광고 없음 + 분석 10건/일 + 키워드 알림 5개
- **Creator $9.99/월** (KPI): 분석 100건/일 + Embed 무제한 + 워터마크 제거 + 키워드 알림 20개
- **Leader $19.99/월**: 무제한 (soft cap 500/일) + API key + Slack 자동 발송 + B2B Lite 베타
- 연간 = 10개월 가격 (17% 할인)

### 9.3 Enterprise (협의)
- 월 $500+ — 회사 카드 결제 / 법무 사전 검토 / 전담 커스터마이징

### 9.4 Pay-per-issue
- 1건 $0.99 (≈ 100코인) — 구독 마찰 큰 사용자 대응

### 9.5 Weekly Report Pack
- $30/건 — 연구·교육·취준 페르소나

### 9.6 Affiliate Commerce + Contextual Ads (v1.6 §9.6/9.7 유지)
- 실시간 이슈 카드 하단 `<AdZone>`만, Coverage 영역 절대 금지 (P12)
- 정치·국방·의료 카테고리 광고 제외
- 수동 큐레이션 (P0w·P0a) → 자동 매칭 (V0.5)

### 9.7 한국 법무 위험 (ADR-011 §법무 매트릭스 + 변호사 자문 발송)

ADR-011의 7개 영역 위험 매트릭스 그대로 유지 + 변호사 자문서 발송 (`docs/research/external-validation-prompts.md` Section B).

---

## 10. Success Metrics (검증 4지표 — C-8)

### Layer 1: North Star (재정의)
- **Creator $9.99 활성 구독자 수** (12개월 목표 300명)

### Layer 2: 검증 4지표 (MAU 대신, ChatGPT 권장)

1. **Pro 분석 카드 클릭 후 결제 전환율** (Free → Pro/Creator/Leader)
2. **키워드 등록률** (활성 사용자 대비)
3. **공유 횟수** (PDF/링크/Embed 합산)
4. **B2B PoC 전환수** (콜드 메일 → 유료 PoC)

### Layer 3: Revenue Metrics (ADR-011 매핑)

| 지표 | P0a | P0b | V0.5 | V1 |
|---|---|---|---|---|
| Free 사용자 | 100 | 1,000 | 10,000 | 100,000 |
| Coin 패키지 구매 | 0 | 5/월 | 100/월 | 1,000/월 |
| Pro $4.99 구독 | 0 | 5 | 50 | 500 |
| **Creator $9.99 (KPI)** | 0 | 3 | 30 | 300 |
| Leader $19.99 | 0 | 1 | 10 | 50 |
| Enterprise | 0 | 0 | 1 | 5 |
| **MRR** | $0 | ~$60 | ~$1,000 | ~$10,000 |

### Layer 4: 신뢰·운영 지표 (P12 + ADR-009 + ADR-014)

- AdZone 누수 0건 (P12)
- LLM 월 비용 < $50 (ADR-014 cap)
- 매체별 정정 로그 (V0.5 신뢰 방어 UX)
- copy_ratio ≤ 15% (모든 LLM 출력)

### Layer 5: Mission Metric

- WDDU (Weekly Diverse-Diet Users) — v1.6 유지

---

## 11. Native Widget Entry Condition (ADR-006 보강)

기존 6개 신호 → ADR-011 매핑 후 재정의:
- **iOS Small (P0b 조건부)**: Creator $9.99 구독 5명 이상 + 대기자 100명 이상
- **iOS Medium/Large (V0.5)**: iOS Small TestFlight 설치 100명 이상
- **Android (V0.5)**: iOS 검증 후 Material You 동시 출시
- **Lock Screen / macOS (V1)**: MAU 50,000

---

## 12. Harness Engineering (v1.6 18종 + ADR-014 신규)

### 12.1 v1.6 18종 (catalog 유지)
- v1.3 8종 + v1.5 7종 + v1.6 3종 (ad-zone-boundary / affiliate-link-provenance / native-widget-entry-condition)

### 12.2 v1.7 신규 후보 (Sprint 0+ 또는 v1.7 patch)
- **assert-llm-call-logging** (ADR-014) — 모든 LLM SDK 호출이 `llm_call_log` 적재 함수 거치는지 정적 분석
- **assert-headline-summary-copy** (ADR-013) — body_summary copy_ratio ≤ 15% + "낚시"·"정화" 단어 0건
- **assert-stance-aux-only** (ADR-009) — Coverage Bar가 1차 surface (위젯·임베드·매체 row)에 없는지 + AI deep panel만 등장하는지

→ **18종 → 21종** (v1.7 확정 시).

### 12.3 P0w 실 구현 4종 (T-W04 종료 시)
- realtime-naming, widget-contract, ad-zone-boundary, affiliate-link-provenance
- 나머지 14종은 Sprint 0 T-001에서 본격 구현

---

## 13. Non-Functional Requirements (v1.6 유지 + ADR-014)

### 13.1 Performance
- Widget API p95 ≤ 300ms
- Cluster API p95 ≤ 500ms (LLM 캐시 hit 95%+)
- LCP /widget ≤ 2s
- LLM 호출 응답 (cache miss): p95 ≤ 3s

### 13.2 Security
- v1.6 유지 + LLM cost-guard (ADR-014)
- 광고 SDK PIPA·표시광고법 (ADR-011)

### 13.3 Accessibility
- v1.6 유지 + 헤더 위젯 (날씨·미세먼지) screen reader 안내문

### 13.4 Legal Compliance (ADR-011 통합)
- 표시광고법 / 정통망법 / PIPA / 청소년보호법 / 게임산업법 / 자동전환 / 소비자보호법
- ADR-011 §법무 매트릭스 7개 영역 변호사 자문 (D+14 발송 권장)

### 13.5 Observability (확장)
- Revenue dashboard (PostHog)
- LLM cost dashboard (Supabase llm_call_log + Slack alert)
- AdZone 누수 incident channel (Sentry P0)
- 검증 4지표 dashboard (P0a 시작 시)

### 13.6 Scalability
- v1.6 유지 + Phase 2 맥미니 + Phase 3 GPU (ADR-014)

---

## 14. Release Plan (v1.6 + ADR-011/014 매핑)

### Phase P0w — Widget-shaped Revenue MVP (D0~D7, 2026-04-21~2026-05-09)
- ✅ 종료 (10 PR + 12 ADR + 6 PRD patch + p0w-exit-checklist Partial Go)

### Phase P0a — 신뢰 데모 + LLM 워커 (D7~D24, 2026-05-09~2026-05-23)
- T-001 Sprint 0: harness 21종 (v1.7 신규 3종 포함) 본격 구현 + ESLint + Vitest + CI lint/test 활성화
- T-002 ~ T-007 v1.3 P0a 티켓 + ADR-014 LLM 워커 통합 (Gemini 2.0 Flash + cache + cap)
- T-006 RSS 30개 수집 + 클러스터링 + DB 적재
- T-005 LLM 호출 + summaries/headline_summaries/keyword_trends 적재
- T-007 /cluster/[id] 실 데이터 swap

### Phase P0b — 클로즈드 알파 + 결제 + 조건부 iOS Small (D24~D40, 2026-05-23~2026-06-09)
- T-B01 결제 (Toss / Stripe Korea) — Pro / Creator / Leader 구독 + 코인 패키지
- T-B02~04 v1.6 P0b
- T-B05 (조건부) iOS Small Widget — Creator 5명 + 대기자 100명 충족 시

### Phase V0.5 — 수익 다각화 + Native 확장 + 자체 호스트 (D40~D100, 2026-06-09~2026-08-08)
- Weekly Report Pack 출시
- API Access 공식 (Leader / Enterprise)
- iOS Medium/Large + Android Widget (조건부)
- 카카오 애드핏 / Google AdSense 분리 영역 파일럿
- ADR-014 Phase 2 — 맥미니 자체 호스트 50% offload
- Frame Clash + Timeline overlay 본격 구현

### Phase V1 — Native 풀스위트 + 광고 정식화 (D100~D180, 2026-08-08~2026-11-06)
- iOS Lock Screen / macOS Desktop
- Android Material You
- 다음에 볼 신호 + 무엇이 새로워졌나 카드 본격 구현
- ADR-014 Phase 3 — GPU 클러스터 검토

### Phase V2 — 확장 (D180~D365, 2026-11-06~)
- 방법론 v1 공개
- 학계 파트너십
- B2B 엔터프라이즈 확장

---

## 15. Design System & Brand (v1.6 §12 유지 + ADR-010 카피)

기존 디자인 토큰 6축 (색상·타이포·spacing·radius·shadow·motion) 그대로 유지. ADR-010 카피만 모든 surface 통일.

---

## 16. Open Questions (v1.6 유지 + 신규)

### v1.6 Q-1 ~ Q-45 유지

### v1.7 신규

**Q-46: 코인 명칭** — 코인 / 포인트 / 크레딧 / 분석권 — D+7 변호사 자문 후 결정 (ADR-011)
**Q-47: 광고 SDK 선택** — AdMob vs 카카오 애드핏 vs 듀얼 — P0b T-B05 결정
**Q-48: DeepSeek 데이터 주권** — 변호사 자문 (ADR-014) — D+14
**Q-49: Frame Clash 단어 토큰화 모델** — Claude Haiku vs Gemini Flash vs Solar — V0.5 검증
**Q-50: 다음에 볼 신호 데이터 소스** — 국회 API · 한국거래소 공시 · 법원 일정 — V0.5 통합
**Q-51: 매체별 정정 로그 구현** — 신뢰 방어 UX 6개 중 핵심 — V0.5 결정
**Q-52: 카테고리별 차등화 매트릭스 검증** — 7 카테고리 × 분석 카드 — P0a 후 데이터 기반 조정

---

## 17. Appendix

### 17.1 v1.6 → v1.7 비교 매트릭스

| 영역 | v1.6 | v1.7 | 변화 |
|---|---|---|---|
| 포지셔닝 | "한국 언론 분포 가시화" | **"한국 이슈 리스크 OS"** | 시민 인프라 → 업무 인프라 |
| 1순위 페르소나 | 이지훈 (스타트업 PM, 시민) | **김크리에이터 (1인 뉴스레터)** | 시민 → 크리에이터 |
| Pro 가격 | 단일 ₩6,900 | **Free 코인 + Pro $4.99 / Creator $9.99 / Leader $19.99** | 단가 → 사다리 |
| 이념 라벨링 | 1차 surface 4색 분포 | **AI deep mini panel 보조** | 1차 → 보조 |
| AI 분석 | ai_summary 단일 (v1.6.4) → 3-section (v1.6.4) → entity_card + trend (v1.6.5) | + Frame Clash + Timeline + 새로워졌나 + 다음 신호 + 헤드라인 본론 | 4 신규 카드 |
| 검증 지표 | 마케팅 (대기자 100명 등) | **검증 4지표 + Creator KPI** | MAU → conversion |
| LLM 비용 | 미정 | **3-phase + cap $50** (ADR-014) | 통제 모델 |
| 헤드라인 | 원본만 | **+ "📝 본론 보기" 토글** (ADR-013) | 신뢰 강화 |
| 날씨/미세먼지 | 없음 | **헤더 한 줄 + banner** | 위젯 가치 확장 |
| ADR | 8개 | **14개** (+ ADR-009/010/011/013/014) | 결정 가속 |
| 비협상 | 14조 | 14조 + ADR-014 LLM cap | 보강 |
| Harness | 18 (4 실 구현) | **21 후보** (3 신규) | 확장 |

### 17.2 v1.7 정식 발의 체크리스트

- [x] ADR-009 이념 라벨링 보조화
- [x] ADR-010 Issue Risk OS 포지셔닝
- [x] ADR-011 Hybrid Coin + Subscription
- [x] ADR-013 Headline Body Extraction
- [x] ADR-014 Cost-Optimized AI Summary Pipeline
- [x] Vision/Mission 재작성
- [x] 페르소나 5명 재배치 (Creator 1순위)
- [x] 검증 4지표 (MAU 대신)
- [x] Surface 매트릭스 신규 카드 4개 + 헤드라인 본론 + 코인 UI + 날씨
- [x] 한국 법무 위험 매트릭스
- [x] Open Questions Q-46~52
- [x] Release Plan ADR-011/014 매핑

### 17.3 P0w → P0a 인계 매트릭스

| 영역 | P0w 산출 | P0a 진입 |
|---|---|---|
| 시각 검증 | 모든 surface | T-007 실 데이터 swap |
| 계약 검증 | 18 harness catalog (4 실 구현) | Sprint 0 T-001 — 21종 본격 구현 |
| 결제 모델 | ADR-011 발의 + 7 결정 | T-B01 Toss/Stripe + 코인 시스템 |
| AI 모델 | ADR-014 발의 + 3-phase | T-005 Gemini 2.0 Flash + cache + cap |
| RSS 데이터 | mock 15 cluster + 30 outlet | T-006 RSS 워커 + DB 적재 |
| 외부 자문 | Codex/Gemini 프롬프트 작성 (Section A·B·C) | 사용자 답변 수집 + 변호사 자문 발송 |
| 페르소나 검증 | mock + 외부 자문 시뮬레이션 | 콜드 메일 10명 + PoC 1~2건 |

---

## 18. 확정 선언

이 PRD v1.7은 **확정본**이며, 이후 변경은 PRD v1.8 발의와 승인을 거쳐야 한다.

P0a/P0b/V0.5 모든 티켓·하네스·ADR은 본 PRD를 **단일 소스 오브 트루스(Single Source of Truth)** 로 참조한다.

P0w D7 Exit Review (Partial Go) → v1.7 정식 발의 → P0a (T-001 Sprint 0 + T-002 ~ T-007) 진입.

**End of PRD v1.7 — 2026-05-09 (확정)**
