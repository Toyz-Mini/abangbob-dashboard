-- Migration: 906_fix_rls_staff_logic.sql
-- Purpose: Fix is_staff() and is_admin() logic.
-- Findings: 'staff' table IDs are inconsistent (mix of UUIDs and random strings) and do not match auth.uid().
-- Fix: Match 'staff.email' with 'auth.jwt() ->> email' for reliable linking.

-- 1. Redefine is_staff()
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is authenticated and their email exists in the staff table
  RETURN EXISTS (
    SELECT 1
    FROM public.staff
    WHERE email = (auth.jwt() ->> 'email')
  );
END;
$$;

-- 2. Redefine is_admin()
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
    WHERE email = (auth.jwt() ->> 'email')
    AND role IN ('admin', 'manager', 'owner', 'Admin', 'Manager', 'Owner') -- Added capitalized variants just in case
  );
END;
$$;
