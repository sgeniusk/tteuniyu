# 운영 셋업 가이드 — P0a 본격 가동 전 사용자 액션

> **작성일**: 2026-05-15 (P0a 진입 직전)
> **대상**: 사용자(태욱) 본인이 외부 환경 셋업 시 참고
> **선행 조건**: PR #28~#31 + D2a (sources whitelist 활성화) 머지 완료

---

## 0. 한 페이지 요약

코드 작업은 모두 끝났다. 이제 **3가지 외부 환경**을 셋업하면 P0a 워커가 본격 가동된다.

| 단계 | 작업 | 시간 | 비용 |
|---|---|---|---|
| 1 | Supabase project 생성 + migrations 실행 | 15분 | Free tier OK (500MB DB + 50K auth users) |
| 2 | GitHub Actions Secrets 등록 | 5분 | 0 |
| 3 | Resend 계정 + 도메인 인증 | 30분 | Free 100건/일 (월 3K) |
| (옵션) | Gemini API key 발급 | 5분 | Pay-as-you-go (예상 $0.10/월) |

---

## 1. Supabase project 생성

### 1.1 Project 생성 (10분)

1. https://supabase.com/dashboard 로그인
2. **New project** → 이름 `tteuniyu-prod` (또는 `tteuniyu-staging` 별도)
3. Region — **Northeast Asia (Seoul)** 권장 (한국 사용자 latency)
4. Database password — 강력하게 (1Password 저장)
5. Plan — **Free** (P0a 단계 충분)

### 1.2 pgvector extension enable

대시보드 → Database → Extensions → `vector` 검색 → **Enable**.
(ADR-018 user_topics 테이블 의존성)

### 1.3 Migrations 실행

CLI 권장 — Supabase CLI 설치 후.

```bash
brew install supabase/tap/supabase
cd ~/dev/tteuniyu
supabase link --project-ref <your-project-ref>
supabase db push
```

또는 대시보드 → SQL Editor에서 `supabase/migrations/` 4개 파일 순서대로 직접 실행.
- `00010_embed_installations.sql`
- `00011_waitlist_expansion.sql`
- `00020_p0a_foundation_schema.sql`
- `00021_p0a_grants.sql`
- `00030_adr017_digest_subscriptions.sql`
- `00031_adr018_user_topics.sql`

### 1.4 검증

대시보드 → Table Editor에 다음 테이블 보이면 성공.
- sources / articles / clusters / cluster_articles / summaries
- digest_subscriptions / digest_send_log
- user_topics / user_topic_matches
- 등

---

## 2. GitHub Actions Secrets

### 2.1 Secrets 등록

Repo → Settings → Secrets and variables → Actions → **New repository secret**.

| Name | Value | 출처 |
|---|---|---|
| `SUPABASE_URL` | `https://<ref>.supabase.co` | Supabase Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Supabase Settings → API → service_role (절대 노출 X) |
| `GEMINI_API_KEY` | `AIza...` | https://makersuite.google.com/app/apikey |
| `SLACK_WEBHOOK_URL` | (선택) | Slack workspace → Apps → Incoming Webhooks |
| `RESEND_API_KEY` | `re_xxx` | (3단계 후) — https://resend.com/api-keys |

### 2.2 GHA workflow 검증

```bash
gh workflow run p0a-worker.yml --field command=ingest
gh run list --workflow=p0a-worker.yml --limit 1
```

**dry-run** 또는 **ingest** 둘 다 활성 source 30개 fetch 시도. SUPABASE_URL이 placeholder가 아닌 실 URL이면 articles 테이블에 INSERT됨.

---

## 3. Resend (이메일 발송) — ADR-017 Daily Digest 진입 시

### 3.1 계정 생성 (10분)

1. https://resend.com/signup
2. **Free plan** — 일 100건 + 월 3,000건
3. **Pro plan** $20/월 — 일 10K + 월 50K (사용자 1,000명+ 도달 시)

### 3.2 도메인 인증 (20분)

1. Resend Dashboard → Domains → Add domain → `tteuniyu.com`
2. 표시되는 DNS 레코드 (SPF + DKIM + DMARC)를 도메인 등록기관에 등록
   - SPF — `v=spf1 include:amazonses.com ~all`
   - DKIM — `resend._domainkey` (Resend가 제공)
   - DMARC — `v=DMARC1; p=quarantine; rua=mailto:dmarc@tteuniyu.com`
3. Verify → 대기 (1-24시간)

### 3.3 도메인 미확보 시

`onboarding@resend.dev` 같은 발신자로 일단 테스트 가능. 단 production 발송 시 도메인 인증 필수.

---

## 4. Gemini API key (선택, T-006 Step 5 LLM 활성화 시)

1. https://makersuite.google.com/app/apikey
2. Create API key
3. GitHub Secrets에 `GEMINI_API_KEY` 등록
4. GHA workflow env에 `LLM_BACKEND=gemini` 추가 (또는 worker 실행 시 `LLM_BACKEND=gemini` 사용)

비용 — Gemini 2.0 Flash $0.0001 input + $0.0004 output / 1K tokens. ADR-014 cap $50/월.

---

## 5. 매체 ToS 활성화 (D2a 본 PR로 완료)

`config/sources_whitelist.yaml` 30개 매체 모두 활성화 완료 (변호사 권고 받음).

만약 특정 매체에 문제 발생 (404 / 403 / 라이선스 분쟁) 시 해당 entry 비활성화.

```yaml
- slug: reuters
  ingestion_enabled: false  # 일시 비활성
  notes: 2026-05-XX 라이선스 검토 중
```

---

## 6. 가동 흐름 (셋업 완료 후)

```
[1] GHA cron 매 시간 정각
       ↓
[2] worker dry-run 또는 ingest
       ↓
[3] 30 매체 RSS fetch → entries
       ↓
[4] 각 entry HTML fetch → trafilatura 본문 추출 (RAM only)
       ↓
[5] 임베딩 (sentence-transformers stub or paraphrase-multilingual-MiniLM)
       ↓
[6] 클러스터링 (Agglomerative threshold 0.7 또는 HDBSCAN)
       ↓
[7] articles + clusters + cluster_articles INSERT
       ↓
[8] LLM 요약 (Gemini Flash) — why_trending + coverage_summary
       ↓
[9] Trust Signal LLM — hoax/clickbait/investment 평가
       ↓
[10] summaries INSERT + audit log
       ↓
[11] (Daily Digest cron, 09:00 KST) 어제 24h 클러스터 + Custom Topic 매칭 → Resend 발송
       ↓
[12] /widget API 응답 mock 대신 DB 사용 (env flag)
```

---

## 7. 운영 체크리스트 (가동 후 1주)

- [ ] GHA cron 매 시간 정상 실행 (Actions tab)
- [ ] Supabase articles 시간당 ≥ 100건 적재
- [ ] Supabase clusters 일 ≥ 30 cluster 형성
- [ ] LLM cost monitor 일 누적 < $1.7 (월 $50 / 30일)
- [ ] hoax/clickbait 태그 부여된 클러스터 수동 검토 (human_review_required=true)
- [ ] Resend Daily Digest open rate ≥ 35% (목표)

---

**End of Setup Guide — 2026-05-15**
