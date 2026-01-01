-- Migration: 915_fix_inventory_write_access.sql
-- Purpose: Grant INSERT, UPDATE, DELETE permissions on 'inventory' table to staff.
-- This depends on is_staff() being robust (fixed in 913).

-- 1. Inventory Insert Access
DROP POLICY IF EXISTS "Allow authenticated insert inventory" ON public.inventory;
CREATE POLICY "Allow authenticated insert inventory"
ON public.inventory FOR INSERT
TO authenticated
WITH CHECK (
  public.is_staff() = true
);

-- 2. Inventory Update Access
DROP POLICY IF EXISTS "Allow authenticated update inventory" ON public.inventory;
CREATE POLICY "Allow authenticated update inventory"
ON public.inventory FOR UPDATE
TO authenticated
USING (
  public.is_staff() = true
)
WITH CHECK (
  public.is_staff() = true
);

-- 3. Inventory Delete Access
DROP POLICY IF EXISTS "Allow authenticated delete inventory" ON public.inventory;
CREATE POLICY "Allow authenticated delete inventory"
ON public.inventory FOR DELETE
TO authenticated
USING (
  public.is_staff() = true
);

-- Note: SELECT policy was already handled in 914_fix_inventory_access.sql as permissive "true" for authenticated. 
-- We can leave that as is (broad read access) or restrict it. 
-- For now, we only care about unblocking write access for staff.
