# Product Requirements Document v1.2
# 뜬이유 (TTEUN-IYU) — 한국 언론을 투시하는 AI

| 항목 | 내용 |
|---|---|
| 문서 버전 | **v1.2 (데이터 라이선스·Public View·P0 분할 반영)** |
| 작성일 | 2026-04-18 |
| 이전 버전 | v1.1 (2026-04-17), v1.0 (2026-04-17 — archived) |
| 대상 | Engineering / Design / Legal Handoff |
| 코드네임 | TTEUN-IYU (이하 "뜬이유") |
| 근거 자료 | taewook-strategy-report.md, prd-v1.0.md, prd-v1.1.md, 외부 평가자 2차 리뷰 (2026-04-18) |
| Target MVP 공개 | **P0a: 2026-05-01 (D+14) / P0b: 2026-05-17 (D+30)** — 2단계 분할 |
| 변경 원칙 | **데이터 라이선스 선잠금, Public View 분리, 단계별 절단** |

---

## Changelog v1.1 → v1.2

### Critical Fixes (착수 전 반드시 해결)

- **C-6 Naver Search API 저장·가공 제한 반영**: v1.1에서 Naver Search API를 P0 핵심 축으로 두었으나, 네이버 고객센터 안내상 API 결과의 저장·가공이 약관상 제한됨. **P0에서 Naver Search는 임시 discovery 용도로만** 사용, 기사 원천 저장·요약·클러스터링은 **언론사 RSS + 허용 범위 확인된 공개 데이터**에서만 수행
- **C-7 Public DB View 도입**: Supabase RLS는 row-level 제어이지 column-level 은닉이 아님. Base table(`sources`, `articles`) 직접 노출 시 `bias_score`·`factuality_score`·`embedding`이 유출 위험. **public_view만 익명 사용자에 grant, base table은 service_role/admin 전용**
- **C-8 methodology_versions FK 구조 수정**: `version text UNIQUE`는 `bias:v0` + `trend:v0` + `election:v0` 동시 존재 불가. **`UNIQUE(scope, version)` 복합 제약 + `methodology_version_id uuid` FK** 로 변경
- **C-9 P0 분할 (P0a / P0b)**: 1인 30일 동안 P0 전체는 여전히 과밀. **P0a (D+14, 신뢰 데모)** + **P0b (D+30, 클로즈드 알파)** 로 이분, Admin 고급 기능·외부 보정은 P0b 이후
- **C-10 Realtime 범위 통일**: v1.1 내부 충돌(F-P0-1은 Supabase Realtime 요구, NFR은 "V1부터") → **P0 전체에서 Realtime CDC 미사용. SWR 60초 polling**, Realtime은 V1 도입

### Major Fixes (착수 전 권장 수정)

- **M-6 clusters 분포 카운트 비정규화 제거**: `left_count`·`center_count`·`right_count`는 매체 점수 변경·이의제기 상태 변화 시 stale. **Materialized view `cluster_coverage_distribution`으로 read-time aggregation**
- **M-7 CREATE EXTENSION 명시**: `pgcrypto`(gen_random_uuid), `vector`(pgvector) migration 첫 줄에 선언
- **M-8 confidence_interval 스키마 반영**: v1.1 법무 섹션에 "신뢰구간 표시"만 있고 스키마엔 없음. **`source_score_evidence.confidence_interval_low/high` 컬럼 추가**, 또는 UI에서 "신뢰구간" 표현 삭제하고 confidence badge로 축소
- **M-9 HITL CHECK constraint 정직화**: v1.1 Verification의 "HITL DB CHECK 완료" 체크는 과장. **P0 쇼츠·Blindspot 테이블 없으므로 실제 강제 지점 없음**. "P0 audit infra만 존재, HITL CHECK는 V1/V2 발행 테이블 도입 시 적용"으로 명시
- **M-10 공개 UI 언어 추가 완화**: "Bias Distribution Bar" → **"보도 분포 바(Coverage Distribution Bar)"**. 공개 UI에서 "Bias" 단어 자체 후퇴, 내부 DB는 `bias_score` 유지 허용

### Minor Additions (PMF 측정 정교화)

- **N-5 공유 카드 6단계 퍼널 지표**: 단일 "생성 수 200건" → **cluster_viewed → share_opened → og_generated → share_completed → shared_link_opened → shared_user_waitlisted** 6단계. 진짜 PMF 신호는 share_completed 80 + shared_link_opened 100
- **N-6 RSS 30개 매체별 ToS 확인 의무**: 각 매체 RSS 피드에 별도 이용 조건이 있는 경우 대비, **스프린트 0에서 30개 매체별 RSS 사용 가능성 매트릭스 작성**

---

## Context (왜 이 문서가 필요한가)

v1.1이 "전략+실행+투자 메모 혼재" 문서에서 "1인 30일 MVP 실행 문서"로 진화했다면, v1.2는 **"실행 문서를 데이터 라이선스·DB 권한·스프린트 현실성 3축으로 최종 잠금"** 단계. 외부 평가자 2차 리뷰에서 발견된 Naver API 저장·가공 제한, Public View 누락, methodology FK 충돌은 모두 **코드 한 줄 쓰기 전**에 해결해야 하는 구조적 결함이었음. v1.2는 이 결함을 모두 해소하고, 30일을 14+16일로 쪼개 실행 가능성을 회복시킨다.

**한 문장 요약**: v1.2는 v1.1의 방향(PMF=분포 카드 공유, 방법론 선잠금)을 유지하되, **데이터 라이선스를 먼저 확정하고 Public View로 정보 유출을 차단한 후 Sprint 0 착수**하는 안전판.

---

## 1. Product Overview

### 1.1 Vision
한국에서 뉴스를 소비하는 모든 사람이 **자신이 어느 진영의 렌즈로 세상을 보는지 실시간으로 인지**하고, 그 렌즈를 **선택적으로 바꿔 끼울 수 있는** 사회를 만든다.

### 1.2 Mission
뜬이유는 한국 언론의 구조적 편향을 대체하지 않고 **가시화(visualize)** 한다. 판단하지 않고 분포를 보여준다. 사용자는 AI의 해석을 소비하는 것이 아니라, AI의 도움으로 **다원적 원본에 접근**한다.

### 1.3 Success Definition (12개월, v1.1 유지)

- **Product**: MAU 100,000 / WAU 60,000 / DAU 20,000 / Day30 리텐션 20%
- **Business**: MRR ₩15,000,000 (Pro ARPPU ₩6,000 × 2,500 + B2B 분리) / B2B 계약 3건 / 월 손익분기
- **Mission**: WDDU 40,000 (Weekly Diverse-Diet Users, MDDI ≥ 0.6 유지 WAU — North Star)
- **Runtime**: 트렌드 레이턴시 p95 ≤ 15분 (P0) → 5분 (V1) / 클러스터링 정확도 90%+ / 이의제기 7일 내 100% 응답

