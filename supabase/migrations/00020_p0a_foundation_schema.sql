-- 00020_p0a_foundation_schema.sql
-- T-006 / P0a Foundation — RSS 워커 + 클러스터링 + LLM 요약을 위한 기본 스키마.
--
-- Sources of truth.
--   PRD v1.7 §6 Data Source Strategy + v1.7.2 patch
--   ADR-007 Amendment 1 (제휴 데이터 경계)
--   ADR-014 (LLM 비용·캐시 + audit log)
--   ADR-015 Amendment 2 (Trust Signal & Investment Risk + 변호사 권고 audit log)
--   ADR-016 (Privacy & Data Boundary, PIPA 단계적 정비)
--   CLAUDE.md 비협상 1~15조 (특히 rule 2/3/4/7/9/11/13/15)
--
-- 비협상 준수.
--   - rule 2 — articles.body 저장 X. headline + url + body_summary(≤15% copy ratio)만.
--   - rule 3 — image URL/thumbnail 저장 X (P0). 모든 image* 컬럼 부재.
--   - rule 4 — bias_score/factuality_score/embedding raw fields 공개 API 노출 X.
--             (embedding은 worker 내부 RAM에서만 처리 후 즉시 폐기 — 본 schema에 없음)
--   - rule 7 — sources에 tos_confirmed=true AND ingestion_enabled=true 두 플래그 모두.
--   - rule 9 — 모든 LLM call은 prompt_version + model + input_hash + output_hash 로그.
--   - rule 11 — anon/authenticated에 grant 없음. service_role + Next.js /api/v1/* 경유.
--   - rule 15 — Trust Tag internal field 4종 (hoax/clickbait/low_confidence/investment).
--             UI 라벨은 components/TrustTag.tsx에서 매핑 (검증 필요/제목-본문 괴리 가능성/
--             표본 부족/기업 관련 이슈).
--
-- 다음 migration.
--   00021_p0a_grants.sql — RLS enable + service_role only grants.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- sources — 매체 whitelist (config/sources_whitelist.yaml과 동기화)
--
-- harness:tos-whitelist가 yaml 파일과 본 테이블 정합성 검증 (P0a 진입 시).
-- ============================================================

CREATE TABLE IF NOT EXISTS sources (
  slug                TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  rss_url             TEXT NOT NULL,
  base_url            TEXT NOT NULL,
  -- 정정 요청 채널 (정통망법 §44-2 + ADR-015 A2.7)
  contact_email       TEXT,
  -- CLAUDE.md rule 7 — 두 플래그 모두 true여야 ingest 허용
  tos_confirmed       BOOLEAN NOT NULL DEFAULT false,
  ingestion_enabled   BOOLEAN NOT NULL DEFAULT false,
  confirmed_at        TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sources_active
  ON sources (slug)
  WHERE tos_confirmed = true AND ingestion_enabled = true;

-- ============================================================
-- articles — 1차 데이터 (RSS 수집)
--
-- 비협상 (CLAUDE.md rule 2/3) — body 저장 X, image URL 저장 X.
-- body_summary는 ADR-014 LLM 워커가 채움 (≤ 15% copy ratio, harness 강제).
-- ============================================================

CREATE TABLE IF NOT EXISTS articles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug                 TEXT NOT NULL REFERENCES sources(slug),
  url                         TEXT NOT NULL UNIQUE,
  headline                    TEXT NOT NULL CHECK (length(headline) BETWEEN 1 AND 300),
  -- ADR-014 LLM 출력 + audit log (CLAUDE.md rule 9)
  body_summary                TEXT CHECK (body_summary IS NULL OR length(body_summary) <= 1000),
  body_summary_model          TEXT,
  body_summary_prompt_version TEXT,
  body_summary_copy_ratio     NUMERIC(4,3) CHECK (body_summary_copy_ratio IS NULL
                                                  OR body_summary_copy_ratio BETWEEN 0 AND 1),
  body_summary_generated_at   TIMESTAMPTZ,
  -- ADR-013 — 본론 추출 토글 (별도 LLM 호출 결과)
  body_extracted              TEXT CHECK (body_extracted IS NULL OR length(body_extracted) <= 2000),
  body_extracted_model        TEXT,
  body_extracted_prompt_version TEXT,
  published_at                TIMESTAMPTZ NOT NULL,
  ingested_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_published
  ON articles (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_source_published
  ON articles (source_slug, published_at DESC);

-- ============================================================
-- clusters — 같은 이슈 묶음
--
-- ADR-015 Amendment 2 — trust_tags는 internal field 4종 (hoax/clickbait/
-- low_confidence/investment) 부분집합. UI 라벨은 components/TrustTag.tsx에서.
--
-- coverage는 4-channel internal — UI 표시 X (ADR-009 Amendment 1 — 이념 라벨 폐기).
-- 보조 통계 + 정책 결정용으로만.
-- ============================================================

CREATE TABLE IF NOT EXISTS clusters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 60),
  category            TEXT CHECK (category IN (
                        'politics','society','economy','international',
                        'tech_science','culture_sports','lifestyle')),
  sample_quality      TEXT NOT NULL CHECK (sample_quality IN (
                        'insufficient_sample','low_confidence','sufficient')),
  -- ADR-015 Trust Tag internal fields
  trust_tags          TEXT[] NOT NULL DEFAULT '{}',
  hoax_likelihood     NUMERIC(3,2) CHECK (hoax_likelihood IS NULL
                                          OR hoax_likelihood BETWEEN 0 AND 1),
  clickbait_score     NUMERIC(3,2) CHECK (clickbait_score IS NULL
                                          OR clickbait_score BETWEEN 0 AND 1),
  is_investment       BOOLEAN NOT NULL DEFAULT false,
  -- ADR-007 + PRD §9.7 + ADR-007 Amendment 1 — politics/elections + 18+ 민감
  -- 카테고리는 false. AdZone family는 절대 부여 X.
  ad_allowed          BOOLEAN NOT NULL DEFAULT true,
  outlets_count       INT NOT NULL DEFAULT 0,
  -- 4-channel internal (UI 노출 금지, ADR-009 Amendment 1)
  coverage            JSONB NOT NULL DEFAULT
                        '{"progressive":0,"mixed":0,"conservative":0,"foreign":0}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clusters_updated
  ON clusters (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_clusters_category_updated
  ON clusters (category, updated_at DESC);

-- Trust Tag 빈도 통계용 partial index
CREATE INDEX IF NOT EXISTS idx_clusters_with_trust_tags
  ON clusters (created_at DESC)
  WHERE array_length(trust_tags, 1) > 0;

-- ============================================================
-- cluster_articles — 다대다 (article ↔ cluster)
-- ============================================================

CREATE TABLE IF NOT EXISTS cluster_articles (
  cluster_id  UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  article_id  UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cluster_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_cluster_articles_article
  ON cluster_articles (article_id);

-- ============================================================
-- summaries — Cluster-level AI 요약 + audit log (ADR-015 A2.5)
--
-- 변호사 권고 — audit log는 면책 수단이 아닌 사후 검증·분쟁 대응용.
-- ============================================================

CREATE TABLE IF NOT EXISTS summaries (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id                  UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  why_trending                TEXT NOT NULL CHECK (length(why_trending) BETWEEN 1 AND 500),
  coverage_summary            TEXT NOT NULL CHECK (length(coverage_summary) BETWEEN 1 AND 800),
  -- LLM call audit log (CLAUDE.md rule 9 + ADR-015 A2.5)
  model                       TEXT NOT NULL,
  prompt_version              TEXT NOT NULL,
  input_hash                  TEXT NOT NULL,
  output_hash                 TEXT NOT NULL,
  validator_version           TEXT,
  copy_ratio                  NUMERIC(4,3) CHECK (copy_ratio IS NULL
                                                  OR copy_ratio BETWEEN 0 AND 1),
  blocked_terms_result        TEXT NOT NULL CHECK (blocked_terms_result IN (
                                'pass','blocked','unknown')),
  human_review_required       BOOLEAN NOT NULL DEFAULT false,
  generated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_summaries_cluster
  ON summaries (cluster_id, generated_at DESC);

-- ============================================================
-- correction_history — 정정 요청 (ADR-015 A2.7 + 정통망법 §44-2)
--
-- risk-based 자동 사람 검토 큐 진입 + 매체/당사자 정정 요청 처리 이력.
-- ============================================================

CREATE TABLE IF NOT EXISTS correction_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id          UUID REFERENCES clusters(id) ON DELETE SET NULL,
  article_id          UUID REFERENCES articles(id) ON DELETE SET NULL,
  source_slug         TEXT REFERENCES sources(slug),
  requester_kind      TEXT NOT NULL CHECK (requester_kind IN (
                        'user','outlet','data_subject','self_audit','auto_queue')),
  requester_email     TEXT,
  reason              TEXT NOT NULL CHECK (length(reason) BETWEEN 1 AND 2000),
  resolution          TEXT CHECK (resolution IS NULL OR resolution IN (
                        'pending','accepted','rejected','tag_removed',
                        'content_amended','content_removed','escalated')),
  resolution_note     TEXT,
  resolved_at         TIMESTAMPTZ,
  resolved_by         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_correction_history_cluster
  ON correction_history (cluster_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_correction_history_pending
  ON correction_history (created_at DESC)
  WHERE resolution IS NULL OR resolution = 'pending';

-- ============================================================
-- user_consent — PIPA 동의 + 보유·파기 추적 (ADR-016)
--
-- ADR-016 — P0a 단계적 정비. 만 14세 미만 차단 (PIPA §22-2).
-- 13개월 보유 후 자동 파기 cron.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_consent (
  user_id                       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  required_consent_version      TEXT NOT NULL,
  required_consent_at           TIMESTAMPTZ NOT NULL,
  marketing_consent             BOOLEAN NOT NULL DEFAULT false,
  marketing_consent_at          TIMESTAMPTZ,
  posthog_overseas_consent      BOOLEAN NOT NULL DEFAULT false,
  posthog_overseas_consent_at   TIMESTAMPTZ,
  birth_year                    SMALLINT NOT NULL CHECK (
                                  birth_year BETWEEN 1900
                                                AND extract(year FROM now())::int
                                ),
  -- PIPA §22-2 enforcement (P0a — 만 14세 미만 가입 X)
  CONSTRAINT user_consent_min_age_14
    CHECK ((extract(year FROM now())::int - birth_year) >= 14),
  withdrawn_at                  TIMESTAMPTZ,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_consent_required_at
  ON user_consent (required_consent_at);

CREATE INDEX IF NOT EXISTS idx_user_consent_withdrawn_at
  ON user_consent (withdrawn_at)
  WHERE withdrawn_at IS NOT NULL;

-- ============================================================
-- audit_logs — 통합 audit (LLM call + retention cron + correction + tos_change)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        TEXT NOT NULL CHECK (kind IN (
                'llm_call','retention_cron','correction','tos_change',
                'consent_change','source_activated','source_deactivated')),
  entity_id   UUID,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_kind_created
  ON audit_logs (kind, created_at DESC);

-- ============================================================
-- updated_at 자동 갱신 trigger
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_clusters_updated_at
  BEFORE UPDATE ON clusters
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
