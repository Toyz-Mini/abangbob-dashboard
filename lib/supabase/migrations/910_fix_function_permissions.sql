-- Migration: 910_fix_function_permissions.sql
-- Purpose: Explicitly GRANT EXECUTE on RLS helper functions.
-- In newer Postgres versions, default execute permissions on 'public' schema functions may be restricted.
-- If the user cannot execute is_staff(), the RLS policy will fail.

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO service_role;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- Also ensure verify_permissions or similar if used (none other global)

-- Force RLS cache refresh just in case
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
