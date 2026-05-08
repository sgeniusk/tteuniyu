# ADR-013: Headline Body Extraction (낚시성 헤드라인 → 본론 요약 토글)

| 항목 | 내용 |
|---|---|
| 상태 | Accepted (v1.7 candidate, P0w Exit 후 정식 채택 예정) |
| 결정일 | 2026-05-04 |
| 결정자 | 태욱 (Founder) |
| 참조 | PRD v1.6 §1.3 Layer 3, ADR-009 (이념 라벨링 보조화), ADR-010 (Issue Risk OS), ADR-014 (cost-optimized pipeline) |
| 발의 동기 | 외부 사용자 의견 (clien.net 게시물 — 낚시 제목 변경 아이디어 2026-05-04) + 사용자(태욱) 채택 의지 |
| 구현 시작 | v1.7 patch (mock UX) → P0a (Claude Haiku 또는 ADR-014 결정 모델로 swap) |

---

## Context

T-W04 작업 중 사용자가 외부 게시물(clien.net 19187041)을 소개. 핵심 아이디어는 "낚시 제목"을 본론 요약으로 변환하는 기능. 우리 detail 페이지의 "📰 매체별 보도 list"에서 자극적·낚시성 헤드라인이 그대로 노출되면 ADR-010 "이슈 리스크 OS" 포지셔닝 (정확한 정보 활용)과 약간의 긴장 발생.

외부 자문(ChatGPT 2026-05-03) 권장 6가지 신뢰 방어 UX 중 "사실/주장 분리"와 정합. 또한 ChatGPT가 "킬러 차별점"으로 짚은 "Visualized Frame Clash"의 한 부분 — 매체간 사실 vs 표현 분리.

**사용자 카피 의도**:
> "허위 자극적인 부분을 고쳐주고 본론만 요약해주는 기능"

→ "정화"·"고친다"·"허위 부분"이라는 직접 표현은 한국 정통망법 제70조 명예훼손 위험. 카피 약화 + UX 설계 신중 필요.

---

## Decision

**원본 헤드라인은 그대로 표시하고, 그 옆에 "📝 본론 보기" 토글을 두어 사용자 선택 시 AI가 추출한 1줄 본론 요약을 펼친다. "정화"·"평가"·"교정" 표현 사용 금지.**

### 1. UX 설계

```
🔘 [매체명] [매체군 라벨] · 3분 전
   "충격! 삼성 1조 적자, 위기 신호 감지" ← 원본 그대로 (변경 X)
   📝 본론 보기 ▼ ← 클릭 토글
   ┌─ "삼성전자 1Q 반도체 영업이익 1조원 감소 — 메모리 사이클 일시 둔화"
   │  📍 AI가 추출한 본론 요약 (P0a Claude Haiku, copy-rate ≤ 15%)
   └─ 출처: 원본 기사 ↗ (외부 링크)
```

원칙:
- **원본 헤드라인 절대 변경 안 함** (매체 명예 보호 + 사용자가 원본도 인지)
- 토글은 default closed (사용자 선택)
- 본론 요약은 항상 매체 표시와 함께 ("AI 추출 — 원본 출처 유지")
- "낚시", "허위", "자극적" 같은 매체 평가 단어 절대 노출 X

### 2. 데이터 흐름 (캐시 우선)

ADR-008 정신과 동일 구조:

```
[RSS 워커]
  ├─ 매 1시간 RSS 수집
  ├─ 새 기사마다 LLM 호출 (1건당 ~$0.0008 with Gemini 2.0 Flash)
  └─ DB 적재 (`headline_summaries` 테이블)
            ↓
[페이지 read]
  /api/v1/clusters/[id] 응답에 outlet_reports[*].body_summary 포함
            ↓
[클라이언트]
  토글 클릭 시 prerendered text 펼침 (추가 API 호출 X)
```

**핵심**: 사용자별 LLM 호출 X. 워커가 cluster·outlet 단위 1회 호출. 같은 텍스트 재호출 0.

### 3. Schema 변경 (cluster-schemas.ts)

```diff
 export const OutletReportSchema = z.object({
   outlet_slug: z.string().min(1).max(40),
   outlet_name: z.string().min(1).max(40),
   stance: OutletStanceSchema,
   headline: z.string().min(1).max(120),
   published_at: z.string(),
   outlet_url: z.string().url(),
+  body_summary: z.string().min(1).max(120).optional(),
+  body_summary_model: z.string().optional(),       // 'claude-haiku-3.5' / 'gemini-2.0-flash'
+  body_summary_prompt_version: z.string().optional(),
 })
```

