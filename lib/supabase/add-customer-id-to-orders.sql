-- ============================================================================
-- LINK ORDERS TO CUSTOMERS
-- This enables tracking which customer made an order for loyalty points
-- ============================================================================

-- Add customer_id column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
