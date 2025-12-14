-- AbangBob Dashboard - Suppliers & Purchase Orders Tables
-- Run this SQL in your Supabase SQL Editor to add supplier management

-- ========================================
-- CREATE HELPER FUNCTION (if not exists)
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- SUPPLIERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  account_numbers JSONB DEFAULT '[]'::jsonb,
  payment_terms TEXT DEFAULT 'cod' CHECK (payment_terms IN ('cod', 'net7', 'net14', 'net30')),
  lead_time_days INTEGER DEFAULT 3,
  rating DECIMAL(2,1) DEFAULT 3.0 CHECK (rating >= 0 AND rating <= 5),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Staff can manage suppliers" ON public.suppliers FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;

-- ========================================
-- PURCHASE ORDERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  supplier_name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
  expected_delivery DATE,
  actual_delivery DATE,
  notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created ON public.purchase_orders(created_at DESC);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view purchase_orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Staff can manage purchase_orders" ON public.purchase_orders FOR ALL USING (true);

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;

-- ========================================
-- UPDATE INVENTORY TABLE
-- ========================================
-- Add foreign key constraint to inventory table for supplier_id
ALTER TABLE public.inventory
  DROP CONSTRAINT IF EXISTS fk_inventory_supplier;

ALTER TABLE public.inventory
  ADD CONSTRAINT fk_inventory_supplier 
  FOREIGN KEY (supplier_id) 
  REFERENCES public.suppliers(id) 
  ON DELETE SET NULL;

-- Create index on supplier_id if not exists
CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON public.inventory(supplier_id);

-- ========================================
-- COMPLETE
-- ========================================
-- Migration complete! Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Run the seed script to populate suppliers and inventory data


