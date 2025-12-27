-- Migration to fix Schedule Access Issues
-- 1. Disable RLS on 'schedule_entries' (likely the table name used in operations, missed in previous RLS disable)
-- 2. Fix Staff ID mismatch where Admin assigned shifts to a Staff ID that differs from the User's Auth ID

-- Part 1: Ensure RLS is disabled for schedule tables
ALTER TABLE IF EXISTS public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedule_entries DISABLE ROW LEVEL SECURITY;

-- Part 2: Auto-Fix Duplicate Staff / Mismatched IDs
-- This block finds users where the Auth ID differs from the Staff ID (by email) and merges the data.
DO $$
DECLARE
    r RECORD;
    duplicate_staff_id uuid;
    auth_user_id uuid;
BEGIN
    -- Loop through all users in auth.users
    FOR r IN 
        SELECT u.id as auth_id, u.email
        FROM auth.users u
        JOIN public.staff s ON u.email = s.email
        WHERE u.id != s.id 
        -- Limit to active staff match to avoid reviving old stuff unnecessarily, 
        -- but here we assume if email matches, it's the same person.
    LOOP
        auth_user_id := r.auth_id;

        -- Find the 'old' or 'duplicate' staff record that is NOT the auth_id
        SELECT id INTO duplicate_staff_id 
        FROM public.staff 
        WHERE email = r.email AND id != auth_user_id 
        LIMIT 1;

        IF duplicate_staff_id IS NOT NULL THEN
            RAISE NOTICE 'Merging Staff Data for % (Auth ID: %, Old Staff ID: %)', r.email, auth_user_id, duplicate_staff_id;

            -- 1. Ensure a valid Staff record exists for the Auth ID
            -- If not, create it by copying the old one
            IF NOT EXISTS (SELECT 1 FROM public.staff WHERE id = auth_user_id) THEN
                INSERT INTO public.staff (
                    id, name, email, phone, role, status, pin, hourly_rate, 
                    ic_number, employment_type, join_date, profile_photo_url, outlet_id,
                    date_of_birth, gender, marital_status, address, nationality, religion, 
                    position, department, bank_details, emergency_contact, extended_data
                )
                SELECT 
                    auth_user_id, name, email, phone, role, status, pin, hourly_rate, 
                    ic_number, employment_type, join_date, profile_photo_url, outlet_id,
                    date_of_birth, gender, marital_status, address, nationality, religion, 
                    position, department, bank_details, emergency_contact, extended_data
                FROM public.staff 
                WHERE id = duplicate_staff_id;
            END IF;

            -- 2. Re-assign Schedules
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedules') THEN
                UPDATE public.schedules SET staff_id = auth_user_id WHERE staff_id = duplicate_staff_id;
            END IF;
            
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedule_entries') THEN
                UPDATE public.schedule_entries SET staff_id = auth_user_id WHERE staff_id = duplicate_staff_id;
            END IF;

            -- 3. Re-assign Attendance
            UPDATE public.attendance SET staff_id = auth_user_id WHERE staff_id = duplicate_staff_id;

            -- 4. Re-assign Leave Requests
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leave_requests') THEN
                 UPDATE public.leave_requests SET staff_id = auth_user_id WHERE staff_id = duplicate_staff_id;
            END IF;

            -- 5. Mark the old staff record as inactive/merged
            UPDATE public.staff 
            SET status = 'terminated', 
                name = name || ' (MERGED)', 
                email = 'merged_' || substring(uuid_generate_v4()::text from 1 for 8) || '_' || email 
                -- We break the email so it doesn't conflict in future lookups
            WHERE id = duplicate_staff_id;
            
        END IF;
    END LOOP;
END $$;
