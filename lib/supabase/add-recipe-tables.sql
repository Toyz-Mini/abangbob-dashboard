-- Recipe Management Tables
-- Phase 2: Recipe costing and ingredient tracking

-- ========================================
-- RECIPES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  menu_item_name TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {stockItemId, stockItemName, quantity, unit, costPerUnit, totalCost}
  total_cost DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  profit_margin DECIMAL(5,2) DEFAULT 0, -- percentage
  instructions TEXT,
  prep_time INTEGER DEFAULT 15, -- minutes
  yield_quantity DECIMAL(10,2) DEFAULT 1,
  yield_unit TEXT DEFAULT 'serving',
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_menu_item ON public.recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_outlet ON public.recipes(outlet_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_active ON public.recipes(is_active);

-- RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view recipes" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Managers can create recipes" ON public.recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Managers can update recipes" ON public.recipes FOR UPDATE USING (true);
CREATE POLICY "Managers can delete recipes" ON public.recipes FOR DELETE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes;

-- Trigger for updated_at
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.recipes IS 'Recipe management with ingredient costing and profit calculation';
COMMENT ON COLUMN public.recipes.ingredients IS 'JSONB array of recipe ingredients with costs';
COMMENT ON COLUMN public.recipes.profit_margin IS 'Calculated profit margin percentage';

