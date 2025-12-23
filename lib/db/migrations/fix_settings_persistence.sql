-- =====================================================
-- FIX MISSING TABLES & PERSISTENCE (Complete Fix)
-- =====================================================
-- Issues:
-- 1. ERROR: relation "public.daily_cash_flows" does not exist
-- 2. Settings not saving (missing RLS policies)
-- 3. Cashier/Shift sessions resetting (missing RLS policies)

-- =====================================================
-- 1. CREATE TABLES IF NOT EXIST
-- =====================================================

-- Ensure outlet_settings exists
CREATE TABLE IF NOT EXISTS public.outlet_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  outlet_name TEXT,
  outlet_address TEXT,
  outlet_phone TEXT,
  outlet_email TEXT,
  outlet_logo_url TEXT,
  currency TEXT DEFAULT 'BND',
  timezone TEXT DEFAULT 'Asia/Brunei',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  payment_methods JSONB DEFAULT '{"cash": true, "card": true, "qr": true, "ewallet": false}'::jsonb,
  theme TEXT DEFAULT 'dark',
  operating_hours JSONB DEFAULT '{}'::jsonb,
  receipt_settings JSONB DEFAULT '{}'::jsonb,
  notification_settings JSONB DEFAULT '{}'::jsonb,
  social_media JSONB DEFAULT '{}'::jsonb,
  appearance JSONB DEFAULT '{}'::jsonb,
  security JSONB DEFAULT '{}'::jsonb,
  whatsapp_config JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_outlet_settings_outlet ON public.outlet_settings(outlet_id);
ALTER TABLE public.outlet_settings ENABLE ROW LEVEL SECURITY;

-- Ensure daily_cash_flows exists (Fix for 42P01 Error)
CREATE TABLE IF NOT EXISTS public.daily_cash_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TEXT NOT NULL,
  outlet_id UUID,
  opening_cash DECIMAL(10,2) DEFAULT 0,
  sales_cash DECIMAL(10,2) DEFAULT 0,
  sales_card DECIMAL(10,2) DEFAULT 0,
  sales_qr DECIMAL(10,2) DEFAULT 0,
  sales_ewallet DECIMAL(10,2) DEFAULT 0,
  expenses_cash DECIMAL(10,2) DEFAULT 0,
  closing_cash DECIMAL(10,2) DEFAULT 0,
  actual_cash DECIMAL(10,2) DEFAULT 0,
  variance DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'open', -- open, closed
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, outlet_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_cash_flows_date ON public.daily_cash_flows(date DESC);
ALTER TABLE public.daily_cash_flows ENABLE ROW LEVEL SECURITY;

-- Ensure cash_registers exists (for POS sessions)
CREATE TABLE IF NOT EXISTS public.cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  opened_by UUID,
  start_cash DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'open', -- open, closed
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  end_cash DECIMAL(10,2),
  variance DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON public.cash_registers(status);
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. RESTORE RLS POLICIES (Fix Persistence)
-- =====================================================

-- Outlet Settings
DROP POLICY IF EXISTS "Admin can manage outlet settings" ON public.outlet_settings;
DROP POLICY IF EXISTS "Authenticated users can manage outlet settings" ON public.outlet_settings;

CREATE POLICY "Authenticated users can manage outlet settings" ON public.outlet_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Daily Cash Flows
DROP POLICY IF EXISTS "Anyone can view cash flows" ON public.daily_cash_flows;
DROP POLICY IF EXISTS "Authenticated users can manage cash flows" ON public.daily_cash_flows;

CREATE POLICY "Authenticated users can manage cash flows" ON public.daily_cash_flows
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Cash Registers
DROP POLICY IF EXISTS "Managers can view all cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Authenticated users can manage cash registers" ON public.cash_registers;

CREATE POLICY "Authenticated users can manage cash registers" ON public.cash_registers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Shifts
DROP POLICY IF EXISTS "Authenticated users can manage shifts" ON public.shifts;

CREATE POLICY "Authenticated users can manage shifts" ON public.shifts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Fixed missing tables and restored RLS policies.';
END $$;
