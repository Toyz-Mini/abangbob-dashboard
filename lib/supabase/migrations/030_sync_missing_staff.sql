-- Sync Missing Approved Users to Staff Table
-- FIX 4: Drop policy -> Alter Column -> Re-create Policy -> Sync Data

-- 1. Drop existing policies that might depend on the ID column
DROP POLICY IF EXISTS "Staff can view own profile" ON public.staff;

-- 2. Alter staff.id to TEXT (to support non-UUID IDs)
ALTER TABLE public.staff ALTER COLUMN id TYPE text;

-- 3. Re-create the policy (Updated for TEXT column)
-- We check if ID matches auth.uid() (casted to text to be safe)
CREATE POLICY "Staff can view own profile" 
ON public.staff 
FOR SELECT 
USING (
  id = auth.uid()::text
);

-- 4. Insert missing records
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
  u."outletId", 
  NOW()
FROM public."user" u
WHERE u.status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM public.staff s WHERE s.id = u.id::text
);
