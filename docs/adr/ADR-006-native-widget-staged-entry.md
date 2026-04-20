# ADR-006: 네이티브 위젯 단계적 진입 조건 (Native Widget Staged Entry)

| 항목 | 내용 |
|---|---|
| 상태 | Accepted |
| 결정일 | 2026-04-21 |
| 결정자 | 태욱 (Founder) |
| 참조 | PRD v1.6 §7.4 F-P0b-11, §10 Native Widget 진입 조건, §11.3.3 |
| 대체 | PRD v1.4 §5.4 "V1 Widget Suite" 일정 기반 방식, PRD v1.5 §9.6 "6개 중 2개" 진입 조건 |

---

## Context

네이티브 위젯 착수 방식은 세 가지 제약 사이에서 결정되어야 한다.

1. **사용자 의도**: 태욱은 iOS/Android 네이티브 위젯을 **P0 스코프에 포함**하길 원한다. 근거는 "홈스크린 5초 소비"가 실시간 이슈 위젯의 JTBD-5 (Discovery)를 완성하는 경로이며, Android 실검 위젯 공백 시장에 대한 선점 기회가 있다는 판단.

2. **v1.5 방어 장치**: v1.5는 네이티브 위젯을 "V1 조건부 (6개 신호 중 2개 달성)"로 연기했다. 근거는 iOS Swift 학습 2~3주 + WidgetKit 숙련 1~2주 + App Store 심사 2~3주 = 최소 5주 기회비용이며, 수익 가설이 검증되기 전 네이티브 투자는 낭비 위험.

3. **현실적 개발 역량**: 1인 창업자로서 동시에 진행 가능한 track은 웹 + 하나의 네이티브 정도. iOS와 Android를 동시에 착수하면 품질·일정 양쪽 위험.

이 셋을 만족하는 중간 지점이 필요했다.

## Decision

**네이티브 위젯을 단계별로, 각 단계마다 다른 진입 조건을 가진 "단계적 조건부 착수"로 전환한다.**

| 단계 | 시점 | 진입 조건 | 미달 시 대응 |
|---|---|---|---|
| iOS Small Widget | **P0b D24-D40** | P0w Exit에서 Paid Intent Rate ≥ 4% AND 대기자 ≥ 100 | Creator Embed·B2B Lite 투자 |
| iOS Medium/Large | V0.5 D40-D100 | iOS Small 설치 ≥ 500 | V0.5 Weekly Report·Affiliate 고도화 |
| Android Small | V0.5 D40-D100 | iOS Small 설치 ≥ 500 | Android PWA 홈스크린 바로가기 대체 |
| Android Medium/Large | V1 D100-D180 | Android Small 설치 ≥ 300 | Android 전략 재검토 |
| macOS Desktop | V1 D100-D180 | iOS Large 설치 ≥ 200 | skip |
| iOS Lock Screen | V1 D100-D180 | MAU 50,000 | skip |

### 핵심 변화점 (v1.5 대비)

- **일정의 앞당김**: v1.5 "V1 조건부 (D+90 이후)" → v1.6 "P0b 조건부 (D+24 이후)". 조기 검증 가능
- **조건 단순화**: v1.5 "6개 신호 중 2개" (B2B·Creator·재방문·공유 등) → v1.6 "2개 지표 동시 충족" (Paid Intent·대기자만)
- **단계 세분화**: v1.5 "Small/Medium/Large 일괄" → v1.6 "Small 우선, Medium/Large는 Small 성과 후"
- **Android 지연**: v1.5 "iOS·Android 동시" → v1.6 "iOS Small 성과 후 Android"

### Harness 강제

`harness/checks/assert-native-widget-entry-condition.ts`:
- PR에 Swift 파일 (`*.swift`, `*.xcodeproj`, `Info.plist`) 포함 탐지
- PostHog Cloud API 호출로 P0w Exit 지표 실시간 조회
- 조건 미달 시 CI fail + PR에 blocking comment
- 환경변수 `POSTHOG_BYPASS=true`로 우회 시 태욱 수동 승인 Slack alert

## Consequences

### Positive

- **사용자 의도 부분 충족**: iOS Small을 P0b 시점에 착수 가능하므로 "P0에 네이티브 위젯 포함" 의사에 근접
- **수익 가설 검증 선행**: P0w D0-D7의 Paid Intent / 대기자 지표로 수익 신호를 먼저 본 뒤 Swift 학습에 투자
- **자원 집중**: iOS Small 1종만 먼저 제출하므로 Swift 학습·심사 대응 부담 최소화
- **실패 fallback 명확**: 조건 미달 시 Swift 작업 skip하고 Creator Embed·B2B 집중으로 자동 피봇
- **단계마다 재평가**: iOS Small 성과가 Medium/Large·Android 착수 가치를 결정