### 1.4 Non-Goals (v1.1 유지 + 추가 잠금)

- 뉴스 기사 원문 재생산
- AI가 사실을 단정하는 팩트체크 엔진
- 정치 성향 추천·매칭
- 실명 댓글·토론 커뮤니티
- 저널리스트 대체용 원고 생성
- 타 국가 언론 편향 분석
- `factuality_score` UI 전면 노출 (v1 방법론 공개 전)
- X 타인 계정 Blindspotter
- **(v1.2 신규) Naver Search API 결과 저장·요약·클러스터링** — 승인 또는 약관 명확화 전까지 discovery only
- **(v1.2 신규) 매체 로고·썸네일 복제 사용** — 라이선스 확인 전까지
- **(v1.2 신규) Public API에서 base table 직접 노출** — 모든 공개 접근은 view 경유

---

## 2. Problem Statement (v1.1 유지, Pain Point 매트릭스 수정)

### 2.1 Jobs-to-be-Done (v1.1 그대로)

JTBD-1 (Functional), JTBD-2 (Emotional), **JTBD-3 (Social — 킬러 시나리오)**

### 2.2 Pain Point 매트릭스 (v1.2 수정)

| Pain Point | MVP 포함 |
|---|---|
| 진영별 보도 프레이밍 차이 확인 → 보도 분포 바 | ✅ P0a |
| 카톡 논쟁 시 맥락 공유 → 분포 카드 OG | ✅ P0a |
| 실시간 이슈 신속 파악 → 15분 간격 | ✅ P0a |
| 방법론 투명성 요구 → /methodology | ✅ P0a |
| 이의제기 경로 → dispute form | ✅ P0b |
| Admin 클러스터 병합/분리 | ✅ P0b |
| 특정 진영 집중 이슈 → Blindspot | ❌ V1 |
| 본인 뉴스 편향 자각 → Media Diet | ❌ V1 |
| 쇼츠 세대 맥락 | ❌ V2 |
| B2B 위기 모니터링 | ❌ V2 |

### 2.3 왜 지금인가 (v1.1 유지)

- 다음 실검 부활(2026-03-03), Claude Code Routines(2026-04-14), Perplexity × SKT 선점 — 동일

---

## 3. Target Users (v1.1 유지)

Persona 1 (이지훈, MVP Primary), Persona 2 (박수민, V2 B2B), Persona 3 (최영자, V1+), Persona 4 (강도현, V2 바이럴)

---

## 4. Product Principles (v1.1 유지 + P6 강화)

### P1. 가시화 우선, 판단 금지 (v1.1 동일)
### P2. 방법론 공개 (v1.1 동일)
### P3. 다양성 디폴트, 진영 선택제 (v1.1 동일)
### P4. 휴먼 감독 강제 — **정직한 표현으로 수정**
- v1.1: "DB CHECK constraint로 강제"
- v1.2: "**V1/V2의 발행 테이블(쇼츠·Blindspot 리포트)에 CHECK constraint로 강제. P0는 audit log + admin 승인 워크플로우로 담보**"
### P5. 원본 존중 (v1.1 동일)
### P6. 방법론 선잠금 (v1.1 동일)
### P7. 데이터 라이선스 우선 (**신규**)
- 모든 데이터 소스는 **저장·가공 가능 범위를 사전 확인**한 후에만 파이프라인에 투입
- 약관 불명확 시 **저장 금지 원칙**
- 매체 RSS는 30개 전수 ToS 검토 후 화이트리스트 방식 운영

---

## 5. Feature Specifications

### 5.1 P0a — 신뢰 데모 (D0~D14, 2026-04-18 ~ 2026-05-01)

**목표**: "우리는 뭘 만들려 하는지"를 보여주는 정적 데모. 핵심 기능 골격만, PMF 측정은 P0b에서.

**P0a 산출물**:
- F-P0a-1 RSS 수집 (30개 매체) + abstractive summary
- F-P0a-2 Python 워커 임베딩 + HDBSCAN 클러스터링 (첫 동작)
- F-P0a-3 `/trends` 페이지 (15분 갱신 + SWR polling)
- F-P0a-4 Coverage Distribution Bar v0
- F-P0a-5 `/cluster/:id` 이슈 상세
- F-P0a-6 `/methodology` 공개 페이지
- F-P0a-7 `/cluster/:id/og` OG 이미지 생성

### 5.2 P0b — 클로즈드 알파 (D14~D30, 2026-05-01 ~ 2026-05-17)

**목표**: 대기자 1,000명 + 클로즈드 알파 100명 + PMF 측정.

**P0b 산출물**:
- F-P0b-1 Admin 도구 (키워드 제외, 클러스터 병합, 편향 수정 로그)
- F-P0b-2 이의제기 폼 + end-to-end 응답 플로우
- F-P0b-3 온보딩 3분 투어 + 대기자 이메일 수집
- F-P0b-4 Naver DataLab 보정 (검증용 1K/일)
- F-P0b-5 BIGKinds 보정 (하루 2회)
- F-P0b-6 외신 RSS 3개 (Reuters, AP, BBC) 매칭
- F-P0b-7 PMF 6단계 퍼널 지표 대시보드 (PostHog)

---

#### F-P0a-1: RSS 수집 & abstractive summary

**User Story**: 시스템은 국내 30개 매체 RSS를 5분 간격으로 수집해 `articles` 테이블에 저장하고, Claude Haiku 4.5로 2~3문장 abstractive summary를 생성한다.

**Acceptance Criteria**:
```gherkin
Given 매체 화이트리스트(sources_whitelist.yaml)에 30개 매체의 RSS URL이 등록되어 있을 때
When Vercel Cron 5분 트리거로 `/api/cron/ingest-rss`가 실행되면
Then 각 매체 RSS를 병렬 fetch하고
And HTML 엔티티 디코딩 + 광고 스크립트 제거 후 title, summary(원문 일부), url, published_at을 추출하며
And 중복 URL은 건너뛴다

Given 신규 기사가 articles에 insert될 때
When Claude Haiku 4.5에 `prompts/summary/v1.md` 프롬프트로 요약 요청이 전송되면
Then 2~3문장 abstractive summary가 생성되고 articles.summary에 저장되며
And 프롬프트에는 "원문 문장 직접 복사 금지" 강제 조항이 포함된다
And CI 회귀 테스트(golden.jsonl 20 케이스)는 복사율 15% 이하 유지

Given RSS fetch 실패 시 (5xx, timeout)
When exponential backoff 3회 재시도 후
Then 실패 기록을 admin_audit_logs에 남기고 다음 cron에서 재시도

Given 매체 ToS 위반 가능성 플래그가 세팅된 경우
When 해당 매체의 수집이 일시 중단되면
Then admin 대시보드에 경고 표시
```

