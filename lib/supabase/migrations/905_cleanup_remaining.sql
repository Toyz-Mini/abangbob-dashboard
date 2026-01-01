-- Migration: 905_cleanup_remaining.sql
-- Purpose: Final sweep to secure remaining tables found with insecure public policies.
-- Tables: leave_requests, replacement_leaves, inventory_logs, holiday_policies, public_holidays, holiday_work_logs.

-- =============================================================================
-- 1. LEAVE REQUESTS
-- =============================================================================
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to leave_requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.leave_requests;

-- Staff View Own
CREATE POLICY "Staff can view own leave_requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (staff_id = auth.uid()::text);

-- Staff Create Own
CREATE POLICY "Staff can create own leave_requests"
ON public.leave_requests FOR INSERT
TO authenticated
WITH CHECK (staff_id = auth.uid()::text);

-- Staff Update Own (e.g. cancel)
CREATE POLICY "Staff can update own leave_requests"
ON public.leave_requests FOR UPDATE
TO authenticated
USING (staff_id = auth.uid()::text);

-- Admin Manage All
CREATE POLICY "Admins can manage leave_requests"
ON public.leave_requests FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- =============================================================================
-- 2. REPLACEMENT LEAVES
-- =============================================================================
ALTER TABLE public.replacement_leaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to replacement_leaves" ON public.replacement_leaves;

-- Staff View Own (assuming staff_id exists, based on pattern)
CREATE POLICY "Staff can view own replacement_leaves"
ON public.replacement_leaves FOR SELECT
TO authenticated
USING (staff_id = auth.uid()::text);

CREATE POLICY "Admins can manage replacement_leaves"
ON public.replacement_leaves FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- =============================================================================
-- 3. INVENTORY LOGS
-- =============================================================================
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public to create inventory logs" ON public.inventory_logs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.inventory_logs;

-- Staff All (Operational)
CREATE POLICY "Staff can manage inventory_logs"
ON public.inventory_logs FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());


-- =============================================================================
-- 4. HOLIDAYS (Config)
-- =============================================================================
ALTER TABLE public.holiday_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to holiday_policies" ON public.holiday_policies;

ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to public_holidays" ON public.public_holidays;

-- Read: Staff, Write: Admin
CREATE POLICY "Staff can view holiday_policies"
ON public.holiday_policies FOR SELECT
TO authenticated
USING (public.is_staff());

CREATE POLICY "Admins can manage holiday_policies"
ON public.holiday_policies FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Staff can view public_holidays"
ON public.public_holidays FOR SELECT
TO authenticated
USING (public.is_staff());

CREATE POLICY "Admins can manage public_holidays"
ON public.public_holidays FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- =============================================================================
-- 5. HOLIDAY WORK LOGS
-- =============================================================================
ALTER TABLE public.holiday_work_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to holiday_work_logs" ON public.holiday_work_logs;

-- Staff View Own
CREATE POLICY "Staff can view own holiday_work_logs"
ON public.holiday_work_logs FOR SELECT
TO authenticated
USING (staff_id = auth.uid()::text);

CREATE POLICY "Admins can manage holiday_work_logs"
ON public.holiday_work_logs FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
