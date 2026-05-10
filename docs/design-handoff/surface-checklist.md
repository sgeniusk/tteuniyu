# 뜬이유 — Surface 체크리스트 (디자이너·QA용)

> **용도**: 디자인 작업 진행 중 화면별 누락 점검 + Trust Tag 색상·자본시장법 고지 표준 일관성 점검
> **참조**: design-brief.md §4 (Surface 인벤토리), §6 (컴포넌트), §8 (비협상)

---

## 0. 사용 방법

각 surface마다 체크박스 채우기. 최종 디자인·코드 합류 시 모든 ✅이 들어가야 합류 가능.

---

## S1. `/widget` — 메인 위젯

### 필수 요소

- [ ] 페이지 헤더 — "🚀 실시간 이슈" 또는 "지금 뜨는 이유" 카피 (네이버 실검 표현 X)
- [ ] Top 10 카드 grid (모바일 1열, 데스크톱 1열 또는 2열)
- [ ] 각 카드 — [Trust Tag (선택)] · 순위·rank trend ↑/NEW · 카테고리 라벨 · 제목 · 매체 dot N개 (회색) · 상대 시간
- [ ] 5위와 6위 사이 `<AdZone>` 슬롯 (광고 가능 영역)
- [ ] 60s 자동 폴링 + 1분마다 회전 인터랙션
- [ ] 카드 클릭 → `/cluster/[id]` 이동
- [ ] 우상단 또는 하단 — "방법론 보기" 링크 → `/methodology`

### 비협상

- [ ] 매체 dot은 모두 slate-400 회색 단일
- [ ] 4분류 라벨 (보수/진보/중도/공영) 텍스트 0건
- [ ] "실시간 검색어", "실검", "Trending Keywords" 표현 0건
- [ ] Trust Tag 색상 — hoax/clickbait → red-600, low_confidence → amber-500
- [ ] 한 카드에 Trust Tag 1개만

### 모바일 (320px-)

- [ ] 카드 1열 grid
- [ ] 카드당 표시 정보 — Trust Tag + 제목 + 매체 dot 3개 + 시간 (헤드라인 색상 변경 X)
- [ ] AdZone 위치 — 5-6위 사이 (배너 형태)

---

## S2. `/cluster/[id]` — 클러스터 디테일

### 필수 요소

- [ ] `[← 돌아가기]` 링크 → `/widget`
- [ ] 헤더 — 카테고리·뜬이유·Issue Risk OS uppercase + 제목 + 표본 N + 갱신시간 + methodology version
- [ ] Trust Tag 슬롯 (헤더 또는 제목 아래)
- [ ] InvestmentWarning (해당 시 — `category=investment`)
- [ ] 📺 영상 뉴스 (선택, YouTube Lite Embed — 썸네일 클릭 시 iframe)
- [ ] 🚀 왜 지금 떴는가 카드 (teal 강조)
- [ ] 📰 매체는 어떻게 다뤘나 카드 (산문, Coverage Bar 없음)
- [ ] 🧠 AI 정밀 분석 카드 — 정체(entity_card) + 흐름(trend sparkline 4 windows)
- [ ] 🔍 Frame Clash 카드 (Pro 차별화, P0a 합류)
- [ ] 🕒 Timeline overlay 카드 (Pro 차별화, P0a 합류)
- [ ] 🆕 무엇이 새로워졌나 카드
- [ ] 📅 다음에 볼 신호 카드
- [ ] 💰 InvestmentImpactCard (해당 시 + Pro+ 게이트)
- [ ] 매체별 보도 list (회색 dot, 매체명, 시간, 헤드라인, ↗)
- [ ] P12 footer — "이 영역에는 광고·제휴·스폰서 카드가 절대 렌더되지 않습니다"

### 비협상

- [ ] AdZone, AffiliateCard, SponsoredCard 컴포넌트 0건 (P12)
- [ ] 매체 dot 모두 slate-400 단일 (4색 X)
- [ ] 매체군 라벨 텍스트 (보수/진보/중도/공영) 0건
- [ ] 헤드라인 색상 — Trust Tag에 따라 hoax/clickbait → red-600, low_confidence → amber-500
- [ ] InvestmentImpactCard 하단 자본시장법 고지 — "본 분석은 공개 보도/공시 요약이며, 매매 권유가 아닙니다"
- [ ] AI 요약 카드 어딘가에 정정 요청 1-click 폼 (위치는 디자이너 결정)

---

## S3. `/embed/iframe?size=...` — 외부 임베드

### 필수 요소

- [ ] 3 size 모두 (small 320×480 / medium 480×600 / large 720×800)
- [ ] Top 5 또는 Top 10 카드 (size에 따라)
- [ ] 각 카드 — Trust Tag + 제목 + 매체 dot + 시간
- [ ] 카드 클릭 → 새 탭 (`target="_blank"`) `/cluster/[id]`
- [ ] 하단 "powered by 뜬이유" 링크 (브랜드 노출)

### 비협상

- [ ] 다크/라이트 테마 자동 적응 (V0.5+ 추가 가능)
- [ ] iframe 내부에 외부 광고 SDK 일체 X
- [ ] 임베드 cookie 자동 설정 X (호스트 사이트 보호)

