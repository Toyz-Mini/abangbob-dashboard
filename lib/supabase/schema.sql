-- AbangBob Dashboard - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- OUTLETS TABLE (for multi-outlet support)
-- ========================================
CREATE TABLE IF NOT EXISTS public.outlets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  social_media JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb
);

-- ========================================
-- OUTLET SETTINGS TABLE (extended settings)
-- ========================================
CREATE TABLE IF NOT EXISTS public.outlet_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Payment Methods
  payment_methods JSONB DEFAULT '{"cash": true, "card": true, "qr": true, "ewallet": false}'::jsonb,
  -- Theme Settings
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  -- Order Settings
  order_number_prefix TEXT DEFAULT 'AB',
  -- Delivery Settings
  delivery_enabled BOOLEAN DEFAULT false,
  delivery_radius_km DECIMAL(5,2) DEFAULT 5.00,
  delivery_min_order DECIMAL(10,2) DEFAULT 10.00,
  delivery_fee DECIMAL(10,2) DEFAULT 3.00,
  -- Security Settings
  session_timeout_minutes INTEGER DEFAULT 480,
  pin_min_length INTEGER DEFAULT 4,
  require_clock_in_photo BOOLEAN DEFAULT true,
  UNIQUE(outlet_id)
);

CREATE INDEX IF NOT EXISTS idx_outlet_settings_outlet ON public.outlet_settings(outlet_id);

-- Add RLS for outlet_settings
ALTER TABLE public.outlet_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view outlet settings" ON public.outlet_settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage outlet settings" ON public.outlet_settings FOR ALL USING (true);

-- ========================================
-- STAFF TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Staff' CHECK (role IN ('Manager', 'Staff', 'Admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  pin TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) DEFAULT 5.00,
  ic_number TEXT,
  employment_type TEXT DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract')),
  join_date DATE,
  profile_photo_url TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_outlet ON public.staff(outlet_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);

-- ========================================
-- ATTENDANCE TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in_time TIME,
  clock_out_time TIME,
  clock_in_photo_url TEXT,
  clock_out_photo_url TEXT,
  break_duration INTEGER DEFAULT 0,
  notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  UNIQUE(staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_staff ON public.attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- ========================================
-- INVENTORY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_quantity DECIMAL(10,2) DEFAULT 0,
  min_quantity DECIMAL(10,2) DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  supplier_id UUID,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_outlet ON public.inventory(outlet_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);

-- ========================================
-- MENU ITEMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15, -- in minutes
  modifier_group_ids UUID[] DEFAULT '{}',
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_items_outlet ON public.menu_items(outlet_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);

-- ========================================
-- ORDERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  order_number TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'takeaway' CHECK (order_type IN ('dine-in', 'takeaway', 'delivery', 'gomamam')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT,
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  table_number INTEGER,
  notes TEXT,
  prepared_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  preparing_started_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_outlet ON public.orders(outlet_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- ========================================
-- CUSTOMERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birthday DATE,
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  segment TEXT DEFAULT 'new' CHECK (segment IN ('new', 'regular', 'vip')),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON public.customers(segment);

-- ========================================
-- EXPENSES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT,
  payment_method TEXT DEFAULT 'cash',
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_outlet ON public.expenses(outlet_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

-- ========================================
-- AUDIT LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  user_id UUID,
  user_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_outlet ON public.audit_logs(outlet_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust as needed)
-- These are basic policies - you may want to create more restrictive ones

-- Staff policies
CREATE POLICY "Staff can view all staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Managers can insert staff" ON public.staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Managers can update staff" ON public.staff FOR UPDATE USING (true);

-- Attendance policies
CREATE POLICY "Anyone can view attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Anyone can insert attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update attendance" ON public.attendance FOR UPDATE USING (true);

-- Inventory policies
CREATE POLICY "Anyone can view inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Staff can manage inventory" ON public.inventory FOR ALL USING (true);

-- Menu items policies
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Managers can manage menu items" ON public.menu_items FOR ALL USING (true);

-- Orders policies
CREATE POLICY "Anyone can view orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Staff can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE USING (true);

-- Customers policies
CREATE POLICY "Anyone can view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Staff can manage customers" ON public.customers FOR ALL USING (true);

-- Expenses policies
CREATE POLICY "Anyone can view expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Managers can manage expenses" ON public.expenses FOR ALL USING (true);

-- Audit logs policies
CREATE POLICY "Anyone can view audit logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Outlets policies
CREATE POLICY "Anyone can view outlets" ON public.outlets FOR SELECT USING (true);
CREATE POLICY "Admin can manage outlets" ON public.outlets FOR ALL USING (true);

-- ========================================
-- REALTIME SUBSCRIPTIONS
-- ========================================

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at
CREATE TRIGGER update_outlets_updated_at BEFORE UPDATE ON public.outlets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outlet_settings_updated_at BEFORE UPDATE ON public.outlet_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STORAGE BUCKETS (run in Supabase Dashboard > Storage)
-- ========================================
-- Create the following storage buckets manually in Supabase Dashboard:
-- 
-- 1. outlet-logos (public bucket for outlet logos)
--    - Enable public access
--    - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--    - Max file size: 2MB
--
-- Storage policies for outlet-logos bucket:
-- INSERT: authenticated users can upload
-- SELECT: public can view
-- UPDATE: authenticated users can update
-- DELETE: authenticated users can delete

