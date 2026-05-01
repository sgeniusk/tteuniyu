-- 00011_waitlist_expansion.sql
-- T-W03 (PRD v1.6 §7.1 F-P0w-4/5/6) — staged for Sprint 0 / P0a swap.
--
-- P0w runs against an in-memory store (apps/web/lib/waitlist/store.ts);
-- this migration is the production schema. service_role only.
--
-- Constraints:
-- - email is the only PII. company_name / contact_name accepted only
--   for b2b_inquiry rows; never indexed.
-- - intent_score 1..5 enforced both in schema and in route Zod.
-- - metadata JSONB stores form-type-specific extras (price_feedback,
--   site_url, monthly_visitors, etc.). MUST NEVER store bias_score /
--   factuality_score / embedding (CLAUDE.md rule 4 — assert-no-public-
--   sensitive-fields will scan).
-- - REVOKE ALL on anon/authenticated (CLAUDE.md rule 11).

CREATE TABLE IF NOT EXISTS waitlist (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT NOT NULL,
  waitlist_type       TEXT NOT NULL
    CHECK (waitlist_type IN ('pro_preorder', 'creator_embed', 'b2b_inquiry')),
  intent_score        INT  CHECK (intent_score IS NULL OR (intent_score BETWEEN 1 AND 5)),
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_verified_at   TIMESTAMPTZ,
  unsubscribed_at     TIMESTAMPTZ,
  CONSTRAINT waitlist_email_type_unique UNIQUE (email, waitlist_type)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_type_created
  ON waitlist (waitlist_type, created_at DESC);

-- Partial index — only "high intent" rows for fast Exit-gate query.
CREATE INDEX IF NOT EXISTS idx_waitlist_high_intent
  ON waitlist (waitlist_type, intent_score)
  WHERE intent_score >= 4;

-- Trigger to keep updated_at fresh on UPDATE.
CREATE OR REPLACE FUNCTION waitlist_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS waitlist_updated_at_trg ON waitlist;
CREATE TRIGGER waitlist_updated_at_trg
  BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION waitlist_set_updated_at();

-- service_role only.
REVOKE ALL ON waitlist FROM anon, authenticated;