**Edge Cases**
- 동일 기사 여러 URL (원본 + AMP + mobile) → canonical_url 우선, rel="canonical" 추출
- 기사 본문이 RSS에 full로 포함된 경우 → **summary만 저장, 원문 미저장** (P5 원칙)
- 한자·이체자 표기 → NFKC 정규화
- 이미지 태그 포함 → **이미지 URL 저장 금지** (P7 원칙)

**데이터 요구사항**
- `sources_whitelist.yaml` (Git 관리, ToS 확인 완료 매체만)
- `articles` INSERT 전 `sources.id` 조회, 없으면 수집 차단
- Summary 생성은 Batch API 50% 할인 경로 사용

---

#### F-P0a-2: Python 워커 임베딩 + HDBSCAN 클러스터링

**User Story**: 신규 기사가 삽입되면 Python 워커(Fly.io)가 임베딩을 생성하고 최근 48시간 기사를 HDBSCAN으로 클러스터링한다.

**Acceptance Criteria**:
```gherkin
Given articles 테이블에 신규 row가 insert될 때
When Supabase webhook이 Python 워커의 `/embed` 엔드포인트를 호출하면
Then OpenAI text-embedding-3-small로 1536차원 벡터 생성 후
And articles.embedding, embedding_provider='openai', embedding_model='text-embedding-3-small', embedding_version='2024-02' 저장

Given 1시간 주기 클러스터링 cron 실행 시
When 최근 48시간 articles.embedding을 대상으로 HDBSCAN (min_cluster_size=3, min_samples=2) 수행되면
Then 신규 cluster 생성 또는 기존 cluster에 article 할당되고
And articles.cluster_id 업데이트 + materialized view 재계산(REFRESH MATERIALIZED VIEW CONCURRENTLY)

Given 클러스터 제목 생성 시
When Claude Sonnet 4.6에 prompts/cluster_title/v1.md 프롬프트로 10개 제목 중 대표 생성 요청
Then clusters.title 저장 + prompt_version 기록

Given 임베딩 제공자 장애 시
When fallback provider(Cohere embed-multilingual-v3) 사용
Then 다른 embedding_dim이면 별도 인덱스 + 쿼리 라우팅
```

**Edge Cases**
- 클러스터 노이즈(-1) → 단독 이슈로 처리, 3개 미만 집계 제외
- 임베딩 재생성 필요(프롬프트 버전 변경) → `embedding_version` 기준 재처리 큐
- Python 워커 cold start → Fly.io machine always-on $10/월 옵션

**데이터 요구사항**
- Python 워커: FastAPI + embedchain + hdbscan, Dockerfile Git 관리
- Supabase webhook 시크릿 공유

---

#### F-P0a-3: `/trends` 페이지 (15분 갱신 + SWR polling)

**User Story**: 사용자는 `/trends`에서 7개 카테고리별 Top 10 키워드를 **15분 간격 서버 갱신 + 클라이언트 60초 stale-while-revalidate**로 본다.

**Acceptance Criteria**:
```gherkin
Given 사용자가 `/trends`에 로그인 없이 진입했을 때
When 기본 카테고리 "전체"가 Next.js Server Component로 프리렌더되면
Then 1초 내 Top 10 트렌드 카드가 표시되고
And 각 카드는 public_trends view에서 조회한 데이터(키워드·순위·스코어·source_mix·confidence·sample_size)를 표시한다

Given 클라이언트 60초 타이머 만료 시
When SWR revalidate가 /api/v1/trends로 폴링하면
Then 새 데이터로 부드럽게 교체 (stale-while-revalidate)
And 기존 DOM은 새 데이터 도착까지 유지

Given Naver DataLab 쿼터 소진 or API 장애 시
When trends.source_availability.naver = false로 렌더링되면
Then 카드의 source mix 바에 Naver 구간이 "데이터 없음" 플레이스홀더로 표시되고
And 상단에 "Naver 데이터 일시 소진/장애" 배너

Given 관련 기사 10개 미만
When confidence < 0.5로 산출되면
Then "표본 부족 (N={sample_size})" 배지와 회색 처리

Given 트렌드 카드 "방법론 보기" 클릭 시
When /methodology#trend-formula 앵커로 이동하면
Then 공식 전문 + 가중치 + 제외 키워드 리스트가 표시된다
```

**Edge Cases**
- v1.1과 동일 + "Realtime 없음" 반영
- 첫 방문 15분 이내 → 서버 렌더된 최신 데이터 사용, 이후 SWR
- 모바일 Safari ITP → first-party 쿠키 불필요 (비로그인 P0)

**데이터 요구사항**
- **`public_trends` view 경유** (base `trends` table 직접 노출 금지)
- source_availability, confidence, sample_size 모두 표시 필수

---

#### F-P0a-4: Coverage Distribution Bar v0 (공개 언어 수정)

**User Story**: 사용자는 이슈 카드 및 `/cluster/:id`에서 **"진보 성향 보도권 / 중도·혼합 보도권 / 보수 성향 보도권 / 외신"** 4구간 누적 바로 본다. (공개 UI에서 "Bias"·"편향" 표현 완전 후퇴)

**공개 UI 카피 (v1.2 확정)**:
- 섹션 제목: **"보도 분포 (Coverage Distribution)"**
- 구간 라벨: "진보 성향 / 중도·혼합 / 보수 성향 / 외신"
- 설명 문구: **"이 이슈를 다룬 보도권의 분포입니다. 기사나 매체의 진실 여부를 판단하지 않으며, 방법론 v0 기준 임시 분류입니다."**
- 방법론 배지: "**v0 실험 | v1 예정 2026-10-17**"

**Acceptance Criteria**:
```gherkin
Given cluster_coverage_distribution 뷰가 cluster_id에 대해 >= 5건 집계될 때
When Coverage Distribution Bar 렌더링되면
Then 4구간 누적 바 + methodology_version 배지 + "방법론 보기" 링크 표시

Given 외신 매칭이 있을 때
When 외신 구간이 보라색으로 분리 표시되면
Then 클릭 시 국가별 매체 리스트 (Reuters-미국, AP-미국, BBC-영국) 드로어

Given 기사 수 < 5일 때
When "표본 부족 (N=3)" 플레이스홀더 + 이유 설명
Then 바 자체는 렌더링하지 않음

Given 매체가 dispute_status='reviewing'일 때
When 해당 구간이 반투명 + "검토 중" 배지
Then 일시적 신뢰도 낮음 표시

Given factuality_score는 어떤 경우에도 UI에 노출되지 않음
When API /v1/clusters/:id/bias 응답에도 factuality_score 필드 제외
Then public_view에서 해당 컬럼 SELECT 불가
```

