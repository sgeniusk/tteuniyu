# ADR-014: Cost-Optimized AI Summary Pipeline (워커-캐시 + 단계적 자체 호스트)

| 항목 | 내용 |
|---|---|
| 상태 | Accepted (v1.7 candidate, P0w Exit 후 정식 채택 예정) |
| 결정일 | 2026-05-04 |
| 결정자 | 태욱 (Founder) |
| 참조 | PRD v1.6 §6 Data Source Strategy, ADR-008 Trend Pipeline, ADR-013 Headline Body Extraction |
| 발의 동기 | 사용자(태욱) 비용 최소화 의지 + AI 요약이 v1.7 핵심 가치인데 단가 폭주 위험 통제 필요 |
| 구현 시작 | P0a (T-005/T-006 워커) → V0.5 (자체 호스트 추가) → V1+ (대규모 자체) |

---

## Context

PRD v1.6 §1.3 Layer 3와 ADR-009/010/013은 모두 **AI 정밀 분석**이 detail 페이지의 핵심 가치라는 결론을 도출. ADR-013(헤드라인 본론 추출)·향후 v1.7의 Frame Clash·다음 신호 카드까지 도입되면 LLM 호출 양이 빠르게 늘어남.

사용자(태욱) 직문:
> "AI 요약이 필요하다면 일단 최대한 저렴하게 사용하기 위해 어떤 방법이 있을까. 맥미니 서버를 활용해서 DB에 계속 정리하고 업하게 만들면 호출만 하게 할 수도 있는 거 아냐? 아니면 제일 저렴한 LLM API로 호출해서 개별로 진행하게끔하는 거야? 각각의 디바이스에서 사용자가?"

핵심 통찰: **사용자별 호출이 아니라 cluster·outlet별 1회 호출 + DB 캐시**가 비용 통제의 결정적 장치. 사용자 디바이스에서 호출 (BYOK) 옵션은 한국 사용자 마찰 + 캐시 불가 + B2B 부적합 — 거부.

---

## Decision

**3단계 진화 모델로 운영. P0a/P0b는 가장 저렴한 클라우드 API + 워커 캐시. V0.5에 맥미니 자체 호스트 부분 도입. V1+에 자체 GPU 인프라.**

### 1. Phase 1 (P0a/P0b — 지금 ~ 3개월) — Gemini 2.0 Flash + 워커 캐시

**모델 선택: Gemini 2.0 Flash**
- 입력 $0.075/1M · 출력 $0.30/1M (2026 시세, 가장 저렴 그룹)
- 한국어 quality 우수
- 데이터 주권 — 미국 회사 (DeepSeek는 중국 → 한국 매체 데이터 외부 ToS 위험으로 보수적 회피)
- API rate limit 충분 (분당 60 RPM 무료 tier, P0a 운영 한도 내 안전)

**대안 retain (정책 변경 시 swap)**:
- DeepSeek V3 — 더 저렴이나 데이터 주권 우려
- Claude Haiku 3.5 — 더 비싸지만 prompt_version 추적·로깅 친화 (P0a 초기에 한해 검토)

**워커 구조** (T-005·T-006와 통합):

```
[Python Worker on Fly.io free tier]
  매 1시간 RSS 수집
        ↓
  새 article마다 LLM 호출 (Gemini 2.0 Flash)
        ↓
  Supabase Cache table에 적재
  - summaries (cluster_id별 ai_analysis JSON)
  - headline_summaries (article별 body_summary, ADR-013)
  - keyword_trends (window별 시계열, ADR-008)
        ↓
[페이지 read]
  /api/v1/clusters/[id], /api/v1/widget/top
  → Supabase SELECT만, LLM 호출 0
        ↓
[브라우저]
  사용자 N명이 와도 비용 동일 (M cluster × outlet × 1일 = M·N 호출 X)
```

**비용 추정 (P0a 안정화 시점)**:

| 항목 | 일 호출 | Gemini 2.0 Flash 월 비용 |
|---|---|---|
| cluster ai_analysis (5단락 × 100 cluster × 1일) | 500 | ~$15 |
| headline body summary (5 outlet × 100 cluster) | 500 | ~$1 |
| keyword_trend interpretation (선택, 월 평균) | 30 | ~$0.5 |
| **합계** | 1,030/일 | **~$17/월** |

→ 월 $50 cap 안에서 안전.

### 2. Phase 2 (V0.5, 결제자 1,000+ 시점) — 맥미니 부분 자체 호스트

**모델 선택**: Solar Pro / Bllossom 70B (한국어 fine-tune 오픈소스) on 맥미니 M4 Pro 48GB

