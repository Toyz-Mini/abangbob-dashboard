-- Migration to fix RAHMAT ILAHAI's schedule entries
-- Problem: Schedule entries were saved with wrong staffId
-- Solution: Update all entries for RAHMAT to use his correct auth user ID

-- Step 1: Find RAHMAT's correct auth user ID from their email
DO $$
DECLARE
    correct_staff_id text;
BEGIN
    -- Get RAHMAT's auth user ID
    SELECT id::text INTO correct_staff_id 
    FROM auth.users 
    WHERE email = 'abangbobeat@gmail.com' 
    LIMIT 1;

    IF correct_staff_id IS NULL THEN
        RAISE NOTICE 'User with email abangbobeat@gmail.com not found in auth.users';
        RETURN;
    END IF;

    RAISE NOTICE 'Found RAHMAT''s correct ID: %', correct_staff_id;

    -- Step 2: Update schedule_entries where staffName contains RAHMAT
    UPDATE public.schedule_entries 
    SET staff_id = correct_staff_id
    WHERE LOWER(staff_name) LIKE '%rahmat%';

    RAISE NOTICE 'Updated schedule_entries for RAHMAT';

    -- Step 3: Also update any 'schedules' table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedules') THEN
        UPDATE public.schedules 
        SET staff_id = correct_staff_id
        WHERE LOWER(staff_name) LIKE '%rahmat%';
        RAISE NOTICE 'Updated schedules table for RAHMAT';
    END IF;

    -- Step 4: Update attendance records for RAHMAT too
    UPDATE public.attendance 
    SET staff_id = correct_staff_id
    WHERE LOWER(staff_name) LIKE '%rahmat%';

    RAISE NOTICE 'Updated attendance for RAHMAT';

    -- Step 5: Ensure RAHMAT has a valid staff record with this ID
    IF NOT EXISTS (SELECT 1 FROM public.staff WHERE id::text = correct_staff_id) THEN
        -- Find any existing staff record for RAHMAT and copy it
        INSERT INTO public.staff (id, name, email, phone, role, status)
        SELECT 
            correct_staff_id,
            name,
            'abangbobeat@gmail.com',
            phone,
            role,
            status
        FROM public.staff 
        WHERE LOWER(name) LIKE '%rahmat%' 
        LIMIT 1;
        
        RAISE NOTICE 'Created staff record for RAHMAT with correct ID';
    ELSE
        -- Update existing staff record email if needed
        UPDATE public.staff 
        SET email = 'abangbobeat@gmail.com'
        WHERE id::text = correct_staff_id AND (email IS NULL OR email != 'abangbobeat@gmail.com');
        
        RAISE NOTICE 'Staff record already exists for RAHMAT';
    END IF;

END $$;

-- Verification: Show RAHMAT's records after fix
SELECT 'schedule_entries' as table_name, staff_id, staff_name, date 
FROM public.schedule_entries 
WHERE LOWER(staff_name) LIKE '%rahmat%'
LIMIT 5;
