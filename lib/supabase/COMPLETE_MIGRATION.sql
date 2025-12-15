-- ========================================
-- ABANGBOB DASHBOARD - COMPLETE DATABASE SETUP
-- ========================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- Then click "Run" to execute all migrations
-- 
-- This file combines ALL migrations into one for easy deployment
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ========================================
-- This section handles cases where tables already exist but are missing new columns
-- Each block checks if table exists first, then adds column if missing

-- Add missing columns to staff table (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff') THEN
    -- Add extended_data column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'extended_data') THEN
      ALTER TABLE public.staff ADD COLUMN extended_data JSONB DEFAULT '{}'::jsonb;
    END IF;
    -- Add outlet_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'outlet_id') THEN
      ALTER TABLE public.staff ADD COLUMN outlet_id UUID;
    END IF;
    -- Add ic_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'ic_number') THEN
      ALTER TABLE public.staff ADD COLUMN ic_number TEXT;
    END IF;
    -- Add employment_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'employment_type') THEN
      ALTER TABLE public.staff ADD COLUMN employment_type TEXT DEFAULT 'full-time';
    END IF;
    -- Add join_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'join_date') THEN
      ALTER TABLE public.staff ADD COLUMN join_date DATE;
    END IF;
    -- Add profile_photo_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'profile_photo_url') THEN
      ALTER TABLE public.staff ADD COLUMN profile_photo_url TEXT;
    END IF;
  END IF;
END $$;

-- Add missing columns to orders table (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'void_refund_status') THEN
      ALTER TABLE public.orders ADD COLUMN void_refund_status TEXT DEFAULT 'none';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'refund_amount') THEN
      ALTER TABLE public.orders ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'refund_reason') THEN
      ALTER TABLE public.orders ADD COLUMN refund_reason TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cashier_id') THEN
      ALTER TABLE public.orders ADD COLUMN cashier_id UUID;
    END IF;
  END IF;
END $$;

-- Add missing columns to menu_items table (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_items') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'modifier_group_ids') THEN
      ALTER TABLE public.menu_items ADD COLUMN modifier_group_ids TEXT[] DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- ========================================
-- HELPER FUNCTION FOR UPDATED_AT
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

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
-- OUTLET SETTINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.outlet_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  payment_methods JSONB DEFAULT '{"cash": true, "card": true, "qr": true, "ewallet": false}'::jsonb,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  order_number_prefix TEXT DEFAULT 'AB',
  delivery_enabled BOOLEAN DEFAULT false,
  delivery_radius_km DECIMAL(5,2) DEFAULT 5.00,
  delivery_min_order DECIMAL(10,2) DEFAULT 10.00,
  delivery_fee DECIMAL(10,2) DEFAULT 3.00,
  session_timeout_minutes INTEGER DEFAULT 480,
  pin_min_length INTEGER DEFAULT 4,
  require_clock_in_photo BOOLEAN DEFAULT true,
  UNIQUE(outlet_id)
);

CREATE INDEX IF NOT EXISTS idx_outlet_settings_outlet ON public.outlet_settings(outlet_id);

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
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  extended_data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_staff_outlet ON public.staff(outlet_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);

