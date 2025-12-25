-- Supabase Migration: staff_complaints table
-- Feature: HR Staff Complaints System (Anonymous support)

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

-- Enable Row Level Security
ALTER TABLE staff_complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to staff_complaints" ON staff_complaints
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE staff_complaints;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_complaints_staff_id ON staff_complaints(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_complaints_status ON staff_complaints(status);
CREATE INDEX IF NOT EXISTS idx_staff_complaints_category ON staff_complaints(category);
CREATE INDEX IF NOT EXISTS idx_staff_complaints_created_at ON staff_complaints(created_at DESC);
