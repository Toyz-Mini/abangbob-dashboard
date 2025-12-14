-- AbangBob Dashboard - Complete Tables Migration
-- Run this SQL in Supabase SQL Editor to add all remaining tables

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
  reason TEXT,
  created_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_item ON public.inventory_logs(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created ON public.inventory_logs(created_at DESC);

-- ========================================
-- RECIPES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  description TEXT,
  yield_quantity INTEGER DEFAULT 1,
  yield_unit TEXT,
  preparation_time INTEGER, -- minutes
  cooking_time INTEGER, -- minutes
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions JSONB DEFAULT '[]'::jsonb,
  total_cost DECIMAL(10,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recipes_menu_item ON public.recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_outlet ON public.recipes(outlet_id);

-- ========================================
-- SHIFTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 60, -- minutes
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_shifts_outlet ON public.shifts(outlet_id);

-- ========================================
-- SCHEDULES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  UNIQUE(staff_id, date, shift_id)
);

CREATE INDEX IF NOT EXISTS idx_schedules_staff ON public.schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_outlet ON public.schedules(outlet_id);

-- ========================================
-- PROMOTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'buy_x_get_y', 'bundle')),
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  applicable_items JSONB DEFAULT '[]'::jsonb,
  applicable_categories JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);

-- ========================================
-- NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'order', 'inventory', 'staff', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  user_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  link TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ========================================
-- PRODUCTION LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.production_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  menu_item_name TEXT NOT NULL,
  quantity_produced INTEGER NOT NULL,
  batch_number TEXT,
  produced_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  produced_by_name TEXT,
  notes TEXT,
  ingredients_used JSONB DEFAULT '[]'::jsonb,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_production_logs_item ON public.production_logs(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_created ON public.production_logs(created_at DESC);

-- ========================================
-- DELIVERY ORDERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_instructions TEXT,
  driver_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  driver_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'on_the_way', 'delivered', 'cancelled')),
  estimated_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  distance_km DECIMAL(5,2),
  notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_order ON public.delivery_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_driver ON public.delivery_orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON public.delivery_orders(status);

-- ========================================
-- CASH FLOWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.cash_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL UNIQUE,
  opening_cash DECIMAL(10,2) DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  cash_sales DECIMAL(10,2) DEFAULT 0,
  card_sales DECIMAL(10,2) DEFAULT 0,
  qr_sales DECIMAL(10,2) DEFAULT 0,
  ewallet_sales DECIMAL(10,2) DEFAULT 0,
  total_refunds DECIMAL(10,2) DEFAULT 0,
  total_expenses DECIMAL(10,2) DEFAULT 0,
  closing_cash DECIMAL(10,2) DEFAULT 0,
  variance DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  closed_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cash_flows_date ON public.cash_flows(date);
CREATE INDEX IF NOT EXISTS idx_cash_flows_outlet ON public.cash_flows(outlet_id);

-- ========================================
-- STAFF KPI TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.staff_kpi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- e.g., '2024-01', '2024-Q1'
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_score DECIMAL(5,2) DEFAULT 0,
  rank INTEGER,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  UNIQUE(staff_id, period)
);

CREATE INDEX IF NOT EXISTS idx_staff_kpi_staff ON public.staff_kpi(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_kpi_period ON public.staff_kpi(period);

-- ========================================
-- LEAVE RECORDS TABLE (for KPI tracking)
-- ========================================
CREATE TABLE IF NOT EXISTS public.leave_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reason TEXT,
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_leave_records_staff ON public.leave_records(staff_id);

-- ========================================
-- TRAINING RECORDS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.training_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  training_type TEXT,
  completion_date DATE,
  score DECIMAL(5,2),
  certificate_url TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_training_records_staff ON public.training_records(staff_id);

-- ========================================
-- OT RECORDS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.ot_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  rate_multiplier DECIMAL(3,2) DEFAULT 1.5,
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_ot_records_staff ON public.ot_records(staff_id);

-- ========================================
-- CUSTOMER REVIEWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  tags JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_staff ON public.customer_reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_order ON public.customer_reviews(order_id);

-- ========================================
-- CHECKLIST TEMPLATES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('opening', 'closing', 'daily', 'weekly')),
  category TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_checklist_templates_type ON public.checklist_templates(type);

-- ========================================
-- CHECKLIST COMPLETIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.checklist_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  type TEXT NOT NULL CHECK (type IN ('opening', 'closing', 'daily', 'weekly')),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_checklist_completions_staff ON public.checklist_completions(staff_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_date ON public.checklist_completions(created_at);

-- ========================================
-- LEAVE BALANCES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  annual_leave INTEGER DEFAULT 14,
  annual_leave_used INTEGER DEFAULT 0,
  sick_leave INTEGER DEFAULT 14,
  sick_leave_used INTEGER DEFAULT 0,
  emergency_leave INTEGER DEFAULT 3,
  emergency_leave_used INTEGER DEFAULT 0,
  unpaid_leave_used INTEGER DEFAULT 0,
  UNIQUE(staff_id, year)
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_staff ON public.leave_balances(staff_id);

-- ========================================
-- LEAVE REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  attachment_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_staff ON public.leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);

-- ========================================
-- CLAIM REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.claim_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT,
  date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claim_requests_staff ON public.claim_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON public.claim_requests(status);