-- Create index on extended_data only if column exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'extended_data') THEN
    CREATE INDEX IF NOT EXISTS idx_staff_extended_data ON public.staff USING gin(extended_data);
  END IF;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);

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
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_outlet ON public.inventory(outlet_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON public.inventory(supplier_id);

-- ========================================
-- INVENTORY LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  stock_item_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
  stock_item_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'initial')),
  quantity DECIMAL(10,2) NOT NULL,
  previous_quantity DECIMAL(10,2) NOT NULL,
  new_quantity DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_stock_item ON public.inventory_logs(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON public.inventory_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_type ON public.inventory_logs(type);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_outlet ON public.inventory_logs(outlet_id);

-- ========================================
-- MODIFIER GROUPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.modifier_groups (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  allow_multiple BOOLEAN DEFAULT false,
  min_selection INTEGER DEFAULT 0,
  max_selection INTEGER DEFAULT 1,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_modifier_groups_outlet ON public.modifier_groups(outlet_id);

-- ========================================
-- MODIFIER OPTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.modifier_options (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  group_id TEXT NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  extra_price DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_modifier_options_group ON public.modifier_options(group_id);
CREATE INDEX IF NOT EXISTS idx_modifier_options_outlet ON public.modifier_options(outlet_id);

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
  preparation_time INTEGER DEFAULT 15,
  modifier_group_ids TEXT[] DEFAULT '{}',
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_items_outlet ON public.menu_items(outlet_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);

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
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  void_refund_status TEXT DEFAULT 'none' CHECK (void_refund_status IN ('none', 'pending_void', 'pending_refund', 'voided', 'refunded', 'partial_refund')),
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  refunded_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  is_synced_offline BOOLEAN DEFAULT false,
  original_offline_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_outlet ON public.orders(outlet_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cashier ON public.orders(cashier_id);
CREATE INDEX IF NOT EXISTS idx_orders_void_refund ON public.orders(void_refund_status);

-- ========================================
-- ORDER ITEMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  modifiers JSONB DEFAULT '[]'::jsonb,
  is_refunded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON public.order_items(menu_item_id);

-- ========================================
-- PAYMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'qr', 'ewallet')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'voided')),
  reference_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ========================================
-- VOID/REFUND REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.void_refund_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('void', 'refund', 'partial_refund')),
  reason TEXT NOT NULL,
  amount DECIMAL(10,2),
  items_to_refund JSONB DEFAULT '[]'::jsonb,
  requested_by UUID NOT NULL REFERENCES public.staff(id) ON DELETE SET NULL,
  requested_by_name TEXT NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  sales_reversed BOOLEAN DEFAULT false,
  inventory_reversed BOOLEAN DEFAULT false,
  reversal_details JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_void_refund_order ON public.void_refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_void_refund_status ON public.void_refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_void_refund_created ON public.void_refund_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_void_refund_requested_by ON public.void_refund_requests(requested_by);

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

