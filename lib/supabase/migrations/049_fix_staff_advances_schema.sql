-- Fix schema for staff_advances (previously named salary_advances in error)
-- This applies the changes intended in 047 to the correct table name

DO $$ 
BEGIN
    -- Only proceed if staff_advances exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_advances') THEN
        
        -- 1. Fix approved_by type (should be TEXT)
        BEGIN
            ALTER TABLE public.staff_advances DROP CONSTRAINT IF EXISTS staff_advances_approved_by_fkey;
        EXCEPTION WHEN undefined_object THEN NULL; END;
        
        ALTER TABLE public.staff_advances ALTER COLUMN approved_by TYPE TEXT;
        
        -- 2. Add approver_name column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_advances' AND column_name = 'approver_name') THEN
             ALTER TABLE public.staff_advances ADD COLUMN approver_name TEXT;
        END IF;

        -- 3. Copy legacy data if available
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_advances' AND column_name = 'approved_by_name') THEN
             UPDATE public.staff_advances SET approver_name = approved_by_name WHERE approver_name IS NULL;
        END IF;

    END IF;
END $$;
