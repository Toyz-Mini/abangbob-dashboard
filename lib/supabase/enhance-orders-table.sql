-- Enhance Orders Table
-- Add missing void/refund tracking columns

-- Add columns if they don't exist (safe to run multiple times)
DO $$ 
BEGIN
  -- Add cashier tracking if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='cashier_id') THEN
    ALTER TABLE public.orders ADD COLUMN cashier_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='cashier_name') THEN
    ALTER TABLE public.orders ADD COLUMN cashier_name TEXT;
  END IF;

  -- Void/refund status columns (already in schema.sql but ensure they exist)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='void_refund_status') THEN
    ALTER TABLE public.orders ADD COLUMN void_refund_status TEXT DEFAULT 'none' 
      CHECK (void_refund_status IN ('none', 'pending_void', 'pending_refund', 'voided', 'refunded', 'partial_refund'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='refund_amount') THEN
    ALTER TABLE public.orders ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='refund_reason') THEN
    ALTER TABLE public.orders ADD COLUMN refund_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='refunded_at') THEN
    ALTER TABLE public.orders ADD COLUMN refunded_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='refunded_by') THEN
    ALTER TABLE public.orders ADD COLUMN refunded_by UUID REFERENCES public.staff(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='refunded_by_name') THEN
    ALTER TABLE public.orders ADD COLUMN refunded_by_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='voided_at') THEN
    ALTER TABLE public.orders ADD COLUMN voided_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='voided_by') THEN
    ALTER TABLE public.orders ADD COLUMN voided_by UUID REFERENCES public.staff(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='voided_by_name') THEN
    ALTER TABLE public.orders ADD COLUMN voided_by_name TEXT;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_cashier ON public.orders(cashier_id);
CREATE INDEX IF NOT EXISTS idx_orders_void_refund_status ON public.orders(void_refund_status);
CREATE INDEX IF NOT EXISTS idx_orders_refunded_by ON public.orders(refunded_by);
CREATE INDEX IF NOT EXISTS idx_orders_voided_by ON public.orders(voided_by);

COMMENT ON COLUMN public.orders.cashier_id IS 'Staff who created the order';
COMMENT ON COLUMN public.orders.void_refund_status IS 'Tracks void/refund status for order history';