CREATE INDEX IF NOT EXISTS idx_production_logs_date ON public.production_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_production_logs_outlet ON public.production_logs(outlet_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_item ON public.production_logs(item);

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

CREATE INDEX IF NOT EXISTS idx_delivery_orders_platform ON public.delivery_orders(platform);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON public.delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_created ON public.delivery_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_outlet ON public.delivery_orders(outlet_id);

-- ========================================
-- DAILY CASH FLOWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.daily_cash_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  opening_cash DECIMAL(10,2) DEFAULT 0,
  sales_cash DECIMAL(10,2) DEFAULT 0,
  sales_card DECIMAL(10,2) DEFAULT 0,
  sales_ewallet DECIMAL(10,2) DEFAULT 0,
  expenses_cash DECIMAL(10,2) DEFAULT 0,
  closing_cash DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  closed_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  closed_by_name TEXT,
  closed_at TIMESTAMPTZ,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, outlet_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_cash_flows_date ON public.daily_cash_flows(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_cash_flows_outlet ON public.daily_cash_flows(outlet_id);

-- ========================================
-- RECIPES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  menu_item_name TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_cost DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  instructions TEXT,
  prep_time INTEGER DEFAULT 15,
  yield_quantity DECIMAL(10,2) DEFAULT 1,
  yield_unit TEXT DEFAULT 'serving',
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_recipes_menu_item ON public.recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_outlet ON public.recipes(outlet_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_active ON public.recipes(is_active);

-- ========================================
-- CHECKLIST TEMPLATES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('opening', 'closing')),
  title TEXT NOT NULL,
  description TEXT,
  require_photo BOOLEAN DEFAULT false,
  require_notes BOOLEAN DEFAULT false,
  order_num INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_checklist_templates_type ON public.checklist_templates(type);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_active ON public.checklist_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_order ON public.checklist_templates(order_num);

-- ========================================
-- CHECKLIST COMPLETIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.checklist_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('opening', 'closing')),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  shift_id TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'incomplete')),
  reviewed_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_checklist_completions_date ON public.checklist_completions(date DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_staff ON public.checklist_completions(staff_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_type ON public.checklist_completions(type);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_status ON public.checklist_completions(status);

-- ========================================
-- LEAVE BALANCES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  annual_entitled INTEGER DEFAULT 0,
  annual_taken INTEGER DEFAULT 0,
  annual_pending INTEGER DEFAULT 0,
  annual_balance INTEGER DEFAULT 0,
  medical_entitled INTEGER DEFAULT 0,
  medical_taken INTEGER DEFAULT 0,
  medical_pending INTEGER DEFAULT 0,
  medical_balance INTEGER DEFAULT 0,
  emergency_entitled INTEGER DEFAULT 0,
  emergency_taken INTEGER DEFAULT 0,
  emergency_pending INTEGER DEFAULT 0,
  emergency_balance INTEGER DEFAULT 0,
  maternity_entitled INTEGER DEFAULT 0,
  maternity_taken INTEGER DEFAULT 0,
  maternity_pending INTEGER DEFAULT 0,
  maternity_balance INTEGER DEFAULT 0,
  paternity_entitled INTEGER DEFAULT 0,
  paternity_taken INTEGER DEFAULT 0,
  paternity_pending INTEGER DEFAULT 0,
  paternity_balance INTEGER DEFAULT 0,
  compassionate_entitled INTEGER DEFAULT 0,
  compassionate_taken INTEGER DEFAULT 0,
  compassionate_pending INTEGER DEFAULT 0,
  compassionate_balance INTEGER DEFAULT 0,
  replacement_entitled INTEGER DEFAULT 0,
  replacement_taken INTEGER DEFAULT 0,
  replacement_pending INTEGER DEFAULT 0,
  replacement_balance INTEGER DEFAULT 0,
  unpaid_taken INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, year)
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_staff ON public.leave_balances(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON public.leave_balances(year);

-- ========================================
-- LEAVE REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('annual', 'medical', 'emergency', 'unpaid', 'maternity', 'paternity', 'compassionate', 'replacement', 'study')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration INTEGER NOT NULL,
  is_half_day BOOLEAN DEFAULT false,
  half_day_type TEXT CHECK (half_day_type IN ('morning', 'afternoon')),
  reason TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approver_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_staff ON public.leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_created ON public.leave_requests(created_at DESC);

-- ========================================
-- CLAIM REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.claim_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('medical', 'transport', 'meal', 'training', 'phone', 'uniform', 'equipment', 'other')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  receipt_urls JSONB DEFAULT '[]'::jsonb,
  claim_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approver_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  paid_at TIMESTAMPTZ,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_claim_requests_staff ON public.claim_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON public.claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_claim_requests_created ON public.claim_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claim_requests_type ON public.claim_requests(type);

-- ========================================
-- STAFF REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.staff_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('shift_swap', 'off_day', 'ot_request', 'schedule_change', 'salary_advance', 'payslip', 'letter', 'training', 'equipment', 'complaint', 'resignation', 'bank_change', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  assigned_to UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  assignee_name TEXT,
  response_note TEXT,
  completed_at TIMESTAMPTZ,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_requests_staff ON public.staff_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_requests_status ON public.staff_requests(status);
CREATE INDEX IF NOT EXISTS idx_staff_requests_category ON public.staff_requests(category);
CREATE INDEX IF NOT EXISTS idx_staff_requests_priority ON public.staff_requests(priority);
CREATE INDEX IF NOT EXISTS idx_staff_requests_created ON public.staff_requests(created_at DESC);

-- ========================================
-- ANNOUNCEMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  target_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE,
  created_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_by_name TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON public.announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);

-- ========================================
-- OIL TRACKERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.oil_trackers (
  fryer_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  current_cycles INTEGER DEFAULT 0,
  cycle_limit INTEGER NOT NULL,
  last_changed_date DATE NOT NULL,
  last_topup_date DATE,
  status TEXT DEFAULT 'good' CHECK (status IN ('good', 'warning', 'critical')),
  has_pending_request BOOLEAN DEFAULT false,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oil_trackers_status ON public.oil_trackers(status);
CREATE INDEX IF NOT EXISTS idx_oil_trackers_outlet ON public.oil_trackers(outlet_id);
CREATE INDEX IF NOT EXISTS idx_oil_trackers_pending ON public.oil_trackers(has_pending_request);

-- ========================================
-- OIL CHANGE REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.oil_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fryer_id TEXT NOT NULL REFERENCES public.oil_trackers(fryer_id) ON DELETE CASCADE,
  fryer_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('change', 'topup')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by TEXT NOT NULL,
  requested_by_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  previous_cycles INTEGER NOT NULL,
  proposed_cycles INTEGER NOT NULL,
  topup_percentage INTEGER,
  photo_url TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  reviewed_by_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_oil_change_requests_fryer ON public.oil_change_requests(fryer_id);
CREATE INDEX IF NOT EXISTS idx_oil_change_requests_status ON public.oil_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_oil_change_requests_requested ON public.oil_change_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_oil_change_requests_action_type ON public.oil_change_requests(action_type);

-- ========================================
-- OIL ACTION HISTORY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.oil_action_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fryer_id TEXT NOT NULL REFERENCES public.oil_trackers(fryer_id) ON DELETE CASCADE,
  fryer_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('change', 'topup')),
  action_at TIMESTAMPTZ DEFAULT NOW(),
  previous_cycles INTEGER NOT NULL,
  new_cycles INTEGER NOT NULL,
  topup_percentage INTEGER,
  requested_by TEXT NOT NULL,
  requested_by_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by TEXT NOT NULL,
  approved_by_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_oil_action_history_fryer ON public.oil_action_history(fryer_id);
CREATE INDEX IF NOT EXISTS idx_oil_action_history_action_at ON public.oil_action_history(action_at DESC);
CREATE INDEX IF NOT EXISTS idx_oil_action_history_action_type ON public.oil_action_history(action_type);

-- ========================================
-- STAFF KPI TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.staff_kpi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_score DECIMAL(5,2) DEFAULT 0,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  rank INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, period)
);

