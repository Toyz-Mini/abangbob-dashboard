-- Fix missing columns in oil tracking tables
-- Run this to add any missing columns

-- ========================================
-- FIX OIL_TRACKERS TABLE
-- ========================================
ALTER TABLE public.oil_trackers 
ADD COLUMN IF NOT EXISTS has_pending_request BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_topup_date DATE,
ADD COLUMN IF NOT EXISTS outlet_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ========================================
-- FIX OIL_CHANGE_REQUESTS TABLE
-- ========================================
ALTER TABLE public.oil_change_requests 
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS requested_by TEXT,
ADD COLUMN IF NOT EXISTS requested_by_id UUID,
ADD COLUMN IF NOT EXISTS previous_cycles INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS proposed_cycles INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS topup_percentage INTEGER,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by_id UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ========================================
-- CREATE INDEXES (if not exist)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_oil_trackers_pending ON public.oil_trackers(has_pending_request);
CREATE INDEX IF NOT EXISTS idx_oil_change_requests_requested ON public.oil_change_requests(requested_at DESC);

-- Done!
SELECT 'All columns added successfully!' as result;
