# 뜬이유 iOS 앱 — 외주 RFP (Request for Proposal)

> **수신**: 외주 iOS 개발자·에이전시
> **발신**: 김태욱 (Founder, sgeniusk@gmail.com)
> **작성일**: 2026-05-11
> **목표**: 동작하는 iOS 앱 + Widget Extension 초기 버전. TestFlight 배포 가능 상태로 인수.
> **인수 후**: 발주자 (+ Claude Code) 가 세부 조절·운영. 본 RFP는 **초기 빌드 1회**만 외주.

---

## 0. 5분 요약 (제안서 작성 전 필독)

### 무엇을 만드는가

**뜬이유 (TTEUN-IYU)** — 한국 이슈 리스크 OS의 iOS 앱 + Widget Extension.

- **앱 본체** — 실시간 이슈 Top 20 카드 + 카드 탭 시 상세 (in-app web view)
- **Widget Extension** — Lock Screen / Home Screen 위젯 (Small / Medium / Large 3종)
- **기존 web API 재활용** — `https://tteuniyu.com/api/v1/widget/top?size=large` (이미 가동 중)

### 무엇을 안 만드는가 (Out of Scope)

- App Store 제출 (발주자 직접)
- 회원가입·로그인·결제 (P0b 이후 별도)
- 푸시 알림 (V0.5+ 이후)
- 광고·제휴 카드 (Apple ToS상 위젯에는 광고 X)
- 분석·트래킹 (PostHog 통합은 V1+)

### 왜 외주

발주자가 Swift 미숙 + 초기 build를 빠르게 받아 발주자 + Claude Code가 이후 운영. 본 RFP는 **컨셉 검증용 초기 build**.

### 통합 책임 분리

본 외주 결과물은 **별도 GitHub repo (`tteuniyu-ios`)** 로 받음. 메인 monorepo (`tteuniyu`)와는 분리. 메인 repo로의 통합은 ADR-006 (Native Widget Staged Entry) 조건 달성 후 별도 작업.

---

## 1. 제품 컨텍스트

### 1.1 정체성

- **브랜드명** — 뜬이유 (한글) / TTEUN-IYU (영문 부가)
- **포지셔닝** — "한국 이슈 리스크 OS" (뉴스 앱 X, 이슈 맥락 도구 O)
- **핵심 카피** — "지금 뜨는 이유 — TOP 20"
- **타겟 사용자** — 콘텐츠 크리에이터·홍보·연구자 (소재·리스크 의사결정 보조)

### 1.2 시각 정체성 (필수 준수)

- **다크 우선 테마** — 배경 `#020617` (slate-950), 카드 `#0f172a/60` (slate-900/60)
- **강조 색** — `#14b8a6` (teal-500)
- **신호 색** (Trust Tag — 변호사 권고 필수 라벨)
  - 빨강 `#dc2626` (red-600) — "검증 필요" / "제목-본문 괴리 가능성"
  - 노랑 `#f59e0b` (amber-500) — "표본 부족" / "기업 관련 이슈"
- **매체 dot** — `#94a3b8` (slate-400) **단일 회색** (4색 분류 절대 금지)
- **폰트** — Pretendard (한글 본문) + JetBrains Mono (수치·코드)

### 1.3 절대 금지 (위반 시 인수 거부)

- 매체 dot에 4색 (보수/진보/중도/공영) 분류 색상 사용 X
- "stance", "ideology", "leaning", "bias", "이념 분류" 등 단어 X (변수명·UI 모두)
- TrustTag UI 라벨에 "검증되지 않은 정보" / "낚시성 제목 가능성" / "보도 출처 부족" / "투자 정보" 사용 X (구버전 라벨)
- 아래 변호사 권고 라벨만 사용 — "검증 필요", "제목-본문 괴리 가능성", "표본 부족", "기업 관련 이슈"
- 위젯 안에 광고·제휴 카드 X (Apple App Store ToS)
- 가격·시세·차트·매수/매도 추천 단어 일체 X (자본시장법 §6 회피)

