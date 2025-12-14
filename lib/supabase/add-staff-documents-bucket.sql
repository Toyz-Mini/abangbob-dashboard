-- Storage Bucket Setup for Staff Documents
-- Run this in your Supabase SQL Editor to create the staff-documents bucket

-- Create the staff-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-documents', 
  'staff-documents', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for staff-documents bucket

-- Policy: Allow authenticated users to upload staff documents
CREATE POLICY "Authenticated users can upload staff documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'staff-documents');

-- Policy: Allow authenticated users to view staff documents
CREATE POLICY "Authenticated users can view staff documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'staff-documents');

-- Policy: Allow authenticated users to update staff documents
CREATE POLICY "Authenticated users can update staff documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'staff-documents');

-- Policy: Allow authenticated users to delete staff documents
CREATE POLICY "Authenticated users can delete staff documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'staff-documents');

-- Note: If you're running without authentication (development mode),
-- you may want to add permissive policies:
-- CREATE POLICY "Anyone can upload staff documents (dev only)"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'staff-documents');


