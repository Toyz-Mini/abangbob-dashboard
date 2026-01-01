-- Ensure order access for online ordering system
-- This migration consolidates and ensures all order permissions are correctly set

-- 1. Ensure get_public_order function exists and works correctly
DROP FUNCTION IF EXISTS public.get_public_order(uuid);
CREATE OR REPLACE FUNCTION public.get_public_order(order_id uuid)
RETURNS SETOF orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM orders WHERE id = order_id;
$$;

-- Grant execute permissions to all roles
GRANT EXECUTE ON FUNCTION public.get_public_order(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_order(uuid) TO service_role;

-- 2. Ensure create_public_order function has proper Smart Linking
DROP FUNCTION IF EXISTS public.create_public_order(jsonb);
CREATE OR REPLACE FUNCTION public.create_public_order(data jsonb)
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_record orders%rowtype;
  valid_customer_id uuid;
BEGIN
  -- 1. Populate record from JSON (missing fields become NULL)
  new_record := jsonb_populate_record(null::orders, data);

  -- 2. Handle Defaults
  IF new_record.id IS NULL THEN new_record.id := gen_random_uuid(); END IF;
  IF new_record.created_at IS NULL THEN new_record.created_at := now(); END IF;
  IF new_record.updated_at IS NULL THEN new_record.updated_at := now(); END IF;
  
  -- Enum/Text defaults
  IF new_record.status IS NULL THEN new_record.status := 'pending'; END IF;
  IF new_record.order_type IS NULL THEN new_record.order_type := 'takeaway'; END IF;
  IF new_record.items IS NULL THEN new_record.items := '[]'::jsonb; END IF;
  
  -- Numeric defaults
  IF new_record.subtotal IS NULL THEN new_record.subtotal := 0; END IF;
  IF new_record.discount IS NULL THEN new_record.discount := 0; END IF;
  IF new_record.tax IS NULL THEN new_record.tax := 0; END IF;
  IF new_record.total IS NULL THEN new_record.total := 0; END IF;
  
  -- Order Number Fallback
  IF new_record.order_number IS NULL THEN 
    new_record.order_number := to_char(now(), 'YYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 4);
  END IF;

  -- 3. SMART CUSTOMER LINKING
  -- Handle case where frontend sends a local UUID that doesn't exist in DB
  IF new_record.customer_id IS NOT NULL THEN
    SELECT id INTO valid_customer_id FROM customers WHERE id = new_record.customer_id;
    IF valid_customer_id IS NULL THEN
      -- ID provided but NOT found. Discard it.
      new_record.customer_id := NULL;
    END IF;
  END IF;

  -- If no valid ID, try to find by phone
  IF new_record.customer_id IS NULL AND new_record.customer_phone IS NOT NULL THEN
     SELECT id INTO valid_customer_id FROM customers WHERE phone = new_record.customer_phone LIMIT 1;
     IF valid_customer_id IS NOT NULL THEN
       new_record.customer_id := valid_customer_id;
     END IF;
  END IF;

  -- If STILL null and we have enough info, create a NEW customer
  IF new_record.customer_id IS NULL AND new_record.customer_name IS NOT NULL THEN
    INSERT INTO customers (id, name, phone, segment, created_at)
    VALUES (gen_random_uuid(), new_record.customer_name, new_record.customer_phone, 'new', now())
    RETURNING id INTO new_record.customer_id;
  END IF;

  -- 4. Insert the fully populated order
  INSERT INTO orders VALUES (new_record.*)
  RETURNING * INTO new_record;
  
  RETURN NEXT new_record;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_public_order(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_order(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_order(jsonb) TO service_role;

-- 3. Ensure RLS policy allows anon to insert orders
-- 3. [DEPRECATED POLICY]
-- Policy management has moved to 901_rls_orders.sql
-- Old: Allow public to create orders (Removed to enforce RPC usage)
-- DROP POLICY IF EXISTS "Allow public to create orders" ON "orders";
-- CREATE POLICY "Allow public to create orders" ...

-- 4. Ensure orders table has SELECT policy for service_role (for RPC)
-- Note: get_public_order uses SECURITY DEFINER so it runs as owner, not anon
-- But let's also add a policy in case direct access is attempted
-- 4. [DEPRECATED POLICY]
-- Policy management has moved to 901_rls_orders.sql
-- Old: Allow authenticated users to view own orders (was too permissive)
-- DROP POLICY IF EXISTS "Allow authenticated users to view own orders" ON "orders";
-- CREATE POLICY "Allow authenticated users to view own orders" ...

-- 5. Ensure RLS is enabled on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
