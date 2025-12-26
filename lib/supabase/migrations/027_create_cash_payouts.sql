-- Migration: Create cash_payouts table for Money Out feature
-- Tracks cash withdrawals from register with reason and approval

CREATE TABLE IF NOT EXISTS cash_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  category TEXT DEFAULT 'petty_cash',  -- petty_cash, refund, change, supplier, other
  performed_by TEXT NOT NULL,          -- Staff ID who took money
  performed_by_name TEXT NOT NULL,
  approved_by TEXT,                    -- Manager ID (optional)
  approved_by_name TEXT,
  register_id UUID,                    -- Link to active cash register
  outlet_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by date
CREATE INDEX IF NOT EXISTS idx_cash_payouts_created ON cash_payouts(created_at);

-- RLS disabled (following current pattern)
ALTER TABLE cash_payouts DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'cash_payouts table created successfully' AS status;
