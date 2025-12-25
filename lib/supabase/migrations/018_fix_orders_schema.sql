-- Fix Orders Table Schema - Add all missing columns
-- This ensures orders sync correctly from the app

-- Add staff tracking columns (for linking orders to cashier)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.staff(id),
ADD COLUMN IF NOT EXISTS staff_name TEXT;

-- Verify the table has all required columns
-- Run this after the ALTER to confirm:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position;
