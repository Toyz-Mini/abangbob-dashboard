-- KPI & Gamification Tables
-- Phase 6: Staff performance tracking and bonuses

-- ========================================
-- STAFF KPI TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.staff_kpi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- YYYY-MM format
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb, -- KPIMetrics object: {mealPrepTime, attendance, emergencyLeave, upselling, customerRating, wasteReduction, trainingComplete, otWillingness}
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

ALTER TABLE public.staff_kpi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view staff KPI" ON public.staff_kpi FOR SELECT USING (true);
CREATE POLICY "Managers can manage staff KPI" ON public.staff_kpi FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_kpi;

CREATE TRIGGER update_staff_kpi_updated_at BEFORE UPDATE ON public.staff_kpi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view training records" ON public.training_records FOR SELECT USING (true);
CREATE POLICY "Staff can manage training records" ON public.training_records FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.training_records;

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

ALTER TABLE public.ot_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view OT records" ON public.ot_records FOR SELECT USING (true);
CREATE POLICY "Staff can manage OT records" ON public.ot_records FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ot_records;

-- ========================================
-- CUSTOMER REVIEWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_order ON public.customer_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_staff ON public.customer_reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_rating ON public.customer_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_created ON public.customer_reviews(created_at DESC);

ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view customer reviews" ON public.customer_reviews FOR SELECT USING (true);
CREATE POLICY "Staff can create customer reviews" ON public.customer_reviews FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_reviews;

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

ALTER TABLE public.leave_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leave records" ON public.leave_records FOR SELECT USING (true);
CREATE POLICY "Staff can manage leave records" ON public.leave_records FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_records;

COMMENT ON TABLE public.staff_kpi IS 'Staff performance metrics and bonus calculations';
COMMENT ON TABLE public.training_records IS 'Staff training completion tracking';
COMMENT ON TABLE public.ot_records IS 'Overtime requests and acceptance tracking';
COMMENT ON TABLE public.customer_reviews IS 'Customer feedback for staff performance';
COMMENT ON TABLE public.leave_records IS 'Leave records for KPI calculation';

