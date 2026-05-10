-- 00021_p0a_grants.sql
-- T-006 / P0a Foundation — RLS enable + service_role only grants.
--
-- Sources of truth.
--   CLAUDE.md rule 11 — Clients must NOT use NEXT_PUBLIC_SUPABASE_ANON_KEY for
--                       table access. All public data flows through /api/v1/*
--                       Next.js routes with service_role.
--   ADR-007 (제휴 데이터 경계) — anon은 어떤 데이터도 직접 읽지 못함
--   ADR-016 (Privacy & Data Boundary) — user_consent는 절대 anon 접근 X
--
-- harness:db-grants가 본 grant 패턴 정합성 검증 (Sprint 0 본격 구현 예정).

-- ============================================================
-- 1. anon / authenticated에 부여된 모든 권한 회수
-- ============================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- ============================================================
-- 2. service_role만 schema·table·sequence·function 전체 접근 허용
-- ============================================================

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 향후 새로 만들어지는 객체에도 동일 default 적용
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO service_role;

-- 그리고 anon/authenticated는 default도 회수
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- ============================================================
-- 3. RLS enable — anon/authenticated가 어쩌다 grant를 받아도 차단되도록 이중 방어
-- ============================================================

ALTER TABLE sources             ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_articles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consent        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- 정책 0개 = service_role bypass + 그 외 모두 거부.
-- harness:db-grants가 모든 테이블에 RLS enable + 정책 0개 또는 service_role only 검증.

-- ============================================================
-- 4. v1.6 기존 테이블 (embed_installations + waitlist)에도 동일 적용
--    이미 적용됐을 수도 있지만 idempotent (CLAUDE.md rule 11 보장).
-- ============================================================

ALTER TABLE IF EXISTS embed_installations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS waitlist             ENABLE ROW LEVEL SECURITY;
