# ADR-009: Ideological Labeling as Auxiliary Information

| 항목 | 내용 |
|---|---|
| 상태 | Accepted (v1.7 candidate, P0w 검토 종료 후 정식 채택 예정) |
| 결정일 | 2026-05-03 |
| 결정자 | 태욱 (Founder) |
| 참조 | PRD v1.6 §1.2 Mission, §12.1 Coverage Distribution, v1.6.2 §C-3, ADR-005 P12, 외부 자문 (Gemini + ChatGPT 2026-05-03) |
| 대체 | PRD v1.6 §1.4 Coverage Distribution을 1차 surface 가치로 정의 |
| 구현 시작 | v1.7 patch (P0w Exit 후) |

---

## Context

PRD v1.6은 "한국 언론의 보도 분포를 시각화"를 핵심 가치로 두고, 4색 진영 분류 (진보 teal / 중도 slate / 보수 amber / 외신 violet)를 위젯·임베드·detail 모두에서 1차 surface로 노출하는 설계였다. v1.6.2 §C-3 patch에서 "위젯·임베드 surface에서는 Coverage Bar 숨김, detail의 politics/society 카테고리에서만 노출"로 일부 후퇴했다.

외부 자문 두 가지가 강력 합의:
- **Gemini**: "한국처럼 정치적으로 극단화된 양극화 사회에서 진영 분류 자체가 정치적 행위로 해석될 위험 — 자신이 지지하는 언론이 '편향되었다'고 분류되는 순간 서비스 자체를 공격함"
- **ChatGPT**: "'진보/중도/보수'라는 단어는 공격받기 쉽다. '매체군 분포', '보도 성향 추정', '기사 내용 판정이 아닌 출처·보도 패턴 기반 분류'로 표현해야 안전"

사용자(태욱)는 다음 입장을 명시:
> "이념 라벨링은 보조적인 거니까... 그냥 AI 분석에서 보여줬으면 해."

이는 PRD v1.6의 "Coverage Distribution을 1차 surface 가치"로 정의한 기존 결정의 근본적 변경이다. **이념 분류는 본문에서 빠지고, AI 정밀 분석 안의 보조 정보로 강등**된다.

---

## Decision

**이념 라벨링(진보/중도/보수/외신 4색 분포)을 모든 1차 surface에서 제거하고, `/cluster/[id]`의 "🧠 AI 정밀 분석" 카드 안의 보조 정보 영역으로 이동한다.**

### 1. 1차 surface에서 제거

| Surface | 변경 전 (v1.6.5) | 변경 후 (v1.7) |
|---|---|---|
| `/widget` Top 10 | Coverage Bar 위젯 카드에서 숨김 (이미) | 변화 없음 |
| `/embed/iframe` | Coverage Bar 숨김 (이미) | 변화 없음 |
| `/cluster/[id]` "📰 매체는 어떻게 다뤘나" 카드 | politics/society일 때 Coverage Bar panel + 4 stat | **Coverage Bar 제거, prose만 표시** |
| `/cluster/[id]` 매체 row 색깔 dot | 4색 stance dot | **단순 회색 dot 또는 outline only** (정치적 라벨 인지 X) |

### 2. 보조 정보로 이동

`/cluster/[id]` "🧠 AI 정밀 분석" 카드 안에 **새 mini panel**:

```
🧠 AI 정밀 분석
   ├─ 정체 (entity_card.definition + domain_facts)
   ├─ AI 흐름 분석 (4-window sparkline)
   └─ 📊 매체 진영 분포 — 보조 정보 (politics/society만)
       └─ Coverage Bar (작은 사이즈) + 4 stat (작은 폰트)
       └─ 안내문: "이 분류는 AllSides·Ad Fontes 공개 매핑 기반의 보조
                  통계입니다. 개별 기사·매체에 대한 가치 판단이 아닙니다."
```

- politics/society 카테고리에서만 mini panel 노출
- 다른 카테고리에서는 mini panel 자체가 없음
- 표본 부족 (sample_quality='insufficient_sample') 시 mini panel 회색 처리 + "분포 형성 중"

### 3. 사안별 동적 라벨 (Optional add-on, V0.5)