-- ========================================
-- STAFF REQUESTS TABLE (General requests)
-- ========================================
CREATE TABLE IF NOT EXISTS public.staff_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  request_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  assigned_to UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  response_note TEXT,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_staff_requests_staff ON public.staff_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_requests_status ON public.staff_requests(status);

-- ========================================
-- ANNOUNCEMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent', 'celebration')),
  target_role TEXT CHECK (target_role IN ('Manager', 'Staff', 'All')),
  start_date DATE,
  end_date DATE,
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON public.announcements(start_date, end_date);

-- ========================================
-- OIL TRACKERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.oil_trackers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  fryer_id TEXT NOT NULL UNIQUE,
  fryer_name TEXT NOT NULL,
  location TEXT,
  oil_type TEXT,
  capacity_liters DECIMAL(5,2),
  current_oil_level DECIMAL(5,2) DEFAULT 100, -- percentage
  last_full_change TIMESTAMPTZ,
  last_topup TIMESTAMPTZ,
  total_frying_hours DECIMAL(8,2) DEFAULT 0,
  hours_since_change DECIMAL(8,2) DEFAULT 0,
  status TEXT DEFAULT 'good' CHECK (status IN ('good', 'warning', 'critical', 'needs_change')),
  notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_oil_trackers_status ON public.oil_trackers(status);

-- ========================================
-- OIL CHANGE REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.oil_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  fryer_id TEXT NOT NULL REFERENCES public.oil_trackers(fryer_id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('full_change', 'topup', 'quality_check')),
  topup_percentage DECIMAL(5,2),
  photo_url TEXT,
  requested_by UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  requested_by_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_oil_requests_fryer ON public.oil_change_requests(fryer_id);
CREATE INDEX IF NOT EXISTS idx_oil_requests_status ON public.oil_change_requests(status);

-- ========================================
-- OIL ACTION HISTORY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.oil_action_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fryer_id TEXT NOT NULL REFERENCES public.oil_trackers(fryer_id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('full_change', 'topup', 'quality_check')),
  performed_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  performed_by_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_oil_history_fryer ON public.oil_action_history(fryer_id);
CREATE INDEX IF NOT EXISTS idx_oil_history_created ON public.oil_action_history(created_at DESC);

-- ========================================
-- ENABLE RLS ON ALL NEW TABLES
-- ========================================
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_kpi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
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

-- ========================================
-- RLS POLICIES (Allow all for now - adjust as needed)
-- ========================================
CREATE POLICY "All access inventory_logs" ON public.inventory_logs FOR ALL USING (true);
CREATE POLICY "All access recipes" ON public.recipes FOR ALL USING (true);
CREATE POLICY "All access shifts" ON public.shifts FOR ALL USING (true);
CREATE POLICY "All access schedules" ON public.schedules FOR ALL USING (true);
CREATE POLICY "All access promotions" ON public.promotions FOR ALL USING (true);
CREATE POLICY "All access notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "All access production_logs" ON public.production_logs FOR ALL USING (true);
CREATE POLICY "All access delivery_orders" ON public.delivery_orders FOR ALL USING (true);
CREATE POLICY "All access cash_flows" ON public.cash_flows FOR ALL USING (true);
CREATE POLICY "All access staff_kpi" ON public.staff_kpi FOR ALL USING (true);
CREATE POLICY "All access leave_records" ON public.leave_records FOR ALL USING (true);
CREATE POLICY "All access training_records" ON public.training_records FOR ALL USING (true);
CREATE POLICY "All access ot_records" ON public.ot_records FOR ALL USING (true);
CREATE POLICY "All access customer_reviews" ON public.customer_reviews FOR ALL USING (true);
CREATE POLICY "All access checklist_templates" ON public.checklist_templates FOR ALL USING (true);
CREATE POLICY "All access checklist_completions" ON public.checklist_completions FOR ALL USING (true);
CREATE POLICY "All access leave_balances" ON public.leave_balances FOR ALL USING (true);
CREATE POLICY "All access leave_requests" ON public.leave_requests FOR ALL USING (true);
CREATE POLICY "All access claim_requests" ON public.claim_requests FOR ALL USING (true);
CREATE POLICY "All access staff_requests" ON public.staff_requests FOR ALL USING (true);
CREATE POLICY "All access announcements" ON public.announcements FOR ALL USING (true);
CREATE POLICY "All access oil_trackers" ON public.oil_trackers FOR ALL USING (true);
CREATE POLICY "All access oil_change_requests" ON public.oil_change_requests FOR ALL USING (true);
CREATE POLICY "All access oil_action_history" ON public.oil_action_history FOR ALL USING (true);

-- ========================================
-- ENABLE REALTIME FOR NEW TABLES
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.oil_change_requests;

-- ========================================
-- UPDATE TRIGGERS FOR updated_at
-- ========================================
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_orders_updated_at BEFORE UPDATE ON public.delivery_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_flows_updated_at BEFORE UPDATE ON public.cash_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_kpi_updated_at BEFORE UPDATE ON public.staff_kpi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claim_requests_updated_at BEFORE UPDATE ON public.claim_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_requests_updated_at BEFORE UPDATE ON public.staff_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oil_trackers_updated_at BEFORE UPDATE ON public.oil_trackers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oil_change_requests_updated_at BEFORE UPDATE ON public.oil_change_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done! All tables created successfully.
