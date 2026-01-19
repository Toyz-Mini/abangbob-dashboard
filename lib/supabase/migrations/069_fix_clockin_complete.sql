-- =====================================================
-- CLOCK-IN/OUT SYSTEM COMPLETE FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- Created: 2026-01-19
-- =====================================================

-- =====================================================
-- STEP 1: Fix Attendance Table Schema
-- =====================================================
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS clock_in_time TIME,
ADD COLUMN IF NOT EXISTS clock_out_time TIME,
ADD COLUMN IF NOT EXISTS clock_in_photo_url TEXT,
ADD COLUMN IF NOT EXISTS clock_out_photo_url TEXT;

-- Remove problematic foreign key that may block inserts
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_outlet_id_fkey;

-- =====================================================
-- STEP 2: Create Storage Bucket
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-photos',
  'attendance-photos',
  true,  -- Make public for easier URL access
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- =====================================================
-- STEP 3: Fix Storage Policies (CRITICAL!)
-- Remove restrictive policies, add permissive ones
-- =====================================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Staff can upload own attendance photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view own photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all attendance photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete own photos" ON storage.objects;

-- Drop any other potential conflicting policies
DROP POLICY IF EXISTS "Allow authenticated uploads to attendance-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from attendance-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to attendance-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from attendance-photos" ON storage.objects;

-- Create new permissive policies
CREATE POLICY "Allow authenticated uploads to attendance-photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attendance-photos');

CREATE POLICY "Allow authenticated reads from attendance-photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attendance-photos');

CREATE POLICY "Allow authenticated updates to attendance-photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'attendance-photos');

CREATE POLICY "Allow authenticated deletes from attendance-photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attendance-photos');

-- =====================================================
-- STEP 4: Fix Attendance Table RLS
-- =====================================================

-- Drop restrictive policies
DROP POLICY IF EXISTS "Staff can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Staff can insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Staff can update own attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Anyone can view attendance" ON attendance;
DROP POLICY IF EXISTS "Anyone can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Anyone can update attendance" ON attendance;
DROP POLICY IF EXISTS "Allow all attendance operations" ON attendance;

-- Disable RLS to allow all operations (simplest fix)
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- OR if you prefer to keep RLS enabled with permissive policy, uncomment below:
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all attendance operations" ON attendance
-- FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 5: Fix Allowed Locations RLS
-- =====================================================
DROP POLICY IF EXISTS "Allow read for authenticated users" ON allowed_locations;
DROP POLICY IF EXISTS "Allow admins to manage locations" ON allowed_locations;
DROP POLICY IF EXISTS "policy_allow_select_authenticated" ON allowed_locations;
DROP POLICY IF EXISTS "policy_allow_insert_authenticated" ON allowed_locations;
DROP POLICY IF EXISTS "policy_allow_update_authenticated" ON allowed_locations;
DROP POLICY IF EXISTS "policy_allow_delete_authenticated" ON allowed_locations;

-- Disable RLS for simplicity
ALTER TABLE allowed_locations DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION: Run these to confirm fix applied
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE 'Run the following to verify:';
  RAISE NOTICE '  SELECT * FROM storage.buckets;';
  RAISE NOTICE '  SELECT * FROM allowed_locations;';
END $$;

-- =====================================================
-- OPTIONAL: Insert default location if none exists
-- Uncomment and modify with your actual coordinates
-- =====================================================
-- INSERT INTO allowed_locations (name, address, latitude, longitude, radius_meters, is_active)
-- SELECT 'Main Outlet', 'Your Address Here', 4.9083, 114.9136, 100, true
-- WHERE NOT EXISTS (SELECT 1 FROM allowed_locations WHERE is_active = true);
