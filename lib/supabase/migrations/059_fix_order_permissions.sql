-- Allow public (anon) to insert orders
-- This is necessary for the online ordering system where users are not authenticated via Auth
-- [DEPRECATED POLICY]
-- Orders must be created via RPC create_public_order (901_rls_orders.sql).
-- DROP POLICY IF EXISTS "Allow public to create orders" ON "orders";
-- CREATE POLICY "Allow public to create orders" ...

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