장기적으로 ChatGPT가 권장한 "사안별 동적 라벨" 도입 검토:
- 각 사안에 대해 LLM이 양측 핵심 주장을 라벨링 (예: "성장 우선" vs "분배 우선", "시장 친화" vs "규제 친화")
- 4색 고정 분류보다 정확하고 정치적 공격에서 더 안전
- v1.7에 mock UI 후보로 검토, 본격 LLM 통합은 V0.5

### 4. 카피 변경

| 영역 | 변경 전 | 변경 후 |
|---|---|---|
| Vision (PRD §1.1) | "어느 진영의 렌즈로 세상을 보는지 실시간으로 인지" | "어떤 매체군이 어떻게 보도하는지 보조 통계로 참고" |
| Mission (PRD §1.2) | "한국 언론의 구조적 편향을 가시화" | "한국 이슈를 5초에 파악하고 매체별 다양한 보도를 비교" |
| 카드 헤더 | "보도 분포 (Coverage Distribution)" | "📊 매체 진영 분포 (보조 통계)" |
| 4색 stance label | "진보 성향 / 중도·혼합 / 보수 성향 / 외신" | (보조 영역에서만) "매체군 A / 매체군 B / 매체군 C / 외신" |

→ ADR-010 (포지셔닝 "이슈 리스크 OS")과 함께 v1.7 §1.1·1.2 Vision/Mission 전면 재작성.

---

## Implementation Contract

### Schema 변경 (cluster-schemas.ts)

`coverage` 필드는 그대로 유지 (API 응답에 항상 포함). 단:
- `coverage_summary` (prose)는 매체 분포 prose, 진영 단어 직접 사용 회피 (`매체군 A`, `매체군 B`)
- 새 필드 `entity_card`·`trend`처럼 `coverage_aux: { display: boolean, ... }` 추가 검토
- 기본 정책: politics/society일 때만 클라이언트가 mini panel 렌더

### CoverageBar 컴포넌트 변경

```diff
 // CoverageBar.tsx
+ // v1.7: variant='compact' 추가 — mini panel용 작은 사이즈
+ // 기본 크기는 기존 그대로 (V0.5에 다른 시각화로 대체 가능)
```

### IssueCard·EmbedRow 컴포넌트 변경

```diff
- import { STANCE_DOT_CLASS, STANCE_TEXT_CLASS } from '...'
+ // 매체 row의 색깔 dot 제거 또는 단순 회색 dot
```

→ stance 정보는 schema에 유지하되 UI에서 색깔 분류 제거.

### Page 변경 (`/cluster/[id]/page.tsx`)

- `📰 매체는 어떻게 다뤘나` 카드에서 `<CoverageDistributionPanel>` 제거
- `🧠 AI 정밀 분석` 카드 안에 `<AuxiliaryStancePanel>` 추가 (politics/society 조건부)
- 매체별 보도 list의 color dot 제거 (단순 매체명 표시)

---

## Consequences

### Positive

- **정치적 공격 위험 대폭 감소**: 진영 분류가 "보조 통계"로 강등되어 "이 서비스가 우리 매체를 진보로 분류했다"는 공격 약화
- **포지셔닝 명확화**: ADR-010 "이슈 리스크 OS"와 정합 — 분류가 1차 가치가 아니라 "참고 자료"
- **신뢰 방어 UX 자연 강화**: 안내문에 "AllSides·Ad Fontes 매핑", "가치 판단 아님" 명시 가능
- **카테고리 차등화 자유**: politics/society 외 카테고리는 mini panel 자체 없음 → V0.5에 카테고리별 다른 보조 시각화 도입 자유로움

### Negative

- **PRD v1.6 핵심 가치 재정의**: "보도 분포 가시화" → "이슈 분석 + 매체 다양성 보조" 큰 변화
- **시각 임팩트 약화**: 4색 큰 bar가 사라지면 "다양한 시선이 있다"는 즉각 인식 감소
- **차별점 약화 위험**: ChatGPT가 "킬러 차별점 2개 중 하나"로 짚은 신뢰 레이어가 약해짐
- **mock 데이터 작업 부담**: v1.6.5의 `coverage_summary` prose 일부 재작성 필요 (진영 단어 회피)

