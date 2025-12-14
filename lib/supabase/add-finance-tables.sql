-- Finance Tables: Daily Cash Flows
-- Phase 2: Core financial tracking

-- ========================================
-- DAILY CASH FLOWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.daily_cash_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  opening_cash DECIMAL(10,2) DEFAULT 0,
  sales_cash DECIMAL(10,2) DEFAULT 0,
  sales_card DECIMAL(10,2) DEFAULT 0,
  sales_ewallet DECIMAL(10,2) DEFAULT 0,
  expenses_cash DECIMAL(10,2) DEFAULT 0,
  closing_cash DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  closed_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  closed_by_name TEXT,
  closed_at TIMESTAMPTZ,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, outlet_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_cash_flows_date ON public.daily_cash_flows(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_cash_flows_outlet ON public.daily_cash_flows(outlet_id);
CREATE INDEX IF NOT EXISTS idx_daily_cash_flows_closed_by ON public.daily_cash_flows(closed_by);

-- RLS
ALTER TABLE public.daily_cash_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view cash flows" ON public.daily_cash_flows FOR SELECT USING (true);
CREATE POLICY "Staff can create cash flows" ON public.daily_cash_flows FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update cash flows" ON public.daily_cash_flows FOR UPDATE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_cash_flows;

-- Trigger for updated_at
CREATE TRIGGER update_daily_cash_flows_updated_at BEFORE UPDATE ON public.daily_cash_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.daily_cash_flows IS 'Daily cash flow tracking for financial reconciliation';
COMMENT ON COLUMN public.daily_cash_flows.date IS 'Unique date per outlet for cash flow record';