`body_summary`는 optional — 처음 클릭 시 lazy load 가능 (P0w mock은 일부 outlet에만 미리 채움).

### 4. P0w mock 구현 범위

- `lib/mock/cluster-details.ts`의 일부 outlet에 hardcoded `body_summary` 추가 (15 cluster × 평균 3 outlet = 45건)
- `<OutletRow>` 컴포넌트에 토글 + body_summary 영역 추가
- 토글 상태는 client component (useState) 또는 native `<details>` 활용
- 분석 이벤트: `body_summary_toggled { cluster_id, outlet_slug, opened }`

### 5. 카피 가드

| 영역 | 금지 표현 | 권장 표현 |
|---|---|---|
| 토글 라벨 | "낚시 제목 정화", "허위 부분 제거" | **"📝 본론 보기"** |
| 펼침 안내 | "이 매체가 자극적으로 다룬 부분" | "AI가 추출한 본론 요약" |
| 매체 비교 | "이 매체는 자극적", "신뢰도 낮음" | (절대 안 씀 — 매체별 평가 X) |

`harness:public-copy-wording` 또는 신규 `harness:headline-summary-copy`가 검증.

### 6. 한국어 LLM 프롬프트 (P0a)

```
시스템: 당신은 한국 뉴스 헤드라인의 본론을 정확하고 짧게 추출하는 도구다.
사용자: 다음 헤드라인의 본론(사실 핵심)만 1문장 80자 이내 한국어로 추출하라.
입력 헤드라인: <원본>
원본 기사 본문: <abstractive summary, ≤ 15% copy ratio>
규칙:
- "충격", "전격", "단독", "발칵", "위기" 같은 자극 단어는 사실 근거가 있을 때만 유지
- 추측·미확인 주장 제외
- 출처가 1개 매체뿐이면 "한 매체 보도" 명시 가능
- 사실/주장 분리: 사실은 평서문, 주장은 따옴표 인용
출력: 본론 1문장만
```

---

## Implementation Contract

### DB schema (P0a, supabase/migrations/00012_headline_summaries.sql)

```sql
CREATE TABLE headline_summaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID NOT NULL REFERENCES sources(id),
  article_url     TEXT NOT NULL,
  headline_hash   TEXT NOT NULL,                     -- SHA-256 of headline + body abstractive summary
  body_summary    TEXT NOT NULL,
  model           TEXT NOT NULL,                     -- 'gemini-2.0-flash', 'claude-haiku-3.5'
  prompt_version  TEXT NOT NULL,
  copy_ratio      DOUBLE PRECISION,                  -- harness:summary-copy-rate input
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT headline_summaries_unique UNIQUE (article_url, model, prompt_version)
);

CREATE INDEX idx_headline_summaries_lookup
  ON headline_summaries (article_url, model, prompt_version);

REVOKE ALL ON headline_summaries FROM anon, authenticated;
```

### Worker (P0a T-005)

- 매 RSS fetch 후 새 기사마다 LLM 호출
- 캐시 키: `(article_url, model, prompt_version)` → 같은 URL + 같은 모델 + 같은 prompt 버전이면 호출 안 함
- copy_ratio 계산해 `harness:summary-copy-rate`에 입력
- 모델 변경 시 prompt_version bump → 자동 재처리

### Cost (ADR-014와 정합)

- Gemini 2.0 Flash 기준: 50 input + 50 output 토큰 = $0.018/1k
- 100 cluster × 5 outlet × 1일 = 500 호출/일 = $0.009/일 = **월 ~$0.27**
- → 거의 무료. ADR-014 cap $50/월 안에서 0.5% 미만

---

## Consequences

### Positive
- **신뢰 강화**: 사용자가 자극적 헤드라인 노출 후에도 본론 확인 가능 → ADR-010 "이슈 리스크 OS" 가치 직접 강화
- **매체 비판 회피**: 원본 변경 안 함 → 정통망법 제70조 명예훼손 위험 거의 0
- **Frame Clash 부분 구현**: 외부 AI(ChatGPT)가 짚은 킬러 차별점의 일부 → 매체간 사실 vs 표현 분리 시각화
- **cost 거의 무료**: ADR-014 캐시 워커 구조 안에서 월 $0.27
- **PR/홍보 페르소나에 직접 가치**: 자사 부정 이슈 헤드라인의 본론 빠르게 파악 → ADR-010 §1순위 페르소나 (박홍보) 가치

