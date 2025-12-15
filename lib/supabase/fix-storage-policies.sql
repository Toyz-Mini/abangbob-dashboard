-- AbangBob Dashboard - Fix Storage Policies
-- Run this SQL in Supabase SQL Editor
-- This fixes the "mime type text/plain is not supported" issue

-- ========================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- ========================================

-- Drop outlet-logos policies if they exist
DROP POLICY IF EXISTS "Public read access for outlet-logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to outlet-logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update outlet-logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from outlet-logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- ========================================
-- UPDATE BUCKET TO ALLOW ALL IMAGE TYPES
-- ========================================

UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
WHERE id = 'outlet-logos';

-- ========================================
-- CREATE NEW POLICIES (Allow all access for now)
-- ========================================

-- Allow anyone to SELECT (view) images
CREATE POLICY "Allow public view outlet-logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'outlet-logos');

-- Allow anyone to INSERT (upload) - for testing without auth
CREATE POLICY "Allow all upload outlet-logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'outlet-logos');

-- Allow anyone to UPDATE
CREATE POLICY "Allow all update outlet-logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'outlet-logos');

-- Allow anyone to DELETE
CREATE POLICY "Allow all delete outlet-logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'outlet-logos');

-- ========================================
-- VERIFY BUCKET EXISTS
-- ========================================

-- Check if bucket exists, if not create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'outlet-logos',
  'outlet-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Done! Storage should now work properly.
-- Run this SQL, then click "Test Semula" in the app.
