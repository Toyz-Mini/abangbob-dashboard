-- =====================================================
-- FIX SETTINGS & OPERATIONS PERSISTENCE
-- =====================================================
-- Issue: 
-- 1. Operation Settings (Operating Hours) resetting to "preset"
-- 2. Cashier/Finance sessions not saving (opening/closing cash)
-- 3. Shift records not saving
--
-- Root Cause: RLS policies were dropped or too restrictive.

-- =====================================================
-- 1. OUTLET SETTINGS (Operating Hours, etc.)
-- =====================================================
DROP POLICY IF EXISTS "Admin can manage outlet settings" ON public.outlet_settings;
DROP POLICY IF EXISTS "Authenticated users can manage outlet settings" ON public.outlet_settings;

CREATE POLICY "Authenticated users can manage outlet settings" ON public.outlet_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure columns exist
ALTER TABLE public.outlet_settings 
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS receipt_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS appearance JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS security JSONB DEFAULT '{}'::jsonb;

-- =====================================================
-- 2. DAILY CASH FLOWS (Finance Dashboard)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view cash flows" ON public.daily_cash_flows;
DROP POLICY IF EXISTS "Staff can create cash flows" ON public.daily_cash_flows;
DROP POLICY IF EXISTS "Staff can update cash flows" ON public.daily_cash_flows;
DROP POLICY IF EXISTS "Authenticated users can manage cash flows" ON public.daily_cash_flows;

CREATE POLICY "Authenticated users can manage cash flows" ON public.daily_cash_flows
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 3. CASH REGISTERS (POS Sessions / Wizard)
-- =====================================================
-- IMPORTANT: This was missing write access, causing "Opening Wizard" loop on refresh
DROP POLICY IF EXISTS "Managers can view all cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Staff can view their own cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Staff can insert their own cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Staff can update their own cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Authenticated users can manage cash registers" ON public.cash_registers;

CREATE POLICY "Authenticated users can manage cash registers" ON public.cash_registers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 4. SHIFTS (Staff Shifts)
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage shifts" ON public.shifts;

CREATE POLICY "Authenticated users can manage shifts" ON public.shifts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 5. OTHER AFFECTED TABLES
-- =====================================================
-- Suppliers
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase Orders
DROP POLICY IF EXISTS "Authenticated users can manage purchase_orders" ON public.purchase_orders;
CREATE POLICY "Authenticated users can manage purchase_orders" ON public.purchase_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Modifier Groups
DROP POLICY IF EXISTS "Authenticated users can manage modifier_groups" ON public.modifier_groups;
CREATE POLICY "Authenticated users can manage modifier_groups" ON public.modifier_groups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Modifier Options
DROP POLICY IF EXISTS "Authenticated users can manage modifier_options" ON public.modifier_options;
CREATE POLICY "Authenticated users can manage modifier_options" ON public.modifier_options
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Fixed persistence for Settings, Cashier (POS), Finance, Shifts, and Operations tables.';
END $$;
