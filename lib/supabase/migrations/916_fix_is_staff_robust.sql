CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_jwt_email text;
  v_email text;
  v_phone text;
  v_uid uuid;
BEGIN
  -- Get context
  v_uid := auth.uid();
  v_jwt_email := auth.jwt() ->> 'email';

  -- 1. EMERGENCY SHORT CIRCUIT for Aliff
  IF v_jwt_email ILIKE 'aliffharris@gmail.com' THEN
    RETURN TRUE;
  END IF;

  -- 2. Direct ID match
  IF EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = v_uid::text
  ) THEN
    RETURN TRUE;
  END IF;

  -- 3. Email match via JWT
  IF v_jwt_email IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.staff
    WHERE LOWER(email) = LOWER(v_jwt_email)
  ) THEN
    RETURN TRUE;
  END IF;

  -- 4. Fallback: Lookup auth.users
  SELECT email, phone INTO v_email, v_phone
  FROM auth.users
  WHERE id = v_uid;

  IF v_email ILIKE 'admin@abangbob.com' THEN
      RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.staff
    WHERE (
      (v_email IS NOT NULL AND LOWER(email) = LOWER(v_email))
      OR
      (v_phone IS NOT NULL AND phone = v_phone)
    )
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$function$;
