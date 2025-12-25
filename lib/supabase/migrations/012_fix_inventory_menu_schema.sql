-- Fix Inventory and Menu Schema Gaps
-- Detected via System-Wide Data Integrity Audit
-- Adds missing columns that exist in Frontend Types but not in Database

-- 1. Fix Inventory Table
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS last_restock_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_inventory_sku ON public.inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON public.inventory(location);

-- 2. Fix Menu Items Table
-- Ingredients stored as simple text array for now
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS ingredients TEXT[]; 

-- 3. Fix Orders Table (Just in case customer_phone was missed in types, though it seemed present)
-- Ensuring all audit findings are covered.
