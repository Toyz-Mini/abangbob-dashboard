-- MEGA MIGRATION: Fix Staff ID Type to TEXT and Update All Dependencies & Policies
-- This migration handles foreign keys, RLS policies, and column types across the system.

-- 1. DROP ALL BLOCKING POLICIES (Explicitly named based on codebase/errors)
-- Staff Table
DROP POLICY IF EXISTS "Staff can view own profile" ON public.staff;
DROP POLICY IF EXISTS "Admins can manage all staff" ON public.staff;

-- Attendance Table
DROP POLICY IF EXISTS "attendance_select_policy" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert_policy" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update_policy" ON public.attendance;
-- (Just in case generic names exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.attendance;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.attendance;

-- Leaves Table
DROP POLICY IF EXISTS "leaves_select_policy" ON public.leaves;
DROP POLICY IF EXISTS "leaves_insert_policy" ON public.leaves;
DROP POLICY IF EXISTS "leaves_update_policy" ON public.leaves;

-- Storage
DROP POLICY IF EXISTS "Admins can view all attendance photos" ON storage.objects;

-- Cash Registers (Known from fix_missing_tables.sql)
DROP POLICY IF EXISTS "Managers can view all cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Staff can view their own cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Staff can insert their own cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Staff can update their own cash registers" ON public.cash_registers;


-- 2. DROP FOREIGN KEYS REFERENCING PUBLIC.STAFF
-- We use a dynamic block to find and drop any FK constraint pointing to staff.id
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.table_schema, tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'staff'
        AND ccu.column_name = 'id'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) 
             || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;


-- 3. ALTER COLUMNS TO TEXT (To support non-UUID IDs)
ALTER TABLE public.staff ALTER COLUMN id TYPE text;

-- Dependent Tables (Alter their columns too)
DO $$ BEGIN
    -- Attendance
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance') THEN
        ALTER TABLE public.attendance ALTER COLUMN "staffId" TYPE text;
    END IF;
    -- Leaves
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leaves') THEN
        ALTER TABLE public.leaves ALTER COLUMN "staffId" TYPE text;
    END IF;
    -- Schedules (Trying both names)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedules') THEN
        ALTER TABLE public.schedules ALTER COLUMN "staffId" TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedule') THEN
        ALTER TABLE public.schedule ALTER COLUMN "staffId" TYPE text;
    END IF;
    -- Cash Registers
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cash_registers') THEN
        ALTER TABLE public.cash_registers ALTER COLUMN "opened_by" TYPE text;
        ALTER TABLE public.cash_registers ALTER COLUMN "closed_by" TYPE text;
    END IF;
    -- Cash Flows
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cash_flows') THEN
        ALTER TABLE public.cash_flows ALTER COLUMN "closed_by" TYPE text;
    END IF;
END $$;


-- 4. RECREATE POLICIES (Updated for TEXT compatibility)

-- Staff policies
CREATE POLICY "Staff can view own profile" ON public.staff FOR SELECT USING (id = auth.uid()::text);
CREATE POLICY "Admins can manage all staff" ON public.staff FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin')
);

-- Attendance policies (Generic permissive for Staff Portal)
DO $$ BEGIN
    CREATE POLICY "attendance_select_policy" ON public.attendance FOR SELECT USING (
      "staffId" = auth.uid()::text OR 
      EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin')
    );
    CREATE POLICY "attendance_insert_policy" ON public.attendance FOR INSERT WITH CHECK ("staffId" = auth.uid()::text);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Leaves policies
DO $$ BEGIN
    CREATE POLICY "leaves_select_policy" ON public.leaves FOR SELECT USING (
      "staffId" = auth.uid()::text OR 
      EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin')
    );
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Storage Policy
CREATE POLICY "Admins can view all attendance photos" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'attendance-photos' AND 
  EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin')
);

-- Cash Register Policies (Restored from previous definition)
DO $$ BEGIN
    CREATE POLICY "Managers can view all cash registers" ON public.cash_registers FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user WHERE id::text = auth.uid()::text AND role IN ('Manager', 'Admin'))
    );
    CREATE POLICY "Staff can view their own cash registers" ON public.cash_registers FOR SELECT USING (
        opened_by = auth.uid()::text OR closed_by = auth.uid()::text
    );
    CREATE POLICY "Staff can insert their own cash registers" ON public.cash_registers FOR INSERT WITH CHECK (
        opened_by = auth.uid()::text
    );
    CREATE POLICY "Staff can update their own cash registers" ON public.cash_registers FOR UPDATE USING (
        opened_by = auth.uid()::text
    );
EXCEPTION WHEN undefined_table THEN NULL; END $$;


-- 5. SYNC MISSING DATA
INSERT INTO public.staff (
  id, name, email, role, status, outlet_id, join_date
)
SELECT 
  u.id::text, u.name, u.email, u.role, 'active', u."outletId", NOW()
FROM public."user" u
WHERE u.status = 'approved'
AND NOT EXISTS (SELECT 1 FROM public.staff s WHERE s.id = u.id::text);