**색상 매핑 (v1.1 유지)**: 진보=teal-500, 중도=slate-400, 보수=amber-600, 외신=violet-500

---

#### F-P0a-5: `/cluster/:id` 이슈 상세

v1.1 F-P0-4와 동일하되, **Coverage Distribution Bar + 분포 카드 공유 버튼 필수 위치**를 한 화면에 배치.

---

#### F-P0a-6: `/methodology` 공개 페이지

v1.1 F-P0-3와 동일하되, **이의제기 폼은 P0b로 이동**. P0a에서는 "이의제기 준비 중, D+30 오픈 예정" 안내.

---

#### F-P0a-7: `/cluster/:id/og` OG 이미지

v1.1 F-P0-6과 동일.

**P0a에 포함된 이유**: 분포 카드는 PMF 측정의 진입점 → 데모 시연 + 카카오톡 공유 리치 프리뷰 조기 확보

---

#### F-P0b-1: Admin 도구 (최소 기능)

v1.1 F-P0-5에서 다음만 포함:
- 키워드 제외 (trend_exclusions INSERT)
- 클러스터 병합 (articles.cluster_id 업데이트)
- 편향 점수 수정 (sources.bias_score + evidence + audit log)
- 이의제기 검토 (bias_disputes 상태 이동)

**P0b 이후 추가**: 클러스터 split, 복잡한 쿼리 빌더, 대량 작업 — v1로 이동

---

#### F-P0b-2: 이의제기 폼

v1.1 F-P0-3의 이의제기 부분만 분리.

**핵심**: 7일 내 응답 SLA 100% 달성 (MVP 물량 적어 수동 대응 가능)

---

#### F-P0b-3: 온보딩 3분 투어 + 대기자

v1.1 F-P0-7 그대로.

---

#### F-P0b-4~6: 보조 데이터 소스

- **Naver DataLab 검증용 (1K/일)**: Top 10 핵심 키워드만 하루 4회 검증
- **BIGKinds 보정**: 하루 2회 동기, 클러스터 누락 교차검증
- **외신 RSS 3개 (Reuters/AP/BBC)**: 1시간 간격, pgvector similarity 0.78+ 매칭

---

#### F-P0b-7: PMF 6단계 퍼널 지표

**목표**: "공유 카드 생성 200건" 단일 지표 → 6단계 퍼널 분해

**PostHog 이벤트 설계**:

| 단계 | 이벤트명 | P0b 목표 | 의미 |
|---|---|---|---|
| 1. 이슈 상세 진입 | `cluster_viewed` | 1,000 | 트래픽 일반성 |
| 2. 공유 버튼 클릭 | `share_opened` | 150 | 관심 구간 |
| 3. OG 생성 성공 | `og_generated` | 120 | 기술 신뢰성 |
| 4. 링크 복사/공유 | `share_completed` | **80** | **진짜 PMF 신호 1** |
| 5. 외부 유입 | `shared_link_opened` | **100** | **진짜 PMF 신호 2** |
| 6. 재방문/대기자 | `shared_user_waitlisted` | 20 | 복합 증거 |

**Exit 판단 기준**:
- ✅ share_completed ≥ 80 AND shared_link_opened ≥ 100 → **V1 전면 착수**
- ⚠️ share_completed ≥ 40 AND shared_link_opened ≥ 50 → V1 범위 축소 재설계
- ❌ 두 지표 모두 미달 → **V1 전면 재설계 또는 pivot**

---

### 5.3 V1 (P1) — 30~180일

v1.1 범위 유지. **전제**: P0b PMF 지표 통과 시에만 착수.

---

### 5.4 V2 (P2) — 180~365일

v1.1 범위 유지.

---

## 6. Technical Requirements

### 6.1 시스템 아키텍처 (v1.2 최종)

```
[Data Sources — P0 축소판]
  RSS 30개 (화이트리스트, ToS 확인 완료)
  Naver Search (P0b: discovery only, 저장 금지)
  Naver DataLab (P0b: 1K/일 검증용)
  BIGKinds (P0b: 하루 2회 보정)
  외신 RSS 3개 (P0b)
            ↓
[Ingestion]  
  Vercel Cron 5~15분 + Supabase Edge Functions (RSS/API fetch)
  Claude Code Routines: 저빈도 전용 (주간 리포트·쇼츠·백업)
            ↓
[Processing — 워커 분리]
  Edge Functions: RSS/API fetch, validation
  Python Worker (Fly.io always-on $10/월): 
    - OpenAI text-embedding-3-small
    - HDBSCAN 클러스터링
    - 클러스터 타이틀 생성 (Claude Sonnet 4.6)
  Claude Haiku 4.5: abstractive summary (Batch API 50%)
            ↓
[Storage — v1.2 구조]    
  Supabase Postgres 15 + pgvector + Storage
  Base Tables (service_role only):
    methodology_versions, sources, articles, clusters,
    trends, trend_exclusions, frames, waitlist, og_cards,
    source_score_evidence, bias_disputes, admin_audit_logs,
    cluster_foreign_matches
  Public Views (anon/authenticated):
    public_sources, public_articles, public_trends, 
    public_clusters, public_frames, public_methodology
  Materialized Views (1시간 refresh):
    cluster_coverage_distribution
            ↓
[Delivery]   
  Next.js 14 (Vercel) + SWR 60s polling (Realtime 없음)
  REST API via public_views
  @vercel/og for OG 이미지
```

**핵심 변경**:
- **C-6**: Naver Search는 ingestion pipeline에서 제거 (discovery only UI 컴포넌트로만)
- **C-7**: Public Views 레이어 신설
- **C-10**: Supabase Realtime 삭제, SWR polling

### 6.2 외부 의존성 & 폴백 (v1.2 확정)

