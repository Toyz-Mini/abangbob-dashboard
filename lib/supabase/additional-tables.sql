-- AbangBob Dashboard - Additional Tables from Spreadsheet Data
-- Run this SQL in Supabase SQL Editor

-- ========================================
-- STAFF ADVANCES TABLE
-- Tracks salary advances/loans to staff
-- ========================================
CREATE TABLE IF NOT EXISTS public.staff_advances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  advance_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deducted')),
  deduction_month TEXT, -- e.g., '2024-12' for when it will be deducted from salary
  deduction_amount DECIMAL(10,2), -- amount to deduct per month (for installments)
  remaining_balance DECIMAL(10,2), -- remaining amount to be deducted
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_staff_advances_staff ON public.staff_advances(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_advances_status ON public.staff_advances(status);

-- ========================================
-- EVENT CHECKLISTS TABLE
-- Tracks items needed for events/booths
-- ========================================
CREATE TABLE IF NOT EXISTS public.event_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  event_name TEXT NOT NULL,
  event_date DATE,
  event_end_date DATE,
  location TEXT,
  booth_number TEXT,
  items JSONB DEFAULT '[]'::jsonb, -- Array of {name, quantity, packed, notes}
  total_items INTEGER DEFAULT 0,
  packed_items INTEGER DEFAULT 0,
  status TEXT DEFAULT 'preparing' CHECK (status IN ('preparing', 'packed', 'dispatched', 'returned', 'completed')),
  prepared_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  prepared_by_name TEXT,
  checked_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  checked_by_name TEXT,
  notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_event_checklists_date ON public.event_checklists(event_date);
CREATE INDEX IF NOT EXISTS idx_event_checklists_status ON public.event_checklists(status);

-- ========================================
-- INTERVIEW CANDIDATES TABLE
-- Tracks job applicants and interview status
-- ========================================
CREATE TABLE IF NOT EXISTS public.interview_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  ic_number TEXT, -- Malaysian IC number
  position_applied TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  source TEXT, -- e.g., 'Walk-in', 'Referral', 'JobStreet', 'Facebook'
  interview_date DATE,
  interview_time TIME,
  interviewer_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  interviewer_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'interviewed', 'shortlisted', 'hired', 'rejected', 'no_show')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  strengths TEXT,
  weaknesses TEXT,
  expected_salary DECIMAL(10,2),
  available_start_date DATE,
  notes TEXT,
  resume_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_interview_candidates_status ON public.interview_candidates(status);
CREATE INDEX IF NOT EXISTS idx_interview_candidates_date ON public.interview_candidates(interview_date);

-- ========================================
-- ENABLE RLS ON ALL NEW TABLES
-- ========================================
ALTER TABLE public.staff_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_candidates ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES (Allow all for now)
-- ========================================
CREATE POLICY "All access staff_advances" ON public.staff_advances FOR ALL USING (true);
CREATE POLICY "All access event_checklists" ON public.event_checklists FOR ALL USING (true);
CREATE POLICY "All access interview_candidates" ON public.interview_candidates FOR ALL USING (true);

-- ========================================
-- ENABLE REALTIME
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_advances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_checklists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_candidates;

-- ========================================
-- UPDATE TRIGGERS
-- ========================================
CREATE TRIGGER update_staff_advances_updated_at BEFORE UPDATE ON public.staff_advances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_checklists_updated_at BEFORE UPDATE ON public.event_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_candidates_updated_at BEFORE UPDATE ON public.interview_candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done! Additional tables created successfully.
