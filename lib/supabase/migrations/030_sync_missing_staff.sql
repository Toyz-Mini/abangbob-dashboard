-- Sync Missing Approved Users to Staff Table
-- FIX 5: Drop ALL dependent policies (Staff & Storage) -> Alter Column -> Recreate Policies -> Sync

-- 1. DROP ALL BLOCKING POLICIES
-- Drop policies on staff table
DROP POLICY IF EXISTS "Staff can view own profile" ON public.staff;
DROP POLICY IF EXISTS "Admins can manage all staff" ON public.staff;
-- Drop policy on storage.objects (which depended on staff.id)
DROP POLICY IF EXISTS "Admins can view all attendance photos" ON storage.objects;

-- 2. Alter staff.id to TEXT (This allows non-UUID IDs like 'Hpp...')
ALTER TABLE public.staff ALTER COLUMN id TYPE text;

-- 3. RECREATE POLICIES (Robust versions handling text IDs)

-- Policy: Staff can view own profile
CREATE POLICY "Staff can view own profile" 
ON public.staff FOR SELECT 
USING (id = auth.uid()::text);

-- Policy: Admins can manage all staff
CREATE POLICY "Admins can manage all staff" 
ON public.staff FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user u 
    WHERE u.id::text = auth.uid()::text 
    AND u.role = 'Admin'
  )
);

-- Policy: Admins can view attendance photos (Updated to rely on public.user, not staff)
CREATE POLICY "Admins can view all attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-photos' 
  AND 
  EXISTS (
    SELECT 1 FROM public.user u 
    WHERE u.id::text = auth.uid()::text 
    AND u.role = 'Admin'
  )
);

-- 4. INSERT DATA (Sync)
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
  u."outletId", -- camelCase column from user table
  NOW()
FROM public."user" u
WHERE u.status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM public.staff s WHERE s.id = u.id::text
);
