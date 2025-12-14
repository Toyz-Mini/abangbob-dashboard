-- Migration: Add extended_data JSONB column to staff table
-- Run this in your Supabase SQL Editor if you already have the staff table created
-- This adds support for storing rich staff profile data

-- Add extended_data JSONB column to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS extended_data JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_staff_extended_data ON public.staff USING gin(extended_data);

-- Add comment to explain the column
COMMENT ON COLUMN public.staff.extended_data IS 'Stores extended staff profile data including bank details, statutory contributions, emergency contact, leave entitlement, permissions, schedule preferences, documents, skills, certifications, and other additional fields';


