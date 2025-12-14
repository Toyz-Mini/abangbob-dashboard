-- ========================================
-- Fix Missing Columns in Orders Table
-- ========================================
-- Run this if you get error: column "cashier_id" does not exist
-- This adds the missing Order History & Void/Refund columns

-- Add cashier_id column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'cashier_id'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN cashier_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add void_refund_status column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'void_refund_status'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN void_refund_status TEXT DEFAULT 'none' 
    CHECK (void_refund_status IN ('none', 'pending_void', 'pending_refund', 'voided', 'refunded', 'partial_refund'));
  END IF;
END $$;

-- Add refund_amount column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'refund_amount'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add refund_reason column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'refund_reason'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN refund_reason TEXT;
  END IF;
END $$;

-- Add refunded_at column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'refunded_at'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN refunded_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add refunded_by column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'refunded_by'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN refunded_by UUID REFERENCES public.staff(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add voided_at column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'voided_at'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN voided_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add voided_by column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'voided_by'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN voided_by UUID REFERENCES public.staff(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add is_synced_offline column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'is_synced_offline'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN is_synced_offline BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add original_offline_id column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'original_offline_id'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN original_offline_id TEXT;
  END IF;
END $$;

-- Create index for cashier_id if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'orders' 
    AND indexname = 'idx_orders_cashier'
  ) THEN
    CREATE INDEX idx_orders_cashier ON public.orders(cashier_id);
  END IF;
END $$;

-- Create index for void_refund_status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'orders' 
    AND indexname = 'idx_orders_void_refund'
  ) THEN
    CREATE INDEX idx_orders_void_refund ON public.orders(void_refund_status);
  END IF;
END $$;

-- Verification query
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND column_name IN (
    'cashier_id',
    'void_refund_status',
    'refund_amount',
    'refund_reason',
    'refunded_at',
    'refunded_by',
    'voided_at',
    'voided_by',
    'is_synced_offline',
    'original_offline_id'
  )
ORDER BY ordinal_position;


