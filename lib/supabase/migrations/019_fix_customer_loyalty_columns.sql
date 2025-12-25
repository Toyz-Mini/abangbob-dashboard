-- Migration: Ensure customer loyalty columns exist
-- Run this in Supabase SQL Editor

-- Add loyalty_points column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'loyalty_points'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN loyalty_points INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add total_spent column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'total_spent'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN total_spent DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add total_orders column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'total_orders'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN total_orders INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add segment column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'segment'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN segment TEXT DEFAULT 'new';
    END IF;
END $$;

-- Verify columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;