자세한 내용은 본 문서 §6 "비협상 제약" 참조.

---

## 2. 기술 요구사항

### 2.1 플랫폼

- **iOS 17.0+** (위젯 신기능 활용 — interactive widgets, control widgets는 V0.5+)
- **iPhone only** (iPad 지원은 V1+)
- **Swift 5.9+ + SwiftUI** (UIKit 사용 최소화 — Web View 정도만)
- **Xcode 15.0+** (iOS 17 SDK)

### 2.2 의존성 정책

- **Swift Package Manager 우선** (CocoaPods·Carthage 사용 X)
- **외부 라이브러리 최소화** — 가능하면 Apple SDK만
- 허용된 외부 라이브러리 후보 (협의 가능)
  - Charts (SwiftUI Charts — Apple 기본, OK)
  - Kingfisher (이미지 로딩 — 단 P0 단계에 이미지 거의 없음, 사용 안 해도 됨)
  - 기타 라이브러리는 사전 협의

### 2.3 아키텍처

- **MVVM (Model-View-ViewModel)** — SwiftUI 친화적
- **async/await + Combine** (시점별 자동 갱신)
- **Codable** Swift native (네트워크 응답 디코딩)
- **테스트** — XCTest 단위 테스트 (API 디코딩 + Trust Tag 매핑 + ViewModel 로직)

### 2.4 권장 디렉토리 구조

```
tteuniyu-ios/
├── README.md
├── Tteuniyu.xcodeproj
├── TteuniyuApp/              # 앱 본체 target
│   ├── App.swift
│   ├── Views/
│   │   ├── RisingIssuesView.swift     # 메인 (Top 20)
│   │   ├── ClusterDetailView.swift    # 상세 (in-app web view)
│   │   ├── SettingsView.swift
│   │   └── OnboardingView.swift
│   ├── ViewModels/
│   ├── Models/
│   ├── Services/
│   │   └── APIClient.swift
│   └── Assets.xcassets
├── TteuniyuWidget/           # Widget Extension target
│   ├── TteuniyuWidget.swift  # Widget bundle
│   ├── RisingIssuesProvider.swift
│   ├── Views/
│   │   ├── SmallWidget.swift  # 4×4
│   │   ├── MediumWidget.swift # 4×8
│   │   └── LargeWidget.swift  # 8×8
│   └── Assets.xcassets
├── TteuniyuShared/           # 공유 framework
│   ├── DesignTokens.swift    # color/font/spacing 표준
│   ├── TrustTag.swift        # 라벨 매핑 (변호사 권고)
│   ├── APIClient.swift
│   └── Models.swift
└── TteuniyuTests/            # XCTest
```

### 2.5 빌드·실행

- 인수 시 Xcode 15+에서 `cmd+R`로 시뮬레이터 실행 가능해야 함
- `xcodebuild build` 콜드 빌드 성공
- TestFlight 배포 가능한 상태 (App ID·인증서·Provisioning Profile 별도 발주자 제공)

---

## 3. 화면·기능 명세

### 3.1 Onboarding (3 step, 첫 실행만)

```
[Step 1]
  로고 + "지금 뜨는 이유"
  부제 — "한국 이슈 리스크 OS"
  버튼 — "다음"

[Step 2]
  3 페르소나 카드 (Creator / PR·IR / Researcher)
  버튼 — "다음"

[Step 3]
  위젯 안내 — "홈 화면에 위젯을 추가하면 잠금 화면에서도 확인 가능"
  버튼 — "시작하기" → MainTabView
```

### 3.2 RisingIssuesView (메인, Top 20)

레이아웃 — 디자인 핸드오프 패키지의 Concept C와 시각 일관성 유지 (`docs/design-handoff/design-brief.md` §6 참조 — 별도 첨부).

