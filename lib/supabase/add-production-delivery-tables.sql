-- Production Logs & Delivery Orders Tables
-- Phase 2: Core missing tables

-- ========================================
-- PRODUCTION LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.production_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  item TEXT NOT NULL,
  quantity_produced DECIMAL(10,2) NOT NULL,
  waste_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.staff(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_logs_date ON public.production_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_production_logs_outlet ON public.production_logs(outlet_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_item ON public.production_logs(item);

-- RLS
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view production logs" ON public.production_logs FOR SELECT USING (true);
CREATE POLICY "Staff can create production logs" ON public.production_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update production logs" ON public.production_logs FOR UPDATE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_logs;

-- ========================================
-- DELIVERY ORDERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  platform TEXT NOT NULL CHECK (platform IN ('Grab', 'Panda', 'Shopee')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'ready', 'picked_up')),
  driver_name TEXT,
  driver_plate TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.staff(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_orders_platform ON public.delivery_orders(platform);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON public.delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_created ON public.delivery_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_outlet ON public.delivery_orders(outlet_id);

-- RLS
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view delivery orders" ON public.delivery_orders FOR SELECT USING (true);
CREATE POLICY "Staff can create delivery orders" ON public.delivery_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update delivery orders" ON public.delivery_orders FOR UPDATE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_orders;

COMMENT ON TABLE public.production_logs IS 'Daily production tracking with waste management';
COMMENT ON TABLE public.delivery_orders IS 'Orders from delivery platforms (Grab, Panda, Shopee)';

