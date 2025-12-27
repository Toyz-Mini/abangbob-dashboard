-- Migration to fix staff_id column type in schedule_entries
-- Problem: staff_id is type UUID but Better Auth IDs are not valid UUIDs
-- Solution: Change staff_id to TEXT type to accept both UUID and Better Auth ID formats

-- Step 1: Change schedule_entries.staff_id from UUID to TEXT
ALTER TABLE public.schedule_entries 
ALTER COLUMN staff_id TYPE text USING staff_id::text;

-- Step 2: Also fix the staff table id column if needed
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

-- Step 6: Fix shifts table if staff_id exists there
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'staff_id') THEN
        EXECUTE 'ALTER TABLE public.shifts ALTER COLUMN staff_id TYPE text USING staff_id::text';
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
