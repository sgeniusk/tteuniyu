# 뜬이유 iOS 앱 — Manus AI agent 프롬프트

> **용도**: Manus (manus.im) 채팅창에 RFP 파일 (`ios-app-rfp.md`) 첨부하면서 함께 보낼 프롬프트.
> **사용법**: 아래 "📋 복사할 프롬프트" 영역 그대로 복사 + Manus 채팅에 붙여넣기 + RFP md 파일 첨부.
> **작성일**: 2026-05-11

---

## 📋 복사할 프롬프트 (이 영역만 복사)

```
You are tasked with building the initial version of an iOS app called "뜬이유" (TTEUN-IYU)
— a Korean Issue Risk OS app. I am attaching 14 files total — read them in this order:

  Tier 1 (NON-NEGOTIABLE — start here, in order):
    1. docs/outsourcing/ios-app-rfp.md     ← main spec, read end-to-end first
    2. CLAUDE.md                            ← 15 non-negotiable rules + 70+ banned words
    3. docs/prd-v1.7.md                     ← product identity, personas, design tokens
    4. docs/prd-v1.7.2-patch.md             ← lawyer-mandated changes (Trust Tag labels)
    5. docs/legal/2026-05-10-legal-response-opinion.md  ← lawyer rationale (Korean)

  Tier 2 (DESIGN):
    6. docs/design-handoff/design-brief.md
    7. docs/design-handoff/surface-checklist.md
    8. apps/web/components/ConceptCCard.tsx ← card layout to translate to Swift

  Tier 3 (CODE REFERENCE — translate to Swift):
    9.  apps/web/components/TrustTag.tsx
    10. apps/web/components/CategoryIcon.tsx
    11. apps/web/components/RisingIssuesList.tsx
    12. apps/web/lib/format.ts

  Tier 4 (SCHEMA + POLICY):
    13. apps/web/lib/api/widget-schemas.ts
    14. docs/adr/ADR-006 + ADR-015

═══════════════════════════════════════════════════════════════════════════════
한국어로 작업해도 좋고 영어로 작업해도 좋다. 단 UI 카피·문서·커밋 메시지는 한국어로.

If you cannot find any of the 14 files, STOP and ask me. Do not start without all
Tier 1 files. CLAUDE.md and the lawyer opinion are the most important — they define
what you can and cannot write in UI labels, variable names, or comments.
═══════════════════════════════════════════════════════════════════════════════

## Your Goal

Deliver a working iOS app + Widget Extension that meets ALL acceptance criteria in
the RFP §11. The app must:

1. Build successfully in Xcode 15+ targeting iOS 17.0+
2. Run in iPhone 15 simulator with no crashes
3. Connect to the live API at `https://tteuniyu.vercel.app/api/v1/widget/top?size=large`
   (or whatever URL I give you when you ask) and render Top 20 cards
4. Include 3 widget sizes (Small / Medium / Large) that fetch and render actual data
5. Match the design tokens, Trust Tag labels, and 비협상 제약 in RFP §6

## Critical Non-Negotiables (위반 시 인수 거부)

These are NOT optional. Read RFP §6 carefully.

- **Trust Tag UI labels MUST use the lawyer-mandated mapping**:
  - `hoax` → "검증 필요"
  - `clickbait` → "제목-본문 괴리 가능성"
  - `low_confidence` → "표본 부족"
  - `investment` → 🏢 "기업 관련 이슈"
- **NEVER use** the old labels ("검증되지 않은 정보", "낚시성 제목 가능성",
  "보도 출처 부족", "투자 정보") — these were removed by lawyer recommendation
- **Outlet dot color = single slate-400 only** (no 4-color political classification)
- **NEVER include words** like 매수, 매도, 호재, 악재, 목표가, 예측, 추천, 전망,
  buy, sell, target price, alpha (full 40+ list in RFP §6.3) in any UI copy or label
