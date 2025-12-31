-- Optimize RLS policies by wrapping auth.uid() in (select auth.uid()) to avoid per-row re-evaluation
-- Addresses "auth_rls_initplan" performance warnings

-- cash_registers
DROP POLICY IF EXISTS "consolidated_cash_registers_select" ON "cash_registers";
CREATE POLICY "consolidated_cash_registers_select" ON "cash_registers"
FOR SELECT USING (
  (EXISTS ( SELECT 1 FROM "user" WHERE ("user".id = (select auth.uid())::text AND "user".role = ANY (ARRAY['Manager'::text, 'Admin'::text]))))
  OR
  (opened_by = (select auth.uid())::text)
  OR
  (closed_by = (select auth.uid())::text)
);

DROP POLICY IF EXISTS "consolidated_cash_registers_insert" ON "cash_registers";
CREATE POLICY "consolidated_cash_registers_insert" ON "cash_registers"
FOR INSERT WITH CHECK (
  (EXISTS ( SELECT 1 FROM "user" WHERE ("user".id = (select auth.uid())::text AND "user".role = ANY (ARRAY['Manager'::text, 'Admin'::text]))))
  OR
  (opened_by = (select auth.uid())::text)
);

DROP POLICY IF EXISTS "consolidated_cash_registers_update" ON "cash_registers";
CREATE POLICY "consolidated_cash_registers_update" ON "cash_registers"
FOR UPDATE USING (
  (EXISTS ( SELECT 1 FROM "user" WHERE ("user".id = (select auth.uid())::text AND "user".role = ANY (ARRAY['Manager'::text, 'Admin'::text]))))
  OR
  (opened_by = (select auth.uid())::text)
) WITH CHECK (
  (EXISTS ( SELECT 1 FROM "user" WHERE ("user".id = (select auth.uid())::text AND "user".role = ANY (ARRAY['Manager'::text, 'Admin'::text]))))
  OR
  (opened_by = (select auth.uid())::text)
);

DROP POLICY IF EXISTS "consolidated_cash_registers_delete" ON "cash_registers";
CREATE POLICY "consolidated_cash_registers_delete" ON "cash_registers"
FOR DELETE USING (
  EXISTS ( SELECT 1 FROM "user" WHERE ("user".id = (select auth.uid())::text AND "user".role = ANY (ARRAY['Manager'::text, 'Admin'::text])))
);

-- staff_xp
DROP POLICY IF EXISTS "staff_xp_insert" ON "staff_xp";
CREATE POLICY "staff_xp_insert" ON "staff_xp"
FOR INSERT WITH CHECK (
  EXISTS ( SELECT 1 FROM staff WHERE (staff.id = (select auth.uid())::text AND staff.role = ANY (ARRAY['Admin'::text, 'Manager'::text])))
);

DROP POLICY IF EXISTS "staff_xp_update" ON "staff_xp";
CREATE POLICY "staff_xp_update" ON "staff_xp"
FOR UPDATE USING (
  EXISTS ( SELECT 1 FROM staff WHERE (staff.id = (select auth.uid())::text AND staff.role = ANY (ARRAY['Admin'::text, 'Manager'::text])))
) WITH CHECK (
  EXISTS ( SELECT 1 FROM staff WHERE (staff.id = (select auth.uid())::text AND staff.role = ANY (ARRAY['Admin'::text, 'Manager'::text])))
);

DROP POLICY IF EXISTS "staff_xp_delete" ON "staff_xp";
CREATE POLICY "staff_xp_delete" ON "staff_xp"
FOR DELETE USING (
  EXISTS ( SELECT 1 FROM staff WHERE (staff.id = (select auth.uid())::text AND staff.role = ANY (ARRAY['Admin'::text, 'Manager'::text])))
);
