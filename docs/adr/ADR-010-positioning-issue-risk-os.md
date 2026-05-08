# ADR-010: Positioning as "Issue Risk OS" for Creators / Researchers / PR

| 항목 | 내용 |
|---|---|
| 상태 | Accepted (v1.7 candidate, P0w 검토 종료 후 정식 채택 예정) |
| 결정일 | 2026-05-03 |
| 결정자 | 태욱 (Founder) |
| 참조 | PRD v1.6 §1.1 Vision, §1.2 Mission, §3 Personas, 외부 자문 (Gemini + ChatGPT 2026-05-03) |
| 대체 | PRD v1.6 §1.1 "한국 언론의 보도 분포 가시화" 비전 |
| 동반 | ADR-009 (이념 라벨링 보조화), ADR-011 (코인+구독 모델) |
| 구현 시작 | v1.7 patch (모든 카피·메타·OG 카드) |

---

## Context

PRD v1.6은 뜬이유를 "한국 언론의 구조적 편향을 가시화"하는 시민 인프라로 정의했다. 외부 자문 두 가지가 강력 합의:

- **ChatGPT 총평**: "'뉴스 앱'으로 팔면 약하고, '이슈 리스크 OS'로 팔면 가능성 있다. 한국은 네이버·카카오 포털 뉴스가 사실상 무료 공공재로 기능하는 특수 환경. 뉴스 구독 언어로는 설득력 약하다. 흩어진 이슈를 업무용으로 압축하는 서비스여야 한다."
- **Gemini 총평**: "한국에서 ₩6,900을 낼 만한 B2C 사용자는 극히 제한적. 유료 전환은 '시간을 아껴주거나(Time-saving)', '돈을 벌게 해주는(Monetization)' 목적에 집중되어야 한다."

사용자(태욱)는 다음 입장을 명시:
> "이슈 리스크 OS로 하도록 하자. 크리에이터 같은 애들이 소재를 뽑을 수 있게."

→ "크리에이터의 소재 발굴" + "리스크 모니터링" 두 핵심 가치로 포지셔닝 변경. ADR-011의 Creator $9.99 sweet spot tier와 정확히 정합.

---

## Decision

**뜬이유의 포지셔닝을 "한국 이슈 리스크 OS — 크리에이터·연구자·PR을 위한 소재·리스크 인프라"로 재정의한다.**

### 1. 새 핵심 가치 제안 (3 layer)

| Layer | 가치 | 페르소나 |
|---|---|---|
| **소재 발굴** (Source) | 매일 뜨는 이슈를 5초에 파악, 3-section AI 분석으로 콘텐츠 소재 즉시 활용 | 콘텐츠 크리에이터, 뉴스레터 운영자, 유튜버, 블로거 |
| **리스크 모니터링** (Risk) | 자사·산업·키워드 관련 부정 이슈 조기 감지, 매체별 보도 흐름 추적 | IR·홍보·법무·대관 실무자, 위기 관리팀 |
| **연구·검증** (Research) | 이슈의 정체·trend·매체 분포를 연구·논문·보고서·자료에 활용 | 트레이더, 리서처, 연구자, 학생 |

### 2. 카피 변경

**Hero (위젯·홈)**
- 이전: "한국 언론의 실시간 이슈와 보도 분포를 5초에 파악하세요."
- 신: "**한국 이슈 리스크 OS — 5초에 파악, 깊이로 활용.**"

**부제**
- "오늘 뜬 이유 + AI 정밀 분석 + 4-window 흐름 — 소재·리스크·연구를 한 화면에."

**OG 카드**
- 제목: "뜬이유 — 한국 이슈 리스크 OS"
- 부제: "5초에 파악, 5분에 분석, 5초 안에 콘텐츠로."

**메타 description**
- "한국에서 뜬 이슈와 그 이유, 매체별 보도 흐름, AI 정밀 분석을 한 화면에. 크리에이터·홍보·연구자를 위한 소재·리스크 인프라."

**가격 페이지**
- Pro: "광고 없이 매일 10개 깊이로 분석"
- **Creator (강조)**: "콘텐츠 소재 100개/일 + Embed + 워터마크 제거"
- Leader: "무제한 분석 + API + Slack 자동 발송"

### 3. 페르소나 5명 재배치

PRD v1.6 §3의 5 페르소나 우선순위 + 카피 톤 재정렬:

