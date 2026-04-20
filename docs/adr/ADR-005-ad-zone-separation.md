# ADR-005: 수익 영역 분리 (Ad Zone Separation)

| 항목 | 내용 |
|---|---|
| 상태 | Accepted |
| 결정일 | 2026-04-21 |
| 결정자 | 태욱 (Founder) |
| 참조 | PRD v1.6 §1.3, §4 P12, §7.1 F-P0w-8, §9.6~9.7, §11.3.1 |
| 대체 | 해당 없음 (v1.6 신규) |

---

## Context

PRD v1.5는 광고 수익을 "초기 모델에서 제외"했다. 근거는 세 가지였다.

- **신뢰 포지셔닝 상충**: "판단하지 않는 중재자"가 광고로 수익을 내면 광고주 관련 이슈 분포 표시에 외부 압력 가능성
- **CPM 경제성 부족**: 초기 트래픽으로 월 $100 미만 예상
- **방법론 공개 원칙(P2)과 긴장**: 광고주 이해관계가 방법론 수정 유혹 유발

v1.6 작성 시점에서 태욱은 **광고·제휴 커머스·프리미엄 구독 세 가지 모두를 수익 모델에 포함**하겠다고 선택했다. 이 선택은 v1.5 원칙과 정면 충돌한다. 그러나 1인 부트스트랩 맥락에서 Pro 구독 + B2B Lite 만으로 초기 현금 흐름을 만드는 것은 현실적으로 6~9개월이 필요하다. 그 기간 동안 서버·인프라·법무 비용을 감당할 수익 다각화가 필요하다.

질문은 **"광고를 수용하면서도 신뢰 포지셔닝을 훼손하지 않는 방법이 있는가?"** 였다.

## Decision

**수익 영역 분리 원칙(Revenue Zone Isolation, P12)을 도입한다.**

모든 수익화 요소(광고·제휴 링크·CPA 배너·프리미엄 upsell)는 **실시간 이슈 위젯 카드 하단의 `<AdZone>` 컴포넌트 내부에서만 렌더**한다. 다음 영역에서는 어떤 형태의 수익 요소도 렌더 금지한다.

- **Coverage Distribution 전체 뷰** (`/cluster/:id`)
- **방법론 페이지** (`/methodology`)
- **이의제기 패널** (`/dispute`, `/cluster/:id/dispute`)
- **외신 비교 페이지** (`/outlet-compare`)
- **OG 카드** (`/cluster/:id/og`)
- **위 영역의 모든 하위 컴포넌트** (`<CoverageBar>`, `<DisputePanel>` 등)

이 원칙은 UI 코드 배치·API 응답 필드·CI 하네스 세 계층에서 동시에 강제된다.

### Implementation Contract

1. **UI 계층**: React 컴포넌트 트리에서 `<AdZone>`·`<AffiliateCard>`·`<SponsoredCard>`는 `<CoverageArea>`·`<MethodologyPage>`·`<DisputePanel>`·`<OutletCompare>`·`<OGCardCanvas>` 하위에 배치 불가. 정적 AST 분석으로 위반 감지.
2. **API 계층**: `/api/v1/widget/top` 응답에만 `ad_allowed: true`, `affiliate_slot`, `ad_slot` 필드 존재. `/api/v1/clusters/:id`·`/api/v1/methodology`·`/api/v1/disputes` 응답은 해당 필드 부재.
3. **Hook 계층**: 클라이언트 `useAdZoneVisibility()` hook이 현재 라우트 체크. 허용 라우트(`/`, `/widget`, `/trends`) 외에서는 `<AdZone>` 자동 숨김.
4. **CI 계층**: `pnpm harness:ad-zone-boundary` 통과 시에만 PR merge. 위반 시 파일 경로 + 라인 번호 출력, exit 1.

### 추가 제외 규칙 (섹션 9.7)

분리 영역 내에서도 다음은 광고·제휴 렌더 금지:
- **정치·선거 카테고리 이슈**: 광고주 중립성 의심 방지
- **표본 부족 이슈** (sample_size < 5): 신뢰 저하 방지

## Consequences

### Positive

