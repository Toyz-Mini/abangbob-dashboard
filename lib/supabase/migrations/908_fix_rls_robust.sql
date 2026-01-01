-- Migration: 908_fix_rls_robust.sql
-- Purpose: Make is_staff() absolutely bulletproof by looking up email in auth.users
-- instead of relying on auth.jwt() claims which might vary.

-- 1. Redefine is_staff() to use auth.uid() lookup
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_email text;
BEGIN
  -- Get the email directly from Supabase Auth system
  SELECT email INTO current_email
  FROM auth.users
  WHERE id = auth.uid();

  IF current_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if that email exists in staff (Case Insensitive)
  RETURN EXISTS (
    SELECT 1
    FROM public.staff
    WHERE LOWER(email) = LOWER(current_email)
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
  current_email text;
BEGIN
  SELECT email INTO current_email
  FROM auth.users
  WHERE id = auth.uid();

  IF current_email IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.staff
    WHERE LOWER(email) = LOWER(current_email)
    AND role IN ('admin', 'manager', 'owner', 'Admin', 'Manager', 'Owner')
  );
END;
$$;
