-- Migration to fix staff_id column type in schedule_entries
-- Problem: staff_id is type UUID but Better Auth IDs are not valid UUIDs
-- Solution: Change staff_id to TEXT type to accept both UUID and Better Auth ID formats

-- First, we need to drop any policies that reference these columns

-- Drop attendance policies
DROP POLICY IF EXISTS attendance_select_policy ON public.attendance;
DROP POLICY IF EXISTS attendance_insert_policy ON public.attendance;
DROP POLICY IF EXISTS attendance_update_policy ON public.attendance;
DROP POLICY IF EXISTS attendance_delete_policy ON public.attendance;
DROP POLICY IF EXISTS "Allow all authenticated users to read attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all authenticated users to insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all authenticated users to update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all authenticated users to delete attendance" ON public.attendance;

-- Drop staff policies
DROP POLICY IF EXISTS staff_select_policy ON public.staff;
DROP POLICY IF EXISTS staff_insert_policy ON public.staff;
DROP POLICY IF EXISTS staff_update_policy ON public.staff;
DROP POLICY IF EXISTS staff_delete_policy ON public.staff;
DROP POLICY IF EXISTS "Allow all authenticated users to read staff" ON public.staff;
DROP POLICY IF EXISTS "Allow all authenticated users to insert staff" ON public.staff;
DROP POLICY IF EXISTS "Allow all authenticated users to update staff" ON public.staff;
DROP POLICY IF EXISTS "Allow all authenticated users to delete staff" ON public.staff;

-- Drop schedule_entries policies
DROP POLICY IF EXISTS schedule_entries_select_policy ON public.schedule_entries;
DROP POLICY IF EXISTS schedule_entries_insert_policy ON public.schedule_entries;
DROP POLICY IF EXISTS schedule_entries_update_policy ON public.schedule_entries;
DROP POLICY IF EXISTS schedule_entries_delete_policy ON public.schedule_entries;

-- Drop leave_requests policies if any
DROP POLICY IF EXISTS leave_requests_select_policy ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_insert_policy ON public.leave_requests;

-- Now change the column types

-- Step 1: Change schedule_entries.staff_id from UUID to TEXT
ALTER TABLE public.schedule_entries 
ALTER COLUMN staff_id TYPE text USING staff_id::text;

-- Step 2: Change staff table id column
ALTER TABLE public.staff 
ALTER COLUMN id TYPE text USING id::text;

-- Step 3: Fix attendance table
ALTER TABLE public.attendance 
ALTER COLUMN staff_id TYPE text USING staff_id::text;

-- Step 4: Fix schedules table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedules') THEN
        EXECUTE 'ALTER TABLE public.schedules ALTER COLUMN staff_id TYPE text USING staff_id::text';
    END IF;
END $$;

-- Step 5: Fix leave_requests table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'staff_id') THEN
        EXECUTE 'ALTER TABLE public.leave_requests ALTER COLUMN staff_id TYPE text USING staff_id::text';
    END IF;
END $$;

-- Verification
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE column_name IN ('staff_id', 'id') 
  AND table_schema = 'public'
  AND table_name IN ('schedule_entries', 'staff', 'attendance', 'leave_requests')
ORDER BY table_name;
