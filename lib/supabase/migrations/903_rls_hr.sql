-- Migration: 903_rls_hr.sql
-- Purpose: Secure Sensitive HR, Inventory, and Operations tables.
-- Strategy:
--    - READ: Staff Only (is_staff()).
--    - WRITE: Staff Only (Operations) OR Admin Only (HR/Audit).

-- =============================================================================
-- 1. STAFF (High Sensitivity)
-- =============================================================================
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.staff;
-- Drop overlapping policies from previous attempts
DROP POLICY IF EXISTS "Staff can see all staff" ON public.staff;
DROP POLICY IF EXISTS "Admin can manage staff" ON public.staff;

-- Standard Staff: Can view directory (e.g. to assign tasks, see schedule)
CREATE POLICY "Staff can view staff directory"
ON public.staff FOR SELECT
TO authenticated
USING (public.is_staff());

-- Admin/Manager: Can Add/Edit/Remove Staff
CREATE POLICY "Admins can manage staff"
ON public.staff FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- =============================================================================
-- 2. INVENTORY & SUPPLIERS (Operations)
-- =============================================================================
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.inventory;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Staff can manage inventory" ON public.inventory;

-- Unified Policy: Staff can do everything (Managers/Crew need to count stock)
CREATE POLICY "Staff can manage inventory"
ON public.inventory FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

CREATE POLICY "Staff can manage suppliers"
ON public.suppliers FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());


-- =============================================================================
-- 3. ATTENDANCE (Mixed Personal/Admin)
-- =============================================================================
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.attendance;

-- Staff can view/punch their OWN attendance? 
-- Usually clock-in systems might insert with auth.uid.
-- Let's allow Staff to VIEW their own.
CREATE POLICY "Staff can view own attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (staff_id = auth.uid()::text);

-- Admins can VIEW/MANAGE ALL attendance
CREATE POLICY "Admins can manage attendance"
ON public.attendance FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow Staff to INSERT (Clock In) - but typically done via RPC for validation?
-- If direct insert is used:
CREATE POLICY "Staff can clock in/out"
ON public.attendance FOR INSERT
TO authenticated
WITH CHECK (staff_id = auth.uid()::text);


-- =============================================================================
-- 4. CASH REGISTERS (Finance)
-- =============================================================================
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.cash_registers;

-- Only authenticated staff can touch registers
CREATE POLICY "Staff can manage cash_registers"
ON public.cash_registers FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());


-- =============================================================================
-- 5. AUDIT LOGS (System)
-- =============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.audit_logs;

-- Admins Only
CREATE POLICY "Admins can view audit_logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

-- System/Staff can INSERT logs (but not read everything)
-- Most logs are created by triggers or backend.
-- Allow insert for all staff?
CREATE POLICY "Staff can insert audit_logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_staff());
