-- ================================================================
-- REVIEW PLATFORM — SUPABASE DATABASE SETUP
-- Run this entire file once in: Supabase Dashboard → SQL Editor
-- ================================================================


-- ================================================================
-- 1. TABLES
-- ================================================================

-- Restaurants (one row per client)
CREATE TABLE IF NOT EXISTS clients (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT        UNIQUE NOT NULL,           -- used in the URL: ?c=slug
  name            TEXT        NOT NULL,                  -- Restaurant display name
  owner_email     TEXT        UNIQUE,                    -- Pre-registered owner email
  google_review_url TEXT      NOT NULL,                  -- Their Google Maps review link
  owner_user_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  active          BOOLEAN     DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure owner_email exists if table was already created
ALTER TABLE clients ADD COLUMN IF NOT EXISTS owner_email TEXT UNIQUE;


-- Private feedback submissions
CREATE TABLE IF NOT EXISTS feedback (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id       UUID        REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  rating          INT         CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  feedback_text   TEXT        NOT NULL,
  is_read         BOOLEAN     DEFAULT FALSE,
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

-- User roles (admin vs owner)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID    REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role    TEXT    CHECK (role IN ('admin', 'owner')) NOT NULL
);


-- ================================================================
-- 2. ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE clients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Helper: returns TRUE if the current logged-in user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;


-- CLIENTS policies ──────────────────────────────────────────────

-- Public (anon) can read active client configs (needed by the review page)
CREATE POLICY "public_read_active_clients" ON clients
  FOR SELECT TO anon, authenticated
  USING (active = TRUE);

-- Owners can also read their own record even if inactive
CREATE POLICY "owner_read_own_client" ON clients
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- Admin can read, insert, update, delete all client records
CREATE POLICY "admin_all_clients" ON clients
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Authenticated users can claim an unlinked client matching their restaurant email/slug
CREATE POLICY "owner_claim_client" ON clients
  FOR UPDATE TO authenticated
  USING (owner_user_id IS NULL OR owner_user_id = auth.uid())
  WITH CHECK (TRUE);


-- FEEDBACK policies ─────────────────────────────────────────────

-- Anyone (anonymous customer) can submit feedback for an active restaurant
CREATE POLICY "public_insert_feedback" ON feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE id = client_id AND active = TRUE)
  );

-- Owners can read feedback that belongs to their restaurant
CREATE POLICY "owner_read_own_feedback" ON feedback
  FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE owner_user_id = auth.uid()
    )
  );

-- Owners can mark their feedback as read/unread
CREATE POLICY "owner_update_own_feedback" ON feedback
  FOR UPDATE TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (TRUE);

-- Admin can read and manage all feedback
CREATE POLICY "admin_all_feedback" ON feedback
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());


-- USER_ROLES policies ───────────────────────────────────────────

-- Users can read their own role (needed for frontend auth checks)
CREATE POLICY "read_own_role" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin can manage all roles
CREATE POLICY "admin_manage_roles" ON user_roles
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());


-- ================================================================
-- 3. TRIGGER — Strict Admin-Only Email Pre-Registration Trigger
--
-- When a client signs up via Supabase Auth:
-- 1. Checks if NEW.email matches a pre-registered client in `clients.owner_email`.
-- 2. If matched: Links `owner_user_id = NEW.id` and assigns 'owner' role.
-- 3. If NOT matched (and not admin): Raises an exception, aborting the signup.
-- ================================================================

CREATE OR REPLACE FUNCTION link_owner_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id UUID;
  v_is_admin  BOOLEAN := FALSE;
BEGIN
  -- Check if user is pre-registered as admin in user_roles
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.id AND role = 'admin') THEN
    v_is_admin := TRUE;
  END IF;

  -- Search for pre-registered client by owner_email
  SELECT id INTO v_client_id
  FROM clients
  WHERE LOWER(owner_email) = LOWER(NEW.email)
    AND owner_user_id IS NULL;

  IF v_client_id IS NOT NULL THEN
    -- Link owner to pre-registered client
    UPDATE clients
    SET owner_user_id = NEW.id
    WHERE id = v_client_id;

    -- Assign owner role
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
  END IF;

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- STRICT ADMIN-ONLY ENFORCEMENT: Block signup if email is not pre-registered by Admin
  RAISE EXCEPTION 'Registration restricted: Email "%" has not been pre-registered by an Administrator.', NEW.email;
END;
$$;

CREATE OR REPLACE TRIGGER on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_owner_on_signup();

-- RPC helper function for front-end linking fallback
CREATE OR REPLACE FUNCTION claim_restaurant(p_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE clients
  SET owner_user_id = auth.uid()
  WHERE slug = p_slug
    AND (owner_user_id IS NULL OR owner_user_id = auth.uid());
    
  RETURN FOUND;
END;
$$;


-- ================================================================
-- 4. ADMIN BOOTSTRAP
--
-- After running this file:
-- 1. Go to admin.html and sign up with YOUR email & password
-- 2. Come back here to the SQL Editor and run the line below
--    (replace with the email you used to sign up)
-- 3. You will NEVER need to touch the database again after this
-- ================================================================

-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'admin'
-- FROM auth.users
-- WHERE email = 'YOUR_ADMIN_EMAIL@example.com';
