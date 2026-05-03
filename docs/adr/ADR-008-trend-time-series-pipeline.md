# ADR-008: Trend Time-Series Pipeline

| 항목 | 내용 |
|---|---|
| 상태 | Accepted |
| 결정일 | 2026-05-03 |
| 결정자 | 태욱 (Founder) |
| 참조 | PRD v1.6 §6 (Data Source Strategy), v1.6.5 patch §R-7, CLAUDE.md rule 1·4·9 |
| 대체 | 해당 없음 (v1.6.5 신규) |
| 구현 시작 | P0a (T-006 워커) |

---

## Context

PRD v1.6.5는 `/cluster/[id]` detail 페이지에 4-window (`7d / 30d / 6m / 1y`) 검색 흐름 sparkline을 추가한다. 페이지 1회 요청에 `cluster × 4 windows × ~30~168 buckets` 데이터가 필요. 매번 LLM 호출 또는 외부 API 호출은 다음 이유로 불가:

- **비용**: cluster 100개 × 4 windows × DAU 수천 = API 호출 일 수십만 회 → DataLab/GTrends 무료 한도 즉시 초과
- **레이턴시**: 외부 API 평균 응답 500ms → 4 windows 직렬 호출 = 2초+ → PRD §7.1 LCP 2s 위반
- **CLAUDE.md rule 1**: Naver Search API 결과 직접 저장 금지. DataLab은 별도 허용이지만 호출 패턴 통제 필요

질문: **트렌드 시계열을 어떤 구조로 적재·서빙할 것인가?**

---

## Decision

**DB 시계열 테이블 + 백그라운드 워커 4-단계 cadence + 페이지는 DB 즉시 read.**

### 1. DB 스키마

```sql
CREATE TABLE keyword_trends (
  keyword         TEXT NOT NULL,
  window          TEXT NOT NULL CHECK (window IN ('7d','30d','6m','1y')),
  bucket_start    TIMESTAMPTZ NOT NULL,
  value           DOUBLE PRECISION NOT NULL CHECK (value >= 0),
  source          TEXT NOT NULL CHECK (source IN ('datalab','gtrends','bigkinds','self','blended')),
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (keyword, window, bucket_start, source)
);

CREATE INDEX idx_keyword_trends_recent
  ON keyword_trends (keyword, window, bucket_start DESC);

REVOKE ALL ON keyword_trends FROM anon, authenticated;
```

`(keyword, window, bucket_start, source)` PK로 중복 적재 시 UPSERT.

### 2. 워커 cadence + 데이터 소스 매트릭스

| Window | bucket size | bucket count | 워커 주기 | 1차 소스 | 보조 소스 |
|---|---|---|---|---|---|
| 7d | 시간 | 168 | **매 1시간** | Naver DataLab (실시간) | 자체 view 카운트 |
| 30d | 일 | 30 | **매 6시간** | DataLab + GTrends | self |
| 6m | 주 | 26 | **매 1일 새벽** | BIGKinds 보정 | GTrends |
| 1y | 주 | 52 | **매 1일 새벽** | BIGKinds | GTrends |

워커는 Python (Fly.io free tier)에서 cron으로 실행. 같은 (keyword, window, bucket) 다중 source 적재 후, 페이지 read 시 `source='blended'`로 가중평균하거나 우선순위 (DataLab > BIGKinds > GTrends > self) 적용.

### 3. 데이터 소스별 호출 한도 + 안전판

| 소스 | 무료 한도 | 우리 사용 패턴 | 한도 초과 대응 |
|---|---|---|---|
| Naver DataLab | 1,000회/일 | Top 10 cluster × 7d × 1h = 240회/일 | 안전 (24% 사용) |
| Google Trends (pytrends) | 비공식, ~1초당 1회 | Top 50 keyword × 30d × 6h = 200회/일 | 1초 sleep + retry-after |
| BIGKinds | 공공DB, 일 2회 | Top 100 keyword × 6m+1y × 1일 = 200회/일 | 안전 |
| 자체 view | 제한 없음 (Supabase 인덱스) | DB 인덱스 1회 read/window | 항상 가능 |

**최대 시나리오**: Top 100 cluster 모두 4 windows + 모든 소스 동시 = 일 ~640회 < 1,000회 DataLab 한도 → **단일 무료 한도 안에서 운영 가능**.

### 4. 페이지 → DB read 경로

```
[Browser]
  GET /cluster/[id]
   ↓
[Next.js route handler]
  /api/v1/clusters/[id]
   ↓
  SELECT FROM keyword_trends
    WHERE keyword IN (cluster.title, cluster.entity_card.subject_canonical)
      AND window IN ('7d','30d','6m','1y')
    ORDER BY bucket_start
   ↓
  ClusterDetailResponseSchema.parse(...)
   ↓
[Browser → SVG sparkline]
```

페이지 응답: DB read 1번 (4 windows 한 쿼리), AI 호출 0번. p95 < 100ms 예상.

---

## Cache Layers

1. **DB index hit** (~5ms typical)
2. **Vercel Edge cache 60s** (route.ts Cache-Control)
3. **Browser cache 60s** (`max-age=60`)

조정: 7d window는 시간당 갱신이라 60s cache OK. 1y window는 1일 갱신이라 1시간 cache 가능 (route별 cache header 조정은 V0.5).