**구조**:
- 맥미니 1대 추가 (₩300만 일회성, 전기료 ₩7k/월)
- 50% 트래픽 자체 호스트 (cluster ai_analysis 같은 큰 호출 우선)
- 나머지 50%는 Gemini 2.0 Flash (burst·새 cluster·실험)
- 기준: 월 API 비용이 맥미니 ROI break-even ($25 × 12개월 < ₩300만 / 12개월) 도달

**언제 swap?** API 비용이 월 $50 초과 + 맥미니 break-even 12개월 안에 들어올 때.

### 3. Phase 3 (V1+, 결제자 5,000+ 시점) — 자체 GPU 인프라

**옵션 A**: 맥미니 클러스터 (3~5대 분산)
**옵션 B**: NVIDIA RTX 4090 또는 RTX 6000 Ada 인스턴스 임대 (RunPod·Lambda Labs)
**옵션 C**: 자체 데이터센터 GPU (V2 이후)

API는 burst·실험·fallback 전용 (월 비용 < $10).

### 4. 캐시 키 + 강제 정책

```typescript
// 모든 LLM 출력은 다음 키로 캐시 (Supabase UPSERT)
{ source_id, article_url, model, prompt_version }
```

- 같은 (article_url, model, prompt_version) → 호출 안 함 (DB hit)
- 모델 변경 (Gemini → Solar) 시 prompt_version bump → 자동 재처리
- prompt_version은 명시적 — CLAUDE.md rule 9 준수

### 5. 비용 cap + 자동 차단

```typescript
// lib/llm/cost-guard.ts
export const MONTHLY_BUDGET_USD = 50

if (currentSpendThisMonth > MONTHLY_BUDGET_USD) {
  // hard stop: skip new LLM calls, log incident, send Slack alert to founder
  return null
}
```

- 워커가 매 호출 전 cost-guard 통과 확인
- 한도 도달 시 새 호출 skip + 기존 캐시 응답
- Slack alert (`SLACK_WEBHOOK_URL` 환경변수) 즉시 발송

### 6. CLAUDE.md rule 9 준수 (Prompt versioning)

모든 LLM 호출은 다음 로깅:
- prompt_version (e.g., 'v1-cluster-summary')
- model (e.g., 'gemini-2.0-flash')
- input_hash (SHA-256 of prompt + input)
- output_hash (SHA-256 of LLM output)
- timestamp
- cost_usd

`llm_call_log` 테이블에 적재 (P0a 신설). audit + cost analytics 양쪽 사용.

---

## Implementation Contract

### DB schema (P0a)

```sql
-- supabase/migrations/00013_llm_call_log.sql
CREATE TABLE llm_call_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version  TEXT NOT NULL,
  model           TEXT NOT NULL,
  input_hash      TEXT NOT NULL,
  output_hash     TEXT NOT NULL,
  input_tokens    INT  NOT NULL,
  output_tokens   INT  NOT NULL,
  cost_usd        DOUBLE PRECISION NOT NULL,
  cache_hit       BOOLEAN NOT NULL DEFAULT FALSE,
  called_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_llm_call_log_cost ON llm_call_log (called_at DESC, cost_usd);
REVOKE ALL ON llm_call_log FROM anon, authenticated;
```

### Cost guard (worker)

```typescript
import { createClient } from '@supabase/supabase-js'

const MONTHLY_BUDGET_USD = 50
const supabase = createClient(/* service_role */)

export async function checkBudget(): Promise<boolean> {
  const { data } = await supabase
    .from('llm_call_log')
    .select('cost_usd')
    .gte('called_at', firstOfMonth())
  const total = (data ?? []).reduce((s, r) => s + r.cost_usd, 0)
  if (total > MONTHLY_BUDGET_USD) {
    await notifySlack(`LLM cost cap hit — ${total.toFixed(2)} USD this month`)
    return false
  }
  return true
}
```

### Harness 후속 (Sprint 0+ 또는 v1.7 patch에 추가)

새 harness `assert-llm-call-logging.ts`:
- 모든 LLM SDK 호출 (Anthropic·Google·OpenAI)이 `llm_call_log` 적재 함수를 거치는지 정적 분석
- 우회 호출 (e.g., `fetch('https://api.openai.com/...')` 직접) 차단

---

## Consequences

### Positive
- **사용자 호출 X 원칙**: cluster·outlet별 1회 호출 → 사용자 100만명 와도 비용 동일
- **cap + alert**: 비용 폭주 자동 차단 (월 $50)
- **단계적 진화**: P0a Gemini → V0.5 맥미니 → V1+ GPU 클러스터, 트래픽 따라 비용 곡선 통제
- **prompt versioning**: CLAUDE.md rule 9 자동 준수
- **데이터 주권 신중**: DeepSeek 회피, Gemini로 시작 → V0.5 자체 호스트로 점진 이동

