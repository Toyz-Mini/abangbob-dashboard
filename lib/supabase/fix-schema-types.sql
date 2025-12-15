-- ========================================
-- FIX SCHEMA: modifier_group_ids TYPE
-- ========================================
-- The schema has modifier_group_ids as UUID[] but we use TEXT strings like 'modgroup_flavour'
-- This script changes the column type to TEXT[]

-- 1. Drop any existing constraints on modifier_group_ids
-- 2. Change column type from UUID[] to TEXT[]

-- Change modifier_group_ids column type from UUID[] to TEXT[]
ALTER TABLE public.menu_items 
ALTER COLUMN modifier_group_ids TYPE TEXT[] 
USING modifier_group_ids::TEXT[];

-- Set default to empty array
ALTER TABLE public.menu_items 
ALTER COLUMN modifier_group_ids SET DEFAULT '{}';

-- ========================================
-- FIX STAFF: Remove email unique constraint or handle duplicates
-- ========================================
-- Option 1: Remove unique constraint on email (if email is optional)
-- ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_email_key;

-- Option 2: Delete staff with duplicate emails first (uncomment if needed)
-- DELETE FROM public.staff WHERE id NOT IN (
--   SELECT MIN(id) FROM public.staff GROUP BY email
-- );

-- For now, just show which emails have duplicates
SELECT email, COUNT(*) as count 
FROM public.staff 
WHERE email IS NOT NULL 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Done!
SELECT 'Schema fix applied! Now try migration again.' as result;
