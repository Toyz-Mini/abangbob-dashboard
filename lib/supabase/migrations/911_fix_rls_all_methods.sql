-- Migration: 911_fix_rls_all_methods.sql
-- Purpose: Support Staff lookup via Email OR Phone.
-- If user logs in via Phone, email is null, causing is_staff() to fail.

-- 1. Redefine is_staff() to use auth.uid() lookup for BOTH email and phone
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_phone text;
BEGIN
  -- Get both email and phone from Supabase Auth
  SELECT email, phone INTO v_email, v_phone
  FROM auth.users
  WHERE id = auth.uid();

  -- If neither exists, they are not a user
  IF v_email IS NULL AND v_phone IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if ANY credential matches in staff
  RETURN EXISTS (
    SELECT 1
    FROM public.staff
    WHERE (
      -- Match Email (if present)
      (v_email IS NOT NULL AND LOWER(email) = LOWER(v_email))
      OR
      -- Match Phone (if present) - clean formatting just in case
      (v_phone IS NOT NULL AND phone = v_phone)
    )
  );
END;
$$;

-- 2. Redefine is_admin() similarly
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_phone text;
BEGIN
  SELECT email, phone INTO v_email, v_phone
  FROM auth.users
  WHERE id = auth.uid();

  IF v_email IS NULL AND v_phone IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.staff
    WHERE (
      (v_email IS NOT NULL AND LOWER(email) = LOWER(v_email))
      OR
      (v_phone IS NOT NULL AND phone = v_phone)
    )
    AND role IN ('admin', 'manager', 'owner', 'Admin', 'Manager', 'Owner')
  );
END;
$$;

-- Grant execute again just to be safe
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
