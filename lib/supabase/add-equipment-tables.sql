-- Equipment & Oil Tracking Tables
-- Phase 5: Oil tracker, change requests, and action history

-- ========================================
-- OIL TRACKERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.oil_trackers (
  fryer_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  current_cycles INTEGER DEFAULT 0,
  cycle_limit INTEGER NOT NULL,
  last_changed_date DATE NOT NULL,
  last_topup_date DATE,
  status TEXT DEFAULT 'good' CHECK (status IN ('good', 'warning', 'critical')),
  has_pending_request BOOLEAN DEFAULT false,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oil_trackers_status ON public.oil_trackers(status);
CREATE INDEX IF NOT EXISTS idx_oil_trackers_outlet ON public.oil_trackers(outlet_id);
CREATE INDEX IF NOT EXISTS idx_oil_trackers_pending ON public.oil_trackers(has_pending_request);

DROP POLICY IF EXISTS "Anyone can view oil trackers" ON public.oil_trackers;
DROP POLICY IF EXISTS "Staff can manage oil trackers" ON public.oil_trackers;
ALTER TABLE public.oil_trackers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view oil trackers" ON public.oil_trackers FOR SELECT USING (true);
CREATE POLICY "Staff can manage oil trackers" ON public.oil_trackers FOR ALL USING (true);

-- Realtime (ignore error if already added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.oil_trackers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS update_oil_trackers_updated_at ON public.oil_trackers;
CREATE TRIGGER update_oil_trackers_updated_at BEFORE UPDATE ON public.oil_trackers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- OIL CHANGE REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.oil_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fryer_id TEXT NOT NULL REFERENCES public.oil_trackers(fryer_id) ON DELETE CASCADE,
  fryer_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('change', 'topup')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by TEXT NOT NULL, -- Staff name
  requested_by_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  previous_cycles INTEGER NOT NULL,
  proposed_cycles INTEGER NOT NULL,
  topup_percentage INTEGER,
  photo_url TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  reviewed_by_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_oil_change_requests_fryer ON public.oil_change_requests(fryer_id);
CREATE INDEX IF NOT EXISTS idx_oil_change_requests_status ON public.oil_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_oil_change_requests_requested ON public.oil_change_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_oil_change_requests_action_type ON public.oil_change_requests(action_type);

DROP POLICY IF EXISTS "Anyone can view oil change requests" ON public.oil_change_requests;
DROP POLICY IF EXISTS "Staff can create oil change requests" ON public.oil_change_requests;
DROP POLICY IF EXISTS "Managers can update oil change requests" ON public.oil_change_requests;
ALTER TABLE public.oil_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view oil change requests" ON public.oil_change_requests FOR SELECT USING (true);
CREATE POLICY "Staff can create oil change requests" ON public.oil_change_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Managers can update oil change requests" ON public.oil_change_requests FOR UPDATE USING (true);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.oil_change_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- OIL ACTION HISTORY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.oil_action_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fryer_id TEXT NOT NULL REFERENCES public.oil_trackers(fryer_id) ON DELETE CASCADE,
  fryer_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('change', 'topup')),
  action_at TIMESTAMPTZ DEFAULT NOW(),
  previous_cycles INTEGER NOT NULL,
  new_cycles INTEGER NOT NULL,
  topup_percentage INTEGER,
  requested_by TEXT NOT NULL,
  requested_by_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by TEXT NOT NULL,
  approved_by_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_oil_action_history_fryer ON public.oil_action_history(fryer_id);
CREATE INDEX IF NOT EXISTS idx_oil_action_history_action_at ON public.oil_action_history(action_at DESC);
CREATE INDEX IF NOT EXISTS idx_oil_action_history_action_type ON public.oil_action_history(action_type);

DROP POLICY IF EXISTS "Anyone can view oil action history" ON public.oil_action_history;
DROP POLICY IF EXISTS "Staff can create oil action history" ON public.oil_action_history;
ALTER TABLE public.oil_action_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view oil action history" ON public.oil_action_history FOR SELECT USING (true);
CREATE POLICY "Staff can create oil action history" ON public.oil_action_history FOR INSERT WITH CHECK (true);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.oil_action_history;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.oil_trackers IS 'Fryer oil tracking with cycle management';
COMMENT ON TABLE public.oil_change_requests IS 'Oil change/topup approval workflow';
COMMENT ON TABLE public.oil_action_history IS 'Historical record of all oil changes and topups';

