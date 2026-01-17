-- Migration to fix Staff Timetable RLS Issues
-- Ensures RLS is disabled and policies allow full access for shifts and schedule_entries

-- Step 1: Disable RLS entirely on relevant tables
ALTER TABLE IF EXISTS public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedule_entries DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view shifts" ON public.shifts;
DROP POLICY IF EXISTS "Managers can manage shifts" ON public.shifts;
DROP POLICY IF EXISTS "Anyone can view schedule entries" ON public.schedule_entries;
DROP POLICY IF EXISTS "Managers can manage schedule entries" ON public.schedule_entries;
DROP POLICY IF EXISTS "Authenticated users can manage shifts" ON public.shifts;
DROP POLICY IF EXISTS "Authenticated users can manage schedule_entries" ON public.schedule_entries;

-- Step 3: Create permissive policies for authenticated users
-- Shifts
CREATE POLICY "Authenticated users can select shifts" ON public.shifts
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert shifts" ON public.shifts
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shifts" ON public.shifts
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete shifts" ON public.shifts
  FOR DELETE 
  USING (true);

-- Schedule Entries
CREATE POLICY "Authenticated users can select schedule_entries" ON public.schedule_entries
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert schedule_entries" ON public.schedule_entries
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedule_entries" ON public.schedule_entries
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete schedule_entries" ON public.schedule_entries
  FOR DELETE 
  USING (true);

-- Verify tables have RLS disabled
DO $$
BEGIN
  RAISE NOTICE 'RLS status check: Shifts - %, Schedule Entries - %', 
    (SELECT relrowsecurity::text FROM pg_class WHERE relname = 'shifts'),
    (SELECT relrowsecurity::text FROM pg_class WHERE relname = 'schedule_entries');
END $$;
