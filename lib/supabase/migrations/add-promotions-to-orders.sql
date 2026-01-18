-- Add promotion tracking columns to orders table

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='promotion_id') THEN
    ALTER TABLE public.orders ADD COLUMN promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='promo_code') THEN
    ALTER TABLE public.orders ADD COLUMN promo_code TEXT;
  END IF;

  -- Ensure discount amount is tracked separately from generic discount percentage if needed, 
  -- but usually 'discount' column is used. Let's make sure we have a clear column for it.
  -- Existing 'discount' column in Order type seems to be a number (amount or percent?). 
  -- In POS page: const discountAmount = (cartSubtotal * discountPercent) / 100;
  -- So 'discount' in DB likely stores the amount.
  -- We'll just ensure it exists or use it.

  -- Add index for reporting
  CREATE INDEX IF NOT EXISTS idx_orders_promotion_id ON public.orders(promotion_id);
END $$;
