-- Secure RPC for creating customers (public access)
-- Allows inserting a customer and immediately returning it (bypassing SELECT RLS)
create or replace function public.create_public_customer(data jsonb)
returns setof customers
language sql
security definer
set search_path = public
as $$
  insert into customers select * from jsonb_populate_record(null::customers, data)
  returning *;
$$;

grant execute on function public.create_public_customer(jsonb) to anon;
grant execute on function public.create_public_customer(jsonb) to authenticated;
grant execute on function public.create_public_customer(jsonb) to service_role;

-- Secure RPC for creating orders (public access)
-- Allows inserting an order and immediately returning it (bypassing SELECT RLS)
create or replace function public.create_public_order(data jsonb)
returns setof orders
language sql
security definer
set search_path = public
as $$
  insert into orders select * from jsonb_populate_record(null::orders, data)
  returning *;
$$;

grant execute on function public.create_public_order(jsonb) to anon;
grant execute on function public.create_public_order(jsonb) to authenticated;
grant execute on function public.create_public_order(jsonb) to service_role;
