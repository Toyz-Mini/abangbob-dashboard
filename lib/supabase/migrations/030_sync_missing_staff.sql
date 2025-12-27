-- Sync Missing Approved Users to Staff Table
-- FIX 3: Alter staff ID to TEXT to support non-UUID user IDs (like 'Hpp...')

-- 1. Alter staff.id to TEXT (This allows any string ID)
ALTER TABLE public.staff ALTER COLUMN id TYPE text;

-- 2. Insert missing records
INSERT INTO public.staff (
  id, 
  name, 
  email, 
  role, 
  status, 
  outlet_id, 
  join_date
)
SELECT 
  u.id::text, 
  u.name, 
  u.email, 
  u.role, 
  'active', 
  u."outletId", -- user table uses camelCase
  NOW()
FROM public."user" u
WHERE u.status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM public.staff s WHERE s.id = u.id::text
);
