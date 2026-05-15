# ADR-018 — Custom Topic Tracking (Creator+)

> **Status**: Accepted (2026-05-12, P0a 진입 직전)
> **Decider**: 태욱 (Founder)
> **Related**: ADR-014 (LLM 비용 파이프라인), ADR-016 (Privacy & Data Boundary), ADR-017 (Daily Digest)
> **Source**: `docs/research/syft-benchmark.md` §1 강점 1

---

## 1. Context

Syft AI의 핵심 차별화 — 사용자가 키워드 입력 시 LLM이 토픽 의도를 이해해 글로벌 소스를 자동 큐레이션. "당신의 의도를 이해" 표현으로 단순 키워드 매칭과 차별화.

뜬 이유 페르소나 #1 (김크리에이터) JTBD — "오늘 다룰 소재 5분 안에 결정". 일반 Top 20에서 본인 분야 매칭 없으면 가치 ↓. Custom Topic으로 본인이 추적 중인 키워드만 받으면 즉시 가치 ↑↑.

---

## 2. Decision

Creator 이상 사용자가 키워드 등록 → 새 클러스터 생성 시 임베딩 유사도 매칭 → 매칭 클러스터를 Daily Digest (ADR-017) + (V0.5+) 푸시 알림으로 우선 노출한다.

### 2.1 Tier별 한도

| Tier | 키워드 한도 | 매칭 깊이 |
|---|---|---|
| Free | 0 | X |
| Pro $4.99 | 5개 | 일치 + 동의어 |
| Creator $9.99 | 20개 | + 의미적 유사 (cosine ≥ 0.7) |
| Leader $19.99 | 50개 | + 사용자별 학습 (V0.5+) |

Syft Free 10 / Plus 100 참고하되, 뜬 이유는 한국 이슈 한정이라 한도 낮게 (Free 0 → Pro 5 결제 동기 강함).

### 2.2 키워드 입력

- 자유 텍스트 (예 "삼성전자 반도체", "K팝 아이돌 마약", "AI 규제")
- LLM hard-block 40+ 단어가 키워드 입력에도 적용 (예 "삼성전자 매수" 거부 + "투자 판단성 단어가 포함되어 있습니다. 사실 추적 키워드로 변경해 주세요" 안내)
- 한 키워드 최대 40자
- 영문 OK (외신 비교 강화 — ADR-019 합류 시)

### 2.3 매칭 알고리즘

1. **Pro (단순)** — 클러스터 제목·요약에 키워드 단어 포함 (대소문자 무시)
2. **Creator (의미적)** — 사용자 키워드 임베딩 + 새 클러스터 임베딩 cosine similarity ≥ 0.7
3. **Leader (학습)** — V0.5+ — 사용자가 매칭 클러스터에 "관심 있음/없음" 피드백 → 임계값 자동 조정

임베딩 — sentence-transformers `paraphrase-multilingual-MiniLM-L12-v2` (ADR-014 Phase 2 맥미니, 한국어 + 영어 지원, 무료, on-device).

### 2.4 매칭 결과 노출

| 위치 | Free | Pro | Creator | Leader |
|---|---|---|---|---|
| Daily Digest (ADR-017) 상단 | X | ✅ | ✅ | ✅ |
| 푸시 알림 (V0.5+) | X | X | ✅ (선택) | ✅ |
| /widget 메인 화면 "내 토픽" 탭 | X | ✅ | ✅ | ✅ |
| 임베드 위젯 추천 | X | X | ✅ | ✅ |

---

## 3. Schema (Supabase)

### 3.1 user_topics 테이블

```sql
CREATE TABLE user_topics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword         TEXT NOT NULL CHECK (length(keyword) BETWEEN 1 AND 40),
  embedding       VECTOR(384),  -- pgvector + paraphrase-multilingual-MiniLM
  active          BOOLEAN NOT NULL DEFAULT true,
  matching_mode   TEXT NOT NULL CHECK (matching_mode IN ('exact','similar','learned')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_matched_at TIMESTAMPTZ,
  match_count     INT NOT NULL DEFAULT 0,
  CONSTRAINT user_topics_user_keyword_unique UNIQUE (user_id, keyword)
);

CREATE INDEX idx_user_topics_active_user ON user_topics (user_id) WHERE active = true;
```

### 3.2 user_topic_matches 테이블 (이력)