CREATE INDEX IF NOT EXISTS idx_staff_kpi_staff ON public.staff_kpi(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_kpi_period ON public.staff_kpi(period);
CREATE INDEX IF NOT EXISTS idx_staff_kpi_rank ON public.staff_kpi(rank);
CREATE INDEX IF NOT EXISTS idx_staff_kpi_score ON public.staff_kpi(overall_score DESC);

-- ========================================
-- TRAINING RECORDS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.training_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_records_staff ON public.training_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_training_records_status ON public.training_records(status);

-- ========================================
-- OT RECORDS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.ot_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  requested_by TEXT NOT NULL,
  requested_by_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  hours_requested DECIMAL(4,2) NOT NULL,
  accepted BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ot_records_staff ON public.ot_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_ot_records_date ON public.ot_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_ot_records_accepted ON public.ot_records(accepted);

-- ========================================
-- CUSTOMER REVIEWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_order ON public.customer_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_staff ON public.customer_reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_rating ON public.customer_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_created ON public.customer_reviews(created_at DESC);

-- ========================================
-- LEAVE RECORDS TABLE (for KPI tracking)
-- ========================================
CREATE TABLE IF NOT EXISTS public.leave_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('annual', 'medical', 'emergency', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_records_staff ON public.leave_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_records_type ON public.leave_records(type);
CREATE INDEX IF NOT EXISTS idx_leave_records_dates ON public.leave_records(start_date, end_date);

-- ========================================
-- SHIFTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_outlet ON public.shifts(outlet_id);
CREATE INDEX IF NOT EXISTS idx_shifts_active ON public.shifts(is_active);

-- ========================================
-- SCHEDULE ENTRIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.schedule_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  shift_name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'absent', 'cancelled')),
  notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_entries_staff ON public.schedule_entries(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_shift ON public.schedule_entries(shift_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_date ON public.schedule_entries(date);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_status ON public.schedule_entries(status);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_outlet ON public.schedule_entries(outlet_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_entries_unique ON public.schedule_entries(staff_id, date, start_time);

-- ========================================
-- PROMOTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'bogo', 'free_item')),
  value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  promo_code TEXT,
  applicable_items JSONB DEFAULT '[]'::jsonb,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_of_week JSONB,
  start_time TIME,
  end_time TIME,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_promo_code ON public.promotions(promo_code) WHERE promo_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_outlet ON public.promotions(outlet_id);

-- ========================================
-- NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('low_stock', 'new_order', 'equipment', 'staff', 'finance', 'system')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON public.notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_outlet ON public.notifications(outlet_id);

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
-- ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlet_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.void_refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_cash_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_kpi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE RLS POLICIES (Allow all for now)
-- ========================================
-- Using DO blocks to safely create policies (skip if exists)

-- Helper function to safely create policies
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  p_name TEXT,
  p_table TEXT,
  p_command TEXT,
  p_using TEXT DEFAULT 'true',
  p_check TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = p_table 
    AND policyname = p_name
  ) THEN
    IF p_command = 'ALL' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (%s)', p_name, p_table, p_using);
    ELSIF p_command = 'SELECT' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (%s)', p_name, p_table, p_using);
    ELSIF p_command = 'INSERT' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (%s)', p_name, p_table, COALESCE(p_check, p_using));
    ELSIF p_command = 'UPDATE' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (%s)', p_name, p_table, p_using);
    ELSIF p_command = 'DELETE' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (%s)', p_name, p_table, p_using);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Outlets policies