| 서비스 | 역할 | 저장 가능성 | P0 포함 | 단계 |
|---|---|---|---|---|
| 언론사 RSS 30개 | **P0 메인 원천** | 매체별 ToS 화이트리스트 | ✅ | P0a |
| Naver Search | **discovery only, 저장 금지** | 저장·가공 제한 | ⚠️ | P0b (UI 컴포넌트) |
| Naver DataLab | **1K/일 검증용** | 약관 검토 후 제한적 payload | ⚠️ | P0b |
| Daum 실시간 트렌드 | 수동/반자동 참조만 | 공식 API 없음, 자동 스크래핑 금지 | ❌ | V1 |
| BIGKinds LAB | 보정·검증용 | 공공데이터 조건 준수 | ⚠️ | P0b |
| 외신 RSS 3개 (Reuters/AP/BBC) | 외신 매칭 | 매체 RSS ToS 확인 필요 | ⚠️ | P0b |
| Google Trends Alpha | 승인 필요 | Alpha 지원 범위 내 | ❌ | 승인 시 V1 |
| YouTube / X / fal.ai / Replicate | V2 쇼츠 | N/A | ❌ | V2 |
| Anthropic Claude | LLM | 자체 데이터 | ✅ | P0a |
| OpenAI Embedding | 임베딩 | 자체 데이터 | ✅ | P0a |
| Supabase | DB/Auth | 자체 데이터 | ✅ | P0a |
| Vercel | 배포 + @vercel/og | N/A | ✅ | P0a |
| Fly.io Python Worker | 클러스터링 | N/A | ✅ | P0a |
| Resend | 이메일 | 자체 데이터 | ✅ | P0b |
| PostHog Cloud | 분석 | 자체 데이터 | ✅ | P0b |

**P0 월 운영비 최종 예측**:
- Supabase Pro $25
- Vercel Pro $20
- Fly.io always-on $10
- Claude API (Haiku Batch): ~$20
- OpenAI Embedding: ~$5
- Resend free tier: $0
- PostHog free tier: $0
- **합계: ~$80/월 (₩112,000)**

### 6.3 DB 스키마 (v1.2 최종)

**4-Part migration 순서**: Extensions → methodology/sources → clusters/articles → views/materialized views