| 순위 | 페르소나 (이름) | 직업 | 핵심 페인 | 우리 가치 |
|---|---|---|---|---|
| 1 | **김크리에이터** | 1인 뉴스레터·유튜버 | 매일 소재 발굴 4시간 소요 | 5초 파악 + AI 분석 → 콘텐츠 30분 작성 |
| 2 | **박홍보** | 스타트업·중견 PR/IR | 자사·산업 이슈 클리핑 + 매체별 보도 흐름 | 키워드 알림 + 매일 8시 리포트 |
| 3 | **이연구** | 정책·법무·대관 실무자, 학계 | 정책 이슈 조기 감지, 시계열 분석 | 6개월·1년 trend + entity_card 출처 |
| 4 | **최트레이더** | 단기·중기 투자자, 퀀트 리서치 | 산업·종목·정책 영향 신호 | 경제 카테고리 + Frame Clash + ticker (V0.5) |
| 5 | **취준생/학생** | 시사 면접·논술·리서치 | 양측 관점 정리, 이슈 요약 | Pay-per-issue $0.99 + Weekly Report |

→ ADR-011 Creator $9.99 = 1순위 페르소나의 sweet spot. tier 가격이 페르소나에 자연 매핑.

### 4. Non-Goals 명시화

뜬이유는 다음을 **표방하지 않는다** (오해 방지):

- ❌ "공정한 언론 평가 도구" (가치 판단 X, ADR-009)
- ❌ "정치적 중립 운동" (정치적 행위 X)
- ❌ "포털 뉴스 대체재" (네이버·카카오 무료 포털 대체 시도 X)
- ❌ "투자 추천" (Frame Clash·trend는 정보 제공, 투자 권유 X)
- ❌ "팩트체크 서비스" (사실/주장 분리는 정보 정리 도구일 뿐)

### 5. 시각·브랜드 변경

- **로고/타이틀**: "뜬이유 — Issue Risk OS" (서브타이틀 추가)
- **색상**: teal 강조 유지 (운영 안정성, "트레이딩 모니터" 톤)
- **폰트**: Pretendard 유지 (한국 사용자 친숙)
- **OG 카드**: "이슈 리스크 OS" 키워드 + Top 3 issue preview

---

## Implementation Contract

### v1.7 patch에 포함될 카피 변경

**`/widget/page.tsx` 헤더**
```diff
- <h1>지금 한국 언론에서 뜨는 이유</h1>
+ <h1>한국 이슈 리스크 OS</h1>
+ <p className="text-body-md">5초에 파악, 5분에 분석, 5초 안에 콘텐츠로.</p>
```

**`apps/web/app/layout.tsx` metadata**
```diff
- title: '뜬이유 — 실시간 이슈'
+ title: '뜬이유 — 한국 이슈 리스크 OS'
- description: '한국 언론의 실시간 이슈와 보도 분포를 5초에 파악하세요.'
+ description: '오늘 뜬 이슈, AI 정밀 분석, 매체별 보도 흐름 — 크리에이터·홍보·연구자를 위한 소재·리스크 인프라.'
```

**`/cluster/[id]` Footer P12 안내문 추가**
```diff
+ <p className="text-body-sm text-slate-500">
+   뜬이유는 가치 판단 도구가 아닙니다. 매체별 보도와 시간 흐름을
+   한 화면에 정리해 콘텐츠·리스크·연구에 활용 가능한 형태로 제공합니다.
+ </p>
```

**`/embed/iframe` Footer**
```diff
- <span>Powered by 뜬이유</span>
+ <span>Powered by 뜬이유 · Issue Risk OS</span>
```

**`PreorderCallouts` 3-up 카드**
```diff
- "개인용 Pro / 크리에이터 Embed / 기업·기관"
+ "개인 Pro $4.99 / Creator $9.99 (소재 100개/일) / Leader $19.99 (무제한 + API)"
```

### 페르소나 재배치 (PRD §3)

PRD v1.7 §3 작성 시:
- 김크리에이터 (1순위) → ADR-011 Creator tier 매핑
- 박홍보 (2순위) → Leader tier 또는 Enterprise 매핑
- 이연구·최트레이더 (3·4순위) → Pro tier 매핑
- 취준생 (5순위) → Pay-per-issue 단건 매핑

---

## Consequences

### Positive

- **카피 일관성**: 모든 surface (헤더·OG·결제·embed)에 "이슈 리스크 OS" 일관 메시지
- **Creator $9.99 sweet spot 자연 정합**: ADR-011 결제 sweet spot이 1순위 페르소나와 정확 매핑 → KPI 명확
- **B2B 페르소나 진입 쉬움**: "리스크 OS" 키워드가 IR·홍보·법무 부서장 의사결정 언어와 매칭
- **외부 자문 두 답변 정합**: ChatGPT "이슈 리스크 OS" + Gemini "콘텐츠 크리에이터 ROI" 모두 흡수
- **ADR-009 (이념 라벨링 보조화)와 정합**: 1차 가치가 "분류"가 아니라 "활용"이 됨

### Negative