---

## S4. `/` — 랜딩 (홈)

### 필수 요소

- [ ] Hero — "지금 뜨는 이유" 한 줄 + 부제 + CTA 버튼 ("위젯 보기" → `/widget`)
- [ ] 메인 위젯 미니 프리뷰 (Top 5 카드)
- [ ] 페르소나 3종 카드 — Creator·PR/IR·Researcher (각 가치 한 문장)
- [ ] Pro/Creator/B2B 대기자 폼 콜아웃 3개
- [ ] (선택) 임베드 사용 안내 — Creator를 위한 snippet 예시
- [ ] 푸터 — 방법론·이의제기·외신비교·문의 링크

### 비협상

- [ ] "실시간 검색어" 표현 0건
- [ ] 정치 좌/우 색상 0건
- [ ] AdZone 노출 가능 (Free 사용자 대상 노출 영역)

---

## S5. `/preorder/pro` — Pro 대기자 폼

### 필수 요소

- [ ] 헤더 — "Pro 대기자 등록 — $4.99/월" 또는 "Pro Preorder"
- [ ] 가치 제안 3-5 bullet (Frame Clash·Timeline·Investment 분석 등)
- [ ] 폼 필드
  - [ ] 이메일 (필수)
  - [ ] 사용 케이스 (textarea, 선택)
  - [ ] 의향 점수 (1-5 슬라이더 또는 세그먼트, 필수, 4점 이상이 P0w Exit Criteria)
  - [ ] 월 결제 의향 가격 (slider $0~$15, 선택)
- [ ] 제출 버튼 (primary CTA)
- [ ] 제출 후 — 감사 페이지 또는 inline 메시지

### 비협상

- [ ] PIPA 동의 항목 (수집 목적·보유 기간·동의 거부권) 명시
- [ ] PostHog US 리전 사용 시 §28-8 국외 이전 동의 (변호사 자문 받은 결과 반영)

---

## S6, S7. `/preorder/creator`, `/inquiries/b2b`

### 필수 요소 (S5와 유사)

- [ ] Creator — 도메인·구독자수·콘텐츠 채널·사용 케이스 + 의향
- [ ] B2B — 회사명·산업·인원수·사용 케이스 + 의향

---

## S8. `/methodology` — 방법론 페이지

### 필수 요소

- [ ] 헤더 — "방법론 — 뜬이유는 어떻게 이슈를 추출하나"
- [ ] 데이터 소스 표 (RSS 매체 30개·외부검증·내부신호·LLM 출력 캐시·날씨)
- [ ] 클러스터링 절차 설명
- [ ] LLM 모델 + prompt_version 공개
- [ ] Trust Tag 임계값 (0.7) + 결정 근거
- [ ] 정정 요청 절차 (1-click + 1주 ≥ 3건 자동 제거)

### 비협상

- [ ] AdZone 0건 (P12 격리)
- [ ] 모든 외부 자료 출처 링크 명시

---

## S9. `/dispute`, `/cluster/[id]/dispute` — 이의제기

### 필수 요소

- [ ] 폼 필드 — 매체명, 클러스터 id, 사유 (textarea), 연락처 (이메일)
- [ ] 제출 후 status='open' 자동 부여 (서버 검증)
- [ ] 처리 SLA 표시 (예 "영업일 3일 내 답변")

### 비협상

- [ ] AdZone 0건 (P12)
- [ ] 클라이언트가 status를 임의 설정 X (서버 강제)

---

## S10. `/outlet-compare` — 외신 비교

### 필수 요소

- [ ] 같은 클러스터의 한국 vs 외신 보도 비교 (P0a 합류)
- [ ] 각 매체 row — 회색 dot + 매체명 + 헤드라인 + 출처 링크
- [ ] (선택) Frame Clash 카드 합류

### 비협상

- [ ] AdZone 0건 (P12)
- [ ] 매체 분류 라벨 0건

---

## S11. `/cluster/[id]/og` — OG 카드 (이미지 렌더)

### 필수 요소

- [ ] 1200×630 고정 사이즈
- [ ] Trust Tag 시각 (배지 형태)
- [ ] 제목 (큰 폰트, ≤ 60자)
- [ ] 표본 N + 갱신시간
- [ ] 뜬이유 로고 + URL
- [ ] (선택) 매체 dot 미니 분포

### 비협상

- [ ] AdZone 0건 (P12)
- [ ] 광고 배너 일체 X

---

## S12. `/cluster/[id]/investment` — 투자 분석 (Pro+ 전용)

### 필수 요소

- [ ] 401 (no auth) / 402 (free tier) / 200 (Pro+) 상태별 화면
- [ ] Free 사용자 → "Pro에서 투자 분석 보기" CTA + 가격 안내
- [ ] Pro+ 사용자 → InvestmentImpactCard 4 항목
  - [ ] 관련 종목·자산명 (텍스트만)
  - [ ] 외신 비교 (출처 링크 포함)
  - [ ] 공시·발표 요약
  - [ ] 분석가 의견 요약