```
[헤더]
  "뜬이유" (mono teal)  ·  "지금 뜨는 이유 — TOP 20"
  LIVE pulse + 60s countdown (우상단)

[카테고리 탭] (스크롤 가능)
  전체 / 경제 / IT·과학 / 사회 / 국제·정치 / 라이프·문화

[Top 20 카드 list]
  각 카드.
    [rank column 40-44px]
      카테고리 SVG 아이콘 (12px)
      순위 번호 (mono, 17px)
      trend ↑/↓/NEW/—
    [content column]
      제목 (2줄 clamp, hoax/clickbait 시 red-300)
      ●●●● (slate-400 회색 dot 4개) + TrustTag OR "N개 매체" + 시간
  카드 사이 — 4px gap

[AdZone 위치]  ← 위젯/앱 본체에는 노출 X (Apple ToS).
  단 본 앱 내 분리된 web view는 광고 노출 가능.

[푸터]
  TTEUN-IYU · Issue Risk OS  ·  방법론 보기 / 이의제기
```

상호작용.
- 카드 탭 → ClusterDetailView (in-app web view)
- 카테고리 탭 클릭 → 해당 카테고리만 필터링
- pull-to-refresh → API 재호출
- 60초마다 자동 갱신 (background 시 일시정지)

### 3.3 ClusterDetailView (in-app web view)

WKWebView로 `https://tteuniyu.com/cluster/{cluster_id}` 로딩.

- 우상단 "Safari로 열기" 버튼
- 우하단 "공유" 버튼 (UIActivityViewController)
- 좌상단 "← 돌아가기" (NavigationStack pop)
- 외부 링크 클릭 (매체 출처 등) — Safari로 열림 (in-app safari controller)

### 3.4 SettingsView

```
- 위젯 추가 안내 (3-step 가이드 — 홈 화면 길게 누름 → + → 뜬이유)
- 알림 설정 (V0.5+ 이후 — placeholder OK)
- 자동 갱신 주기 (60s 고정 — UI 노출 X 또는 disabled)
- 정보
  - 앱 버전
  - 이용 약관 (web 링크)
  - 개인정보 처리방침 (web 링크 — `https://tteuniyu.com/privacy`)
  - 문의 (mailto:sgeniusk@gmail.com)
```

### 3.5 Tab Bar (옵션)

탭 2개 권장.
1. 🚀 실시간 (RisingIssuesView)
2. ⚙️ 설정 (SettingsView)

OR Onboarding/Settings를 모달로 처리하고 단일 화면 구조도 OK. 협의.

---

## 4. iOS Widget Extension 명세

### 4.1 3개 사이즈

| Size | iOS family | 사용처 | 표시 콘텐츠 |
|---|---|---|---|
| Small | `.systemSmall` (4×4) | Lock Screen / Home Screen | Top 1 카드 (Trust Tag + 제목 1줄 + 매체 dot 3개 + 시간) |
| Medium | `.systemMedium` (4×8) | Home Screen | Top 3 카드 (각 카드 동일 구조, 헤드라인 2줄) |
| Large | `.systemLarge` (8×8) | Home Screen | Top 5 카드 (각 카드 동일 구조, 헤드라인 2줄) |

### 4.2 Timeline Provider

```swift
struct RisingIssuesProvider: TimelineProvider {
    func getTimeline(...) async {
        // 1. API call /api/v1/widget/top?size=small (or medium / large)
        // 2. Decode WidgetResponse
        // 3. Build entries with refresh date = now + 30 minutes
        //    (Apple iOS는 위젯 갱신을 OS가 결정. 30분 권고)
        // 4. .atEnd policy
    }
}
```

### 4.3 위젯 표시 비협상

- **광고·제휴 카드 절대 X** (Apple App Store Review 거절 사유)
- **TrustTag UI 라벨 변호사 권고만 사용**
- **매체 dot slate-400 단일** (4색 X)
- **"실시간 검색어" 단어 X** ("실시간 이슈" 또는 "지금 뜨는 이유"만)
- **자본시장법 표현 차단** — investment 태그도 "기업 관련 이슈"로만 표시

### 4.4 위젯 → 앱 deep link

위젯 카드 탭 → 앱 열림 + 해당 cluster detail 자동 진입.

```
URL scheme: tteuniyu://cluster/{cluster_id}
```

앱 본체에서 `onOpenURL` 처리.

---

## 5. API 명세

### 5.1 베이스 URL

- **Production** — `https://tteuniyu.com/api/v1` (현재 도메인 미확정 시 발주자가 시점에 제공)
- **Staging** — `https://staging.tteuniyu.com/api/v1` (옵션, 발주자 협의)

