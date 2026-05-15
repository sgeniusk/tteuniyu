# Syft AI 벤치마크 — 흡수 가능한 강점 분석 + 구현 plan

> **작성일**: 2026-05-12
> **분석 대상**: [Syft AI](https://syft.ai/ko) — World's First AI-Native News Agent
> **목적**: 뜬 이유에 흡수 가능한 강점을 우선순위·난이도·ROI별로 분류 + 구현 plan
> **결론 — 즉시 발의 ADR 3건 제안 (ADR-017/018/019)**.

---

## 0. 한 페이지 요약

Syft가 **글로벌 정보 컨시어지** (개인 토픽 + 다국어 + 일일 다이제스트 + 자동화)라면, 뜬 이유는 **한국 이슈 의사결정 OS** (Trust Tag + 매체 분포 + 변호사 컴플라이언스). Syft 강점 7가지 중 **3가지 즉시 흡수**, 2가지 V0.5+, 2가지 부적합.

| 우선순위 | 흡수 항목 | 새 ADR | 시점 |
|---|---|---|---|
| **P0** | 일일 이메일 다이제스트 (Pro+) | ADR-017 | P0a 안정화 |
| **P0** | 사용자 정의 키워드 추적 (Creator+) | ADR-018 | P0a 안정화 |
| P1 | 다국어 자동 번역 (외신 → 한국어) | ADR-019 | P0a |
| P2 | TTS 팟캐스트 (다이제스트 → 음성) | V0.5+ ADR-020 (예정) | V0.5+ |
| P2 | Ask 뜬 이유 (대화형 Q&A) | V0.5+ ADR-021 (예정) | V0.5+ |
| ❌ | 글로벌 동적 소싱 | 부적합 — 한국 이슈 한정 |
| ❌ | 의도 학습 알고리즘 | ADR-018에 흡수 |

---

## 1. Syft 강점 7가지 + 뜬 이유 적합성

### 강점 1 — 사용자 정의 채널 (Hyperpersonalization)

**Syft** — "키워드 입력 → 글로벌 소스 자동 큐레이션 → AI 요약". "당신의 의도를 이해" — 단순 키워드 매칭이 아닌 LLM 기반 토픽 추론.

**뜬 이유 적용**.
- ✅ **Creator+ 핵심 차별화** — 매일 5분 안에 콘텐츠 소재 1개 발굴이라는 페르소나 1 (김크리에이터) JTBD에 직결
- 구현 — 사용자가 키워드 등록 → 매일 RSS 워커가 LLM 분류 → 매칭 클러스터만 푸시·이메일
- 비용 영향 — LLM 추가 호출 (사용자별 클러스터 매칭). ADR-014 비용 cap 영향 분석 필요
- 비협상 — 변호사 권고 단어 hard-block 그대로 적용

**→ ADR-018 발의 후보**

### 강점 2 — 일일 다이제스트 (Daily Digest)

**Syft** — 매일 자동 메일/푸시 — "몇 분 안에 최신 상태 유지".

**뜬 이유 적용**.
- ✅ **Pro 차별화 + Creator+ 더 강력** — Free에는 제공 안 하면서 결제 동기 만듦
- 구현 — GHA cron 매일 09:00 KST → 어제 24h Top 10 클러스터 + 사용자 키워드 매칭 → SendGrid HTML 이메일
- Trust Tag 4종 + 매체 분포 + Frame Clash 미니 + deep link
- 비협상 — PIPA 마케팅 수신 동의 분리 (ADR-016 대기자 폼 §5.3 권고)
- 한국 SaaS 표준 — 발신자명 "뜬 이유 <noreply@tteuniyu.com>", 수신거부 footer 필수

**→ ADR-017 발의 후보** (가장 ROI 큼)

### 강점 3 — 다국어 자동 번역

**Syft** — 모든 언어를 모국어로. 외신 1차 자료 접근성↑.

**뜬 이유 적용**.
- ✅ **외신 비교 카드** (이미 Pro 분석 카드 V0.5+ 계획)에 자동 번역 합류
- 구현 — Reuters/AP/BBC/NYT/Bloomberg/Nikkei 6개 외신 RSS 수집 시 LLM 한국어 요약
- 비협상 — 외신 저작권 (변호사 의견서 §2.6) — copy ratio ≤ 15%, 사실관계 중심 재서술
- LLM 비용 — 외신 클러스터별 1회 호출 = ADR-014 워커 캐시에 통합

**→ ADR-019 발의 후보**

### 강점 4 — 자동화 깊이 (End-to-end Automation)

**Syft** — 키워드 → 소싱 → 번역 → 요약 → 배달 전과정 자동.

**뜬 이유 현 상태**.
- ✅ ADR-014 LLM 비용 최적화 파이프라인 (Phase 1-3) 이미 진행 중
- ✅ T-006 P0a Foundation (PR #21~#23) RSS 워커 skeleton 완료
- ⏳ PR #26 임베딩 + 클러스터링, PR #27 LLM 요약 + Trust Signal 진행 예정

→ **이미 흡수 중**. 추가 작업 X.

### 강점 5 — Ask Syft (대화형 인터페이스)

**Syft** — "이 토픽 관련 정책 변화는?" 같은 질문 → LLM 답변.

**뜬 이유 적용**.
- ⚠ **자본시장법·정통망법 회피 어려움** — 변호사 권고 hard-block 40+ 단어를 LLM output에 강제하기 까다로움
- ⚠ Pro+ 유료 가치 강화 가능 — 단 변호사 사전 검토 필수
- V0.5+ 별도 ADR-021 (예정) 발의 후 도입

**→ V0.5+ 보류**

### 강점 6 — Podcast (TTS 변환)

**Syft** — 다이제스트를 음성으로 → 출퇴근 청취.

**뜬 이유 적용**.
- ✅ Korean TTS (Naver Clova / OpenAI TTS / Google) — 출퇴근 retention
- 비용 — 분당 $0.01-0.02, Pro 사용자당 일 5분 = 월 $0.30
- V0.5+ 별도 ADR-020 (예정) 발의 후 도입

**→ V0.5+ 보류**

### 강점 7 — 글로벌 동적 소싱

**Syft** — 매체 whitelist 미리 등록 X, 토픽이 떠오르는 모든 출처 동적 추적.

**뜬 이유 적합성**.
- ❌ **부적합** — 한국 이슈 OS 포지셔닝 (ADR-010). 30개 매체 whitelist + ToS 정합성 (CLAUDE.md rule 7)이 신뢰 brand의 핵심
- ❌ 동적 소싱 = 신뢰도 산정 어려움 + 법무 리스크 ↑

→ **부적합. 의도적 차별화 유지**.

---

## 2. 즉시 발의 ADR 3건 (Detailed)

### ADR-017 — Daily Digest Email (Pro+)

**상태** — 본 문서로 발의, 머지 후 정식 ADR-017 작성 예정.

**Decision** — Pro+ 사용자에게 매일 09:00 KST 자동 이메일 다이제스트 발송.

**왜**.
- Syft 벤치마크 — 일일 다이제스트가 retention 핵심
- Pro/Creator/Leader 차별화 (Free X)
- 변호사 권고 PIPA 마케팅 수신 동의 분리 (ADR-016 §5.3)와 정합

**구현**.
- GHA cron `0 0 * * *` (UTC, KST 09:00) — 또는 맥미니 cron
- Python 워커 새 모듈 `apps/worker/src/tteuniyu_worker/digest.py`
- 어제 24h Top 10 클러스터 + 해당 사용자 키워드 매칭 (ADR-018 합류 시)
- HTML 템플릿 (Pretendard inline + Trust Tag 4종 + 매체 분포 미니 + deep link)
- SendGrid 또는 Resend (한국 도메인 reputation 좋은 곳 검토)
- 발신자 — `noreply@tteuniyu.com` (사용자 도메인 확정 후)
- 수신거부 footer 필수 (정통망법 §50)

**비협상**.
- PIPA 마케팅 수신 동의 (별도 체크박스)
- 만 14세 미만 발송 X (ADR-016)
- Trust Tag UI 라벨 변호사 권고 4종만
- 자본시장법 단어 0건

**비용**.
- SendGrid 무료 — 일 100건 + 월 100,000건 이하 무료
- 또는 Resend $20/월 (월 50,000건)
- Pro+ 사용자 1,000명 × 30일 = 월 30,000건 → 무료 tier 충분

**Pro+ 가치 강화**.
- "매일 5분 안에 한국 이슈 정리" — Creator 페르소나 #1 JTBD 직결

### ADR-018 — Custom Topic Tracking (Creator+)

**Decision** — Creator/Leader 사용자가 키워드 등록 → 해당 클러스터만 푸시·이메일.

**왜**.
- Syft 벤치마크 — Hyperpersonalization이 Pro/Plus 차별화의 핵심
- Creator JTBD — "오늘 다룰 소재 5분 안에" → 키워드 fit 강화
- ROI — 인당 광고 노출 + 결제 전환율 ↑

**구현**.
- Supabase 테이블 신규 — `user_topics` (user_id + keyword + created_at + active)
- 한도 — Pro 5개, Creator 20개, Leader 50개 (Syft Free 10/Plus 100 참고로 조정)
- LLM 워커 — 매 클러스터 생성 시 user_topics와 의미적 유사도 평가 (embedding 기반 cosine similarity ≥ 0.7)
- 매칭 시 — daily digest에 우선 표시 + (V0.5+) push 알림

**비협상**.
- LLM hard-block 40+ 단어가 키워드 입력에도 적용 (사용자가 "삼성전자 매수" 같은 키워드 등록 시 거부 + 안내)
- PIPA 키워드 데이터 보유 13개월 + 사용자 삭제 권한

**비용**.
- 임베딩 — sentence-transformers (ADR-014 Phase 2 맥미니) 무료
- 매칭 계산 — 클러스터당 모든 user_topics와 cosine similarity ≈ O(N) 사용자
- Creator 1,000명 × 평균 10개 키워드 = 10,000 비교 / 클러스터 — 부담 없음

**Pro+ 가치 강화**.
- "내가 추적하는 이슈만 받아보기" — 광범위 정보 피로 해소

### ADR-019 — 외신 자동 번역 (Pro+)

**Decision** — 외신 6매체 (Reuters/AP/BBC/NYT/Bloomberg/Nikkei) RSS 수집 시 LLM 한국어 요약.

**왜**.
- Syft 벤치마크 — 다국어 → 모국어가 Plus 차별화 핵심
- 외신 비교 카드 (PRD v1.7 §7.2) 가치 강화
- Pro+ 차별화 (Free에는 영어 제목만)

**구현**.
- LLM 호출 — 외신 클러스터에만 추가 호출 (한국 매체는 번역 X)
- prompt_version `translate_v1` — 사실관계 중심 한국어 재서술 (≤ 15% copy ratio)
- ADR-014 워커 캐시에 통합 (article_url + model + prompt_version)

**비협상**.
- 변호사 §2.6 외신 저작권 — copy ratio ≤ 15%, 직접 인용 X
- 유료 외신 (AP·Reuters·Bloomberg) — 라이선스 사전 합의 (V0.5+ 검토)
- 무료 외신 (BBC·NYT·Nikkei) — 본 ADR 범위

**비용**.
- 외신 클러스터당 1회 호출 — Gemini 2.0 Flash $0.0001/호출
- 일 100 외신 클러스터 × 30일 = $0.30/월. ADR-014 cap 내

---

## 3. V0.5+ 보류 ADR 2건

### ADR-020 (예정) — TTS 팟캐스트

- 다이제스트 음성 변환
- 출퇴근 청취 retention
- TTS provider 검토 (Naver Clova / Google / OpenAI / 자체 호스트 Bark)
- Pro+ 차별화

### ADR-021 (예정) — Ask 뜬 이유

- 대화형 Q&A 인터페이스
- 자본시장법·정통망법 사전 검토 필수 (변호사)
- LLM hard-block 40+ 단어 강제 + 답변에 출처 의무
- Leader $19.99 차별화 가능

---

## 4. 흡수 우선순위 매트릭스

| ADR | 시점 | 노력 (개발자-주) | 비용 (월) | Pro+ 가치 | retention 영향 |
|---|---|---|---|---|---|
| **ADR-017** Daily Digest | P0a 안정화 | 1주 | $0-20 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **ADR-018** Custom Topic | P0a 안정화 | 2주 | ~$0 (맥미니) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **ADR-019** 외신 번역 | P0a | 1주 | $0.30 | ⭐⭐⭐ | ⭐⭐⭐ |
| ADR-020 TTS Podcast | V0.5+ | 2주 | $5-30 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| ADR-021 Ask 뜬 이유 | V0.5+ | 4주 + 변호사 | $30-100 | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**추천 순서** — ADR-019 (T-006 워커 통합) → ADR-017 (P0a 안정화 첫 PR) → ADR-018 (P0a Exit 직전).

---

## 5. PRD v1.7.3 patch 후보

본 벤치마크 머지 후 발의.

- §9 Monetization Pro+ 가치 재정의 보강
  - Pro $4.99 — Daily Digest (ADR-017)
  - Creator $9.99 — + Custom Topic 20개 (ADR-018) + 외신 자동 번역 (ADR-019)
  - Leader $19.99 — + Ask 뜬 이유 (V0.5+ ADR-021) + Custom Topic 50개

- §11 Success Metrics 보강
  - Daily Digest open rate (Pro+)
  - Custom Topic 등록률 (Creator+)
  - 외신 번역 클릭률

---

## 6. 뜬 이유만의 차별화 (Syft가 못하는 것 — 잊지 말 것)

Syft 벤치마크 진행하면서도 **본 제품의 moat**는 유지·강화.

| 차별화 | 왜 Syft에 없나 | 뜬 이유의 강화 방향 |
|---|---|---|
| Trust Tag 4종 (변호사 권고) | Syft는 글로벌 일반 — 한국 법무 안 봄 | 절대 변경 X. 강화 |
| 매체별 보도 분포 | Syft는 묶어서 요약 | Coverage Distribution 카드로 시각화 |
| 자본시장법 컴플라이언스 | Syft는 미국 기준 | Pro 분석 카드 변호사 사인오프 강화 |
| Creator 페르소나 #1 fit | Syft는 일반 정보 | Frame Clash·Timeline·Next Signals 강화 |
| 한국 RSS 30개 + ToS | Syft는 동적 소싱 | sources_whitelist 정합성 + 정정 요청 flow |

---

## 7. 다음 액션

| # | 액션 | 누가 | 시점 |
|---|---|---|---|
| 1 | 본 문서 PR 머지 | Claude | 즉시 |
| 2 | ADR-019 (외신 번역) — T-006 워커 통합으로 PR #27에 병합 | Claude | T-006 진행 중 |
| 3 | ADR-017 (Daily Digest) 정식 ADR 작성 + 첫 PR | Claude | P0a 진입 후 |
| 4 | ADR-018 (Custom Topic) 정식 ADR 작성 | Claude | ADR-017 합류 후 |
| 5 | PRD v1.7.3 patch — Monetization §9 + Metrics §11 보강 | Claude | ADR-017/018/019 머지 후 |
| 6 | 사용자 — Pro+ 가치 재정의 검토 (Creator $9.99에 맞는 가치 충분한지) | 태욱 | ADR-017 머지 후 |

---

**End of Syft Benchmark — 2026-05-12**