- **NEVER include ads or affiliate cards in widgets** (Apple App Store ToS violation)
- **NEVER use words** like "stance", "ideology", "leaning", "bias",
  "이념 분류", "보수 매체", "진보 매체" anywhere (variable names, comments, UI)

## Step-by-step Process

1. **Acknowledge the RFP**. Reply with a 1-paragraph summary of what you understood
   the RFP wants, then list any clarifying questions before starting code.

2. **Wait for my answers** to clarifying questions before writing any code.

3. **Set up the Xcode project**:
   - Project name: `Tteuniyu`
   - Bundle ID: `com.tteuniyu.app` (placeholder — I'll change before App Store submit)
   - Targets: `TteuniyuApp`, `TteuniyuWidget`, `TteuniyuTests`
   - Use Swift Package Manager only (no CocoaPods)
   - Include the directory structure shown in RFP §2.4

4. **Build the shared module first** (`TteuniyuShared/`):
   - DesignTokens.swift (color/font/spacing per RFP §7)
   - Models.swift (Codable structs matching API JSON in RFP §5.2)
   - APIClient.swift (async/await URLSession wrapper)
   - TrustTag.swift (the lawyer-mandated label mapping enum)

5. **Build the main app** (`TteuniyuApp/`):
   - Onboarding (3 steps per RFP §3.1)
   - RisingIssuesView (Top 20 list per RFP §3.2 — replicate the Concept C card design)
   - ClusterDetailView (WKWebView wrapper)
   - SettingsView (per RFP §3.4)

6. **Build the widget extension** (`TteuniyuWidget/`):
   - Small / Medium / Large per RFP §4
   - 30-minute timeline refresh
   - Tap-through deep link to app

7. **Write tests** (`TteuniyuTests/`):
   - At least 10 XCTest cases
   - Cover API decoding, Trust Tag mapping, ViewModel logic
   - Run `xcodebuild test` and confirm all pass

8. **Verify against acceptance criteria** in RFP §11. Self-check every checkbox.

9. **Deliver**:
   - Push to a private GitHub repo named `tteuniyu-ios`
   - I will create the repo and add you as a collaborator. Ask me for the repo URL
     when you reach this step
   - Include a complete README.md per RFP §9.2
   - Include 5 simulator screenshots in `docs/screenshots/`
   - Open the first PR with all initial code (no direct push to main)

## Things You Must Ask Me Before Starting

- The current production API base URL (I'll provide one of:
  `https://tteuniyu.com/api/v1` or a Vercel preview URL)
- The Pretendard + JetBrains Mono font files (I'll attach OFL ttf files)
- The 7 SVG category icons (or whether you should hand-translate from
  `apps/web/components/CategoryIcon.tsx` which I'll attach)
- Any Bundle ID you should use (default `com.tteuniyu.app`)

## Things You Should NOT Do Without Asking

- Do not register an Apple Developer account
- Do not generate App Store certificates or provisioning profiles
- Do not submit to App Store
- Do not implement push notifications, in-app purchases, login, or analytics
  (these are out of scope per RFP §0)
- Do not add any analytics SDK (PostHog, Firebase, etc.)
- Do not change the Trust Tag UI labels or category enum without my approval
- Do not add any third-party library beyond Apple SDKs unless you ask first

## When You Are Blocked

If you cannot proceed without information or access, STOP and ask me. Do not
guess or fabricate API responses, certificates, or sample data. Use the
provided live API URL for all data fetching.

## Definition of Done

You are done when ALL items in RFP §11 (Acceptance Criteria) are checked AND
I confirm the deliverables in writing. Until then, the work is in progress.

## Style Notes

- Korean text in UI must use `word-break: keep-all` equivalent (SwiftUI line break)
- Dark theme is the priority; light theme should still be readable but not focus
- Animations: 120ms ease for hover, 200ms for data updates
- All API calls must include `User-Agent: Tteuniyu-iOS/0.1.0`
- All API calls must respect `Cache-Control` from server (60s)
- Use SwiftUI Charts only if needed — prefer text + simple shapes for P0

## Final Deliverable Checklist

Before you say "done", confirm you have:

- [ ] Pushed initial commit to `tteuniyu-ios` GitHub repo
- [ ] Opened the first PR with all initial code (not pushed directly to main)
- [ ] README.md complete with build instructions
- [ ] `xcodebuild build` succeeds (cold build)
- [ ] `xcodebuild test` passes (10+ test cases)
- [ ] 5 simulator screenshots in repo
- [ ] All RFP §11 acceptance criteria checkboxes verified ✅
- [ ] Trust Tag UI labels match the lawyer-mandated 4 only (no old labels)
- [ ] Outlet dot is single slate-400 (no 4-color)
- [ ] No banned words in UI/code/comments

Ready? Read `ios-app-rfp.md` end-to-end first, then send me your acknowledgment
+ clarifying questions. Do NOT start coding until I answer your questions.
```

---

## 사용 절차 (사용자용)

### 1. Manus 접속

https://manus.im 에 로그인.

### 2. 새 task 시작

채팅 입력창에 위 "📋 복사할 프롬프트" 영역 전체를 복사해서 붙여넣기.

### 3. 파일 첨부 (총 14개, Tier 분류)

다음 파일을 task에 첨부. **Tier 1은 절대 빠지면 안 됨** — Manus가 비협상 위반할 위험이 매우 높아짐.

#### Tier 1 — 필수 (5개)

| # | 파일 | 왜 필수 |
|---|---|---|
| 1 | `docs/outsourcing/ios-app-rfp.md` | 메인 spec — 모든 작업의 기준 |
| 2 | `CLAUDE.md` | **비협상 15조 + Naming Ban 70+ 단어** — 위반 시 인수 거부 |
| 3 | `docs/prd-v1.7.md` (590줄) | 제품 정체성·페르소나·디자인 토큰 §15 |
| 4 | `docs/prd-v1.7.2-patch.md` (374줄) | 변호사 권고 종합 — Trust Tag 라벨 변경 + Pro+ 가치 재정의 |
| 5 | `docs/legal/2026-05-10-legal-response-opinion.md` (740줄) | 변호사 의견서 원본 — 왜 그 라벨/금지 단어인지 근거 |

#### Tier 2 — 디자인 (3개)

| # | 파일 | 왜 |
|---|---|---|
| 6 | `docs/design-handoff/design-brief.md` | 디자인 토큰·컴포넌트 명세 |
| 7 | `docs/design-handoff/surface-checklist.md` | 화면별 비협상 체크 |
| 8 | `apps/web/components/ConceptCCard.tsx` | Concept C 카드 레이아웃 (Swift 직번역 reference) |

#### Tier 3 — 구현 reference (4개)

| # | 파일 | 왜 |
|---|---|---|
| 9 | `apps/web/components/TrustTag.tsx` | 라벨 매핑 코드 (Swift TrustTag.swift 직번역) |
| 10 | `apps/web/components/CategoryIcon.tsx` | 7-enum SVG 아이콘 (Swift Path 변환 reference) |
| 11 | `apps/web/components/RisingIssuesList.tsx` | 60s polling + AdZone 위치 + grid 패턴 |
| 12 | `apps/web/lib/format.ts` | 한국어 시간 포맷 (`relativeTime` 등 — Swift DateFormatter 참고) |

#### Tier 4 — schema + 정책 (2개)

| # | 파일 | 왜 |
|---|---|---|
| 13 | `apps/web/lib/api/widget-schemas.ts` | API 응답 schema (Swift Codable 변환) |
| 14 | `docs/adr/ADR-006-native-widget-staged-entry.md` + `docs/adr/ADR-015-trust-signal-and-investment-risk-layer.md` | iOS 진입 조건 + Trust Signal full spec (Amendment 2 포함) |

#### 첨부 절차

- **public repo 또는 read 권한 share** — Manus가 GitHub URL fetch 가능
  - 본 패키지는 `https://github.com/sgeniusk/tteuniyu`에 공개됨 (PR #24 머지 후)
  - Manus 채팅에 GitHub 파일 URL 14개 붙여넣기로 대체 가능
- **private repo + 첨부** — 14개 파일을 zip으로 묶어서 Manus에 직접 첨부

#### 첨부 안 한 파일 (의도적 제외)

| 파일 | 제외 이유 |
|---|---|
| `apps/web/lib/api/cluster-schemas.ts` | ClusterDetailView가 native 구현 시 필요. 현 RFP는 WKWebView이라 X |
| `apps/web/components/AdZone.tsx` | iOS 위젯에 광고 X (Apple ToS) — P12 패턴 알 필요 적음 |
| `apps/web/components/IssueCard.tsx` | ConceptCCard (Concept C) 하나로 충분 |
| `docs/privacy-policy-draft.md` | Settings 링크는 web URL로만 (`https://tteuniyu.com/privacy`) |

### 4. Manus 응답 기다리기

Manus가 RFP 정독 후 다음 중 하나로 응답.

- 명확한 질문 list 제시 → 답변 후 진행
- 즉시 작업 시작 → 잘못된 가정으로 진행 가능, **답변하지 말고 "STOP. Ask questions first per the prompt."로 차단**

### 5. 사용자가 답변할 질문 (예상)

| 질문 | 답변 가이드 |
|---|---|
| API URL | `https://tteuniyu.vercel.app/api/v1` (또는 staging 환경 결정 후) |
| 폰트 파일 | Pretendard ttf 6 weights + JetBrains Mono ttf 4 weights를 첨부 |
| SVG 아이콘 | `CategoryIcon.tsx` 첨부 + "Swift Path 또는 SVG asset로 변환" |
| Bundle ID | `com.tteuniyu.app` (placeholder, App Store 제출 전 변경) |
| 디자인 시안 | RFP §7 디자인 토큰 + Concept C HTML (`/widget` 페이지 스크린샷) 참조 |

### 6. Manus가 코드 생성 시작 후

- 매 단계마다 PR 형태로 산출물 받기
- 비협상 위반 (Trust Tag 라벨·매체 dot 색·금지 단어) 즉시 차단
- 진행 상황 1일 1회 확인

### 7. 완료 시점

- `tteuniyu-ios` GitHub repo private에 PR 들어옴 → 사용자가 collaborator 추가
- 로컬 Xcode에서 빌드 + 시뮬레이터 동작 확인
- Acceptance Criteria 25 체크박스 검증
- Claude Code 합류 (사용자가 새 세션 시작 — `tteuniyu-ios` 디렉토리에서)

---

## 주의사항

### Manus 한계

- Manus는 Apple Developer Program 인증·서명 X (계정 정보 절대 공유 X)
- Xcode를 직접 실행해서 시뮬레이터를 켜는 건 사용자 환경에서만 가능 (Manus는 Linux 환경)
- 시뮬레이터 스크린샷은 Manus가 못 찍음 → "스크린샷은 사용자가 인수 후 시뮬레이터에서 촬영"으로 합의
- 위젯 30분 background refresh는 Manus가 코드 검증만 가능, 실 동작은 사용자가 검증

### Manus 강점

- RFP 정독 + Q&A 후 일관된 코드베이스 생성
- Codable + SwiftUI + WidgetKit 보일러플레이트 빠르게 작성
- 테스트 자동 생성
- README 자동 작성

### 비용·시간

- Manus는 사용량 기반 과금 (정확한 가격은 manus.im 확인)
- 본 RFP 규모는 Manus 크레딧 ~30~80 단위 추정 (대규모 task)
- 실제 코드 작성 시간은 24~72 시간 추정 (Manus background task)

---

## 변경 사항 추적

본 프롬프트나 RFP를 수정하면 Manus에게 다시 보내야 함. 현재 버전 — `2026-05-11-v1`.

수정 시 commit 후 GitHub URL을 Manus에게 다시 전달.

---

**End of Manus Prompt — 2026-05-11**
