-- AbangBob Dashboard - Supabase Storage Setup
-- Run this SQL in Supabase SQL Editor to create storage buckets and policies

-- ========================================
-- CREATE STORAGE BUCKETS
-- ========================================

-- Create outlet-logos bucket for outlet branding images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'outlet-logos',
  'outlet-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create staff-photos bucket for staff profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-photos',
  'staff-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create documents bucket for receipts, claims, attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create oil-photos bucket for oil tracking photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'oil-photos',
  'oil-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- STORAGE POLICIES FOR PUBLIC BUCKETS
-- ========================================

-- outlet-logos: Anyone can view, authenticated users can upload/update/delete
CREATE POLICY "Public read access for outlet-logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'outlet-logos');

CREATE POLICY "Authenticated users can upload to outlet-logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'outlet-logos');

CREATE POLICY "Authenticated users can update outlet-logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'outlet-logos');

CREATE POLICY "Authenticated users can delete from outlet-logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'outlet-logos');

-- staff-photos: Anyone can view, authenticated users can upload/update/delete
CREATE POLICY "Public read access for staff-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'staff-photos');

CREATE POLICY "Authenticated users can upload to staff-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'staff-photos');

CREATE POLICY "Authenticated users can update staff-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'staff-photos');

CREATE POLICY "Authenticated users can delete from staff-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'staff-photos');

-- oil-photos: Anyone can view, authenticated users can upload/update/delete
CREATE POLICY "Public read access for oil-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'oil-photos');

CREATE POLICY "Authenticated users can upload to oil-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'oil-photos');

CREATE POLICY "Authenticated users can update oil-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'oil-photos');

CREATE POLICY "Authenticated users can delete from oil-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'oil-photos');

-- ========================================
-- STORAGE POLICIES FOR PRIVATE BUCKETS
-- ========================================

-- documents: Only authenticated users can access
CREATE POLICY "Authenticated read access for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload to documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete from documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Done! Storage buckets and policies created successfully.