```sql
-- =====================================
-- PART 1: Extensions (migration 첫 줄 필수)
-- =====================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector

-- =====================================
-- PART 2: Methodology & Sources Infrastructure
-- =====================================

CREATE TABLE methodology_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('bias', 'trend', 'frames', 'blindspot', 'election')),
  version text NOT NULL,
  description text NOT NULL,
  published_url text,
  effective_from timestamptz NOT NULL DEFAULT now(),
  deprecated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scope, version)
);

CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  rss_url text,
  category text NOT NULL CHECK (category IN
    ('daily','broadcast','public','economic','wire','alternative','foreign')),
  -- Internal scoring (never exposed to public API)
  bias_score numeric(3,1) NOT NULL CHECK (bias_score BETWEEN -9.0 AND 9.0),
  factuality_score numeric(3,1) CHECK (factuality_score BETWEEN 0.0 AND 10.0),
  ownership_group text,
  methodology_version_id uuid REFERENCES methodology_versions(id),
  axis_b_chaebol numeric(3,1),
  axis_c_regime_critic numeric(3,1),
  axis_d_sensationalism numeric(3,1),
  is_state_owned boolean DEFAULT false,
  last_reviewed_at timestamptz,
  dispute_status text DEFAULT 'ok' CHECK (dispute_status IN ('ok','reviewing','disputed')),
  tos_confirmed boolean DEFAULT false,  -- v1.2 신규: ToS 확인 완료 매체만 수집
  tos_confirmed_at timestamptz,
  tos_source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE source_score_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id),
  methodology_version_id uuid REFERENCES methodology_versions(id),
  evidence_type text NOT NULL 
    CHECK (evidence_type IN ('expert_panel', 'audience_survey', 'nlp_corpus', 'ownership', 'correction_history', 'external_mapping')),
  evidence_summary text NOT NULL,
  sample_size int,
  confidence numeric(3,2),
  confidence_interval_low numeric(4,3),   -- v1.2 신규
  confidence_interval_high numeric(4,3),  -- v1.2 신규
  published_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bias_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id),
  cluster_id uuid,  -- FK는 아래 ALTER
  article_id uuid,
  claimant_name text,
  claimant_email text NOT NULL,
  claim text NOT NULL,
  status text NOT NULL DEFAULT 'open' 
    CHECK (status IN ('open', 'reviewing', 'accepted', 'rejected', 'published')),
  editor_response text,
  responded_at timestamptz,
  public_log_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_audit_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id text NOT NULL,
  before jsonb,
  after jsonb,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================
-- PART 3: Clusters & Articles
-- =====================================

CREATE TABLE clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  -- v1.2: left_count 등 denormalized count 제거, materialized view로 이동
  blindspot_flag text CHECK (blindspot_flag IN ('left','right')),
  blindspot_score numeric(4,2),
  first_reported_at timestamptz,
  last_updated_at timestamptz,
  velocity_score numeric(5,2),
  category text,
  methodology_version_id uuid REFERENCES methodology_versions(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id),
  title text NOT NULL,
  summary text,  -- abstractive, Haiku 4.5
  url text UNIQUE NOT NULL,
  canonical_url text,
  author text,
  published_at timestamptz NOT NULL,
  cluster_id uuid REFERENCES clusters(id),
  embedding_provider text,
  embedding_model text,
  embedding_dim int,
  embedding_version text,
  embedding vector(1536),
  has_opinion_tag boolean DEFAULT false,
  is_press_release boolean DEFAULT false,
  ingestion_source text NOT NULL CHECK (ingestion_source IN ('rss','bigkinds','manual')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_articles_embedding ON articles USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_articles_cluster ON articles(cluster_id, published_at DESC);

-- bias_disputes FK 추가
ALTER TABLE bias_disputes 
  ADD CONSTRAINT fk_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id),
  ADD CONSTRAINT fk_article FOREIGN KEY (article_id) REFERENCES articles(id);

-- =====================================
-- PART 4: Trends, Frames, Waitlist, OG
-- =====================================

CREATE TABLE trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  keyword_normalized text NOT NULL,
  category text NOT NULL,
  source_mix jsonb NOT NULL,
  source_availability jsonb NOT NULL,
  confidence numeric(3,2) NOT NULL,
  score numeric(6,3) NOT NULL,
  rank int NOT NULL,
  velocity numeric(5,2),
  sample_size int,
  tracked_at timestamptz NOT NULL DEFAULT now(),
  exclusion_reason text
);
CREATE INDEX idx_trends_category_tracked ON trends(category, tracked_at DESC);

CREATE TABLE trend_clusters (
  trend_id uuid REFERENCES trends(id),
  cluster_id uuid REFERENCES clusters(id),
  relevance numeric(4,3) NOT NULL,
  PRIMARY KEY (trend_id, cluster_id)
);

CREATE TABLE trend_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern text NOT NULL,
  reason text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('election','legal','pii','spam','abuse')),
  active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  removed_at timestamptz,
  removed_reason text
);

CREATE TABLE frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid REFERENCES clusters(id),
  source_id uuid REFERENCES sources(id),
  article_id uuid REFERENCES articles(id),
  frame_keywords text[] NOT NULL,
  lead_sentence text,
  headline text,
  confidence numeric(3,2),
  extracted_by text,
  prompt_version text,
  extracted_at timestamptz DEFAULT now()
);

CREATE TABLE waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  referrer text,
  utm_source text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE og_cards (
  cluster_id uuid PRIMARY KEY REFERENCES clusters(id),
  image_url text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  version int NOT NULL DEFAULT 1
);

CREATE TABLE foreign_outlets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  country text NOT NULL,
  state_owned boolean DEFAULT false,
  rss_url text,
  tos_confirmed boolean DEFAULT false
);

CREATE TABLE cluster_foreign_matches (
  cluster_id uuid REFERENCES clusters(id),
  article_id uuid REFERENCES articles(id),
  outlet_id uuid REFERENCES foreign_outlets(id),
  similarity numeric(4,3) NOT NULL,
  matched_at timestamptz DEFAULT now(),
  PRIMARY KEY (cluster_id, article_id)
);

-- =====================================
-- PART 5: Public Views (v1.2 신규 — 정보 유출 차단)
-- =====================================

-- 모든 public read는 view 경유. base table은 anon에서 완전 차단.

REVOKE ALL ON sources, articles, clusters, trends, frames, 
  source_score_evidence, bias_disputes, admin_audit_logs,
  methodology_versions, og_cards, cluster_foreign_matches
FROM anon, authenticated;

CREATE VIEW public_sources AS
SELECT
  id,
  slug,
  name,
  url,
  category,
  ownership_group,
  CASE
    WHEN bias_score <= -2 THEN 'progressive_leaning_coverage'
    WHEN bias_score >= 2 THEN 'conservative_leaning_coverage'
    ELSE 'mixed_or_center_coverage'
  END AS public_coverage_group,
  (SELECT version FROM methodology_versions mv WHERE mv.id = s.methodology_version_id) AS methodology_version,
  last_reviewed_at,
  dispute_status
FROM sources s
WHERE tos_confirmed = true;

CREATE VIEW public_articles AS
SELECT
  a.id,
  a.source_id,
  a.title,
  a.summary,
  a.url,
  a.canonical_url,
  a.published_at,
  a.cluster_id,
  a.has_opinion_tag,
  a.is_press_release,
  a.created_at
FROM articles a
JOIN sources s ON s.id = a.source_id
WHERE s.tos_confirmed = true;
-- embedding, factuality_score 등 내부 필드 제외

CREATE VIEW public_clusters AS
SELECT
  c.id,
  c.title,
  c.summary,
  c.blindspot_flag,
  c.first_reported_at,
  c.last_updated_at,
  c.velocity_score,
  c.category,
  (SELECT version FROM methodology_versions mv WHERE mv.id = c.methodology_version_id) AS methodology_version
FROM clusters c;

CREATE VIEW public_trends AS
SELECT
  id, keyword, keyword_normalized, category,
  source_mix, source_availability, confidence,
  score, rank, velocity, sample_size, tracked_at
FROM trends
WHERE exclusion_reason IS NULL;

CREATE VIEW public_methodology AS
SELECT scope, version, description, published_url, effective_from
FROM methodology_versions
WHERE deprecated_at IS NULL;

-- v1.2 신규: Coverage Distribution as Materialized View
CREATE MATERIALIZED VIEW cluster_coverage_distribution AS
SELECT
  a.cluster_id,
  COUNT(DISTINCT a.source_id) FILTER (
    WHERE s.bias_score <= -2 AND s.category != 'foreign'
  ) AS progressive_count,
  COUNT(DISTINCT a.source_id) FILTER (
    WHERE s.bias_score > -2 AND s.bias_score < 2 AND s.category != 'foreign'
  ) AS mixed_count,
  COUNT(DISTINCT a.source_id) FILTER (
    WHERE s.bias_score >= 2 AND s.category != 'foreign'
  ) AS conservative_count,
  COUNT(DISTINCT a.source_id) FILTER (
    WHERE s.category = 'foreign'
  ) AS foreign_count,
  COUNT(DISTINCT a.id) AS total_articles,
  MAX(a.published_at) AS latest_article_at
FROM articles a
JOIN sources s ON s.id = a.source_id
WHERE a.is_press_release = false
  AND s.tos_confirmed = true
GROUP BY a.cluster_id;

CREATE UNIQUE INDEX idx_ccd_cluster ON cluster_coverage_distribution(cluster_id);

-- Public view on materialized view
CREATE VIEW public_cluster_coverage AS
SELECT 
  cluster_id,
  progressive_count,
  mixed_count,
  conservative_count,
  foreign_count,
  total_articles,
  latest_article_at,
  CASE 
    WHEN total_articles < 5 THEN 'insufficient_sample'
    WHEN total_articles < 10 THEN 'low_confidence'
    ELSE 'sufficient'
  END AS sample_quality
FROM cluster_coverage_distribution;

-- GRANT to public
GRANT SELECT ON public_sources TO anon, authenticated;
GRANT SELECT ON public_articles TO anon, authenticated;
GRANT SELECT ON public_clusters TO anon, authenticated;
GRANT SELECT ON public_trends TO anon, authenticated;
GRANT SELECT ON public_methodology TO anon, authenticated;
GRANT SELECT ON public_cluster_coverage TO anon, authenticated;

-- POST endpoints: waitlist, bias_disputes는 RLS로 제어
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY waitlist_insert ON waitlist FOR INSERT TO anon WITH CHECK (true);

ALTER TABLE bias_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY disputes_insert ON bias_disputes FOR INSERT TO anon WITH CHECK (
  claim IS NOT NULL AND claimant_email IS NOT NULL
);
CREATE POLICY disputes_public_read ON bias_disputes FOR SELECT TO anon USING (
  status = 'published'
);

-- =====================================
-- Materialized View 자동 refresh
-- =====================================

-- Supabase pg_cron으로 1시간마다 refresh (Edge Function or psql)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY cluster_coverage_distribution;
```

### 6.4 API 설계 (v1.2 — Public View 기반)

- Base URL: `https://api.tteuniyu.com/v1`
- **P0는 public read only + 최소 POST** (로그인 없음)
- **모든 GET 엔드포인트는 public view만 경유**
- Rate Limit: 공개 60/min/ip
- 인증: `X-API-Key` (향후 B2B)

