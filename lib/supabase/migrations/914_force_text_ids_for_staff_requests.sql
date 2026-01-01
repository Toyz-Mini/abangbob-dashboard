-- Force convert staff_requests ID columns to TEXT to support Better Auth IDs
-- This resolves the "invalid input syntax for type uuid" error when syncing

DO $$ 
BEGIN
    -- 1. Alter staff_id
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'staff_requests' 
        AND column_name = 'staff_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.staff_requests ALTER COLUMN staff_id TYPE text USING staff_id::text;
        RAISE NOTICE 'Converted staff_requests.staff_id to TEXT';
    END IF;

    -- 2. Alter approved_by
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'staff_requests' 
        AND column_name = 'approved_by' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.staff_requests ALTER COLUMN approved_by TYPE text USING approved_by::text;
        RAISE NOTICE 'Converted staff_requests.approved_by to TEXT';
    END IF;

    -- 3. Alter target_staff_id (if exists)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'staff_requests' 
        AND column_name = 'target_staff_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.staff_requests ALTER COLUMN target_staff_id TYPE text USING target_staff_id::text;
        RAISE NOTICE 'Converted staff_requests.target_staff_id to TEXT';
    END IF;

END $$;
