-- Allow public (anon) to create customers
-- Required for new online order customers
drop policy if exists "Allow public to create customers" on "customers";
create policy "Allow public to create customers"
on "customers"
for insert
to anon
with check (true);

-- Allow public (anon) to update inventory
-- Required for automatic stock deduction upon order
-- [DEPRECATED POLICY]
-- Inventory management is restricted to Staff only (903_rls_hr.sql).
-- DROP POLICY IF EXISTS "Allow public to update inventory" ON "inventory";
-- CREATE POLICY "Allow public to update inventory" ...

-- Allow public (anon) to read inventory is likely needed to check stock before update
-- [DEPRECATED POLICY]
-- Inventory is private.
-- DROP POLICY IF EXISTS "Allow public to read inventory" ON "inventory";
-- CREATE POLICY "Allow public to read inventory" ...

-- Also allow public to insert into inventory_logs (if the app logs deductions)
-- [DEPRECATED POLICY]
-- Inventory logs are private.
-- DROP POLICY IF EXISTS "Allow public to create inventory logs" ON "inventory_logs";
-- CREATE POLICY "Allow public to create inventory logs" ...
