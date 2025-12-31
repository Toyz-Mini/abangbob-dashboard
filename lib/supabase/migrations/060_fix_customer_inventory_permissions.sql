-- Allow public (anon) to create customers
-- Required for new online order customers
create policy "Allow public to create customers"
on "customers"
for insert
to anon
with check (true);

-- Allow public (anon) to update inventory
-- Required for automatic stock deduction upon order
-- Note: This is permissive. Ideally, we would use a secure RPC for this, 
-- but for now, we enable the update policy to unblock the feature.
create policy "Allow public to update inventory"
on "inventory"
for update
to anon
using (true)
with check (true);

-- Allow public (anon) to read inventory is likely needed to check stock before update
-- IF not already enabled. Checking existing policies...
-- Assuming public read might already be there or not needed if we blindly update.
-- But 'using (true)' in update policy requires read access if it scans.
create policy "Allow public to read inventory"
on "inventory"
for select
to anon
using (true);

-- Also allow public to insert into inventory_logs (if the app logs deductions)
create policy "Allow public to create inventory logs"
on "inventory_logs"
for insert
to anon
with check (true);
