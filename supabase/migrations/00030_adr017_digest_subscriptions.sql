-- ADR-017 Daily Digest — digest_subscriptions + 동의 분리 + 발송 이력
--
-- 비협상 (ADR-016 PIPA + 정통망법 §50/§50의2 + 변호사 §5.3).
--   - 마케팅 수신 동의 + Daily Digest 동의 분리 (사용자가 마케팅 거부해도
--     digest는 받을 수 있음 — 정보 제공 메일 분류)
--   - 1-click 수신거부 token (정통망법 §50)
--   - 발송 시간 09:00 KST 안전 (정통망법 §50의2)
--   - 보유 기간 13개월 + 해지 시 익월 1일 cascade (ADR-016)

CREATE TABLE IF NOT EXISTS digest_subscriptions (
  user_id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT NOT NULL,
  digest_consent          BOOLEAN NOT NULL DEFAULT false,
  digest_consent_at       TIMESTAMPTZ,
  marketing_consent       BOOLEAN NOT NULL DEFAULT false,  -- 별도 동의 (선택)
  marketing_consent_at    TIMESTAMPTZ,
  -- 1-click 수신거부 (정통망법 §50)
  unsubscribe_token       TEXT NOT NULL UNIQUE
                            DEFAULT encode(gen_random_bytes(24), 'hex'),
  unsubscribed_at         TIMESTAMPTZ,
  -- 발송 옵션
  preferred_categories    TEXT[] NOT NULL DEFAULT '{}',
  include_custom_topics   BOOLEAN NOT NULL DEFAULT true,  -- ADR-018 매칭 결과 포함
  include_frame_clash     BOOLEAN NOT NULL DEFAULT false,  -- Creator+ 차별화
  include_intl_translation BOOLEAN NOT NULL DEFAULT false, -- ADR-019 외신 번역
  -- 메타
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digest_subs_active
  ON digest_subscriptions (user_id)
  WHERE digest_consent = true AND unsubscribed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_digest_subs_token
  ON digest_subscriptions (unsubscribe_token);

-- 발송 이력 — 12개월 보유 + 운영 통계
CREATE TABLE IF NOT EXISTS digest_send_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES digest_subscriptions(user_id) ON DELETE CASCADE,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_id          TEXT,                 -- Resend / SendGrid message id
  template_version    TEXT NOT NULL,        -- HTML 템플릿 버전
  cluster_count       INT NOT NULL,         -- 본 디제스트에 포함된 cluster 수
  custom_topic_matches INT NOT NULL DEFAULT 0,  -- ADR-018 매칭 수
  open_at             TIMESTAMPTZ,          -- Resend webhook 결과
  click_at            TIMESTAMPTZ,          -- 첫 클릭
  bounce_at           TIMESTAMPTZ,
  complained_at       TIMESTAMPTZ           -- 스팸 신고
);

CREATE INDEX IF NOT EXISTS idx_digest_log_user
  ON digest_send_log (user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_digest_log_recent
  ON digest_send_log (sent_at DESC)
  WHERE sent_at > now() - INTERVAL '30 days';

-- ─── RLS — own data only (CLAUDE.md rule 11) ─────────────────────────

ALTER TABLE digest_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY digest_subs_self ON digest_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY digest_subs_self_modify ON digest_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY digest_log_self ON digest_send_log
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM digest_subscriptions
                  WHERE user_id = digest_send_log.user_id)
  );

-- ─── service_role 전용 grants (worker가 사용) ─────────────────────────

GRANT ALL ON digest_subscriptions TO service_role;
GRANT ALL ON digest_send_log TO service_role;

-- ─── updated_at 자동 갱신 trigger ────────────────────────────────────

CREATE TRIGGER set_digest_subscriptions_updated_at
  BEFORE UPDATE ON digest_subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
