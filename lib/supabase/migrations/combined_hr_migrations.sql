-- Combined HR Migrations (003-010)
-- This script runs all HR related migrations in order.

-- ==========================================
-- 003_disciplinary_actions.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS disciplinary_actions (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('verbal_warning', 'written_warning', 'final_warning', 'suspension', 'termination')),
  reason TEXT NOT NULL,
  details TEXT,
  issued_by TEXT NOT NULL,
  issued_by_name TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to disciplinary_actions" ON disciplinary_actions
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE disciplinary_actions;

CREATE INDEX IF NOT EXISTS idx_disciplinary_staff_id ON disciplinary_actions(staff_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_type ON disciplinary_actions(type);
CREATE INDEX IF NOT EXISTS idx_disciplinary_created_at ON disciplinary_actions(created_at DESC);

-- ==========================================
-- 004_staff_training.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS staff_training (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food_safety', 'health_safety', 'customer_service', 'technical', 'compliance', 'other')),
  scheduled_date DATE,
  completed_at DATE,
  expires_at DATE,
  certificate_number TEXT,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff_training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to staff_training" ON staff_training
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE staff_training;

CREATE INDEX IF NOT EXISTS idx_staff_training_staff_id ON staff_training(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_training_category ON staff_training(category);
CREATE INDEX IF NOT EXISTS idx_staff_training_status ON staff_training(status);
CREATE INDEX IF NOT EXISTS idx_staff_training_expires_at ON staff_training(expires_at);

-- ==========================================
-- 005_staff_documents.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS staff_documents (
  id TEXT PRIMARY KEY,
  staff_id TEXT,
  staff_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('ic_front', 'ic_back', 'contract', 'resume', 'offer_letter', 'medical_report', 'work_permit', 'certificate', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  expiry_date DATE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to staff_documents" ON staff_documents
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE staff_documents;

CREATE INDEX IF NOT EXISTS idx_staff_documents_staff_id ON staff_documents(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_documents_type ON staff_documents(type);
CREATE INDEX IF NOT EXISTS idx_staff_documents_expiry_date ON staff_documents(expiry_date);

-- ==========================================
-- 006_performance_reviews.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS performance_reviews (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  punctuality INTEGER NOT NULL CHECK (punctuality >= 1 AND punctuality <= 5),
  teamwork INTEGER NOT NULL CHECK (teamwork >= 1 AND teamwork <= 5),
  productivity INTEGER NOT NULL CHECK (productivity >= 1 AND productivity <= 5),
  communication INTEGER NOT NULL CHECK (communication >= 1 AND communication <= 5),
  initiative INTEGER NOT NULL CHECK (initiative >= 1 AND initiative <= 5),
  strengths TEXT,
  improvements TEXT,
  goals TEXT,
  comments TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_acknowledgement', 'completed')),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to performance_reviews" ON performance_reviews
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE performance_reviews;

CREATE INDEX IF NOT EXISTS idx_performance_reviews_staff_id ON performance_reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_period ON performance_reviews(period);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON performance_reviews(status);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_created_at ON performance_reviews(created_at DESC);

-- ==========================================
-- 007_onboarding_checklists.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS onboarding_checklists (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  due_date DATE,
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes TEXT,
  assigned_to TEXT,
  assigned_to_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE onboarding_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to onboarding_checklists" ON onboarding_checklists
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_checklists;

CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_staff_id ON onboarding_checklists(staff_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_status ON onboarding_checklists(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_due_date ON onboarding_checklists(due_date);

-- ==========================================
-- 008_exit_interviews.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS exit_interviews (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  exit_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('resignation', 'termination', 'contract_end', 'retirement', 'other')),
  reason_details TEXT,
  overall_experience INTEGER NOT NULL CHECK (overall_experience >= 1 AND overall_experience <= 5),
  management_rating INTEGER NOT NULL CHECK (management_rating >= 1 AND management_rating <= 5),
  work_environment INTEGER NOT NULL CHECK (work_environment >= 1 AND work_environment <= 5),
  career_growth INTEGER NOT NULL CHECK (career_growth >= 1 AND career_growth <= 5),
  what_liked TEXT,
  what_disliked TEXT,
  suggestions TEXT,
  would_recommend BOOLEAN NOT NULL DEFAULT false,
  interviewed_by TEXT,
  interviewed_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exit_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to exit_interviews" ON exit_interviews
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE exit_interviews;

CREATE INDEX IF NOT EXISTS idx_exit_interviews_staff_id ON exit_interviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_reason ON exit_interviews(reason);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_exit_date ON exit_interviews(exit_date DESC);

-- ==========================================
-- 009_staff_complaints.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS staff_complaints (
  id TEXT PRIMARY KEY,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  staff_id TEXT, -- Nullable if anonymous
  staff_name TEXT NOT NULL, -- "Anonymous" if anonymous
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('harassment', 'misconduct', 'safety', 'management', 'other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT, -- Admin name
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to staff_complaints" ON staff_complaints
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE staff_complaints;

CREATE INDEX IF NOT EXISTS idx_staff_complaints_staff_id ON staff_complaints(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_complaints_status ON staff_complaints(status);
CREATE INDEX IF NOT EXISTS idx_staff_complaints_category ON staff_complaints(category);
CREATE INDEX IF NOT EXISTS idx_staff_complaints_created_at ON staff_complaints(created_at DESC);

-- ==========================================
-- 010_ot_claims.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS ot_claims (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TEXT NOT NULL, -- e.g. "18:00"
  end_time TEXT NOT NULL,   -- e.g. "22:00"
  hours_worked NUMERIC NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  multiplier NUMERIC NOT NULL DEFAULT 1.0,
  total_amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by TEXT,
  approver_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ot_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ot_claims" ON ot_claims
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE ot_claims;

CREATE INDEX IF NOT EXISTS idx_ot_claims_staff_id ON ot_claims(staff_id);
CREATE INDEX IF NOT EXISTS idx_ot_claims_status ON ot_claims(status);
CREATE INDEX IF NOT EXISTS idx_ot_claims_date ON ot_claims(date);
CREATE INDEX IF NOT EXISTS idx_ot_claims_created_at ON ot_claims(created_at DESC);