### 5.2 GET /widget/top

#### Request

```
GET /api/v1/widget/top?size=small|medium|large
Accept: application/json
```

#### Response (size=large 예시 — 20개 클러스터)

```jsonc
{
  "clusters": [
    {
      "cluster_id": "00000000-0000-4000-8000-000000000001",
      "title": "미국 연준 5월 금리 동결 시사",
      "category": "economy",
      "coverage": {
        "progressive": 4,
        "mixed": 6,
        "conservative": 5,
        "foreign": 3
      },
      "sample_quality": "sufficient",
      "trust_tags": ["investment"],          // 0~N개 (UI는 우선순위 1개만)
      "outlets_count": 18,
      "ad_allowed": true,
      "previous_rank": 2,                    // null = 신규 (NEW 배지)
      "updated_at": "2026-05-11T12:34:00Z"
    },
    // ... 19 more
  ],
  "methodology_version": "v0.1-p0w-mock",
  "overall_diversity_index": 0.62,
  "updated_at": "2026-05-11T12:34:00Z"
}
```

#### Trust Tag enum (4개만)

```
"hoax"           → UI label "검증 필요"            (red-600)
"clickbait"      → UI label "제목-본문 괴리 가능성" (red-600)
"low_confidence" → UI label "표본 부족"            (amber-500)
"investment"     → UI label "기업 관련 이슈"        (amber-500, 🏢 prefix)
```

#### Category enum (7개)

```
politics / society / economy / international /
tech_science / culture_sports / lifestyle
```

#### sample_quality enum (3개)

```
insufficient_sample / low_confidence / sufficient
```

### 5.3 GET /clusters/{id} (클러스터 상세)

P0 단계에서 본 RFP의 ClusterDetailView는 web view를 띄우므로 직접 호출 X.
API spec은 `https://github.com/sgeniusk/tteuniyu/blob/main/apps/web/lib/api/cluster-schemas.ts` 참조.

### 5.4 캐시·갱신

- HTTP `Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=30`
- 앱 본체 — 60초 폴링 + pull-to-refresh + foreground 진입 시 갱신
- 위젯 — Timeline 30분 간격 (Apple OS 결정)

### 5.5 인증

P0 단계에서 인증 X. 모든 GET endpoint public.
P0b 이후 결제·구독 시점에 OAuth (Apple Sign-In) 도입 예정 — 본 RFP 범위 외.

---

## 6. 비협상 제약 (변호사 권고 + 비협상 15조)

### 6.1 Trust Tag UI 라벨 (절대 변경 X)

| Internal field | UI 라벨 (변호사 권고) | 색상 |
|---|---|---|
| `hoax` | "검증 필요" | red-600 |
| `clickbait` | "제목-본문 괴리 가능성" | red-600 |
| `low_confidence` | "표본 부족" | amber-500 |
| `investment` | 🏢 "기업 관련 이슈" | amber-500 |

**구버전 라벨** ("검증되지 않은 정보" / "낚시성 제목 가능성" / "보도 출처 부족" / "투자 정보") 절대 사용 X.

Tooltip 표준 — "이 표시는 개별 매체 평가가 아니라 수집된 보도 묶음에 대한 자동 분석 신호입니다."

### 6.2 매체 표시

- **dot 색상** — slate-400 단일 회색만 (4색 분류 X)
- **매체군 라벨** — "보수/진보/중도/공영" 텍스트 표시 X
- **매체명 + 시간 + 헤드라인 + 외부 링크 ↗만**

### 6.3 자본시장법 표현 차단