**P0 엔드포인트 (최종)**
- `GET /trends?category=&limit=` → public_trends
- `GET /trends/exclusions` → trend_exclusions (active=true만)
- `GET /clusters/:id` → public_clusters + public_cluster_coverage
- `GET /clusters/:id/articles` → public_articles (cluster_id 필터)
- `GET /clusters/:id/coverage` → public_cluster_coverage
- `GET /clusters/:id/foreign` → cluster_foreign_matches (P0b)
- `GET /cluster/:id/og` → @vercel/og 생성 (24시간 캐시)
- `GET /methodology` → public_methodology
- `POST /waitlist` → waitlist INSERT
- `POST /disputes` → bias_disputes INSERT (status='open')

**금지 엔드포인트** (의도적 부재):
- ❌ `GET /sources/:id/bias_score` — 숫자 직접 노출 금지
- ❌ `GET /articles/:id/factuality` — factuality 공개 금지
- ❌ `GET /articles/:id/embedding` — 임베딩 공개 금지

### 6.5 Harness 프롬프트 관리 (v1.1 유지)

`/prompts/summary/v1.md`, `/prompts/cluster_title/v1.md`, `/prompts/frames/v1.md` 등.

---

## 7. Non-Functional Requirements

### 7.1 Performance (v1.2 — Realtime 제외 명시)

- LCP ≤ 2.5s / INP ≤ 200ms
- 카테고리 탭 ≤ 200ms / Coverage Bar 렌더 ≤ 100ms
- **트렌드 업데이트 UI 반영 ≤ 60s (P0, SWR polling)**
- **Realtime CDC는 V1 도입**
- API p95 ≤ 500ms / p99 ≤ 1s (public view JOIN 비용 고려)
- Lighthouse 85+ (P0a), 90+ (P0b)
- materialized view refresh ≤ 10s (1시간 1회)

### 7.2 Security (v1.2 강화)

- TLS 1.3 + HSTS
- **Supabase base table 완전 차단** (anon/authenticated REVOKE)
- **모든 public read는 view 경유**
- RLS: waitlist INSERT, bias_disputes INSERT/published SELECT만
- **service_role 키는 서버 환경변수로만 관리, 클라이언트 코드 노출 금지**
- API Key 90일 로테이션 (V1)
- OWASP ASVS L1 (P0)
- Sentry + Dependabot
- CSP strict

### 7.3 Accessibility (v1.1 유지)

### 7.4 Legal Compliance (v1.2 데이터 라이선스 추가)

**저작권법 제7·28조** (v1.1 유지)
- 전문 미저장
- abstractive summary 2~3문장 + 아웃링크
- 썸네일·매체 로고 사용 금지

**정보통신망법 제70조** (v1.1 유지)

**언론중재법 제17조의2** (v1.1 유지)

**공직선거법 제8조의6** (v1.1 Election Safety Pipeline 유지)

**AI 기본법 제31조** (v1.1 해석 유지)

**개인정보보호법** (v1.1 유지)

**GDPR** (V1 이후)

**(v1.2 신규) 데이터 소스 이용약관**
- **Naver Search API**: 결과 저장·가공 제한 약관 준수. P0에서 기사 저장 파이프라인에서 제외, discovery only UI 컴포넌트로만 사용. 향후 공식 문의·법무 자문 결과에 따라 승격 검토
- **Naver DataLab**: payload 저장 최소화, 집계 결과만 활용
- **BIGKinds**: 공공데이터 포털 이용 조건 준수, 재배포 금지
- **외신 RSS**: Reuters/AP/BBC 개별 RSS ToS 확인, 제목+리드 1문장+아웃링크 원칙
- **언론사 RSS 30개**: 스프린트 0에서 ToS 매트릭스 작성, `sources.tos_confirmed=true` 매체만 수집 활성화
- **Daum 실시간 트렌드**: 공식 API 없음, 자동 스크래핑 금지. P0 제외, V1에서 공식 API 협의

### 7.5 Observability (v1.1 유지)
### 7.6 Scalability (v1.1 유지)

---

## 8. Success Metrics (4 Layers, v1.2 수정)

### Layer 1 — North Star
**WDDU**: MDDI ≥ 0.6 유지 WAU — **V1에서 측정 시작** (P0는 로그인 없어 개인 추적 불가)

### Layer 2 — Product (v1.2 분할 반영)

| 지표 | P0a(14d) | P0b(30d) | V1(180d) | V2(365d) |
|---|---|---|---|---|
| DAU | 50 | 150 | 5,000 | 20,000 |
| WAU | 150 | 500 | 18,000 | 60,000 |
| MAU | 300 | 1,000 | 30,000 | 100,000 |
| **cluster_viewed** | 300 | **1,000** | 30,000 | 150,000 |
| **share_opened** | 40 | **150** | 4,500 | 22,500 |
| **og_generated** | 30 | **120** | 4,000 | 20,000 |
| **share_completed** | 20 | **80** | 2,500 | 12,500 |
| **shared_link_opened** | 25 | **100** | 3,500 | 17,500 |
| **방법론 조회율 WAU 중** | 10% | **10%** | 7% | 5% |

### Layer 3 — Business (v1.1 유지)

### Layer 4 — Mission (v1.1 유지, 단 WDDU는 V1부터)

---

## 9. Release Plan (v1.2 — P0a/P0b 분할)

### Phase 0 — Sprint 0 Pre-Dev (D0~D2, 2026-04-18 ~ 2026-04-20)

**개발 이전 잠금 작업 (코드 한 줄 금지)**

- [ ] **법무 자문 변호사 계약** + 5대 질문지 전달
- [ ] **Naver Developer 고객센터 공식 문의** 발송 (DataLab 1K/일 + Search 저장·가공 범위 확인)
- [ ] **RSS 30개 매체 ToS 확인 매트릭스** 작성 (`docs/data-licensing.md`)
- [ ] **Public View / RLS 설계 최종화** (`docs/db-access-control.md`)
- [ ] **Methodology v0 초안 작성** (`docs/methodology-v0.md`)
- [ ] 도메인 확보 + Supabase 프로젝트 생성

### Phase 1a — P0a 신뢰 데모 (D2~D14, 2026-04-20 ~ 2026-05-01)

**산출물**
- Migration 5-part 실행 (Extensions → Methodology → Clusters → Articles → Views)
- 화이트리스트 매체 RSS 수집 (ToS 확인 완료만)
- Python 워커 (Fly.io) 임베딩 + HDBSCAN
- `/trends` 페이지 (15분 갱신 + SWR)
- Coverage Distribution Bar v0 (공개 언어)
- `/cluster/:id` 이슈 상세
- `/methodology` 페이지 (이의제기 "D+30 오픈" 안내)
- `/cluster/:id/og` OG 이미지
- PostHog + Sentry 셋업