### Negative

- **Swift 학습 기회비용**: P0b 16일 중 실질 개발 가능한 시간이 iOS Small에 투입되면 P0b 고유 과업(Pro 결제·클로즈드 알파) 시간 압박
- **심사 일정 위험**: App Store 심사 2~3주 → P0b D24-D40 내 정식 출시 불확실, TestFlight 내부 배포로 제한될 가능성
- **조건 달성 시뮬레이션 필요**: Paid Intent ≥ 4% + 대기자 ≥ 100이 달성 용이하면 Swift 병행 부담이 큰 역설 발생 (Q-44)
- **Android 지연 부담**: iOS만 먼저 가면 Android 사용자층(한국 시장 70%) 접근 불가 기간 연장

### Neutral

- 조건 상향 조정 가능성: Q-44 해결 후 "Paid Intent ≥ 6% + 대기자 ≥ 200 + 유료 선결제 ≥ 5건" 으로 보수화 가능
- 단계 간 전환 시 재평가 오버헤드: 매 단계 지표 대시보드 확인 필요

## Alternatives Considered

### Alt-A: 사용자 선택 그대로 "P0에 iOS+Android 일괄" (최대 공격적)
- **Pro**: 사용자 의도 완전 충족
- **Con**: Swift + Kotlin 동시 학습 5~8주 + 심사 4~6주 → P0a·P0b 지연 필연, 웹 품질 저하
- **Reject 이유**: 1인 역량 초과, 수익 가설 미검증 상태 투자

### Alt-B: v1.5 원안 유지 "V1 D+90, 6개 신호 2개" (v1.5 보수)
- **Pro**: 가장 안전
- **Con**: D+90까지 네이티브 미착수는 사용자 의도와 거리 큼. Android 실검 공백 시장 선점 기회 놓침
- **Reject 이유**: 사용자 의사 반영 불충분

### Alt-C: iOS만 P0a에 착수 (일정 기반)
- **Pro**: iOS 조기 출시
- **Con**: 수익 가설 검증 없이 Swift 학습 → 기회비용 큰 도박
- **Reject 이유**: "수익 검증 우선(P11)" 원칙 위반

### Alt-D: PWA 홈스크린 바로가기만 (네이티브 완전 회피)
- **Pro**: 추가 학습 없음
- **Con**: iOS Safari PWA 위젯은 지원 부족, Android Chrome은 가능하나 "네이티브 위젯" 경험 아님
- **Reject 이유**: 사용자 의도와 너무 거리 큼. 단, Android 부분은 PWA fallback 수용 (미달 시 대응 명세)

**결론**: **단계적 조건부 착수 (Alt-제시안)**가 공격/보수 사이 최적 균형.

## Verification

- [ ] `harness/checks/assert-native-widget-entry-condition.ts` 작성 (Sprint 0)
- [ ] PostHog API 키 발급 + `POSTHOG_PERSONAL_API_KEY` 환경변수 설정
- [ ] P0w D5 시점 중간 지표 확인 세팅 (P0w 중반 Q-44 결정 근거)
- [ ] 고의적 반례 PR: Swift 파일 추가하되 Paid Intent 0% 상태 → CI fail 확인
- [ ] 고의적 우회 시도: `POSTHOG_BYPASS=true` 설정 → 태욱 Slack 알림 작동 확인
- [ ] iOS WidgetKit 학습 리소스 큐레이션 (Hacking with Swift, Apple Docs)

## Open Questions

- **Q-44**: 조건 숫자 보수성 결정 — D+5 P0w 중반 지표 기반 (이 ADR 상태 영향)
- **iOS Developer Program 계약**: 법인 계정 vs 개인 계정 — 1인 부트스트랩은 개인 계정 권장 (연 $99)
- **App Store 심사 리스크**: 네이버 실검 연상 카피 금지 (섹션 5.1 준수)

## References

- PRD v1.6 §7.4 F-P0b-11 iOS Small Widget (조건부)
- PRD v1.6 §10 Native Widget 단계적 진입 조건 표
- PRD v1.6 §11.3.3 `assert-native-widget-entry-condition.ts`
- PRD v1.5 §9.6 V1 Native Widget 진입 조건 (6개 중 2개) — 본 ADR에서 단순화
- PRD v1.4 §5.4 V1 Widget Features — 일정 기반 접근 (대체됨)
