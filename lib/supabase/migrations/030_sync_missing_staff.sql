-- MEGA MIGRATION v4: Fix Staff ID Type with EXPANDED SCOPE (Operation Clean Sweep)
-- Covers SOPs, Inventory, Orders, Logs, etc to remove ALL dependencies.

-- 1. DROP ALL POLICIES ON RELATED TABLES (Expanded List)

-- Helper block to drop all policies on a huge list of tables
DO $$ 
DECLARE
    -- List of all tables potentially linked to Staff or having RLS checking Staff ID
    tables text[] := ARRAY[
        'staff', 'attendance', 'leaves', 
        'schedules', 'schedule', 
        'cash_registers', 'cash_flows',
        'sop_templates', 'sop_logs', 'sop_assignments',
        'inventory_logs', 'inventory_counts',
        'orders', 'void_requests',
        'staff_kpi', 'kpi_records',
        'notifications', 'audit_logs'
    ];
    tbl text;
    pol record;
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Check if table exists
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            -- Loop through all policies for this table
            FOR pol IN (
                SELECT policyname 
                FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = tbl
            ) LOOP
                EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.' || quote_ident(tbl);
            END LOOP;
        END IF;
    END LOOP;
END $$;


-- Drop Storage Policy explicitly
DROP POLICY IF EXISTS "Admins can view all attendance photos" ON storage.objects;


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


-- 3. ALTER COLUMNS TO TEXT (Global Schema Fix)
ALTER TABLE public.staff ALTER COLUMN id TYPE text;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance') THEN
        ALTER TABLE public.attendance ALTER COLUMN "staffId" TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leaves') THEN
        ALTER TABLE public.leaves ALTER COLUMN "staffId" TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedules') THEN
        ALTER TABLE public.schedules ALTER COLUMN "staffId" TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cash_registers') THEN
        ALTER TABLE public.cash_registers ALTER COLUMN "opened_by" TYPE text;
        ALTER TABLE public.cash_registers ALTER COLUMN "closed_by" TYPE text;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cash_flows') THEN
        ALTER TABLE public.cash_flows ALTER COLUMN "closed_by" TYPE text;
    END IF;
    -- SOP Logs often reference staff
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sop_logs') THEN
        ALTER TABLE public.sop_logs ALTER COLUMN "staff_id" TYPE text; -- standard snake_case usually
    END IF;
    -- Orders
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE public.orders ALTER COLUMN "staff_id" TYPE text; 
        ALTER TABLE public.orders ALTER COLUMN "server_id" TYPE text; -- sometimes named server_id
    END IF;
END $$;


-- 4. RECREATE POLICIES (Future Proofed for Text IDs)

-- Staff policies
CREATE POLICY "Staff can view own profile" ON public.staff FOR SELECT USING (id = auth.uid()::text);
CREATE POLICY "Admins can manage all staff" ON public.staff FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin')
);

-- Attendance policies
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
        CREATE POLICY "attendance_select_policy" ON public.attendance FOR SELECT USING (
          "staffId" = auth.uid()::text OR 
          EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin')
        );
        CREATE POLICY "attendance_insert_policy" ON public.attendance FOR INSERT WITH CHECK ("staffId" = auth.uid()::text);
        CREATE POLICY "attendance_delete_policy" ON public.attendance FOR DELETE USING (
             "staffId" = auth.uid()::text OR 
             EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin')
        );
        CREATE POLICY "attendance_update_policy" ON public.attendance FOR UPDATE USING ("staffId" = auth.uid()::text);
    END IF;
END $$;

-- Leaves policies
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leaves') THEN
        CREATE POLICY "leaves_select_policy" ON public.leaves FOR SELECT USING (
          "staffId" = auth.uid()::text OR 
          EXISTS (SELECT 1 FROM public.user u WHERE u.id::text = auth.uid()::text AND u.role = 'Admin')
        );
        CREATE POLICY "leaves_insert_policy" ON public.leaves FOR INSERT WITH CHECK ("staffId" = auth.uid()::text);
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


-- GENERIC RESTORE FOR OTHER TABLES (SOP, Inventory, etc)
-- Safety fallback: Restore basic Read Access for authenticated users on tables we wiped.
DO $$ 
DECLARE
    generic_tables text[] := ARRAY['sop_templates', 'sop_logs', 'sop_assignments', 'inventory_logs', 'orders', 'void_requests'];
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY generic_tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            EXECUTE 'CREATE POLICY "Enable read for authenticated ' || tbl || '" ON public.' || quote_ident(tbl) || ' FOR SELECT TO authenticated USING (true)';
        END IF;
    END LOOP;
END $$;


-- 5. SYNC MISSING DATA (Immediate Fix)
INSERT INTO public.staff (id, name, email, role, status, outlet_id, join_date)
SELECT u.id::text, u.name, u.email, u.role, 'active', u."outletId", NOW()
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
      NEW."outletId",
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