### Negative
- **모델 quality 제약**: Solar Pro / Bllossom (오픈소스)이 Claude Haiku보다 미세 quality 차이 가능. P0a 일부 cluster에서 비교 검증 필요
- **운영 부담 증가 (Phase 2+)**: 맥미니 24/7 가동 + 모델 업데이트 + 다운타임 대응 자체 책임
- **prompt_version 마이그레이션 비용**: 모델·prompt 바꾸면 캐시 무효화 → 재처리 비용
- **Slack alert 의존**: 비용 cap 도달 시 founder가 즉시 응답 못 하면 일부 사용자 lazy fallback 필요 (분석 카드 "갱신 중" 상태)

### Neutral
- 첫 패키지 (Gemini 2.0 Flash)에 묶여 있다는 인상 — 단 prompt_version 시스템으로 swap이 단일 라인 변경
- Sprint 0 harness `assert-llm-call-logging` 추가는 v1.7 patch 작업

---

## Alternatives Considered

### Alt-A: 사용자 디바이스 호출 (BYOK)
- **Pro**: 우리 비용 0
- **Con**: 사용자 onboarding 마찰 거대 (한국 평균 사용자 API key 미보유), 캐시 불가, B2B 부적합, 보안 위험
- **Reject**: 외부 자문(ChatGPT) + 한국 시장 검증 — 기각

### Alt-B: Claude Haiku 3.5 단일 사용
- **Pro**: prompt versioning·sampling 정교, copy-rate 검증 우수
- **Con**: 월 ~$290 (Gemini의 12배). P0a 결제자 부재 시 부담 큼
- **Reject**: 비용 우선

### Alt-C: 처음부터 자체 호스트 (Phase 2 즉시 진입)
- **Pro**: API 비용 0
- **Con**: P0a 단계에서 quality 검증 부족 + 다운타임 대응 부담 + 일회성 ₩300만 결제자 0 시점에 부담
- **Reject**: 검증 후 단계적 swap이 안전

### Alt-D (선택): Phase 1 Gemini 2.0 Flash + 워커 캐시 → Phase 2 부분 자체 → Phase 3 GPU
- **Pro**: 비용·quality·운영 부담 균형, 단계마다 데이터로 의사결정
- **Con**: 두 시스템 동시 운영 (Phase 2)
- **Selected**: 가장 견고

---

## Verification

### P0a Phase 1
- [ ] `llm_call_log` 테이블 + cost-guard 함수 구현
- [ ] `summaries` / `headline_summaries` / `keyword_trends` 테이블에 cache 키 (article_url, model, prompt_version)
- [ ] 워커 (Python on Fly.io) 매 RSS fetch 후 LLM 호출 + 적재
- [ ] 페이지 응답 LLM 호출 0회 (DB read만)
- [ ] 월 비용 < $25 (안정화 시점)
- [ ] Slack alert 동작 확인 (cap 90% 도달 시)
- [ ] `harness:llm-call-logging` 통과 (Sprint 0 추가)

### P0b 전환 점검
- [ ] 결제자 1,000명 도달 시 맥미니 추가 ROI 계산 (월 API ≥ $25 + 12개월 안 break-even 가능성)

### V0.5 Phase 2
- [ ] 맥미니 + Ollama / LM Studio 가동
- [ ] 50% 트래픽 자체 호스트 swap
- [ ] quality 비교 (Gemini vs Solar Pro/Bllossom) 일부 cluster
- [ ] 다운타임 대응 — fallback to Gemini 2.0 Flash 자동

---

## Open Questions

1. **DeepSeek 데이터 주권**: 변호사 자문 (ADR-011 패키지에 추가) — 한국 매체 데이터 외부 전송이 ToS 위반인가? 만약 안전이면 Gemini 대신 DeepSeek 단가 비교
2. **Claude Haiku 일부 사용?**: copy-rate 정확도 + prompt_version 로깅 친화 — P0a 초기 일부 cluster에 한해 사용 후 비교
3. **맥미니 Apple Silicon GPU 한국어 quality 임계점**: M4 Max + 64GB로 70B 모델 quantized 가동 시 Claude Haiku 대비 quality 갭 — V0.5 검증 필요
4. **prompt 표준화**: 같은 prompt를 Gemini · Solar Pro · Claude Haiku 모두 동일하게 가동 가능? — 시스템 메시지 통일 + 모델별 프롬프트 어댑터 필요할 수도
5. **harness 우회 가능성**: 어떤 개발자가 fetch로 직접 호출하면 logging skip — Sprint 0 `assert-llm-call-logging` 강제 필수

---

## References

- 사용자(태욱) 비용 질문 — 2026-05-04
- 외부 자문 (Gemini + ChatGPT 2026-05-03)
- ADR-008 Trend Pipeline — 같은 워커 + 캐시 + cap 패턴 적용
- ADR-013 Headline Body Extraction — body_summary 캐시 통합
- CLAUDE.md rule 9 — prompt_version 로깅 의무

---

**End of ADR-014 — 2026-05-04**
