-- Consolidate multiple permissive RLS policies on cash_registers, staff_positions, and staff_xp

-- cash_registers
DROP POLICY IF EXISTS "Managers can view all cash registers" ON "cash_registers";
DROP POLICY IF EXISTS "Staff can insert their own cash registers" ON "cash_registers";
DROP POLICY IF EXISTS "Staff can view their own cash registers" ON "cash_registers";
DROP POLICY IF EXISTS "Staff can update their own cash registers" ON "cash_registers";

CREATE POLICY "consolidated_cash_registers_select" ON "cash_registers"
FOR SELECT USING (
  (EXISTS ( SELECT 1 FROM "user" WHERE ("user".id = (auth.uid())::text AND "user".role = ANY (ARRAY['Manager'::text, 'Admin'::text]))))
  OR
  (opened_by = (auth.uid())::text)
  OR
  (closed_by = (auth.uid())::text)
);

CREATE POLICY "consolidated_cash_registers_insert" ON "cash_registers"
FOR INSERT WITH CHECK (
  (EXISTS ( SELECT 1 FROM "user" WHERE ("user".id = (auth.uid())::text AND "user".role = ANY (ARRAY['Manager'::text, 'Admin'::text]))))
  OR
  (opened_by = (auth.uid())::text)
);

CREATE POLICY "consolidated_cash_registers_update" ON "cash_registers"
FOR UPDATE USING (
  (EXISTS ( SELECT 1 FROM "user" WHERE ("user".id = (auth.uid())::text AND "user".role = ANY (ARRAY['Manager'::text, 'Admin'::text]))))
  OR
  (opened_by = (auth.uid())::text)
) WITH CHECK (
  (EXISTS ( SELECT 1 FROM "user" WHERE ("user".id = (auth.uid())::text AND "user".role = ANY (ARRAY['Manager'::text, 'Admin'::text]))))
  OR
  (opened_by = (auth.uid())::text)
);

CREATE POLICY "consolidated_cash_registers_delete" ON "cash_registers"
FOR DELETE USING (
  EXISTS ( SELECT 1 FROM "user" WHERE ("user".id = (auth.uid())::text AND "user".role = ANY (ARRAY['Manager'::text, 'Admin'::text])))
);

-- staff_positions
-- Confine "Allow public read access" to anon only to avoid duplicate execution for authenticated users
DROP POLICY IF EXISTS "Allow public read access" ON "staff_positions";

CREATE POLICY "Allow public read access" ON "staff_positions"
FOR SELECT TO anon USING (true);


-- staff_xp
DROP POLICY IF EXISTS "Admins can manage XP" ON "staff_xp";
DROP POLICY IF EXISTS "Staff can view all XP for leaderboard" ON "staff_xp";
DROP POLICY IF EXISTS "Staff can view own XP" ON "staff_xp";

CREATE POLICY "staff_xp_select" ON "staff_xp"
FOR SELECT USING (true);

CREATE POLICY "staff_xp_insert" ON "staff_xp"
FOR INSERT WITH CHECK (
  EXISTS ( SELECT 1 FROM staff WHERE (staff.id = (auth.uid())::text AND staff.role = ANY (ARRAY['Admin'::text, 'Manager'::text])))
);

CREATE POLICY "staff_xp_update" ON "staff_xp"
FOR UPDATE USING (
  EXISTS ( SELECT 1 FROM staff WHERE (staff.id = (auth.uid())::text AND staff.role = ANY (ARRAY['Admin'::text, 'Manager'::text])))
) WITH CHECK (
  EXISTS ( SELECT 1 FROM staff WHERE (staff.id = (auth.uid())::text AND staff.role = ANY (ARRAY['Admin'::text, 'Manager'::text])))
);

CREATE POLICY "staff_xp_delete" ON "staff_xp"
FOR DELETE USING (
  EXISTS ( SELECT 1 FROM staff WHERE (staff.id = (auth.uid())::text AND staff.role = ANY (ARRAY['Admin'::text, 'Manager'::text])))
);
