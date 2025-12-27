-- MEGA MIGRATION v8: Fix Staff ID AND Outlet ID Types (The "Universal Adaptor")
-- Now handles staff.id AND staff.outlet_id type mismatches.

-- 1. DROP ALL POLICIES ON ALL TABLES (Global Scan)

DO $$ 
DECLARE
    tbl text;
    pol record;
BEGIN
    FOR tbl IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    ) LOOP
        FOR pol IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = tbl
        ) LOOP
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.' || quote_ident(tbl);
        END LOOP;
    END LOOP;
END $$;


-- Drop Storage Policy explicitly
DROP POLICY IF EXISTS "Admins can view all attendance photos" ON storage.objects;


-- 2. DROP FOREIGN KEYS (Outgoing & Incoming)

-- A) Drop Incoming FKs (Other tables referencing staff.id)
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

-- B) Drop Outgoing FKs from Staff (e.g. staff.outlet_id references outlets)
-- This allows us to change outlet_id type
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'staff' 
        AND constraint_type = 'FOREIGN KEY'
    ) LOOP
        EXECUTE 'ALTER TABLE public.staff DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;


-- 3. ALTER COLUMNS TO TEXT (Dynamic Column Check)
ALTER TABLE public.staff ALTER COLUMN id TYPE text;
ALTER TABLE public.staff ALTER COLUMN outlet_id TYPE text; -- CHANGED to TEXT

DO $$ BEGIN
    -- Attendance
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='attendance' AND column_name='staffId') THEN
        ALTER TABLE public.attendance ALTER COLUMN "staffId" TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='attendance' AND column_name='staff_id') THEN
        ALTER TABLE public.attendance ALTER COLUMN "staff_id" TYPE text;
    END IF;

    -- Leaves
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='leaves' AND column_name='staffId') THEN
        ALTER TABLE public.leaves ALTER COLUMN "staffId" TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='leaves' AND column_name='staff_id') THEN
        ALTER TABLE public.leaves ALTER COLUMN "staff_id" TYPE text;
    END IF;

    -- Schedules
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='schedules' AND column_name='staffId') THEN
        ALTER TABLE public.schedules ALTER COLUMN "staffId" TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='schedules' AND column_name='staff_id') THEN
        ALTER TABLE public.schedules ALTER COLUMN "staff_id" TYPE text;
    END IF;

    -- Cash Registers
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='cash_registers' AND column_name='opened_by') THEN
        ALTER TABLE public.cash_registers ALTER COLUMN "opened_by" TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='cash_registers' AND column_name='closed_by') THEN
        ALTER TABLE public.cash_registers ALTER COLUMN "closed_by" TYPE text;
    END IF;
    
    -- SOP / Orders (Snake case mostly)
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='sop_logs' AND column_name='staff_id') THEN
        ALTER TABLE public.sop_logs ALTER COLUMN "staff_id" TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='orders' AND column_name='staff_id') THEN
        ALTER TABLE public.orders ALTER COLUMN "staff_id" TYPE text;
    END IF;
     IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='orders' AND column_name='server_id') THEN
        ALTER TABLE public.orders ALTER COLUMN "server_id" TYPE text;
    END IF;
END $$;


-- 4. RECREATE POLICIES (Dynamic Column Usage)

-- Staff policies
CREATE POLICY "Staff can view own profile" ON public.staff FOR SELECT USING (id = auth.uid()::text);
CREATE POLICY "Admins can manage all staff" ON public.staff FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin')
);

-- Attendance policies
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='attendance' AND column_name='staffId') THEN
            -- Use camelCase
            CREATE POLICY "attendance_select_policy" ON public.attendance FOR SELECT USING ("staffId" = auth.uid()::text OR EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin'));
            CREATE POLICY "attendance_insert_policy" ON public.attendance FOR INSERT WITH CHECK ("staffId" = auth.uid()::text);
            CREATE POLICY "attendance_delete_policy" ON public.attendance FOR DELETE USING ("staffId" = auth.uid()::text OR EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin'));
            CREATE POLICY "attendance_update_policy" ON public.attendance FOR UPDATE USING ("staffId" = auth.uid()::text);
        ELSE
            -- Use snake_case
            CREATE POLICY "attendance_select_policy" ON public.attendance FOR SELECT USING (staff_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin'));
            CREATE POLICY "attendance_insert_policy" ON public.attendance FOR INSERT WITH CHECK (staff_id = auth.uid()::text);
            CREATE POLICY "attendance_delete_policy" ON public.attendance FOR DELETE USING (staff_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin'));
            CREATE POLICY "attendance_update_policy" ON public.attendance FOR UPDATE USING (staff_id = auth.uid()::text);
        END IF;
    END IF;
END $$;

-- Leaves policies
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leaves') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='leaves' AND column_name='staffId') THEN
             CREATE POLICY "leaves_select_policy" ON public.leaves FOR SELECT USING ("staffId" = auth.uid()::text OR EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin'));
             CREATE POLICY "leaves_insert_policy" ON public.leaves FOR INSERT WITH CHECK ("staffId" = auth.uid()::text);
        ELSE
             CREATE POLICY "leaves_select_policy" ON public.leaves FOR SELECT USING (staff_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin'));
             CREATE POLICY "leaves_insert_policy" ON public.leaves FOR INSERT WITH CHECK (staff_id = auth.uid()::text);
        END IF;
    END IF;
END $$;

-- Storage Policy
CREATE POLICY "Admins can view all attendance photos" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'attendance-photos' AND 
  EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin')
);

-- Cash Register Policies
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cash_registers') THEN
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
    END IF;
END $$;


-- RECREATE GENERIC POLICIES FOR EVERYTHING ELSE
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('attendance', 'leaves', 'cash_registers', 'staff', 'user') 
        AND tablename NOT LIKE 'pg_%'
    ) LOOP
        -- Only add policy if Row Level Security is enabled
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = tbl AND relrowsecurity = true) THEN
             EXECUTE 'CREATE POLICY "Enable read for authenticated ' || tbl || '" ON public.' || quote_ident(tbl) || ' FOR SELECT TO authenticated USING (true)';
        END IF;
    END LOOP;
END $$;


-- 5. SYNC MISSING DATA (Immediate Fix)
-- staff.id converted to text. staff.outlet_id converted to text.
-- Insert now works for ANY string format.
INSERT INTO public.staff (id, name, email, role, status, outlet_id, join_date)
SELECT 
    u.id::text, 
    u.name, 
    u.email, 
    u.role, 
    'active', 
    u."outletId"::text, -- Safe cast to text
    NOW()
FROM public."user" u
WHERE u.status = 'approved' AND NOT EXISTS (SELECT 1 FROM public.staff s WHERE s.id = u.id::text);


-- 6. AUTOMATION TRIGGER (Long Term Fix)
CREATE OR REPLACE FUNCTION public.handle_new_approved_staff()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.staff (id, name, email, role, status, outlet_id, join_date)
    VALUES (
      NEW.id::text,
      NEW.name,
      NEW.email,
      NEW.role,
      'active',
      NEW."outletId"::text, -- Ensure text
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_approve_create_staff ON public."user";
CREATE TRIGGER on_approve_create_staff
  AFTER UPDATE ON public."user"
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_approved_staff();

-- Done
