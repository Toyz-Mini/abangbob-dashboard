-- Supabase Migration: performance_reviews table
-- Feature: HR Performance Review System

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

-- Enable Row Level Security
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to performance_reviews" ON performance_reviews
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE performance_reviews;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_performance_reviews_staff_id ON performance_reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_period ON performance_reviews(period);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON performance_reviews(status);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_created_at ON performance_reviews(created_at DESC);