LLM이 생성한 헤드라인이 다음 단어를 포함하더라도 그대로 표시 (서버에서 이미 hard-block 40+로 차단). iOS 앱에서 추가 필터링은 X. 단 절대 다음 단어로 UI 카피·라벨 만들지 말 것.

```
금지 — 매수, 매도, 보유, 진입, 청산, 비중확대, 비중축소, 손절, 익절,
       물타기, 관망, 목표가, 수익률, 상승 여력, 하락 위험, 급등, 급락,
       반등, 조정, 상방, 하방, 호재, 악재, 저평가, 고평가, 유망,
       모멘텀, 리레이팅, 촉매, 예측, 추천, 전망,
       buy, sell, hold, overweight, underweight, outperform, underperform,
       target price, upside, downside, alpha
```

### 6.4 광고·제휴 절대 노출 X

- **위젯** — 광고 노출 시 Apple App Store Review 거절. 절대 X.
- **앱 본체** — V0.5+ 별도 ADR 발의 후 도입 검토. 본 RFP 범위 외.
- **In-app web view** — `/cluster/[id]` 페이지는 P12 격리 영역이라 web에서도 광고 0건.
- **In-app web view** — `/widget` 페이지에는 web 광고 있음 (앱 안에 노출되어도 OK).

### 6.5 데이터 수집 X

- 사용자 IP·위치·연락처·식별자 수집 X
- 분석 SDK (PostHog 등) 통합 X (V1+ 별도)
- 디바이스 ID·광고 ID 수집 X
- IDFA 사용 X → ATT 프롬프트 X

### 6.6 만 14세 미만 차단

본 RFP 범위에서는 가입·결제 X이라 직접 적용 사항 없음.
App Store age rating은 "12+" 권장 (뉴스 콘텐츠).

---

## 7. 디자인 spec 상세

### 7.1 색상 토큰 (Swift)

```swift
// TteuniyuShared/DesignTokens.swift
extension Color {
    // 베이스
    static let baseBg950 = Color(hex: 0x020617)
    static let baseCard900 = Color(hex: 0x0f172a).opacity(0.6)
    static let baseBorder800 = Color(hex: 0x1e293b)
    static let textPrimary = Color(hex: 0xf8fafc)
    static let textSecondary = Color(hex: 0x94a3b8)
    static let textCaption = Color(hex: 0x64748b)

    // 강조
    static let accentTeal = Color(hex: 0x14b8a6)

    // 신호 (Trust Tag)
    static let trustHoax = Color(hex: 0xdc2626)        // red-600
    static let trustLowConf = Color(hex: 0xf59e0b)     // amber-500
    static let trustHeadlineRed = Color(hex: 0xfca5a5) // red-300 (다크 위 가독성)
    static let trustHeadlineAmber = Color(hex: 0xfde68a) // amber-200

    // 매체 dot — 단일 회색
    static let outletDot = Color(hex: 0x94a3b8)
}
```

### 7.2 타이포그래피

```swift
// TteuniyuShared/DesignTokens.swift
extension Font {
    // Pretendard 한글 본문
    static let displayMD = Font.custom("Pretendard-Bold", size: 28)
    static let headingMD = Font.custom("Pretendard-SemiBold", size: 18)
    static let bodyMD = Font.custom("Pretendard-Regular", size: 14)
    static let bodySM = Font.custom("Pretendard-Regular", size: 12)

    // JetBrains Mono — 수치
    static let monoMD = Font.custom("JetBrainsMono-Bold", size: 16)
    static let monoSM = Font.custom("JetBrainsMono-Medium", size: 11)
}
```

폰트 파일은 발주자가 제공 (Pretendard, JetBrains Mono 모두 OFL 라이선스).

### 7.3 SVG 카테고리 아이콘

7개 카테고리 SVG. 본 RFP에 첨부 (또는 `apps/web/components/CategoryIcon.tsx` 참조 — Swift로 직접 구현).

권장 — `Image(systemName: ...)` 대신 인라인 SwiftUI Path 또는 SVG asset.

