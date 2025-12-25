-- Supabase Migration: exit_interviews table
-- Feature: HR Exit Interview System

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

-- Enable Row Level Security
ALTER TABLE exit_interviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to exit_interviews" ON exit_interviews
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE exit_interviews;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exit_interviews_staff_id ON exit_interviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_reason ON exit_interviews(reason);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_exit_date ON exit_interviews(exit_date DESC);