- **PRD §1.1 Vision 재작성 부담**: Vision·Mission 둘 다 변경 (시민 인프라 → 업무 인프라)
- **로고·OG 카드·메타 모두 변경**: P0a OG 카드 (T-007) 시작 전 카피 확정 필수
- **시민 페르소나 손실**: 일반 시민이 "공정한 언론 비교"로 사용하던 가치 약화 (단 Free 코인 시스템으로 일부 보존)
- **mock prose 재작성**: `coverage_summary`의 일부 카피가 "시민 정보" 톤이라 "활용 가능성" 톤으로 재작성

### Neutral

- 카피 톤은 더 "B2B SaaS"스러워지지만, 한국 SaaS 시장 표준이고 Free 코인 시스템이 light user 흡수
- "이슈 리스크 OS" 영문 표현 — 한국 사용자에게 친숙한지 검토 필요 (대안: "이슈 관제 OS", "한국 이슈 모니터")

---

## Alternatives Considered

### Alt-A: 기존 "보도 분포 가시화" 시민 인프라 유지
- **Pro**: PRD v1.6 일관성
- **Con**: 두 외부 AI 강력 경고. Pro $6,900 단독 모델로 한국 결제 마찰 극복 어려움
- **Reject**: 외부 자문 무게

### Alt-B: "한국형 Ground News" / "AllSides Korea"
- **Pro**: 해외 모델 친숙
- **Con**: Ground News·AllSides는 미국 양당 정치에 최적화 — 한국 다당·진영 복합 환경에 misfit. 또한 ChatGPT 분석 — "한국은 토론 문화·언론 신뢰가 다름"
- **Reject**: 모방 포지셔닝

### Alt-C: "투자·트레이딩 인텔리전스" (Gemini 1순위)
- **Pro**: ROI 명확
- **Con**: 트레이더 페르소나 churn 위험 큼 (한 번 손실 → 즉시 해지). B2B PR/IR 페르소나 흡수 어려움. 투자 자문법 규제 위험
- **Reject**: 사용자 명시 "크리에이터 소재 발굴" + ChatGPT 1순위 PR/홍보와 충돌

### Alt-D (선택): "이슈 리스크 OS" 우산 + 3-layer 가치 (소재·리스크·연구)
- **Pro**: 사용자 명시 의도 + 두 외부 AI 합의 + ADR-011 Creator KPI 매핑
- **Con**: PRD §1.1 재작성, 카피 일관 변경 필요
- **Selected**: 가장 견고한 정합

---

## Verification

- [ ] PRD v1.7 §1.1 Vision 재작성 (시민 인프라 → 업무 인프라)
- [ ] PRD v1.7 §1.2 Mission 재작성 (가치 판단 → 활용 가능 정보 제공)
- [ ] PRD v1.7 §3 페르소나 5명 재배치 (김크리에이터 1순위)
- [ ] PRD v1.7 §1.4 Non-Goals 5개 명시
- [ ] 모든 페이지 헤더·OG·메타 카피 변경
- [ ] `/widget/page.tsx`, `/cluster/[id]/page.tsx`, `/embed/iframe/page.tsx`, `layout.tsx` 카피 통일
- [ ] `harness:public-copy-wording` + `harness:realtime-naming` 통과
- [ ] `harness:monetization-claims` 통과 — Creator 강조 카피가 false-advertising 아님

---

## Open Questions

1. **"이슈 리스크 OS" 영문 표현 한국 친화도**: "한국 이슈 모니터", "이슈 관제실" 등 한국어 대체 검토 필요?
2. **Frame Clash 카드 도입**: ADR-009와 함께 "🔍 매체간 단어 차이" 카드 → 크리에이터의 "콘텐츠 소재" 가치와 직접 정합. v1.7 patch 채택?
3. **Creator KPI 검증**: Creator $9.99 전환율을 어떻게 측정? (ADR-011 §검증 + 본 ADR §3 페르소나 1순위)
4. **Non-Goal "투자 추천" vs trend·entity_card 가치**: trend·entity_card가 사실상 트레이더 의사결정 정보 — 자문법 위반 위험? 변호사 검토 후 disclaimer 카피 결정.

---

## References

- 외부 자문 — ChatGPT (2026-05-03): "'뉴스 앱'으로 팔면 약하고 '이슈 리스크 OS'로 팔면 가능성 있다"
- 외부 자문 — Gemini (2026-05-03): "콘텐츠 크리에이터·트레이더의 ROI가 명확한 페르소나"
- PRD v1.6 §1.1 Vision (재작성 대상)
- PRD v1.6 §1.2 Mission (재작성 대상)
- PRD v1.6 §3 Personas (재배치)
- ADR-009 (동반): 이념 라벨링 보조화 → 1차 가치가 "활용"이 됨
- ADR-011 (동반): Creator $9.99 sweet spot = 1순위 페르소나와 정확 매핑

---

**End of ADR-010 — 2026-05-03**
