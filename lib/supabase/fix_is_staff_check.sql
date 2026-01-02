CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_jwt_email text;
  v_uid uuid;
BEGIN
  -- Get context
  v_uid := auth.uid();
  v_jwt_email := auth.jwt() ->> 'email';

  -- 1. Direct ID match
  -- Cast v_uid to text to compare with staff.id (which is text)
  IF EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = v_uid::text
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Email match via JWT
  -- This is the critical fix for when IDs don't match (e.g. legacy staff records)
  IF v_jwt_email IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.staff
    WHERE LOWER(email) = LOWER(v_jwt_email)
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$function$;
