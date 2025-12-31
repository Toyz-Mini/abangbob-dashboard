-- Improve create_public_customer to handle "Find or Create" logic
-- This prevents unique constraint errors when the client cannot see existing customers due to RLS
-- and attempts to create a duplicate.

create or replace function public.create_public_customer(data jsonb)
returns setof customers
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_customer customers%rowtype;
  new_customer customers%rowtype;
  input_phone text;
begin
  -- Extract phone from jsonb input
  input_phone := data->>'phone';

  -- 1. Try to find existing customer by phone
  if input_phone is not null then
    select * into existing_customer from customers where phone = input_phone limit 1;
    if found then
      -- If found, return it immediately without trying to insert
      return next existing_customer;
      return;
    end if;
  end if;

  -- 2. If not found, Insert new customer
  insert into customers
  select * from jsonb_populate_record(null::customers, data)
  returning * into new_customer;
  
  return next new_customer;
  return;
end;
$$;

-- Ensure permissions are still correct (redundant but safe)
grant execute on function public.create_public_customer(jsonb) to anon;
grant execute on function public.create_public_customer(jsonb) to authenticated;
grant execute on function public.create_public_customer(jsonb) to service_role;
