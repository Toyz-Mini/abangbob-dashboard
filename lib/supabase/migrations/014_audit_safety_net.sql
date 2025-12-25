-- "Safety Net" Migration: Ensure Core HR & Finance Tables Exist
-- This script proactively fixes potential "missing table" or "missing column" errors
-- for modules where independent migrations might be missing (001/002).

-- ==========================================
-- 1. EXPENSES (Finance)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    category TEXT NOT NULL, -- enum handled in app
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT NOT NULL,
    receipt_url TEXT,
    payment_method TEXT NOT NULL,
    vendor TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Optional metadata
    outlet_id UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access to expenses" ON public.expenses;
CREATE POLICY "Enable all access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 2. LEAVE REQUESTS (HR)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id TEXT NOT NULL, -- Relaxed FK (TEXT) for robustness
    staff_name TEXT NOT NULL,
    type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration NUMERIC(4, 1) NOT NULL,
    is_half_day BOOLEAN DEFAULT false,
    half_day_type TEXT, -- 'morning', 'afternoon'
    reason TEXT NOT NULL,
    attachments TEXT[], -- Array of URLs
    status TEXT DEFAULT 'pending',
    
    approved_by TEXT,
    approver_name TEXT,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff_id ON public.leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

-- RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access to leave_requests" ON public.leave_requests;
CREATE POLICY "Enable all access to leave_requests" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- 3. CLAIM REQUESTS (HR)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.claim_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    type TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT NOT NULL,
    receipt_urls TEXT[],
    claim_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    
    approved_by TEXT,
    approver_name TEXT,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    paid_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_claim_requests_staff_id ON public.claim_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON public.claim_requests(status);

-- RLS
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access to claim_requests" ON public.claim_requests;
CREATE POLICY "Enable all access to claim_requests" ON public.claim_requests FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 4. CLEANUP & TRIGGERS
-- ==========================================

-- Trigger to update updated_at for Expenses
DROP TRIGGER IF EXISTS update_expenses_modtime ON public.expenses;
CREATE TRIGGER update_expenses_modtime BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Trigger for Leave Requests
DROP TRIGGER IF EXISTS update_leave_requests_modtime ON public.leave_requests;
CREATE TRIGGER update_leave_requests_modtime BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Trigger for Claim Requests
DROP TRIGGER IF EXISTS update_claim_requests_modtime ON public.claim_requests;
CREATE TRIGGER update_claim_requests_modtime BEFORE UPDATE ON public.claim_requests
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
