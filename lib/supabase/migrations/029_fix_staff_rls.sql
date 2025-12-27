-- Fix Staff RLS Policies
-- Enables staff to view their own profile and Admins to view all.

-- Enable RLS on staff table
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Staff can view own profile" ON public.staff;
DROP POLICY IF EXISTS "Admins can view all staff" ON public.staff;
DROP POLICY IF EXISTS "Staff view own profile" ON public.staff;
DROP POLICY IF EXISTS "Admin view all" ON public.staff;
DROP POLICY IF EXISTS "Admins can manage all staff" ON public.staff;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.staff;

-- Policy for Staff (view own)
-- Universally cast both sides to text to prevent type mismatch
CREATE POLICY "Staff can view own profile"
ON public.staff
FOR SELECT
TO authenticated
USING (
  id::text = auth.uid()::text
);

-- Policy for Admin (view/edit all)
-- Checks the public.user table for 'Admin' role
-- Universally cast both sides to text to prevent type mismatch
CREATE POLICY "Admins can manage all staff"
ON public.staff
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE id::text = auth.uid()::text
    AND role = 'Admin'
  )
);