### 7.4 Spacing

| Token | 값 | 용도 |
|---|---|---|
| xs | 4 | 카드 내부 gap |
| sm | 8 | 아이콘과 텍스트 사이 |
| md | 16 | 일반 padding |
| lg | 20 | 카드 padding |
| xl | 32 | 섹션 간격 |

### 7.5 Radius

- 작은 배지 — `.cornerRadius(6)`
- 카드 기본 — `.cornerRadius(8)`
- 큰 카드 — `.cornerRadius(12)`

### 7.6 모션

- 카드 호버·선택 — 120ms ease
- modal 등장 — 300ms
- 시계열 등 데이터 변경 — 200ms

---

## 8. Asset 요구사항

| 자산 | 사이즈 | 제공 |
|---|---|---|
| 앱 아이콘 | 1024×1024 (앱), 모든 iOS size | 발주자 (디자이너 외주 진행 중) |
| Launch Screen | App icon + 그라데이션 | 외주개발자 SwiftUI 자체 구현 |
| Pretendard 폰트 | OFL ttf 6 weights | 발주자 제공 |
| JetBrains Mono | OFL ttf 4 weights | 발주자 제공 |
| 카테고리 SVG 7종 | 12px viewBox | 발주자 제공 (`apps/web/components/CategoryIcon.tsx` Swift 변환) |
| 워드마크 텍스트 | "뜬이유" mono teal | 외주개발자 SwiftUI 자체 구현 |
| 스크린샷 (App Store용) | 6.7" / 5.5" 시뮬레이터 | 외주개발자 빌드 + 발주자가 App Store 등록 |

---

## 9. 산출물 형식

### 9.1 코드 인수

- **GitHub repo (private)** — `tteuniyu-ios`
- 발주자가 collaborator 권한 부여
- 모든 작업 PR 기반 (main 브랜치 직접 push 금지)
- 커밋 history는 의미 단위로 (squash/squash-merge OK)

### 9.2 README.md (필수 섹션)

- 프로젝트 개요 (1 단락)
- Xcode 빌드·실행 절차 (cmd+R로 시뮬레이터까지)
- 환경변수 (.xcconfig 파일 위치 + API base URL 변경 방법)
- 위젯 추가 시뮬레이션 절차 (시뮬레이터 위젯 확인)
- 디렉토리 구조
- 알려진 이슈 + V1+ 개선 후보

### 9.3 Xcode project 정합성

- `.xcodeproj` 또는 `.xcworkspace` 모두 OK (단 필요 없으면 .xcodeproj 권장)
- Schemes — `TteuniyuApp`, `TteuniyuWidget`, `TteuniyuTests` 3개
- `xcodebuild build -scheme TteuniyuApp -destination 'generic/platform=iOS Simulator'` 콜드 빌드 성공
- Apple Silicon (M1+) Mac에서 동작 확인

### 9.4 테스트

- XCTest 단위 테스트 ≥ 10개 (API 디코딩 + Trust Tag 매핑 + ViewModel 로직)
- `xcodebuild test -scheme TteuniyuTests` 통과
- 코드 커버리지 ≥ 50% (도전 과제 X, 실용적 가이드)

### 9.5 빌드 산출물

인수 시점에 다음 파일 동봉.
- `Tteuniyu.ipa` (TestFlight 업로드 가능 — 단 발주자 인증서로 재서명 필요할 수 있음)
- App Store Connect Application Loader 스크린샷 동봉
- 6.7" 시뮬레이터 스크린샷 5장 (메인 / 카테고리 필터 / 카드 hover / 위젯 시뮬레이터 / 설정)

---

## 10. 일정 + 비용 협의 가이드

발주자가 제안서 받을 후 협의.

### 10.1 추정 일정 (참고)

