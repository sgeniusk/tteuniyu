# P0w Exit Review Checklist

> **시점**: 2026-05-09 (D7 Exit Review)
> **목적**: P0w 단계 종료 + v1.7 PRD 정식 발의 전 게이트
> **결정자**: 태욱 (Founder)
> **참조**: PRD v1.6 §14 P0w Exit Criteria, harness-roadmap-v1.6 §3 P0w Exit Review Gate

---

## 0. P0w 누적 결과 (D0~D7)

### 0.1 PR 누적 (10개)
| # | PR | 핵심 | 상태 |
|---|---|---|---|
| 1 | T-W01 widget MVP + v1.6.1 patch | Top 10 + 60s polling + minute rotation | ✅ merged |
| 2 | T-W02 Creator Embed Script | iframe + widget.js (4KB minified) | ✅ merged |
| 3 | v1.6.2 patch | Category 7-enum + Coverage Bar 위젯에서 숨김 + ↑/NEW trend | ✅ merged |
| 4 | T-W03 Pro/Creator/B2B 폼 | 3 form + waitlist 저장 + email stub | ✅ merged |
| 5 | v1.6.3 patch | mock-rich detail page (15 cluster × 30 outlet) | ✅ merged |
| 6 | v1.6.4 patch | structured AI analysis (subject + why + coverage) | ✅ merged |
| 7 | v1.6.5 patch | card reorder + entity_card + trend sparkline + YouTube Lite Embed | ✅ merged |
| 8 | T-W04 + ADR-009/010/011 | AdZone P12 + 이념 라벨링 보조화 + Issue Risk OS 포지셔닝 + Coin/Subscription 발의 | ✅ merged |
| 9 | ADR-013 + ADR-014 | 헤드라인 본론 + 비용 최적화 LLM 파이프라인 | ⏳ awaiting CI/merge |
| 10 | v1.7 PRD (다음) | 모든 ADR + 페르소나 + 신규 카드 통합 | 📝 발의 예정 |

### 0.2 ADR 누적 (12개)
- ADR-001 ~ 008 (v1.6 확정 시점에 작성)
- **ADR-009** 이념 라벨링 보조화
- **ADR-010** Issue Risk OS 포지셔닝
- **ADR-011** Hybrid Coin + Subscription
- **ADR-013** Headline Body Extraction
- **ADR-014** Cost-Optimized AI Summary Pipeline

### 0.3 Harness 상태 (18종 catalog 기준)
- 실 구현: realtime-naming, widget-contract, ad-zone-boundary, affiliate-link-provenance (4종)
- Placeholder: 14종 (Sprint 0 T-001에서 본격 구현)
- CI 통과율: PR 9개 모두 ~50초 green

### 0.4 코드 자산 (LOC 기준 mock 포함)
- TypeScript/TSX: ~6,500 lines (apps/web 기준)
- ADR 문서: 12개 × 평균 200줄 = ~2,400줄
- PRD 문서: v1.6 + 5 patches = ~3,000줄
- Research: state of the system + external validation prompts = ~1,000줄

---

## 1. PRD v1.6 §14 P0w Exit Criteria

| # | Exit Criterion | 측정 | 결과 | 상태 |
|---|---|---|---|---|
| 1 | 대기자 ≥ 100명 (Pro + Creator + B2B 합산) | 폼 제출 누적 | **0건** (실 트래픽 0) | ❌ 미달 |
| 2 | Pro Preorder 의향 ≥ 20건 (intent ≥ 4) | ProWaitlistForm 제출 + 4점 이상 | **0건** | ❌ 미달 |
| 3 | Creator 대기자 ≥ 10명 | CreatorWaitlistForm 제출 | **0건** | ❌ 미달 |
| 4 | B2B/API 문의 ≥ 3건 | B2BInquiryForm 제출 | **0건** | ❌ 미달 |
| 5 | 광고/제휴 클릭 ≥ 20건 | affiliate_link_clicked + ad_clicked 합산 | **0건** | ❌ 미달 |
| 6 | 분리 영역 광고 누수 0건 | harness:ad-zone-boundary | **0 violations** | ✅ 충족 |
| 7 | 치명적 신뢰·법무 이슈 0건 | 자가 점검 | **없음** | ✅ 충족 |
| 8 | RSS 매체 ≥ 15개 ToS 확인 | sources_whitelist | **0개** (P0a로 이동) | ❌ 미달 |

**Exit Criteria 6개 미달, 2개 충족**.

→ 실 트래픽이 0이라 마케팅 측 지표 6개는 모두 측정 불가. 단 P0w는 **시각·계약·구조 검증 단계**이고, 실 사용자 모집은 P0a/P0b 본격 진행 시점부터.

---

## 2. P0w 실제 달성 (Exit Criteria 외)

PRD v1.6 §14 외 — P0w가 실제로 달성한 것:

