-- Supabase Migration: ot_claims table
-- Feature: HR Overtime Claims Management

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

-- Enable Row Level Security
ALTER TABLE ot_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to ot_claims" ON ot_claims
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ot_claims;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ot_claims_staff_id ON ot_claims(staff_id);
CREATE INDEX IF NOT EXISTS idx_ot_claims_status ON ot_claims(status);
CREATE INDEX IF NOT EXISTS idx_ot_claims_date ON ot_claims(date);
CREATE INDEX IF NOT EXISTS idx_ot_claims_created_at ON ot_claims(created_at DESC);