SELECT create_policy_if_not_exists('Anyone can view outlets', 'outlets', 'SELECT');
SELECT create_policy_if_not_exists('Admin can manage outlets', 'outlets', 'ALL');

-- Outlet settings policies  
SELECT create_policy_if_not_exists('Anyone can view outlet settings', 'outlet_settings', 'SELECT');
SELECT create_policy_if_not_exists('Admin can manage outlet settings', 'outlet_settings', 'ALL');

-- Staff policies
SELECT create_policy_if_not_exists('Staff can view all staff', 'staff', 'SELECT');
SELECT create_policy_if_not_exists('Managers can insert staff', 'staff', 'INSERT');
SELECT create_policy_if_not_exists('Managers can update staff', 'staff', 'UPDATE');

-- Attendance policies
SELECT create_policy_if_not_exists('Anyone can view attendance', 'attendance', 'SELECT');
SELECT create_policy_if_not_exists('Anyone can insert attendance', 'attendance', 'INSERT');
SELECT create_policy_if_not_exists('Anyone can update attendance', 'attendance', 'UPDATE');

-- Inventory policies
SELECT create_policy_if_not_exists('Anyone can view inventory', 'inventory', 'SELECT');
SELECT create_policy_if_not_exists('Staff can manage inventory', 'inventory', 'ALL');

