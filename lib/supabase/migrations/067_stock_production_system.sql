-- Stock, Recipe & Production Management System
-- Migration 067: Add inventory types and production tracking
-- Created: 2026-01-16

-- ========================================
-- 1. ENHANCE INVENTORY TABLE
-- ========================================

-- Add item type classification (raw materials, semi-finished, finished goods)
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'raw' 
CHECK (item_type IN ('raw', 'semi-finished', 'finished'));

-- Link semi-finished goods to their production recipe
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS production_recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL;

-- Add max quantity for better stock management
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS max_quantity DECIMAL(10,2);

-- Index for faster lookups by type
CREATE INDEX IF NOT EXISTS idx_inventory_item_type ON public.inventory(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_production_recipe ON public.inventory(production_recipe_id);

-- ========================================
-- 2. ENHANCE RECIPES TABLE
-- ========================================

-- Add recipe type to distinguish menu recipes from production recipes
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS recipe_type TEXT DEFAULT 'menu' CHECK (recipe_type IN ('menu', 'production'));

-- Link production recipe to its output inventory item
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS output_inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL;

-- Output quantity per batch
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS output_quantity DECIMAL(10,2) DEFAULT 1;

-- Output unit (e.g., kg, litre, pcs)
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS output_unit TEXT;

-- Index for recipe type lookups
CREATE INDEX IF NOT EXISTS idx_recipes_type ON public.recipes(recipe_type);
CREATE INDEX IF NOT EXISTS idx_recipes_output_inventory ON public.recipes(output_inventory_id);

-- ========================================
-- 3. ENHANCE PRODUCTION_LOGS TABLE
-- ========================================

-- Link production to recipe
ALTER TABLE public.production_logs
ADD COLUMN IF NOT EXISTS recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL;

-- Store recipe name for historical reference (even if recipe is deleted)
ALTER TABLE public.production_logs
ADD COLUMN IF NOT EXISTS recipe_name TEXT;

-- Store ingredients that were deducted (for audit trail)
-- Format: [{stockItemId, stockItemName, quantity, unit, costPerUnit, totalCost}]
ALTER TABLE public.production_logs
ADD COLUMN IF NOT EXISTS ingredients_deducted JSONB DEFAULT '[]'::jsonb;

-- Link to output inventory item created
ALTER TABLE public.production_logs
ADD COLUMN IF NOT EXISTS output_inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL;

-- Quantity of output created
ALTER TABLE public.production_logs
ADD COLUMN IF NOT EXISTS output_quantity DECIMAL(10,2);

-- Total cost of batch (sum of all ingredient costs)
ALTER TABLE public.production_logs
ADD COLUMN IF NOT EXISTS batch_cost DECIMAL(10,2) DEFAULT 0;

-- Staff who performed the production
ALTER TABLE public.production_logs
ADD COLUMN IF NOT EXISTS staff_id TEXT REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE public.production_logs
ADD COLUMN IF NOT EXISTS staff_name TEXT;

-- Production status
ALTER TABLE public.production_logs
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Indexes for production logs
CREATE INDEX IF NOT EXISTS idx_production_logs_recipe ON public.production_logs(recipe_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_output ON public.production_logs(output_inventory_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_staff ON public.production_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_status ON public.production_logs(status);

-- ========================================
-- 4. INVENTORY LOGS ENHANCEMENT
-- ========================================

-- Add reference to production log for traceability
ALTER TABLE public.inventory_logs
ADD COLUMN IF NOT EXISTS production_log_id UUID REFERENCES public.production_logs(id) ON DELETE SET NULL;

-- Add reference to order for sales deductions
ALTER TABLE public.inventory_logs
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Add order number for easy reference
ALTER TABLE public.inventory_logs
ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Source of the change
ALTER TABLE public.inventory_logs
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'production', 'order', 'waste', 'restock', 'adjustment', 'initial'));

-- Indexes for logs
CREATE INDEX IF NOT EXISTS idx_inventory_logs_production ON public.inventory_logs(production_log_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order ON public.inventory_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_source ON public.inventory_logs(source);

-- ========================================
-- 5. CREATE STOCK ALERTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  inventory_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'negative_stock', 'expiring_soon')),
  current_quantity DECIMAL(10,2),
  threshold_quantity DECIMAL(10,2),
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by TEXT REFERENCES public.staff(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_alerts_inventory ON public.stock_alerts(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_type ON public.stock_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_ack ON public.stock_alerts(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_created ON public.stock_alerts(created_at DESC);

-- RLS
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All access stock_alerts" ON public.stock_alerts FOR ALL USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_alerts;

-- ========================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON COLUMN public.inventory.item_type IS 'Classification: raw (purchased materials), semi-finished (produced in-house), finished (ready to sell)';
COMMENT ON COLUMN public.inventory.production_recipe_id IS 'For semi-finished items, the recipe used to produce them';

COMMENT ON COLUMN public.recipes.recipe_type IS 'menu = for selling menu items, production = for creating semi-finished goods';
COMMENT ON COLUMN public.recipes.output_inventory_id IS 'For production recipes, the inventory item created';

COMMENT ON COLUMN public.production_logs.ingredients_deducted IS 'JSONB array of ingredients deducted during this production run';
COMMENT ON COLUMN public.production_logs.batch_cost IS 'Total cost of all ingredients used in this batch';

COMMENT ON TABLE public.stock_alerts IS 'Real-time stock alerts for low/out-of-stock situations';

-- ========================================
-- 7. HELPER FUNCTIONS
-- ========================================

-- Function to check stock level and create alert if needed
CREATE OR REPLACE FUNCTION check_stock_level_and_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_type TEXT;
  v_existing_alert_id UUID;
BEGIN
  -- Determine alert type based on stock level
  IF NEW.current_quantity < 0 THEN
    v_alert_type := 'negative_stock';
  ELSIF NEW.current_quantity = 0 THEN
    v_alert_type := 'out_of_stock';
  ELSIF NEW.current_quantity <= NEW.min_quantity THEN
    v_alert_type := 'low_stock';
  ELSE
    -- Stock is healthy, remove any existing unacknowledged alerts
    DELETE FROM public.stock_alerts 
    WHERE inventory_id = NEW.id 
    AND is_acknowledged = false;
    RETURN NEW;
  END IF;

  -- Check if alert already exists for this item
  SELECT id INTO v_existing_alert_id
  FROM public.stock_alerts
  WHERE inventory_id = NEW.id
  AND alert_type = v_alert_type
  AND is_acknowledged = false;

  -- If no existing alert, create one
  IF v_existing_alert_id IS NULL THEN
    INSERT INTO public.stock_alerts (
      inventory_id,
      inventory_name,
      alert_type,
      current_quantity,
      threshold_quantity,
      outlet_id
    ) VALUES (
      NEW.id,
      NEW.name,
      v_alert_type,
      NEW.current_quantity,
      NEW.min_quantity,
      NEW.outlet_id
    );
  ELSE
    -- Update existing alert with current quantity
    UPDATE public.stock_alerts
    SET current_quantity = NEW.current_quantity,
        created_at = NOW()
    WHERE id = v_existing_alert_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for stock level monitoring
DROP TRIGGER IF EXISTS trigger_check_stock_level ON public.inventory;
CREATE TRIGGER trigger_check_stock_level
  AFTER UPDATE OF current_quantity ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_level_and_alert();

-- Done!
-- Run this migration in Supabase SQL Editor
