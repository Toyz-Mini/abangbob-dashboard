-- Ensure all request tables have correct approval columns definition
-- 1. approved_by should be TEXT (not UUID) to support external auth providers
-- 2. approver_name should exist (standardized name)

DO $$ 
BEGIN
    -- ==========================================
    -- 1. SALARY ADVANCES
    -- ==========================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salary_advances') THEN
        -- Fix approved_by type
        BEGIN
            ALTER TABLE public.salary_advances DROP CONSTRAINT IF EXISTS salary_advances_approved_by_fkey;
        EXCEPTION WHEN undefined_object THEN NULL; END;
        
        ALTER TABLE public.salary_advances ALTER COLUMN approved_by TYPE TEXT;
        
        -- Fix approver_name column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_advances' AND column_name = 'approver_name') THEN
             ALTER TABLE public.salary_advances ADD COLUMN approver_name TEXT;
        END IF;

        -- Migrate data if approved_by_name exists (legacy)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_advances' AND column_name = 'approved_by_name') THEN
             -- Determine if we should copy data. Only if approver_name is empty.
             UPDATE public.salary_advances SET approver_name = approved_by_name WHERE approver_name IS NULL;
        END IF;
    END IF;

    -- ==========================================
    -- 2. STAFF REQUESTS (Permintaan Lain)
    -- ==========================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_requests') THEN
        -- Ensure approved_by column exists and is TEXT
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_requests' AND column_name = 'approved_by') THEN
             ALTER TABLE public.staff_requests ADD COLUMN approved_by TEXT;
        ELSE
             BEGIN
                ALTER TABLE public.staff_requests DROP CONSTRAINT IF EXISTS staff_requests_approved_by_fkey;
             EXCEPTION WHEN undefined_object THEN NULL; END;
             ALTER TABLE public.staff_requests ALTER COLUMN approved_by TYPE TEXT;
        END IF;

        -- Ensure approver_name column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_requests' AND column_name = 'approver_name') THEN
             ALTER TABLE public.staff_requests ADD COLUMN approver_name TEXT;
        END IF;
    END IF;

    -- ==========================================
    -- 3. CONFIRM OTHER TABLES (Just in case)
    -- ==========================================
    
    -- OT Claims
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ot_claims') THEN
        ALTER TABLE public.ot_claims ALTER COLUMN approved_by TYPE TEXT;
    END IF;

    -- Claim Requests
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claim_requests') THEN
        ALTER TABLE public.claim_requests ALTER COLUMN approved_by TYPE TEXT;
    END IF;

END $$;