```sql
CREATE TABLE user_topic_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id     UUID NOT NULL REFERENCES user_topics(id) ON DELETE CASCADE,
  cluster_id   UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  similarity   NUMERIC(4,3) CHECK (similarity BETWEEN 0 AND 1),
  matched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_feedback TEXT CHECK (user_feedback IN ('relevant','irrelevant','unrated')),
  CONSTRAINT user_topic_matches_unique UNIQUE (topic_id, cluster_id)
);
```

### 3.3 RLS

```sql
ALTER TABLE user_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_topics_self ON user_topics
  USING (auth.uid() = user_id);
ALTER TABLE user_topic_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_topic_matches_self ON user_topic_matches
  USING (auth.uid() = (SELECT user_id FROM user_topics WHERE id = topic_id));
```

CLAUDE.md rule 11 — service_role 외에는 own data만.

---

## 4. PIPA 정합 (ADR-016 보강)

### 4.1 보유 기간

- user_topics — 활성 구독 + 13개월 (ADR-016)
- user_topic_matches — 매칭일로부터 13개월
- 사용자가 수동 삭제 시 즉시 (cascade)

### 4.2 동의 항목

```
[ ] 필수 — 키워드 추적 데이터 수집·이용 (서비스 핵심 기능)
[ ] 선택 — 키워드 데이터로 추천 알고리즘 개선 동의
```

선택 항목 미동의 시 학습 모드 (Leader) 비활성화.

### 4.3 직접 식별자 분리

- 키워드 자체에는 사용자 식별 정보 X (사용자 본인이 입력 — 자기 데이터)
- 단 사용자가 본명 등 PII 입력 시 — 입력 단계에서 PII 패턴 감지 + 경고 ("개인 식별 정보가 포함되어 있는 것 같습니다")

---

## 5. 비용 추정

### 5.1 임베딩 비용

- sentence-transformers (ADR-014 Phase 2 맥미니) — 무료
- 클러스터 1개당 1회 임베딩 (1차 LLM 워커에서 이미 계산)
- user_topic 등록 시 1회 임베딩

### 5.2 매칭 비용 (LLM 호출 X)

- 새 클러스터 생성 시 — 모든 활성 user_topics와 cosine similarity 계산
- Creator 1,000명 × 평균 10개 = 10,000 비교 / 클러스터
- 일 100 신규 클러스터 = 1M 비교 / 일
- 비용 — 거의 0 (CPU dot product, ~0.1초)

### 5.3 PostgreSQL pgvector

- Supabase Pro $25/월 — pgvector 기본 지원
- 인덱스 (HNSW 또는 IVFFlat) — V0.5+ 사용자 100K+ 시 도입

---

## 6. UI 명세 (V0.5+ 본격 구현 — 본 ADR은 데이터 모델 + worker 우선)

### 6.1 키워드 추가 화면 — `/account/topics`

```
🔍 추적 중인 키워드 (3 / 20)

[+ 새 키워드 추가] (Pro 5개 한도 내)

[키워드 카드 — 삼성전자 반도체]
  매칭: 12회 (지난 7일)
  최근: 2026-05-11 (16개 매체) →
  [관련성 ↑] [관련성 ↓] [삭제]

[키워드 카드 — K팝 아이돌 마약]
  매칭: 3회 (지난 7일)
  ...
```

### 6.2 매인 화면 — "내 토픽" 탭 신설

```
[Pro+ only] 6 카테고리 + 1 추가 탭 = 7 카테고리 탭

전체 / 내 토픽 / 경제 / IT·과학 / 사회 / 국제·정치 / 라이프·문화
                        ↑ 신규
```

내 토픽 탭 = user_topics 매칭 클러스터만 (rank 무시 + 매칭 시간순).

### 6.3 Daily Digest 통합 (ADR-017)

```
[Daily Digest 상단]

🔍 당신이 추적 중인 키워드 매칭

  • 삼성전자 반도체 → 삼성전자 1분기 반도체 흑자 전환 (26개 매체) →
  • K팝 아이돌 마약 → 매칭 없음
  • AI 규제 → AI 기본법 국회 통과 (15개 매체) →

[그 아래 일반 Top 5 카테고리별]
```

---

## 7. 구현 단계 (Phased PRs)

