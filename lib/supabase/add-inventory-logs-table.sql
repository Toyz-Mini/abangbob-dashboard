-- Add Inventory Logs Table
-- Track all stock adjustments (in/out/adjustment/initial)

CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  stock_item_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
  stock_item_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'initial')),
  quantity DECIMAL(10,2) NOT NULL,
  previous_quantity DECIMAL(10,2) NOT NULL,
  new_quantity DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_logs_stock_item ON public.inventory_logs(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON public.inventory_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_type ON public.inventory_logs(type);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_outlet ON public.inventory_logs(outlet_id);

-- Enable RLS
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view inventory logs" ON public.inventory_logs FOR SELECT USING (true);
CREATE POLICY "Staff can create inventory logs" ON public.inventory_logs FOR INSERT WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_logs;

-- Add trigger for updated_at (if needed in future)
COMMENT ON TABLE public.inventory_logs IS 'Tracks all inventory stock adjustments with audit trail';

