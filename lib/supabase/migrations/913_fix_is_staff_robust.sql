-- Migration: 913_fix_is_staff_robust.sql
-- Purpose: Make is_staff() more robust by restoring direct ID check.
-- Reason: Some users might have matching IDs but email mismatches (or missing JWT email).

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt_email text;
  v_email text;
  v_phone text;
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  v_jwt_email := auth.jwt() ->> 'email';
  
  -- DEBUG LOGGING --
  RAISE LOG 'DEBUG_IS_STAFF: START uid=%, jwt_email=%', v_uid, v_jwt_email;
  -------------------

  -- 1. EMERGENCY SHORT CIRCUIT for Aliff
  -- Check JWT claim first (fastest, no DB lookup)
  IF v_jwt_email ILIKE 'aliffharris@gmail.com' THEN
    RAISE LOG 'DEBUG_IS_STAFF: Matched emergency email bypass';
    RETURN TRUE;
  END IF;

  -- 2. Check for direct ID match (legacy/robustness)
  -- This handles cases where staff.id WAS correctly set to auth.uid()
  IF EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = v_uid::text
  ) THEN
    RAISE LOG 'DEBUG_IS_STAFF: Matched public.staff id';
    RETURN TRUE;
  END IF;

  -- 3. Standard Logic (Email & Phone from auth.users)
  SELECT email, phone INTO v_email, v_phone
  FROM auth.users
  WHERE id = v_uid;
  
  RAISE LOG 'DEBUG_IS_STAFF: Looked up auth.users: email=%, phone=%', v_email, v_phone;

  -- If neither exists, they are not a user (or auth.uid is null)
  IF v_email IS NULL AND v_phone IS NULL THEN
    RAISE LOG 'DEBUG_IS_STAFF: No email or phone found in auth.users';
    RETURN FALSE;
  END IF;

  -- Check if ANY credential matches in staff
  IF EXISTS (
    SELECT 1
    FROM public.staff
    WHERE (
      (v_email IS NOT NULL AND LOWER(email) = LOWER(v_email))
      OR
      (v_phone IS NOT NULL AND phone = v_phone)
    )
  ) THEN
    RAISE LOG 'DEBUG_IS_STAFF: Found match in staff by email/phone';
    RETURN TRUE;
  END IF;

  RAISE LOG 'DEBUG_IS_STAFF: FAIL - No match found in staff table';
  RETURN FALSE;
END;
$$;

-- Also update is_admin to include ID check for consistency
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt_email text;
  v_email text;
  v_phone text;
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  v_jwt_email := auth.jwt() ->> 'email';

  -- DEBUG LOGGING --
  RAISE LOG 'DEBUG_IS_ADMIN: START uid=%, jwt_email=%', v_uid, v_jwt_email;
  -------------------

  -- 1. EMERGENCY SHORT CIRCUIT for Aliff
  IF v_jwt_email ILIKE 'aliffharris@gmail.com' THEN
    RAISE LOG 'DEBUG_IS_ADMIN: Matched emergency email bypass';
    RETURN TRUE;
  END IF;

  -- 2. Check for direct ID match
  IF EXISTS (
    SELECT 1
    FROM public.staff
    WHERE id = v_uid::text
    AND role IN ('admin', 'manager', 'owner', 'Admin', 'Manager', 'Owner')
  ) THEN
    RAISE LOG 'DEBUG_IS_ADMIN: Matched public.staff id with role';
    RETURN TRUE;
  END IF;

  SELECT email, phone INTO v_email, v_phone
  FROM auth.users
  WHERE id = v_uid;
  
  RAISE LOG 'DEBUG_IS_ADMIN: auth.users lookup: email=%, phone=%', v_email, v_phone;

  -- Short circuit for backup admin email if known
  IF v_email ILIKE 'admin@abangbob.com' THEN
    RAISE LOG 'DEBUG_IS_ADMIN: Matched backup admin email';
    RETURN TRUE;
  END IF;

  IF v_email IS NULL AND v_phone IS NULL THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.staff
    WHERE (
      (v_email IS NOT NULL AND LOWER(email) = LOWER(v_email))
      OR
      (v_phone IS NOT NULL AND phone = v_phone)
    )
    AND role IN ('admin', 'manager', 'owner', 'Admin', 'Manager', 'Owner')
  ) THEN
    RAISE LOG 'DEBUG_IS_ADMIN: Found match in staff with role';
    RETURN TRUE;
  END IF;

  RAISE LOG 'DEBUG_IS_ADMIN: FAIL - No match found';
  RETURN FALSE;
END;
$$;

-- Grant perms again to be sure
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
