-- Supabase Migration: disciplinary_actions table
-- Feature: HR Disciplinary Actions

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

-- Enable Row Level Security
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to disciplinary_actions" ON disciplinary_actions
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE disciplinary_actions;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disciplinary_staff_id ON disciplinary_actions(staff_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_type ON disciplinary_actions(type);
CREATE INDEX IF NOT EXISTS idx_disciplinary_created_at ON disciplinary_actions(created_at DESC);