---

## P0a 구현 단계 (T-006 워커)

```
Step 1: 워커 scaffold (Python + APScheduler on Fly.io)
Step 2: DataLab API 클라이언트 + 7d hour buckets 적재
Step 3: GTrends pytrends 통합 + 30d day buckets
Step 4: BIGKinds 통합 + 6m/1y week buckets
Step 5: Supabase upsert + UNIQUE 충돌 처리
Step 6: 자체 view 카운트 → trends.source='self' 적재
Step 7: cron 등록 (1h / 6h / 1d schedules)
Step 8: 모니터링 (워커 실패 알림, 적재 누락 검출)
```

V0.5 단계: 'blended' source 가중평균 알고리즘 + 신호-잡음 필터링.

---

## Privacy / Compliance

- **CLAUDE.md rule 1 (Naver Search 저장 금지)**: DataLab은 별도 허용 (PRD §6.2). DataLab 응답 raw payload는 저장하지 않고 (keyword, bucket, value)만 추출 적재.
- **CLAUDE.md rule 4 (sensitive fields)**: `keyword_trends.value`는 0~100 정규화 — 절대 raw query count 노출 금지 (DataLab ToS).
- **자체 view 카운트**: cluster_id별 조회 수만, IP/user_id 미저장.
- **GDPR/PIPA**: 키워드는 PII 아님. user-level 트래킹 없음.

---

## Consequences

### Positive
- **무료 한도 안 운영**: 월 $0 (Vercel free + Supabase free + Fly.io free)
- **빠른 페이지 응답**: AI 호출 0회, DB read 1회
- **데이터 다원성**: 4 소스 blended로 단일 source 편향 완화 (V0.5)
- **확장성**: cluster 1,000개까지 한도 안

### Negative
- **신선도 trade-off**: 7d window가 시간당만 갱신 → 사용자가 새로고침해도 새 시점 반영 1시간 지연
- **데이터 소스 의존**: DataLab 서비스 변경 시 7d window 영향 → BIGKinds/self 보강 필요
- **1차 진실 부재**: 우리 자체 트래픽이 적은 P0w/P0a 단계는 외부 데이터에 전적 의존 → 데이터 소스 신뢰성이 곧 신뢰성

### Neutral
- 시계열 데이터 누적: 1년 후 keyword 100개 × 4 window × 평균 60 bucket × 100B = 24MB → Supabase free 500MB 안에서 수년
- 워커 장애 시 캐시된 DB 데이터로 graceful degradation (마지막 적재 시각 표시)

---

## Alternatives Considered

### Alt-A: 페이지 fetch 시 lazy 외부 API + 결과 DB 캐시
- **Pro**: 단순, 워커 없음
- **Con**: 첫 사용자 느림 (500ms+), race condition, DataLab 호출 패턴 통제 어려움
- **Reject**: P0a 트래픽 증가 시 한도 초과 위험

### Alt-B: ISR (Incremental Static Regeneration)
- **Pro**: Next.js 플랫폼 활용, 별도 워커 불필요
- **Con**: 페이지별 revalidate가 트리거 → 키워드 100개 × 4 window 각각 따로 ISR 부담, B2B API 호환 불가
- **Reject**: 우리 use case에 부적합

### Alt-D: 외부 Time-Series DB (InfluxDB / TimescaleDB)
- **Pro**: 시계열 전문, 압축률 우수, 윈도우 함수 풍부
- **Con**: P0w 규모에 over-engineering, 추가 인프라 비용 ($25+/mo)
- **Reject**: Supabase Postgres + 단일 인덱스로 충분 (수년 600MB 안)

**결론**: Postgres `keyword_trends` 테이블 + 백그라운드 워커가 비용/단순성/확장성 균형 최적.

---

## Verification

P0a T-006 워커 구현 시:
- [ ] `supabase/migrations/00012_keyword_trends.sql` 적용
- [ ] DataLab 클라이언트 단위 테스트 (mock 응답)
- [ ] cron 등록 확인 (Fly.io machine schedule)
- [ ] 7일 운영 후 적재 누락률 < 5%
- [ ] DataLab 일 호출 < 500회 (안전 마진 50%)
- [ ] 페이지 p95 응답 < 200ms (DB index hit 기준)

---

## Open Questions

1. **bigkinds 자격**: 공공DB API 가입 절차·심사 기간 확인 필요 (1주일 예상)
2. **DataLab payload 저장 범위**: 응답 JSON 어디까지 저장 가능한지 Naver 공식 문의 (PRD v1.3 Q-24 연장)
3. **자체 view 정의**: cluster page view? widget rank 1~10 노출 view? embed 카드 view? — V0.5 결정
4. **blended 가중치**: source별 신뢰 가중치 (DataLab 0.5 / GTrends 0.3 / BIGKinds 0.15 / self 0.05?) — 6개월 데이터 후 결정

---

## References

- PRD v1.6.5 §R-7 (본 ADR 발의)
- PRD v1.6 §6.2 (Naver DataLab/BIGKinds 1·2차 데이터)
- ADR-001 Data Licensing (Naver Search 저장 금지 — DataLab은 별도 허용)
- CLAUDE.md rule 1, 4, 9
