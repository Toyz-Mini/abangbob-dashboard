-- =====================================================
-- CREATE VOID REFUND REQUESTS TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create the void_refund_requests table
CREATE TABLE IF NOT EXISTS public.void_refund_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id),
  order_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('void', 'refund', 'partial_refund')),
  reason TEXT NOT NULL,
  amount DECIMAL(10, 2),
  items_to_refund JSONB,
  requested_by UUID,
  requested_by_name TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  sales_reversed BOOLEAN DEFAULT FALSE,
  inventory_reversed BOOLEAN DEFAULT FALSE,
  reversal_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_void_refund_order ON public.void_refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_void_refund_status ON public.void_refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_void_refund_created ON public.void_refund_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_void_refund_requested_by ON public.void_refund_requests(requested_by);

-- Enable Row Level Security
ALTER TABLE public.void_refund_requests ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
DROP POLICY IF EXISTS "Anyone can view void_refund_requests" ON public.void_refund_requests;
CREATE POLICY "Anyone can view void_refund_requests" ON public.void_refund_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can create void_refund_requests" ON public.void_refund_requests;
CREATE POLICY "Staff can create void_refund_requests" ON public.void_refund_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Managers can update void_refund_requests" ON public.void_refund_requests;
CREATE POLICY "Managers can update void_refund_requests" ON public.void_refund_requests FOR UPDATE USING (true);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_void_refund_requests_updated_at ON public.void_refund_requests;
CREATE TRIGGER update_void_refund_requests_updated_at 
  BEFORE UPDATE ON public.void_refund_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.void_refund_requests;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'void_refund_requests table created successfully!';
END $$;
