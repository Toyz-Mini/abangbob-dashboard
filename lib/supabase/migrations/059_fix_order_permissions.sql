-- Allow public (anon) to insert orders
-- This is necessary for the online ordering system where users are not authenticated via Auth
create policy "Allow public to create orders"
on "orders"
for insert
to anon
with check (true);

-- Create a secure function to fetch a specific order by ID
-- This allows "anon" users to view the order they just created without exposing all orders
create or replace function public.get_public_order(order_id uuid)
returns setof orders
language sql
security definer
set search_path = public
as $$
  select * from orders where id = order_id;
$$;

-- Grant access to the function
grant execute on function public.get_public_order(uuid) to anon;
grant execute on function public.get_public_order(uuid) to authenticated;
grant execute on function public.get_public_order(uuid) to service_role;