### Neutral

- API schema의 `coverage` 필드는 유지 → B2B API 사용자(IR·퀀트)는 여전히 raw 데이터 접근 가능
- 매체별 stance 색깔 dot 제거 vs 단순 회색 → 매체 row 시각 구분이 약해짐. 단 매체명 자체로 사용자가 인식 가능

---

## Alternatives Considered

### Alt-A: 4색 분포를 그대로 1차 surface 유지 (현 v1.6.5)
- **Pro**: 변화 비용 0
- **Con**: 두 외부 AI 강력 경고. 정치적 공격 + 신뢰 훼손 위험 큼
- **Reject**: 외부 자문 위험 평가 무게

### Alt-B: "매체군 A/B/C/외신" 단순 명칭화 (이름만 바꿈)
- **Pro**: UX는 그대로, 명칭만 안전화
- **Con**: 색깔과 함께 4색이 그대로 1차 surface → 사용자 인지에 "진영 분류"로 읽힘. 명칭 회피만으로 위험 미해결
- **Reject**: 표면적 변경

### Alt-C: 4색 분포 완전 제거 (보조 정보도 없음)
- **Pro**: 가장 안전
- **Con**: ChatGPT가 "킬러 차별점"으로 짚은 신뢰 레이어 자체 소멸. B2B 가치 약화
- **Reject**: 너무 보수적, B2B 페르소나(IR/퀀트) 가치 손실

### Alt-D (선택): 1차 surface에서 제거 + AI 분석 보조 정보로 이동
- **Pro**: 위험 최소화 + 차별점 보존 + 카테고리별 차등화 유연성
- **Con**: PRD §1.1/1.2 Vision/Mission 재작성, mock 일부 재작업
- **Selected**: 사용자 명시 + 외부 AI 종합 권장 + ADR-010과 정합

---

## Verification

- [ ] `/cluster/[id]` politics 카테고리 페이지 → "📰 매체" 카드에서 Coverage Bar 부재 + "🧠 AI 정밀 분석" 카드 안에 mini panel 표시
- [ ] non-politics/society 카테고리 페이지 → mini panel 자체 없음
- [ ] 매체 row 색깔 dot 제거 시각 확인
- [ ] PRD v1.7 Vision/Mission 카피 변경 반영
- [ ] ADR-010 (포지셔닝)과 일관성 확인 — "이슈 리스크 OS" 카피와 분포 보조화 정합
- [ ] `harness:public-copy-wording` 통과 — 새 카피에서 "편향" "Bias" 없음
- [ ] `coverage_summary` mock 일부 재작성 — 진영 단어 회피, "매체군" 표현 사용

---

## Open Questions

1. **사안별 동적 라벨 도입 시점**: v1.7 mock vs V0.5 LLM 통합 — Frame Clash 카드와 통합 가능?
2. **stance 데이터 백엔드 활용**: API 응답에 `coverage` 유지 → B2B 사용자가 색깔 dot 시각화를 자체 서비스에 만들 수 있는 raw 데이터 노출되는 것? Enterprise tier 한정 권장?
3. **AllSides·Ad Fontes 매핑 사용**: 한국 매체에 대한 매핑이 부재 — 자체 매핑 + "기준" 공개 의무
4. **신뢰도 배지**: ChatGPT 권장 6 방어 UX 중 "신뢰도 배지" — mini panel에 통합?

---

## References

- 외부 자문 — Gemini (2026-05-03): "양극화 사회에서 진영 분류 = 정치적 행위"
- 외부 자문 — ChatGPT (2026-05-03): "'진보/보수' 단어는 오염, '매체군 분포'로 표현"
- PRD v1.6 §1.1 Vision (재작성 대상)
- PRD v1.6 §12.1 Coverage Distribution (보조화)
- v1.6.2 §C-3 (위젯 surface 숨김, 이번 결정으로 detail surface까지 확대)
- ADR-005 P12 Revenue Zone Isolation (정합 유지)
- ADR-010 Positioning as Issue Risk OS (동반 발의)

---

**End of ADR-009 — 2026-05-03**