### Negative
- **AI 출력 quality 의존**: 본론 요약이 부정확하면 사용자 신뢰 하락. P0a LLM 통합 후 copy_ratio 검증 필수
- **카피 마찰**: "낚시 제목 정화" 같은 직관적 라벨을 못 쓰니 "📝 본론 보기" 의미 전달이 약할 수 있음 — A/B 테스트 필요 (V0.5)
- **매체 측 반발 가능성**: 매체가 "본론" 표현이 자기 헤드라인 비판으로 해석할 위험 — 변호사 자문 필요 (ADR-011 변호사 자문 패키지에 추가)
- **mock 작성 부담**: P0w mock에 45개 body_summary 직접 작성 필요

### Neutral
- 토글 default closed → 첫 페이지 로드 영향 없음
- body_summary가 없는 outlet도 graceful degrade (토글 숨김)

---

## Alternatives Considered

### Alt-A: 자극도 점수 (0~100) 표시
- **Pro**: 정량화로 명확
- **Con**: 매체별 점수 부여 = 평가 = 명예훼손 위험 큼
- **Reject**: 법무 위험

### Alt-B: 자극도 ≥ 80 헤드라인 회색 처리 (검열)
- **Pro**: 사용자 시각 보호
- **Con**: 사실상 매체 차단. 표현의 자유 충돌
- **Reject**: 강한 검열 신호

### Alt-C: 헤드라인 원본 자체를 "본론 요약"으로 교체
- **Pro**: 단순
- **Con**: 매체 명예훼손 직격탄. 원본 미인지로 사용자 정보 손실
- **Reject**: 가장 큰 위험

### Alt-D (선택): 원본 + 토글 본론 (병기)
- **Pro**: 매체 명예 보호 + 사용자 선택권 + 정확도 검증 가능
- **Con**: 토글 학습 마찰 (V0.5 A/B 검증 필요)
- **Selected**: 가장 안전 + 가치 명확

---

## Verification

### P0w mock
- [ ] `lib/mock/cluster-details.ts`에 `body_summary` 일부 outlet 추가 (15 cluster × 3 outlet = 45)
- [ ] `<OutletRow>` 토글 UI + body_summary 영역
- [ ] 분석 이벤트 `body_summary_toggled` 추가
- [ ] 카피 가드 통과 — "낚시", "정화", "자극" 단어 0건

### P0a 본격
- [ ] `supabase/migrations/00012_headline_summaries.sql` 적용
- [ ] T-005 워커가 LLM 호출 + DB 적재
- [ ] `harness:summary-copy-rate`가 body_summary에도 적용 (≤ 15% copy ratio)
- [ ] copy_ratio 위반 시 워커 자동 재처리

---

## Open Questions

1. **카피 라벨 검증**: "📝 본론 보기" vs "✨ 사실 핵심" vs "🔍 핵심 요약" — A/B 테스트 (V0.5)
2. **매체 측 ToS 확인**: 매체가 자기 헤드라인 옆에 AI 본론 표시를 허용하는가? — RSS 약관에 일반 명시 없으나 변호사 자문 필요
3. **자극 단어 보존 정책**: "충격", "단독", "전격" 같은 단어가 사실 근거 있을 때 유지해야 하는가? — 프롬프트 개선 (V0.5)
4. **매체 stance 영향**: 보수·진보 매체가 사실 vs 표현 차이가 다른 패턴인가? Frame Clash와 통합 시 데이터 후 분석

---

## References

- 외부 의견 — clien.net 19187041 (2026-05-04 사용자 공유)
- ChatGPT (2026-05-03) — 6 신뢰 방어 UX 중 "사실/주장 분리"
- ChatGPT (2026-05-03) — "킬러 차별점 — Visualized Frame Clash"
- ADR-008 Trend Pipeline — cluster·outlet별 캐시 워커 구조 패턴 적용
- ADR-009 이념 라벨링 보조화 — "AI 분석 안" 영역과 정합
- ADR-010 Issue Risk OS — "정확한 정보 활용" 가치 강화
- ADR-014 비용 최적화 — 캐시 + 워커 패턴 동일 적용

---

**End of ADR-013 — 2026-05-04**
