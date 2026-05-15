-- ADR-018 Custom Topic Tracking — user_topics + user_topic_matches + RLS
--
-- 비협상.
--   - rule 11 — service_role + RLS own data only
--   - rule 4 — embedding raw값 worker RAM only, DB는 cosine 매칭 결과만
--   - 변호사 §1.3 — 키워드 입력 시 hard-block 40+ 단어 거부 (애플리케이션 layer)
--   - PIPA §22-2 만 14세 미만 (ADR-016) — 부모 user_id 부재로 자동 차단
--
-- pgvector 의존성 — Supabase Pro 기본 지원. 미설치 환경에서는 Cluster Plan
-- Setting → Extensions → pgvector enable 필요.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS user_topics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword         TEXT NOT NULL CHECK (length(keyword) BETWEEN 1 AND 40),
  -- ADR-014 paraphrase-multilingual-MiniLM-L12-v2 출력 차원
  embedding       VECTOR(384),
  active          BOOLEAN NOT NULL DEFAULT true,
  -- ADR-018 §2.3 — Pro 단순 / Creator 의미적 / Leader 학습
  matching_mode   TEXT NOT NULL DEFAULT 'exact'
                    CHECK (matching_mode IN ('exact', 'similar', 'learned')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_matched_at TIMESTAMPTZ,
  match_count     INT NOT NULL DEFAULT 0,
  CONSTRAINT user_topics_user_keyword_unique UNIQUE (user_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_user_topics_active_user
  ON user_topics (user_id) WHERE active = true;

-- pgvector HNSW 인덱스는 V0.5+ 사용자 100K+ 시 추가 (현 단계는 brute force OK).
-- CREATE INDEX user_topics_embedding_hnsw
--   ON user_topics USING hnsw (embedding vector_cosine_ops);

-- ─── 매칭 이력 (사용자 피드백 + 학습 모드 데이터) ────────────────────

CREATE TABLE IF NOT EXISTS user_topic_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        UUID NOT NULL REFERENCES user_topics(id) ON DELETE CASCADE,
  cluster_id      UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  similarity      NUMERIC(4,3) CHECK (similarity BETWEEN 0 AND 1),
  matched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_feedback   TEXT NOT NULL DEFAULT 'unrated'
                    CHECK (user_feedback IN ('relevant', 'irrelevant', 'unrated')),
  feedback_at     TIMESTAMPTZ,
  CONSTRAINT user_topic_matches_unique UNIQUE (topic_id, cluster_id)
);

CREATE INDEX IF NOT EXISTS idx_user_topic_matches_topic
  ON user_topic_matches (topic_id, matched_at DESC);

-- Partial index predicate는 IMMUTABLE만 허용 (now() X). 전체 sent_at index로 대체.
CREATE INDEX IF NOT EXISTS idx_user_topic_matches_recent
  ON user_topic_matches (matched_at DESC);

-- ─── RLS — own data only (CLAUDE.md rule 11) ─────────────────────────

ALTER TABLE user_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_topics_self ON user_topics
  USING (auth.uid() = user_id);

CREATE POLICY user_topic_matches_self ON user_topic_matches
  USING (
    auth.uid() = (SELECT user_id FROM user_topics
                  WHERE id = user_topic_matches.topic_id)
  );

-- ─── service_role 전용 grants (worker가 사용) ─────────────────────────

GRANT ALL ON user_topics TO service_role;
GRANT ALL ON user_topic_matches TO service_role;

-- ─── tier 한도 enforcement function ──────────────────────────────────
--
-- ADR-018 §2.1 — Pro 5 / Creator 20 / Leader 50.
-- 본 함수는 INSERT 시점에 호출 (애플리케이션 layer 또는 BEFORE INSERT trigger).

CREATE OR REPLACE FUNCTION user_topic_count_within_tier_limit(
  p_user_id UUID,
  p_limit INT
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INT;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM user_topics
  WHERE user_id = p_user_id AND active = true;
  RETURN current_count < p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION user_topic_count_within_tier_limit(UUID, INT) TO service_role;
