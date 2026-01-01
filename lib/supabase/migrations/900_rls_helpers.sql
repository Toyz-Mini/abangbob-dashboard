-- Migration: 900_rls_helpers.sql
-- Purpose: Create consistent helper functions for RLS policies
-- efficient and secure 'is_staff' check to avoid recursive RLS issues.

-- 1. Create a secure function to check if the current user is a staff member
--    SECURITY DEFINER means it runs with the privileges of the creator (postgres/admin)
--    This bypasses RLS on the 'staff' table itself, preventing infinite recursion.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Secure search path
AS $$
BEGIN
  -- Check if the user is authenticated and exists in the staff table
  -- We assume 'auth.uid()' returns the UUID of the currently logged-in user
  RETURN EXISTS (
    SELECT 1
    FROM public.staff
    WHERE id = auth.uid()::text
  );
END;
$$;

-- 2. Grant execute permission to everyone (authenticated and anon)
--    The function internal logic handles the security (requires auth.uid())
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO service_role;

-- 3. Also create a helper for 'is_admin' if we need stricter controls later
--    (Optional but good to have foundation)
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
    WHERE id = auth.uid()::text
    AND role IN ('admin', 'manager', 'owner') -- Adjust roles as per your schema
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
