-- Fix duplicate indexes
DROP INDEX IF EXISTS idx_claim_requests_staff;
ALTER TABLE leave_balances DROP CONSTRAINT IF EXISTS unique_staff_year;
DROP INDEX IF EXISTS idx_leave_requests_staff;

-- Fix redundant policies
DROP POLICY IF EXISTS "Enable read for authenticated staff_positions" ON staff_positions;

-- Optimize staff_xp policies
-- "Admins can manage XP"
ALTER POLICY "Admins can manage XP" ON staff_xp 
USING ( EXISTS ( SELECT 1 FROM staff WHERE ((staff.id = (select auth.uid())::text) AND (staff.role = ANY (ARRAY['Admin'::text, 'Manager'::text])))) );

-- "Staff can view own XP"
ALTER POLICY "Staff can view own XP" ON staff_xp 
USING ( ((select auth.uid())::text = staff_id) );

-- Optimize xp_logs policies
-- "Staff can view own XP logs"
ALTER POLICY "Staff can view own XP logs" ON xp_logs 
USING ( ((select auth.uid())::text = staff_id) );

-- Optimize cash_registers policies
-- "Managers can view all cash registers"
ALTER POLICY "Managers can view all cash registers" ON cash_registers 
USING ( EXISTS ( SELECT 1 FROM "user" WHERE (("user".id = (select auth.uid())::text) AND ("user".role = ANY (ARRAY['Manager'::text, 'Admin'::text])))) );

-- "Staff can insert their own cash registers"
ALTER POLICY "Staff can insert their own cash registers" ON cash_registers 
WITH CHECK ( (opened_by = (select auth.uid())::text) );

-- "Staff can update their own cash registers"
ALTER POLICY "Staff can update their own cash registers" ON cash_registers 
USING ( (opened_by = (select auth.uid())::text) );

-- "Staff can view their own cash registers"
ALTER POLICY "Staff can view their own cash registers" ON cash_registers 
USING ( ((opened_by = (select auth.uid())::text) OR (closed_by = (select auth.uid())::text)) );
