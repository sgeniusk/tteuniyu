-- 00010_embed_installations.sql
-- T-W02 / Sprint 0: Creator Embed install tracking.
--
-- P0w runs against an in-memory store (apps/web/lib/embed/install-store.ts);
-- this migration is staged for Sprint 0 supabase init / P0a swap.
--
-- Constraints:
-- - host = installer's domain (NOT user PII)
-- - user_agent truncated to 255 chars at insert time (route enforces)
-- - No IP, no cookie, no user identity
-- - REVOKE ALL on anon/authenticated (CLAUDE.md rule 11 / 8)

CREATE TABLE IF NOT EXISTS embed_installations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host            TEXT NOT NULL,
  size            TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
  user_agent      TEXT,
  install_count   INT  NOT NULL DEFAULT 1,
  installed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT embed_installations_host_size_unique UNIQUE (host, size)
);

CREATE INDEX IF NOT EXISTS idx_embed_installations_host
  ON embed_installations (host);

CREATE INDEX IF NOT EXISTS idx_embed_installations_last_seen
  ON embed_installations (last_seen_at DESC);

-- No public access; service_role inserts/updates only via /api/v1/embed/install.
REVOKE ALL ON embed_installations FROM anon, authenticated;