| 단계 | 산출물 | 예상 |
|---|---|---|
| Kick-off + 요구사항 검토 | 양측 합의 | D+0 ~ D+2 |
| 앱 본체 (메인 + 상세 + 설정) | 시뮬레이터 동작 | D+10 |
| Widget Extension 3 size | 위젯 시뮬레이터 동작 | D+18 |
| 테스트 + QA | 인수 검증 | D+25 |
| TestFlight 빌드 + 인수 | 최종 산출물 + 문서 | D+30 |

### 10.2 비용 (협의)

본 RFP는 **고정가 견적** 권장. 시급 X. 견적 기준.

- 메인 앱 화면 4종 + ViewModels + APIClient
- Widget Extension 3 size
- 테스트 10건+
- README + 시뮬레이터 스크린샷
- 인수 후 30일 maintenance (버그 fix 한정, 기능 추가 X)

### 10.3 결제 방법

발주자와 직접 협의. 일반적으로 30/40/30 분할 (계약 시 / 중간 데모 / 인수 검증 통과).

---

## 11. Acceptance Criteria

발주자가 인수 시점에 다음 모두 ✅이어야 통과.

### 11.1 빌드·실행

- [ ] Xcode 15+ 에서 `cmd+R`로 시뮬레이터 실행 성공
- [ ] iPhone 15 시뮬레이터 (iOS 17.0)에서 앱 정상 동작
- [ ] iPhone SE 시뮬레이터 (4.7")에서 레이아웃 깨지지 않음
- [ ] 라이트/다크 모드 자동 적응 (다크 우선이지만 라이트 모드에서도 가독성 OK)

### 11.2 기능 동작

- [ ] Onboarding 3 step 정상 진행
- [ ] 메인 화면이 API 호출 + Top 20 카드 grid 렌더
- [ ] 카테고리 탭 클릭 시 필터링 동작
- [ ] 60초마다 자동 갱신 (background 시 일시정지)
- [ ] 카드 탭 → ClusterDetailView (web view) 진입
- [ ] pull-to-refresh 동작
- [ ] 설정 화면 정상 진입

### 11.3 위젯 동작

- [ ] Small / Medium / Large 3 size 모두 시뮬레이터 위젯 갤러리에 표시
- [ ] 각 위젯이 API 호출 + 카드 렌더 (size별 정확한 cluster 수)
- [ ] 위젯 탭 → 앱 열림 + 해당 cluster detail 자동 진입 (deep link)
- [ ] 30분 background refresh 정상 (시뮬레이터 직접 확인 어려움 — 코드 review로 검증)

### 11.4 비협상 검증

- [ ] Trust Tag UI 라벨이 변호사 권고 매핑 정확 (검증 필요/제목-본문 괴리 가능성/표본 부족/기업 관련 이슈)
- [ ] 매체 dot 색상이 slate-400 단일 (4색 분류 X)
- [ ] 위젯에 광고·제휴 카드 0건
- [ ] 자본시장법 금지 단어가 UI 카피·라벨에 0건 (40+ 단어 §6.3)
- [ ] "실시간 검색어" / "실검" / "stance" / "ideology" 변수명·UI 0건

### 11.5 기술 산출물

- [ ] README.md 모든 섹션 채움
- [ ] XCTest 10개 이상 통과
- [ ] `xcodebuild build` 콜드 빌드 성공 (Warning는 최소화)
- [ ] 6.7" 시뮬레이터 스크린샷 5장
- [ ] (선택) `.ipa` 빌드 동봉

---

## 12. 인수 후 통합 방안

발주자 (+ Claude Code) 가 인수 후 진행.

### 12.1 즉시 검증 (Day 0)

- 발주자 로컬 Xcode에서 빌드 + 시뮬레이터 동작 확인
- README 절차 그대로 따라 환경 셋업 가능한지 검증
- Acceptance Criteria 모두 체크

### 12.2 Claude Code 합류 (Day 1+)

- Claude Code 세션을 `tteuniyu-ios` repo 기준으로 시작
- 본 RFP + 메인 monorepo의 `docs/legal/` + `docs/adr/` 컨텍스트 로딩
- 다음 작업 예 (발주자 결정).
  - 디자이너가 별도로 작업한 새 디자인 적용
  - PostHog 분석 통합 (PIPA 동의 flow 포함)
  - 알림 설정 화면 추가
  - Widget interactive 추가 (iOS 17+)

### 12.3 메인 monorepo 통합 (V0.5+)

본 RFP 결과물은 `tteuniyu-ios` 별도 repo 유지.
메인 monorepo (`tteuniyu`)로 통합은 ADR-006 조건 달성 후 별도 PR로 진행.
- ADR-006 — Native Widget 진입 조건 (Paid Intent ≥ 4% AND Waitlist ≥ 100)

### 12.4 App Store 제출 (V0.5+)

발주자 직접 진행. 외주개발자 범위 외.

---

## 13. 커뮤니케이션 + Q&A

### 13.1 채널

- **이메일** — sgeniusk@gmail.com
- **GitHub Issues** — `tteuniyu-ios` repo (계약 후 권한 부여)
- **답변 SLA** — 24시간 (KST 평일)

### 13.2 의사결정 권한

- 발주자 — 모든 의사결정 (디자인·기능·아키텍처 변경)
- 외주개발자 — 코드 수준 결정 권한 (라이브러리 선택·내부 구조 등 — 단 §2.2 의존성 정책 준수)

### 13.3 변경 관리

- 본 RFP 외 추가 기능 요청 → 별도 협의 + 견적 (본 견적에 포함 X)
- 본 RFP 내 기능 수정 → 30일 maintenance 범위 내 처리

---

## 14. 첨부 자료 (별도 파일)

본 RFP와 함께 제공.

| 자료 | 내용 |
|---|---|
| `design-handoff/design-brief.md` | 디자인 토큰·컴포넌트 명세 (web 기준, iOS 변환 참조) |
| `design-handoff/surface-checklist.md` | 화면별 비협상 체크 |
| `apps/web/components/TrustTag.tsx` | TrustTag 매핑 코드 (Swift 직번역 가능) |
| `apps/web/components/CategoryIcon.tsx` | 7 SVG 아이콘 (Swift Path 변환 참조) |
| `apps/web/lib/api/widget-schemas.ts` | API 응답 schema (Codable 모델 변환 참조) |
| `apps/web/components/ConceptCCard.tsx` | 카드 레이아웃 SwiftUI 변환 참조 |

GitHub repo `https://github.com/sgeniusk/tteuniyu` (private) — 계약 후 read 권한 부여.

---

## 15. 사인오프

```
의뢰일 ─ 2026-05-11
의뢰인 ─ 김태욱 (Founder, sgeniusk@gmail.com)
외주개발자 ─ (계약 후 채움)
계약일 ─ (계약 후 채움)
인수 예정일 ─ D+30
인수 채널 ─ GitHub repo private + .ipa 동봉
```

---

## 부록 A — 참고 명령어

### 발주자가 인수 후 검증 시

```bash
# repo 클론
git clone git@github.com:<외주개발자>/tteuniyu-ios.git
cd tteuniyu-ios

# Xcode 빌드
open Tteuniyu.xcodeproj
# cmd+R로 시뮬레이터 실행

# CLI 빌드
xcodebuild build \
  -scheme TteuniyuApp \
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.0'

# 테스트
xcodebuild test \
  -scheme TteuniyuTests \
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.0'
```

---

## 부록 B — Q&A 템플릿

외주개발자가 RFP 정독 후 다음 질문에 답해 제안서 첨부 권장.

```
1. 본 RFP 범위 작업의 추정 일수 + 비용
2. 사용 라이브러리 (SPM 외 추가 필요 여부)
3. 인수 시 .ipa 포함 여부
4. 30일 maintenance 범위 협의 (버그 fix 정의)
5. 디자이너 산출물 (별도 외주 진행 중) 합류 시점에 디자인 변경 가능성
6. App Store Connect 인증서 share 방식
7. 본 RFP에서 불명확한 부분 + 발주자 추가 결정 필요 항목
```

---

**End of iOS App RFP — 2026-05-11**
