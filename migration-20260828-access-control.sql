-- ================================================================
-- TAQYEEMI — ACCESS CONTROL & SECURITY HARDENING MIGRATION
-- Run this migration script in Supabase Dashboard → SQL Editor
-- Date: 2026-08-28
-- Safe and Additive: Preserves all existing clients and feedback
-- ================================================================

-- 1. ADD PORTAL_STATUS TO CLIENTS (INDEPENDENT FROM ACTIVE)
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS portal_status TEXT NOT NULL DEFAULT 'active';

-- Add check constraint safely if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_portal_status_check'
  ) THEN
    ALTER TABLE clients 
      ADD CONSTRAINT clients_portal_status_check 
      CHECK (portal_status IN ('active', 'suspended'));
  END IF;
END $$;

-- 2. CREATE PLATFORM_SETTINGS TABLE (FOR GLOBAL SUSPENSION)
CREATE TABLE IF NOT EXISTS platform_settings (
  id                     INT         PRIMARY KEY DEFAULT 1,
  owner_portals_enabled  BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO platform_settings (id, owner_portals_enabled)
VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- 3. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION are_owner_portals_enabled()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_portals_enabled FROM platform_settings WHERE id = 1 LIMIT 1),
    TRUE
  );
$$;

-- 4. PLATFORM SETTINGS RLS POLICIES
DROP POLICY IF EXISTS "admin_manage_platform_settings" ON platform_settings;
CREATE POLICY "admin_manage_platform_settings" ON platform_settings
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public_read_platform_settings" ON platform_settings;
DROP POLICY IF EXISTS "authenticated_read_platform_settings" ON platform_settings;
CREATE POLICY "authenticated_read_platform_settings" ON platform_settings
  FOR SELECT TO authenticated USING (TRUE);

-- 5. SAFE PUBLIC CLIENT RPC (PREVENTS SENSITIVE DATA EXPOSURE)
CREATE OR REPLACE FUNCTION get_public_client(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  google_review_url TEXT,
  active BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, slug, google_review_url, active
  FROM clients
  WHERE slug = p_slug AND active = TRUE
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_public_client(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_client(TEXT) TO anon, authenticated, service_role;

-- 6. HARDEN CLAIM_RESTAURANT RPC
CREATE OR REPLACE FUNCTION claim_restaurant()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_client_id UUID;
BEGIN
  -- Authenticated user only
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Derive verified email database-side
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL OR TRIM(v_email) = '' THEN
    v_email := auth.jwt() ->> 'email';
  END IF;

  IF v_email IS NULL OR TRIM(v_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No verified email found for user');
  END IF;

  -- Only claim pre-approved client matching normalized email
  UPDATE clients
  SET owner_user_id = v_uid
  WHERE TRIM(LOWER(owner_email)) = TRIM(LOWER(v_email))
    AND (owner_user_id IS NULL OR owner_user_id = v_uid)
  RETURNING id INTO v_client_id;

  IF v_client_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (v_uid, 'owner')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'client_id', v_client_id);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'No pre-approved client matching this authenticated email');
END;
$$;

REVOKE ALL ON FUNCTION claim_restaurant() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION claim_restaurant() FROM anon;
GRANT EXECUTE ON FUNCTION claim_restaurant() TO authenticated, service_role;

-- 7. REMOVE OVERLY BROAD DIRECT CLAIM POLICY ON CLIENTS
DROP POLICY IF EXISTS "owner_claim_client" ON clients;

-- 8. UPDATE CLIENTS RLS POLICIES
DROP POLICY IF EXISTS "admin_all_clients" ON clients;
CREATE POLICY "admin_all_clients" ON clients
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "owner_read_own_client" ON clients;
CREATE POLICY "owner_read_own_client" ON clients
  FOR SELECT TO authenticated USING (owner_user_id = auth.uid());

-- Restrict anonymous column exposure on clients table
REVOKE SELECT ON clients FROM anon;
GRANT SELECT (id, active) ON clients TO anon;

DROP POLICY IF EXISTS "public_read_active_clients" ON clients;
DROP POLICY IF EXISTS "anon_verify_active_clients" ON clients;
CREATE POLICY "anon_verify_active_clients" ON clients
  FOR SELECT TO anon USING (active = TRUE);

-- 9. STRICT FEEDBACK RLS POLICIES (DATABASE-LEVEL ENFORCEMENT)

-- A. Customer feedback submission: ONLY depends on active customer funnel
DROP POLICY IF EXISTS "public_insert_feedback" ON feedback;
CREATE POLICY "public_insert_feedback" ON feedback 
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = client_id AND active = TRUE
    )
  );

-- B. Owner feedback read: BLOCKED when suspended or globally disabled
DROP POLICY IF EXISTS "owner_read_own_feedback" ON feedback;
CREATE POLICY "owner_read_own_feedback" ON feedback 
  FOR SELECT TO authenticated
  USING (
    are_owner_portals_enabled() AND
    client_id IN (
      SELECT id FROM clients
      WHERE owner_user_id = auth.uid()
        AND portal_status = 'active'
    )
  );

-- C. Owner feedback update: BLOCKED when suspended or globally disabled
DROP POLICY IF EXISTS "owner_update_own_feedback" ON feedback;
CREATE POLICY "owner_update_own_feedback" ON feedback 
  FOR UPDATE TO authenticated
  USING (
    are_owner_portals_enabled() AND
    client_id IN (
      SELECT id FROM clients
      WHERE owner_user_id = auth.uid()
        AND portal_status = 'active'
    )
  )
  WITH CHECK (
    are_owner_portals_enabled() AND
    client_id IN (
      SELECT id FROM clients
      WHERE owner_user_id = auth.uid()
        AND portal_status = 'active'
    )
  );

-- D. Admin feedback access: Full access for super-admin
DROP POLICY IF EXISTS "admin_all_feedback" ON feedback;
CREATE POLICY "admin_all_feedback" ON feedback 
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