| 영역 | 결과 |
|---|---|
| **시각 검증** | /widget Top 10 + AdZone + /cluster/[id] detail (mock-rich) + /embed/iframe 모두 시각 검증 완료 |
| **계약 검증** | Widget API + Cluster API + Embed install API + Affiliate lookup API 모두 Zod-validated, 18종 harness catalog (실 구현 4) |
| **포지셔닝 결정** | "한국 언론 분포 가시화" → "한국 이슈 리스크 OS" (ADR-010) |
| **수익 모델 결정** | 단일 ₩6,900 Pro → Free + Coin + Pro $4.99 / Creator $9.99 / Leader $19.99 (ADR-011) |
| **이념 라벨 결정** | 4색 1차 surface → AI 분석 mini panel 보조 정보 (ADR-009) |
| **외부 자문 종합** | Gemini + ChatGPT (2026-05-03) → 두 AI 합의 5가지 + 차이 4가지 → ADR-009/010/011/013 발의 |
| **AI 비용 모델** | 사용자별 호출 X / 워커 캐시 / Phase별 자체 호스트 (ADR-014) |
| **헤드라인 본론** | 외부 사용자 의견 (clien.net) → ADR-013 발의 |
| **비협상 14조 위반 0건** | 모든 PR 통과 |

---

## 3. P0w Exit Decision Matrix

### Option A: Go (PRD §14 그대로 적용 → No-Go여야 함)
- ❌ Exit Criteria 6개 미달 → No-Go
- 단 마케팅 0인 P0w를 종결시키지 않으면 v1.7 발의 자체가 막힘

### Option B: Partial Go (사용자 모집은 P0a/P0b로 이동, 시각·계약·구조 통과로 Exit 인정)
- ✅ 시각 검증·계약 검증·구조 결정 모두 통과
- ✅ 외부 자문 + ADR-009~014 발의로 v1.7 base 명확
- ⚠ 단 Exit Criteria의 마케팅 지표는 P0a/P0b에서 본격 측정 필요
- → v1.7 발의 가능 + P0a 진행

### Option C: No-Go + PRD §14 수정 발의
- 마케팅 0이라 §14 충족 영영 불가능 → §14 자체가 P0w 본질과 misaligned
- §14 수정 v1.7 patch가 필요

### 사용자(태욱) 결정 후보 (제 권고: Option B)
- v1.7 PRD §11 Success Metrics에 "P0w는 시각·계약·구조 검증, 마케팅 지표는 P0b부터" 명시
- ADR-010 정신과 정합 (시민 캠페인 → 업무 인프라)

---

## 4. P0w 검증 7원칙 (사용자 자가 점검)

다음 7가지를 사용자가 직접 확인 후 v1.7 발의 결정:

1. ✅ **시각 일관성**: /widget · /embed/iframe · /cluster/[id] 디자인 일관
2. ✅ **데이터 일관성**: API 응답 + 페이지 표시가 schema와 일치 (Zod 통과)
3. ✅ **P12 강제**: AdZone family가 /cluster/[id] · /methodology · /dispute · /outlet-compare에 절대 없음 (harness 통과)
4. ✅ **카피 일관성**: "이슈 리스크 OS" + "Creator $9.99" 카피 모든 surface 통일 (ADR-010)
5. ✅ **외부 자문 반영**: Gemini + ChatGPT 답변 → ADR-009/010/011/013/014 발의로 통합
6. ✅ **법무 사전 검토 자료 준비**: ADR-011 §한국 법무 위험 매트릭스 + external-validation-prompts.md Section B → 변호사 자문 발송 가능
7. ✅ **v1.7 발의 base 충분**: state-of-the-system.md + 12 ADR + 6 PRD patches → v1.7 PRD 정식 발의 자료 충분

---

## 5. 결정 권장: Partial Go → v1.7 발의 진행

**근거**:
- 시각·계약·구조 측면 모두 P0w 목표 달성
- 외부 자문 종합 + 사용자 결정으로 ADR-009~014 발의 완료
- 실 트래픽은 P0a 마케팅 시작 시점부터 — Exit Criteria의 마케팅 지표는 본질적으로 P0b 이전 측정 불가
- P0a 진행 + v1.7 발의가 자연 연결
- v1.7 PRD §11 Success Metrics 재정의로 "P0w/P0a/P0b/V0.5 단계별 지표" 명확화

**다음 액션 (D7+1)**:
1. **v1.7 PRD 정식 발의** — 모든 ADR + 페르소나 재배치 + 신규 카드 후보 + 검증 4지표
2. **변호사 자문서 발송** — ADR-011 §법무 위험 매트릭스 + external-validation-prompts §B
3. **외부 콜드 메일 캠페인** — 외부-validation-prompts §A 시뮬레이션 결과 활용 + 실 PR/IR 10명 발송 (사용자 직접)
4. **Sprint 0 T-001 착수** — 18종 harness 본격 구현 + tests + ESLint config + CI lint/test 활성화
5. **P0a T-006 RSS 워커 시작** — RSS 30개 수집 + 클러스터링 + DB 적재 (ADR-008/014 워커 패턴 적용)

---

## 6. P0w Exit Sign-off

```
[ ] 사용자(태욱) Partial Go 결정 확정
[ ] v1.7 PRD 정식 발의 (다음 단계 진행)
[ ] 사용자 외부 자문 발송 의지 (Codex/Gemini Section A·B·C)
[ ] 변호사 자문 발송 (ADR-011 + external-validation Section B)
```

서명: 2026-05-09 D7

---

**End of P0w Exit Review Checklist — 2026-05-09**