| PR | 범위 | LOC 추정 |
|---|---|---|
| #27 (이번 함께) | ADR-018 정식 ADR (docs only) | ~280 |
| #29 또는 별도 | Supabase migration `user_topics` + `user_topic_matches` + RLS + harness | ~200 |
| 후속 | Python worker — 임베딩 + 매칭 (ADR-014 Phase 2 통합) | ~400 |
| 후속 | UI — 키워드 추가 화면 + "내 토픽" 탭 | ~600 |
| 후속 | Daily Digest 통합 (ADR-017 합류 후) | ~100 |

총 약 1,580 LOC. P0a 안정화 ~3주.

---

## 8. Risks

### 8.1 LLM이 키워드 의도 잘못 이해

- 예 "삼성" 등록 시 삼성전자/삼성생명/삼성중공업 등 모두 매칭 → 사용자 부담
- 완화 — 사용자 피드백 (관련성 ↑/↓) → V0.5+ 학습 모드로 정밀화
- 완화 — 키워드 등록 시 LLM이 "이 키워드는 다음 분야 모두에 해당될 수 있습니다 — 더 구체적으로 입력하시려면..." 가이드

### 8.2 경쟁사 정보 추적 (B2B 사용자)

- 키워드 "쿠팡" 등록 → 쿠팡 관련 보도 모두 모니터링
- 정상 사용 — 단 매체에서 봇 차단 시도 가능
- 완화 — sources_whitelist + ToS 정합 (CLAUDE.md rule 7)

### 8.3 자본시장법 회피

- 사용자가 "삼성전자 매수 시점" 같은 투자 판단성 키워드 등록 시도
- 완화 — 입력 단계에서 LLM hard-block 40+ 단어 거부 + 안내
- 완화 — 매칭 클러스터의 Trust Tag 우선 (investment 태그 시 자본시장법 고지)

### 8.4 사용자가 본인 PII 키워드로 등록

- 예 "김태욱 동향" — 본명 + 일반 단어
- 완화 — 입력 단계에서 PII 패턴 감지 + 경고
- 완화 — 매칭 결과는 본인만 볼 수 있음 (RLS)

---

## 9. Alternatives Rejected

### 9.1 키워드 한도 무제한 (Syft 100개 모방)

- 거부 — 한국 이슈 한정이라 100개는 과함 + 매칭 비용 ↑ + 사용자 피로
- 채택 — Pro 5 / Creator 20 / Leader 50 (Tier 차별화)

### 9.2 Free 사용자에도 1-2개 키워드 허용

- 거부 — 결제 동기 약화 + 워커 부담
- 채택 — Free 0 / Pro부터

### 9.3 키워드 대신 카테고리만 (현 6 카테고리 탭 유지)

- 거부 — Syft 핵심 차별화 흡수 안 됨 + Creator JTBD 불충족
- 채택 — Custom Topic + 카테고리 탭 둘 다 유지 (선택권)

---

## 10. Decision Log

| 날짜 | 항목 | 결정 |
|---|---|---|
| 2026-05-12 | Tier 한도 | Free 0 / Pro 5 / Creator 20 / Leader 50 |
| 2026-05-12 | 매칭 알고리즘 | Pro 단순, Creator 의미적 (cosine ≥ 0.7), Leader 학습 V0.5+ |
| 2026-05-12 | 임베딩 모델 | sentence-transformers paraphrase-multilingual-MiniLM (ADR-014 Phase 2) |
| 2026-05-12 | 자본시장법 회피 | 키워드 입력 시 hard-block 40+ 단어 거부 |
| 2026-05-12 | PII 보호 | 입력 단계 PII 패턴 감지 + 경고 |
| 2026-05-12 | "내 토픽" 탭 | 메인 화면에 신규 추가 (Pro+) |

---

## 11. References

- `docs/research/syft-benchmark.md` §1 강점 1 (Hyperpersonalization)
- ADR-014 (LLM 비용 + 임베딩) — 본 ADR의 임베딩 인프라 제공
- ADR-016 (Privacy & Data Boundary) — PIPA 13개월 보유 + 동의 분리
- ADR-017 (Daily Digest) — Custom Topic 매칭 클러스터를 다이제스트 상단 노출
- 변호사 의견서 §1.3 (LLM hard-block 40+ 단어)
- pgvector — Supabase Pro 기본 지원

---

**End of ADR-018 — 2026-05-12**
