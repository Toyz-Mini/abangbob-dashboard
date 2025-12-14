-- Staff Portal Tables: Checklists, Leave Management, Claims, Requests, Announcements
-- Phase 3: Complete staff portal functionality

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

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view checklist templates" ON public.checklist_templates FOR SELECT USING (true);
CREATE POLICY "Managers can manage checklist templates" ON public.checklist_templates FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_templates;

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
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {templateId, title, isCompleted, completedAt, photoUrl, notes}
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

ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view checklist completions" ON public.checklist_completions FOR SELECT USING (true);
CREATE POLICY "Staff can create checklist completions" ON public.checklist_completions FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update checklist completions" ON public.checklist_completions FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_completions;

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

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leave balances" ON public.leave_balances FOR SELECT USING (true);
CREATE POLICY "Staff can manage leave balances" ON public.leave_balances FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_balances;

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  duration INTEGER NOT NULL, -- days
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

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leave requests" ON public.leave_requests FOR SELECT USING (true);
CREATE POLICY "Staff can create leave requests" ON public.leave_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update leave requests" ON public.leave_requests FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;

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

ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view claim requests" ON public.claim_requests FOR SELECT USING (true);
CREATE POLICY "Staff can create claim requests" ON public.claim_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update claim requests" ON public.claim_requests FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_requests;

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

ALTER TABLE public.staff_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view staff requests" ON public.staff_requests FOR SELECT USING (true);
CREATE POLICY "Staff can create staff requests" ON public.staff_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update staff requests" ON public.staff_requests FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_requests;

-- ========================================
-- ANNOUNCEMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  target_roles JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['Manager', 'Staff']
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

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Managers can manage announcements" ON public.announcements FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

COMMENT ON TABLE public.checklist_templates IS 'Checklist templates for opening/closing procedures';
COMMENT ON TABLE public.checklist_completions IS 'Completed checklists with staff tracking';
COMMENT ON TABLE public.leave_balances IS 'Staff leave entitlements and balances';
COMMENT ON TABLE public.leave_requests IS 'Staff leave applications and approvals';
COMMENT ON TABLE public.claim_requests IS 'Staff expense claim requests';
COMMENT ON TABLE public.staff_requests IS 'General staff requests and queries';
COMMENT ON TABLE public.announcements IS 'Company-wide announcements for staff';

