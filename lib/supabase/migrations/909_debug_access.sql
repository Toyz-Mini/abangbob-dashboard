-- Migration: 909_debug_access.sql
-- Purpose: Add a temporary debug function to diagnose RLS issues.

CREATE OR REPLACE FUNCTION public.debug_access_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_email text;
  v_is_staff boolean;
  v_matched_staff_role text;
BEGIN
  v_uid := auth.uid();
  
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_uid;

  v_is_staff := public.is_staff();
  
  SELECT role INTO v_matched_staff_role
  FROM public.staff
  WHERE LOWER(email) = LOWER(v_email)
  LIMIT 1;

  RETURN jsonb_build_object(
    'uid', v_uid,
    'auth_email', v_email,
    'is_staff_func_result', v_is_staff,
    'matched_staff_role', v_matched_staff_role,
    'found_in_staff_table', (v_matched_staff_role IS NOT NULL)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_access_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_access_status() TO anon;
