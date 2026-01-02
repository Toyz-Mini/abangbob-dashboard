-- Migration to fix Inventory RLS with RBAC (Role Based Access Control)
-- Roles:
-- Staff: View & Update
-- Admin/Manager: View, Update, Insert, Delete

-- 1. Drop existing policies to clean up
DROP POLICY IF EXISTS "Allow authenticated delete inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated insert inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated update inventory" ON inventory;
DROP POLICY IF EXISTS "Staff can manage inventory" ON inventory;
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON inventory;
DROP POLICY IF EXISTS "Staff Access" ON inventory;

-- Ensure RLS is enabled
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- 2. Create Granular Policies

-- SELECT: All Staff can view
CREATE POLICY "Staff can view inventory"
ON inventory
FOR SELECT
TO authenticated
USING (is_staff());

-- UPDATE: All Staff can update (e.g. adjust stock)
CREATE POLICY "Staff can update inventory"
ON inventory
FOR UPDATE
TO authenticated
USING (is_staff())
WITH CHECK (is_staff());

-- INSERT: Only Admin/Manager can add items
-- (is_admin() checks for Admin, Manager, Owner roles)
CREATE POLICY "Admins and Managers can add inventory"
ON inventory
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- DELETE: Only Admin/Manager can delete items
CREATE POLICY "Admins and Managers can delete inventory"
ON inventory
FOR DELETE
TO authenticated
USING (is_admin());
