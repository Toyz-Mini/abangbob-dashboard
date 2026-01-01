-- Migration: 904_cleanup_security.sql
-- Purpose: Clean up dangerous leftover policies from previous migrations (053, 054, etc.)
-- Ensure only the new, strict policies from 900-903 remain.

-- 1. CASH REGISTERS
-- Remove "consolidated" policies which were wide (TO public)
DROP POLICY IF EXISTS "consolidated_cash_registers_select" ON public.cash_registers;
DROP POLICY IF EXISTS "consolidated_cash_registers_insert" ON public.cash_registers;
DROP POLICY IF EXISTS "consolidated_cash_registers_update" ON public.cash_registers;
DROP POLICY IF EXISTS "consolidated_cash_registers_delete" ON public.cash_registers;

-- 2. INVENTORY
-- Remove dangerous public policies that might have been created manually or by older scripts
DROP POLICY IF EXISTS "Allow public to read inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow public to update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Public can view inventory" ON public.inventory;

-- 3. STAFF
-- Remove dangerous public management
DROP POLICY IF EXISTS "Allow staff management" ON public.staff;

-- 4. STAFF POSITIONS
-- Secure this table (was public read)
ALTER TABLE public.staff_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.staff_positions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.staff_positions;

CREATE POLICY "Authenticated can view staff_positions"
ON public.staff_positions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage staff_positions"
ON public.staff_positions FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. STAFF XP
-- Remove public select
DROP POLICY IF EXISTS "staff_xp_select" ON public.staff_xp;
DROP POLICY IF EXISTS "staff_xp_insert" ON public.staff_xp;
DROP POLICY IF EXISTS "staff_xp_update" ON public.staff_xp;
DROP POLICY IF EXISTS "staff_xp_delete" ON public.staff_xp;

-- Re-implement securely
CREATE POLICY "Staff can view staff_xp"
ON public.staff_xp FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage staff_xp"
ON public.staff_xp FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. XP LOGS
DROP POLICY IF EXISTS "Staff can view own XP logs" ON public.xp_logs;
DROP POLICY IF EXISTS "users_view_own_xp_logs" ON public.xp_logs;

CREATE POLICY "Staff can view own XP logs"
ON public.xp_logs FOR SELECT
TO authenticated
USING (staff_id = auth.uid()::text);

-- 7. CHECKLIST COMPLETIONS (Cleanup)
ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.checklist_completions;
-- Assume Staff can View/Create
CREATE POLICY "Staff can manage checklist_completions"
ON public.checklist_completions FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- 8. CHECKLIST TEMPLATES
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.checklist_templates;

CREATE POLICY "Staff can view checklist_templates"
ON public.checklist_templates FOR SELECT
TO authenticated
USING (public.is_staff());

CREATE POLICY "Admins can manage checklist_templates"
ON public.checklist_templates FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
