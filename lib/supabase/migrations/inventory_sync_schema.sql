-- Inventory Sync Schema

-- 1. Link SOP Steps to Inventory Items
-- This allows a specific step (e.g. "Count Milk") to be linked to an inventory item (e.g. "Full Cream Milk")
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sop_steps' AND column_name = 'inventory_item_id') THEN
        ALTER TABLE public.sop_steps 
        ADD COLUMN inventory_item_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sop_steps' AND column_name = 'inventory_action') THEN
        ALTER TABLE public.sop_steps 
        ADD COLUMN inventory_action TEXT DEFAULT 'set_stock'; 
        -- Actions: 'set_stock' (overwrite), 'deduct' (reduce usage), 'add' (restock)
    END IF;
END $$;

-- 2. Inventory Logs Table
-- A generic table to track all changes to inventory (Manual edits, SOP syncs, Waste)
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
    previous_quantity DECIMAL(10,2),
    new_quantity DECIMAL(10,2),
    change_amount DECIMAL(10,2), -- Positive (Add) or Negative (Deduct)
    reason TEXT NOT NULL, -- e.g. 'sop_sync', 'manual_adjustment', 'waste_report'
    reference_id UUID, -- Optional: link to sop_log_id or waste_log_id
    staff_id UUID REFERENCES public.staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access to logs" ON public.inventory_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert access to logs" ON public.inventory_logs FOR INSERT WITH CHECK (true);
