-- Fix create_public_order to handle default values correctly
-- jsonb_populate_record produces NULLs for missing fields, which bypasses Postgres column defaults.
-- We must manually apply defaults for critical columns to avoid NOT NULL violations.

create or replace function public.create_public_order(data jsonb)
returns setof orders
language plpgsql
security definer
set search_path = public
as $$
declare
  new_record orders%rowtype;
begin
  -- Populate record from JSON (missing fields become NULL)
  new_record := jsonb_populate_record(null::orders, data);

  -- Manually apply defaults if NULL
  if new_record.id is null then new_record.id := gen_random_uuid(); end if;
  if new_record.created_at is null then new_record.created_at := now(); end if;
  if new_record.updated_at is null then new_record.updated_at := now(); end if;
  
  -- Enum/Text defaults
  if new_record.status is null then new_record.status := 'pending'; end if;
  if new_record.order_type is null then new_record.order_type := 'takeaway'; end if;
  if new_record.items is null then new_record.items := '[]'::jsonb; end if;
  
  -- Numeric defaults
  if new_record.subtotal is null then new_record.subtotal := 0; end if;
  if new_record.discount is null then new_record.discount := 0; end if;
  if new_record.tax is null then new_record.tax := 0; end if;
  if new_record.total is null then new_record.total := 0; end if;
  
  -- Prevent NOT NULL violation for order_number if missing
  if new_record.order_number is null then 
    -- Fallback generation: Timestamp + random suffix
    new_record.order_number := to_char(now(), 'YYMMDDHH24MISS');
  end if;

  -- Insert the fully populated record
  insert into orders values (new_record.*)
  returning * into new_record;
  
  return next new_record;
end;
$$;

-- Ensure permissions
grant execute on function public.create_public_order(jsonb) to anon;
grant execute on function public.create_public_order(jsonb) to authenticated;
grant execute on function public.create_public_order(jsonb) to service_role;
