-- Migration: Ensure staff_requests access
-- This migration disables RLS on staff_requests to ensure visibility for both parties
-- and follows the pattern of the project's 'disable RLS quick fix'

ALTER TABLE IF EXISTS public.staff_requests DISABLE ROW LEVEL SECURITY;

-- Ensure schema cache is updated
NOTIFY pgrst, 'reload schema';
