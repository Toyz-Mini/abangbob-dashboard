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
drop policy if exists "Allow public to update inventory" on "inventory";
create policy "Allow public to update inventory"
on "inventory"
for update
to anon
using (true)
with check (true);

-- Allow public (anon) to read inventory is likely needed to check stock before update
drop policy if exists "Allow public to read inventory" on "inventory";
create policy "Allow public to read inventory"
on "inventory"
for select
to anon
using (true);

-- Also allow public to insert into inventory_logs (if the app logs deductions)
drop policy if exists "Allow public to create inventory logs" on "inventory_logs";
create policy "Allow public to create inventory logs"
on "inventory_logs"
for insert
to anon
with check (true);