- **신뢰 포지셔닝 유지**: Coverage Distribution·방법론·이의제기 영역은 광고 없는 "신뢰 인프라"로 남음. 사용자가 '깊은 분석'으로 진입할수록 상업적 요소가 사라지는 점층적 신뢰 경험
- **수익 다각화 가능**: 실시간 이슈 영역에서만 광고·제휴를 운영해도 월 ₩600,000~1,000,000 추가 수익 기대 (V0.5 기준)
- **CI 자동화로 후퇴 방지**: 코드 리뷰 의존이 아닌 정적 분석으로 원칙 강제. 태욱이 "이번만 예외"로 Coverage에 광고 넣는 실수 불가능
- **외부 커뮤니케이션 간명화**: "Coverage Distribution에는 광고 절대 없음" 한 줄로 신뢰 설명 가능

### Negative

- **개발 복잡도 증가**: `<AdZone>` 배치 계약·`ad_allowed` 필드·Hook·Harness 등 다층 검증 필요
- **수익 상한**: Coverage 영역을 수익화 금지하므로 트래픽 증가 대비 광고 수익 확장성 제한. 구독·B2B·제휴가 주력이 되어야 함
- **컴포넌트 재사용 제약**: 실시간 이슈 카드 컴포넌트가 Coverage 영역에서 재사용될 때 AdZone 자동 제거 로직 필요
- **CI 시간 증가**: 정적 AST 분석 + API 응답 검증으로 CI 30초~1분 추가

### Neutral

- 광고 네트워크 계약 시 "Coverage 영역 광고 불가" 조항 명시 필요 (V1 AdSense 정식 제휴 시점)
- 제휴 파트너(쿠팡파트너스)와의 배너 크기·형식 협상에서 `<AdZone>` 규격 제약 협의 필요

## Alternatives Considered

### Alt-A: 모든 페이지에 광고 허용 (사용자 초기 선택)
- **Pro**: 수익 최대화, 개발 단순
- **Con**: v1.5 신뢰 포지셔닝 전면 포기. 방법론 페이지에 광고가 뜨는 순간 뜬이유의 차별화 상실
- **Reject 이유**: 차별화 소실이 수익보다 큰 기회비용

### Alt-B: 광고 완전 제외 (v1.5 원칙 유지)
- **Pro**: 가장 깨끗한 신뢰 포지셔닝
- **Con**: 6~9개월 Pro/B2B 수익만으로 현금 흐름 위험. 광고 제거는 V2 이후로 미루는 것과 동일
- **Reject 이유**: 1인 부트스트랩 현금 흐름 위험 > 포지셔닝 순도

### Alt-C: 광고 영역 완전 별도 페이지 분리 (`/sponsored-daily`)
- **Pro**: 가장 엄격한 분리
- **Con**: 사용자 유입 동선 왜곡, 광고 수익 효율 하락 (별도 페이지 방문률 낮음)
- **Reject 이유**: 현실적 CTR 하락이 분리 이득을 상쇄

**결론**: **구획(zone) 분리**가 alt-A/B/C의 tradeoff를 가장 잘 균형잡는다.

## Verification

- [ ] `harness/checks/assert-ad-zone-boundary.ts` 작성 (Sprint 0 D7~D10)
- [ ] 고의적 반례 PR: `<AdZone>`을 `/cluster/:id` 페이지에 삽입 → CI fail 확인
- [ ] 고의적 반례 PR: `ad_allowed: true` 필드를 `/api/v1/methodology` 응답에 추가 → CI fail 확인
- [ ] Legal 자문 1차 결과 반영 (Q-45, D+7)
- [ ] Claude Design 의뢰 시 `<AdZone>` 시각적 경계 명세 포함 (Q-41)

## References

- PRD v1.6 §4 P12 수익 영역 분리 원칙
- PRD v1.6 §7.1 F-P0w-8 `<AdZone>` 컴포넌트 + 수동 큐레이션
- PRD v1.6 §11.3.1 `assert-ad-zone-boundary.ts` 하네스 명세
- PRD v1.5 §2.4 광고 수익 초기 제외 근거 (본 ADR에서 재협상)
