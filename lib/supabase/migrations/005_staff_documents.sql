-- Supabase Migration: staff_documents table
-- Feature: HR Staff Documents Management

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

-- Enable Row Level Security
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to staff_documents" ON staff_documents
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE staff_documents;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_documents_staff_id ON staff_documents(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_documents_type ON staff_documents(type);
CREATE INDEX IF NOT EXISTS idx_staff_documents_expiry_date ON staff_documents(expiry_date);
