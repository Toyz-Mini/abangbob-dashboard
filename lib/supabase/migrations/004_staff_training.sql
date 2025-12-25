-- Supabase Migration: staff_training table
-- Feature: HR Staff Training & Certifications

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

-- Enable Row Level Security
ALTER TABLE staff_training ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to staff_training" ON staff_training
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE staff_training;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_training_staff_id ON staff_training(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_training_category ON staff_training(category);
CREATE INDEX IF NOT EXISTS idx_staff_training_status ON staff_training(status);
CREATE INDEX IF NOT EXISTS idx_staff_training_expires_at ON staff_training(expires_at);