- [ ] 카드 상단 — 자본시장법 고지 ("본 정보는 투자 자문이 아닙니다")
- [ ] 카드 하단 — 자세한 고지 ("본 분석은 공개 보도/공시 요약이며, 매매 권유가 아닙니다. 투자의 책임은 본인에게 있습니다.")

### 비협상

- [ ] 가격·시세·차트 일체 X (V0.5+)
- [ ] "예측·추천·전망·매수·매도·목표가" 단어 0건 (LLM output validator)
- [ ] AdZone 0건 (P12)

---

## S13. `/account/coins` — 코인 충전·잔액 (P0b)

### 필수 요소

- [ ] 현재 잔액 (유료/무료 구분)
- [ ] 충전 옵션 (₩1,000 / ₩5,000 / ₩10,000)
- [ ] 사용 내역 (최근 30건)
- [ ] 적립 내역 (광고 시청·앱 열기)
- [ ] 환불 신청 1-click

### 비협상

- [ ] 미성년자 (만 19세 미만) 결제 시 법정대리인 동의 절차 (PG 제공)
- [ ] 자본시장법·게임산업법·청소년보호법 고지 (변호사 자문 결과 반영)

---

## S14. `/account/subscription` — 구독 가입·관리 (P0b)

### 필수 요소

- [ ] 현재 tier 표시 (Free / Pro / Creator / Leader)
- [ ] 다른 tier 비교 표
- [ ] 업그레이드·다운그레이드 1-click
- [ ] 결제 갱신일 + 자동 갱신 토글
- [ ] 자동 갱신 7일 전 알림 채널 설정 (이메일/SMS/푸시)
- [ ] 해지 1-click + 해지 후 잔여 기간 사용 가능 안내

### 비협상

- [ ] 자동전환 동의 (2025-02-14 시행) — 결제 7일 전 알림 의무 (변호사 자문 결과 반영)
- [ ] Trial 없음 (코인이 effective free trial)
- [ ] 잔여 코인 환불 절차 명시

---

## S15. iOS Small Widget (V0.5+, 진입 조건 충족 시)

### 필수 요소

- [ ] 4×4 size — Top 1 카드 (Trust Tag + 제목 + 시간)
- [ ] 4×8 size — Top 3 카드
- [ ] 8×8 size — Top 5 카드
- [ ] 라이트/다크 자동 적응
- [ ] 30분 자동 갱신 (배터리 절약)

### 비협상

- [ ] iOS Small에는 광고 X (Apple ToS)
- [ ] Trust Tag 배지만 (헤드라인 색상 변경 X — 가독성)
- [ ] 진입 조건 — Paid Intent ≥ 4% AND Waitlist ≥ 100 (PostHog API 검증, harness 강제)

---

## 글로벌 일관성 점검

### 색상

- [ ] 모든 surface에서 배경 slate-950 단일
- [ ] 모든 매체 dot slate-400 단일
- [ ] Trust Tag 외 빨강·노랑 색상 사용 0건 (오로지 hoax/clickbait/low_confidence/investment만)
- [ ] teal 강조는 "왜 지금 떴는가" 카드 + primary CTA 버튼만

### 타이포

- [ ] 본문 — Pretendard
- [ ] 수치·코드 — JetBrains Mono
- [ ] 한국어 줄바꿈 — `word-break: keep-all` 적용 (단어 단위)

### 인터랙션

- [ ] 모든 hover transition — `duration-fast` (120ms)
- [ ] 모든 카드 클릭 영역 명확 (`cursor-pointer` + 호버 시 보더 강조)
- [ ] 외부 링크 모두 `target="_blank" rel="noopener noreferrer"`
- [ ] 키보드 내비게이션 (Tab 순서 + Enter 클릭) 정상 동작

### 접근성

- [ ] WCAG AA 명도 대비 4.5:1 (색상 모두)
- [ ] 모든 이미지 `alt` 텍스트 (영상 뉴스 썸네일·OG 카드)
- [ ] 모든 인터랙티브 요소 `aria-label`
- [ ] 스크린리더로 카드 카운트·Trust Tag 읽힘

---

## QA 시나리오 (Persona 기반 walkthrough)

### Scenario A — Creator 5분 워크플로우

1. /widget 열기 → Top 10 스캐닝 가능?
2. 카드 클릭 → 디테일 진입 부드러움?
3. "다음에 볼 신호" 카드 즉시 인지?
4. 외부 링크 클릭 시 별도 탭?

### Scenario B — PR 위기 워크플로우

1. /cluster/[id] 직진 → hoax 배지 0.5초 안에 인지?
2. 매체별 보도 list에서 어느 매체가 hoax인지 명확?
3. 정정 요청 1-click 명확?

### Scenario C — Trader 워크플로우

1. /cluster/[id] (investment 카테고리) → 노란 InvestmentWarning 즉시 인지?
2. Free 사용자 — Pro CTA 명확?
3. Pro 사용자 — 4 항목 정보 밀도 적정?
4. 자본시장법 고지 모든 surface에서 보임?

---

**End of Surface Checklist — 2026-05-09**