-- Inventory logs policies
SELECT create_policy_if_not_exists('Anyone can view inventory logs', 'inventory_logs', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create inventory logs', 'inventory_logs', 'INSERT');

-- Menu items policies
SELECT create_policy_if_not_exists('Anyone can view menu items', 'menu_items', 'SELECT');
SELECT create_policy_if_not_exists('Managers can manage menu items', 'menu_items', 'ALL');

-- Modifier groups policies
SELECT create_policy_if_not_exists('Anyone can view modifier groups', 'modifier_groups', 'SELECT');
SELECT create_policy_if_not_exists('Managers can manage modifier groups', 'modifier_groups', 'ALL');

-- Modifier options policies
SELECT create_policy_if_not_exists('Anyone can view modifier options', 'modifier_options', 'SELECT');
SELECT create_policy_if_not_exists('Managers can manage modifier options', 'modifier_options', 'ALL');

-- Customers policies
SELECT create_policy_if_not_exists('Anyone can view customers', 'customers', 'SELECT');
SELECT create_policy_if_not_exists('Staff can manage customers', 'customers', 'ALL');

-- Orders policies
SELECT create_policy_if_not_exists('Anyone can view orders', 'orders', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create orders', 'orders', 'INSERT');
SELECT create_policy_if_not_exists('Staff can update orders', 'orders', 'UPDATE');

-- Order items policies
SELECT create_policy_if_not_exists('Anyone can view order items', 'order_items', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create order items', 'order_items', 'INSERT');
SELECT create_policy_if_not_exists('Staff can update order items', 'order_items', 'UPDATE');

-- Payments policies
SELECT create_policy_if_not_exists('Anyone can view payments', 'payments', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create payments', 'payments', 'INSERT');
SELECT create_policy_if_not_exists('Staff can update payments', 'payments', 'UPDATE');

-- Void/Refund requests policies
SELECT create_policy_if_not_exists('Anyone can view void_refund_requests', 'void_refund_requests', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create void_refund_requests', 'void_refund_requests', 'INSERT');
SELECT create_policy_if_not_exists('Managers can update void_refund_requests', 'void_refund_requests', 'UPDATE');

-- Expenses policies
SELECT create_policy_if_not_exists('Anyone can view expenses', 'expenses', 'SELECT');
SELECT create_policy_if_not_exists('Managers can manage expenses', 'expenses', 'ALL');

-- Suppliers policies
SELECT create_policy_if_not_exists('Anyone can view suppliers', 'suppliers', 'SELECT');
SELECT create_policy_if_not_exists('Staff can manage suppliers', 'suppliers', 'ALL');

-- Purchase orders policies
SELECT create_policy_if_not_exists('Anyone can view purchase_orders', 'purchase_orders', 'SELECT');
SELECT create_policy_if_not_exists('Staff can manage purchase_orders', 'purchase_orders', 'ALL');

-- Production logs policies
SELECT create_policy_if_not_exists('Anyone can view production logs', 'production_logs', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create production logs', 'production_logs', 'INSERT');
SELECT create_policy_if_not_exists('Staff can update production logs', 'production_logs', 'UPDATE');

-- Delivery orders policies
SELECT create_policy_if_not_exists('Anyone can view delivery orders', 'delivery_orders', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create delivery orders', 'delivery_orders', 'INSERT');
SELECT create_policy_if_not_exists('Staff can update delivery orders', 'delivery_orders', 'UPDATE');

-- Daily cash flows policies
SELECT create_policy_if_not_exists('Anyone can view cash flows', 'daily_cash_flows', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create cash flows', 'daily_cash_flows', 'INSERT');
SELECT create_policy_if_not_exists('Staff can update cash flows', 'daily_cash_flows', 'UPDATE');

-- Recipes policies
SELECT create_policy_if_not_exists('Anyone can view recipes', 'recipes', 'SELECT');
SELECT create_policy_if_not_exists('Managers can create recipes', 'recipes', 'INSERT');
SELECT create_policy_if_not_exists('Managers can update recipes', 'recipes', 'UPDATE');
SELECT create_policy_if_not_exists('Managers can delete recipes', 'recipes', 'DELETE');

-- Checklist templates policies
SELECT create_policy_if_not_exists('Anyone can view checklist templates', 'checklist_templates', 'SELECT');
SELECT create_policy_if_not_exists('Managers can manage checklist templates', 'checklist_templates', 'ALL');

-- Checklist completions policies
SELECT create_policy_if_not_exists('Anyone can view checklist completions', 'checklist_completions', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create checklist completions', 'checklist_completions', 'INSERT');
SELECT create_policy_if_not_exists('Staff can update checklist completions', 'checklist_completions', 'UPDATE');

-- Leave balances policies
SELECT create_policy_if_not_exists('Anyone can view leave balances', 'leave_balances', 'SELECT');
SELECT create_policy_if_not_exists('Staff can manage leave balances', 'leave_balances', 'ALL');

-- Leave requests policies
SELECT create_policy_if_not_exists('Anyone can view leave requests', 'leave_requests', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create leave requests', 'leave_requests', 'INSERT');
SELECT create_policy_if_not_exists('Staff can update leave requests', 'leave_requests', 'UPDATE');

-- Claim requests policies
SELECT create_policy_if_not_exists('Anyone can view claim requests', 'claim_requests', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create claim requests', 'claim_requests', 'INSERT');
SELECT create_policy_if_not_exists('Staff can update claim requests', 'claim_requests', 'UPDATE');

-- Staff requests policies
SELECT create_policy_if_not_exists('Anyone can view staff requests', 'staff_requests', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create staff requests', 'staff_requests', 'INSERT');
SELECT create_policy_if_not_exists('Staff can update staff requests', 'staff_requests', 'UPDATE');

-- Announcements policies
SELECT create_policy_if_not_exists('Anyone can view announcements', 'announcements', 'SELECT');
SELECT create_policy_if_not_exists('Managers can manage announcements', 'announcements', 'ALL');

-- Oil trackers policies
SELECT create_policy_if_not_exists('Anyone can view oil trackers', 'oil_trackers', 'SELECT');
SELECT create_policy_if_not_exists('Staff can manage oil trackers', 'oil_trackers', 'ALL');

-- Oil change requests policies
SELECT create_policy_if_not_exists('Anyone can view oil change requests', 'oil_change_requests', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create oil change requests', 'oil_change_requests', 'INSERT');
SELECT create_policy_if_not_exists('Managers can update oil change requests', 'oil_change_requests', 'UPDATE');

-- Oil action history policies
SELECT create_policy_if_not_exists('Anyone can view oil action history', 'oil_action_history', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create oil action history', 'oil_action_history', 'INSERT');

-- Staff KPI policies
SELECT create_policy_if_not_exists('Anyone can view staff KPI', 'staff_kpi', 'SELECT');
SELECT create_policy_if_not_exists('Managers can manage staff KPI', 'staff_kpi', 'ALL');

-- Training records policies
SELECT create_policy_if_not_exists('Anyone can view training records', 'training_records', 'SELECT');
SELECT create_policy_if_not_exists('Staff can manage training records', 'training_records', 'ALL');

-- OT records policies
SELECT create_policy_if_not_exists('Anyone can view OT records', 'ot_records', 'SELECT');
SELECT create_policy_if_not_exists('Staff can manage OT records', 'ot_records', 'ALL');

-- Customer reviews policies
SELECT create_policy_if_not_exists('Anyone can view customer reviews', 'customer_reviews', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create customer reviews', 'customer_reviews', 'INSERT');

-- Leave records policies
SELECT create_policy_if_not_exists('Anyone can view leave records', 'leave_records', 'SELECT');
SELECT create_policy_if_not_exists('Staff can manage leave records', 'leave_records', 'ALL');

-- Shifts policies
SELECT create_policy_if_not_exists('Anyone can view shifts', 'shifts', 'SELECT');
SELECT create_policy_if_not_exists('Managers can manage shifts', 'shifts', 'ALL');

-- Schedule entries policies
SELECT create_policy_if_not_exists('Anyone can view schedule entries', 'schedule_entries', 'SELECT');
SELECT create_policy_if_not_exists('Managers can manage schedule entries', 'schedule_entries', 'ALL');

-- Promotions policies (special case with status condition)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotions' AND policyname = 'Anyone can view active promotions') THEN
    CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (status = 'active');
  END IF;
END $$;
SELECT create_policy_if_not_exists('Managers can manage promotions', 'promotions', 'ALL');

-- Notifications policies
SELECT create_policy_if_not_exists('Anyone can view notifications', 'notifications', 'SELECT');
SELECT create_policy_if_not_exists('Staff can create notifications', 'notifications', 'INSERT');
SELECT create_policy_if_not_exists('Staff can update notifications', 'notifications', 'UPDATE');
SELECT create_policy_if_not_exists('Staff can delete notifications', 'notifications', 'DELETE');

-- Audit logs policies
SELECT create_policy_if_not_exists('Anyone can view audit logs', 'audit_logs', 'SELECT');
SELECT create_policy_if_not_exists('Anyone can create audit logs', 'audit_logs', 'INSERT');

-- ========================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- ========================================

DROP TRIGGER IF EXISTS update_outlets_updated_at ON public.outlets;
CREATE TRIGGER update_outlets_updated_at BEFORE UPDATE ON public.outlets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_outlet_settings_updated_at ON public.outlet_settings;
CREATE TRIGGER update_outlet_settings_updated_at BEFORE UPDATE ON public.outlet_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_updated_at ON public.staff;
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_modifier_groups_updated_at ON public.modifier_groups;
CREATE TRIGGER update_modifier_groups_updated_at BEFORE UPDATE ON public.modifier_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_modifier_options_updated_at ON public.modifier_options;
CREATE TRIGGER update_modifier_options_updated_at BEFORE UPDATE ON public.modifier_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON public.purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_cash_flows_updated_at ON public.daily_cash_flows;
CREATE TRIGGER update_daily_cash_flows_updated_at BEFORE UPDATE ON public.daily_cash_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipes_updated_at ON public.recipes;
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_balances_updated_at ON public.leave_balances;
CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_oil_trackers_updated_at ON public.oil_trackers;
CREATE TRIGGER update_oil_trackers_updated_at BEFORE UPDATE ON public.oil_trackers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_kpi_updated_at ON public.staff_kpi;
CREATE TRIGGER update_staff_kpi_updated_at BEFORE UPDATE ON public.staff_kpi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedule_entries_updated_at ON public.schedule_entries;
CREATE TRIGGER update_schedule_entries_updated_at BEFORE UPDATE ON public.schedule_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotions_updated_at ON public.promotions;
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_void_refund_requests_updated_at ON public.void_refund_requests;
CREATE TRIGGER update_void_refund_requests_updated_at BEFORE UPDATE ON public.void_refund_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ENABLE REALTIME SUBSCRIPTIONS
-- ========================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.modifier_groups;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.modifier_options;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.void_refund_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.production_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_cash_flows;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_templates;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_completions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_balances;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.oil_trackers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.oil_change_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.oil_action_history;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_kpi;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.training_records;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ot_records;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_reviews;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_records;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_entries;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.promotions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- VERIFICATION - Check tables created
-- ========================================

SELECT 
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- ========================================
-- MIGRATION COMPLETE!
-- ========================================
-- All tables, indexes, RLS policies, and realtime subscriptions have been created.
-- 
-- Next steps:
-- 1. Set environment variables in Vercel:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
-- 2. Redeploy your application
-- 3. Your data will now persist in the database!
-- ========================================
