-- 1. List All Policies on the table
SELECT
    polname as policy_name,
    CASE WHEN polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as type,
    polroles as roles,
    polcmd as cmd,
    pg_get_expr(polqual, polrelid) as condition,
    pg_get_expr(polwithcheck, polrelid) as with_check
FROM pg_policy
JOIN pg_class ON pg_policy.polrelid = pg_class.oid
WHERE pg_class.relname = 'allowed_locations';

-- 2. List All Triggers on the table
SELECT
    tgname as trigger_name,
    tgenabled as status,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'allowed_locations'::regclass;

-- 3. Check RLS Status
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'allowed_locations';
