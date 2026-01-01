-- Migration: 914_fix_inventory_access.sql
-- Purpose: Ensure Inventory and Menu are readable by ALL authenticated users.
-- This fixes the "blank screen" issue for staff if is_staff() logic is too strict/failing.

-- 1. Inventory Read Access
DROP POLICY IF EXISTS "Allow authenticated read inventory" ON public.inventory;
CREATE POLICY "Allow authenticated read inventory"
ON public.inventory FOR SELECT
TO authenticated
USING (true);

-- 2. Menu Items Read Access
DROP POLICY IF EXISTS "Allow authenticated read menu_items" ON public.menu_items;
CREATE POLICY "Allow authenticated read menu_items"
ON public.menu_items FOR SELECT
TO authenticated
USING (true);

-- 3. Suppliers Read Access (Often needed for inventory view)
DROP POLICY IF EXISTS "Allow authenticated read suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated read suppliers"
ON public.suppliers FOR SELECT
TO authenticated
USING (true);
