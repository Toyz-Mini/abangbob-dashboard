-- Supabase Migration: onboarding_checklists table
-- Feature: HR Onboarding Checklist System

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

-- Enable Row Level Security
ALTER TABLE onboarding_checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to onboarding_checklists" ON onboarding_checklists
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_checklists;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_staff_id ON onboarding_checklists(staff_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_status ON onboarding_checklists(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_checklists_due_date ON onboarding_checklists(due_date);
