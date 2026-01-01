-- Migration: 907_fix_rls_sensitivity.sql
-- Purpose: Fix is_staff() to be case-insensitive.
-- findings: Users reported access issues; likely due to 'Email' vs 'email' mismatches.

-- 1. Redefine is_staff() with LOWER()
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Case-insensitive match
  RETURN EXISTS (
    SELECT 1
    FROM public.staff
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
  );
END;
$$;

-- 2. Redefine is_admin() with LOWER()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.staff
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
    AND role IN ('admin', 'manager', 'owner', 'Admin', 'Manager', 'Owner')
  );
END;
$$;
