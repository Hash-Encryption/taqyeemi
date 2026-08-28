-- ================================================================
-- TAQYEEMI PLATFORM — COMPLETE FAIL-SAFE DATABASE SETUP
-- Run this entire script in Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. TABLES
CREATE TABLE IF NOT EXISTS clients (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug              TEXT        UNIQUE NOT NULL,
  name              TEXT        NOT NULL,
  owner_email       TEXT        UNIQUE,
  google_review_url TEXT        NOT NULL,
  owner_user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  active            BOOLEAN     DEFAULT TRUE,
  portal_status     TEXT        NOT NULL DEFAULT 'active' CHECK (portal_status IN ('active', 'suspended')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS owner_email TEXT UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_status TEXT NOT NULL DEFAULT 'active' CHECK (portal_status IN ('active', 'suspended'));

CREATE TABLE IF NOT EXISTS feedback (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id       UUID        REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  rating          INT         CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  feedback_text   TEXT        NOT NULL,
  is_read         BOOLEAN     DEFAULT FALSE,
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID    REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role    TEXT    CHECK (role IN ('admin', 'owner')) NOT NULL
);

CREATE TABLE IF NOT EXISTS lead_submissions (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name        TEXT        NOT NULL,
  google_maps_link     TEXT        NOT NULL,
  decision_maker_name  TEXT        NOT NULL,
  email                TEXT        UNIQUE NOT NULL,
  phone_number         TEXT        NOT NULL,
  counter_count        INT         NOT NULL DEFAULT 1,
  status               TEXT        CHECK (status IN ('pending', 'contacted', 'invited', 'rejected')) DEFAULT 'pending',
  submission_count     INT         NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id                     INT         PRIMARY KEY DEFAULT 1,
  owner_portals_enabled  BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO platform_settings (id, owner_portals_enabled)
VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. ROW LEVEL SECURITY
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

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

-- RLS POLICIES: PLATFORM SETTINGS
DROP POLICY IF EXISTS "admin_manage_platform_settings" ON platform_settings;
CREATE POLICY "admin_manage_platform_settings" ON platform_settings
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public_read_platform_settings" ON platform_settings;
DROP POLICY IF EXISTS "authenticated_read_platform_settings" ON platform_settings;
CREATE POLICY "authenticated_read_platform_settings" ON platform_settings
  FOR SELECT TO authenticated USING (TRUE);

-- RLS POLICIES: CLIENTS
DROP POLICY IF EXISTS "owner_claim_client" ON clients;

DROP POLICY IF EXISTS "admin_all_clients" ON clients;
CREATE POLICY "admin_all_clients" ON clients
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "owner_read_own_client" ON clients;
CREATE POLICY "owner_read_own_client" ON clients
  FOR SELECT TO authenticated USING (owner_user_id = auth.uid());

-- Restrict anonymous column access on clients table
REVOKE SELECT ON clients FROM anon;
GRANT SELECT (id, active) ON clients TO anon;

DROP POLICY IF EXISTS "public_read_active_clients" ON clients;
DROP POLICY IF EXISTS "anon_verify_active_clients" ON clients;
CREATE POLICY "anon_verify_active_clients" ON clients
  FOR SELECT TO anon USING (active = TRUE);

-- RLS POLICIES: FEEDBACK
DROP POLICY IF EXISTS "public_insert_feedback" ON feedback;
CREATE POLICY "public_insert_feedback" ON feedback 
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = client_id AND active = TRUE
    )
  );

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

DROP POLICY IF EXISTS "admin_all_feedback" ON feedback;
CREATE POLICY "admin_all_feedback" ON feedback 
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- RLS POLICIES: USER ROLES
DROP POLICY IF EXISTS "read_own_role" ON user_roles;
CREATE POLICY "read_own_role" ON user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_roles" ON user_roles;
CREATE POLICY "admin_manage_roles" ON user_roles
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- RLS POLICIES: LEADS
DROP POLICY IF EXISTS "public_insert_leads" ON lead_submissions;
CREATE POLICY "public_insert_leads" ON lead_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "admin_all_leads" ON lead_submissions;
CREATE POLICY "admin_all_leads" ON lead_submissions
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 3. FAIL-SAFE SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION link_owner_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id UUID;
BEGIN
  BEGIN
    SELECT id INTO v_client_id
    FROM clients
    WHERE TRIM(LOWER(owner_email)) = TRIM(LOWER(NEW.email))
    LIMIT 1;

    IF v_client_id IS NOT NULL THEN
      UPDATE clients
      SET owner_user_id = NEW.id
      WHERE id = v_client_id
        AND (owner_user_id IS NULL OR owner_user_id = NEW.id);

      INSERT INTO user_roles (user_id, role)
      VALUES (NEW.id, 'owner')
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_signup ON auth.users;
CREATE TRIGGER on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_owner_on_signup();

-- 4. HARDENED CLAIM RESTAURANT RPC
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
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL OR TRIM(v_email) = '' THEN
    v_email := auth.jwt() ->> 'email';
  END IF;

  IF v_email IS NULL OR TRIM(v_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No verified email found');
  END IF;

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

  RETURN jsonb_build_object('success', false, 'error', 'No matching pre-approved client found');
END;
$$;

REVOKE ALL ON FUNCTION claim_restaurant() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION claim_restaurant() FROM anon;
GRANT EXECUTE ON FUNCTION claim_restaurant() TO authenticated, service_role;

-- 5. SAFE PUBLIC CLIENT RPC
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