**P0a Exit Criteria**
- ✅ Migration 실행 성공 (5-part, 에러 0)
- ✅ Public View에서만 public data 접근 (base table anon GRANT 0건)
- ✅ 15개 이상 매체에서 기사 수집 진행 중 (ToS 확인된 매체만)
- ✅ 클러스터 50개 이상 형성
- ✅ 트렌드 p95 ≤ 15분
- ✅ Coverage Bar 렌더 동작
- ✅ OG 이미지 생성 동작
- ✅ Lighthouse Performance 85+
- ✅ **factuality_score가 public API 응답에 미포함** (테스트 자동화)

### Phase 1b — P0b 클로즈드 알파 (D14~D30, 2026-05-01 ~ 2026-05-17)

**산출물**
- Admin 도구 최소 기능 (키워드 제외·클러스터 병합·편향 수정)
- 이의제기 폼 + 7일 SLA end-to-end
- 온보딩 3분 투어 + 대기자 이메일 수집
- Naver DataLab 검증용 연동 (1K/일)
- BIGKinds 보정 연동
- 외신 RSS 3개 매칭
- PMF 6단계 퍼널 대시보드
- 클로즈드 알파 초대 100명

**P0b Exit Criteria**
- ✅ 대기자 1,000명 확보
- ✅ 클로즈드 알파 100명 온보딩
- ✅ 잘못 묶인 클러스터 비율 ≤ 10% (수동 샘플 100건)
- ✅ 표본 부족 표시 정확도 100%
- ✅ 방법론 페이지 조회율 WAU 중 10%
- ✅ 이의제기 7일 내 100% 응답 (SLA)
- ✅ **share_completed ≥ 80**
- ✅ **shared_link_opened ≥ 100**
- ✅ 매체 ToS 이슈 발생 0건

### Phase 2 — V0.5 (D30~D90)

**착수 전제 (v1.2 강화)**:
- share_completed + shared_link_opened 두 지표 모두 달성 시에만 V1 착수
- **미달 시**: V1 범위 축소 또는 pivot 검토 후 다음 단계 재설계

### Phase 3 — V1 (D90~D180), Phase 4 — V2 (D180~D365)

v1.1 유지.

---

## 10. Open Questions (v1.2 — 3개 추가)

**v1.1 15개 + v1.2 신규 6개 = 총 24개**

### v1.1 유지 (Q-1 ~ Q-23)

### v1.2 신규

24. **Q-24 Naver Search API 저장 범위 공식 확인**: 고객센터 문의 결과에 따라 P0b 축소 / V1 승격 / 완전 제외 판단 — **D+7 결정**
25. **Q-25 RSS 30개 매체 ToS 준수 수준**: 전수 화이트리스트(보수적) vs 명시 금지 매체만 블랙리스트(공격적) — **D+7 변호사 자문 반영**
26. **Q-26 Public View 반환 필드 최종**: 언어학적 coverage group 명칭("progressive_leaning_coverage") 그대로 노출 vs 한글 별칭만 노출 — **D+14 디자인 리뷰**

---

## 11. Appendix

### 11.1 용어집 (v1.2 추가)

- **Coverage Distribution**: 공개 UI에서 "보도 분포". 내부 DB는 `bias_score` 기반
- **Public View**: anon/authenticated에 GRANT되는 view. base table 직접 노출 금지
- **ToS Whitelist**: `sources.tos_confirmed=true` 매체만 수집·표시
- **PMF 6-step Funnel**: cluster_viewed → share_opened → og_generated → share_completed → shared_link_opened → shared_user_waitlisted

### 11.2 데이터 권리·저장 가능성 매트릭스 (v1.2 신규)

| 소스 | 이용 조건 | 저장 가능성 | P0 역할 | 승급 조건 |
|---|---|---|---|---|
| 언론사 RSS 30개 | 매체별 RSS 헤더·robots.txt 확인 | 제목+abstractive summary+URL OK, 이미지/로고 금지 | ✅ P0a 메인 | ToS 확인 완료 시 활성화 |
| Naver Search | 저장·가공 제한 | discovery only, 저장 금지 | ⚠️ P0b (UI만) | 공식 문의 결과 반영 |
| Naver DataLab | 1K/일, payload 최소 저장 | 집계값만, 키워드 리스트 저장 OK | ⚠️ P0b 검증용 | 공식 문의 결과 |
| BIGKinds | 공공데이터 조건 | 제목/메타 OK, 전문 금지, 재배포 금지 | ⚠️ P0b 보정 | 연구용 조건 확인 |
| Daum 실시간 | 공식 API 없음, 자동 스크래핑 금지 | 저장 불가 | ❌ P0 제외 | V1에서 공식 API 협의 |
| Reuters/AP/BBC RSS | 각 매체 RSS ToS | 제목+리드 1문장+URL | ⚠️ P0b | 매체별 ToS 확인 |
| Google Trends Alpha | 승인 필요 | 집계 데이터 저장 조건 내 | ❌ 승인 대기 | Alpha 승인 |
| YouTube / X / fal.ai | V2 | N/A | ❌ V2 | V2 킥오프 |

### 11.3 v1.2 Sprint 0 체크리스트 (개발 착수 전 필수)

- [ ] Q-24~26 결정 완료
- [ ] 법무 자문 1차 결과 (편향 라벨·선거법·썸네일·API ToS·방법론 공개 수준)
- [ ] sources_whitelist.yaml 30개 매체 tos_confirmed 플래그 설정
- [ ] Migration SQL 5-part 드라이런 성공
- [ ] Public View 설계 리뷰 (base table GRANT 0건 검증)
- [ ] Methodology v0 문서 공개 URL 준비
- [ ] 이의제기 SLA 7일 운영 매뉴얼 작성

### 11.4 Verification v1.2 (완료 판정)

- [x] Changelog v1.1→v1.2 섹션 존재
- [x] C-6~C-10 Critical 모두 반영
- [x] P0a/P0b 분할 + Exit Criteria 각각 명시
- [x] Public View SQL 포함
- [x] Materialized View 설계
- [x] Data Licensing Matrix 포함
- [x] Sprint 0 체크리스트 6개 이상
- [x] PMF 6단계 퍼널 지표 명시
- [x] Naver Search discovery only 명시
- [x] methodology_versions FK 수정
- [x] CREATE EXTENSION 추가
- [x] HITL CHECK constraint 표현 정직화
- [x] confidence_interval 스키마 반영
- [x] "Bias" → "Coverage" 공개 언어 수정

**End of PRD v1.2 — 2026-04-18**
