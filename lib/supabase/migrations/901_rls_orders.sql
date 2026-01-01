-- Migration: 901_rls_orders.sql
-- Purpose: Secure 'orders' and 'order_items' tables.
-- Strategy:
-- 1. Orders:
--    - SELECT: Owner (auth.uid = customer_id) OR Staff (is_staff()).
--    - INSERT: Authenticated Owner or Staff. (Anon uses create_public_order RPC).
--    - UPDATE: Owner or Staff.

-- =============================================================================
-- 1. ORDERS TABLE
-- =============================================================================

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Allow public to create orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated users to view own orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;
-- (Add generic list to catch any others commonly named)
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Policy 1: Staff can do EVERYTHING
CREATE POLICY "Staff can do everything on orders"
ON public.orders
FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Policy 2: Authenticated Customers can VIEW their own orders
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Policy 3: Authenticated Customers can INSERT their own orders
CREATE POLICY "Customers can insert own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Policy 4: Authenticated Customers can UPDATE their own orders
-- (Might restrict columns in future, but generally okay for now)
CREATE POLICY "Customers can update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());



