-- Enable RLS for Attendance table
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Enable RLS for Allowed Locations table
ALTER TABLE public.allowed_locations ENABLE ROW LEVEL SECURITY;

-- Verify policies exist (optional redundant check, but good practice)
-- The error stated "Policy Exists", so we just need to enable RLS.

-- Use this query to verify implementation in SQL Editor:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('attendance', 'allowed_locations');
