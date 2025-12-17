-- ============================================================================
-- FIX RECIPES TABLE SCHEMA
-- Run this script in your Supabase Dashboard > SQL Editor to fix "column not found" errors.
-- ============================================================================

-- Add missing financial columns
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2) DEFAULT 0;

-- Add missing detail columns
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS prep_time INTEGER DEFAULT 15;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS yield_quantity DECIMAL(10,2) DEFAULT 1;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS yield_unit TEXT DEFAULT 'serving';

-- Add status column
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Note: We are NOT adding menu_item_name as we now handle that via client-side join.

-- Grant permissions just in case
GRANT ALL ON public.recipes TO postgres;
GRANT ALL ON public.recipes TO anon;
GRANT ALL ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;

-- Force schema cache reload (Supabase sometimes caches schema)
NOTIFY pgrst, 'reload schema';
