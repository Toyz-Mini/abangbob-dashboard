-- Migration: Add Modifier Groups and Options tables
-- Run this in Supabase SQL Editor to add modifier support

-- ========================================
-- CREATE MODIFIER TABLES
-- ========================================

-- Create modifier_groups table
CREATE TABLE IF NOT EXISTS public.modifier_groups (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  allow_multiple BOOLEAN DEFAULT false,
  min_selection INTEGER DEFAULT 0,
  max_selection INTEGER DEFAULT 1,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_modifier_groups_outlet ON public.modifier_groups(outlet_id);

-- Create modifier_options table
CREATE TABLE IF NOT EXISTS public.modifier_options (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  group_id TEXT NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  extra_price DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_modifier_options_group ON public.modifier_options(group_id);
CREATE INDEX IF NOT EXISTS idx_modifier_options_outlet ON public.modifier_options(outlet_id);

-- ========================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE POLICIES
-- ========================================

-- Modifier groups policies
CREATE POLICY "Anyone can view modifier groups" ON public.modifier_groups FOR SELECT USING (true);
CREATE POLICY "Managers can manage modifier groups" ON public.modifier_groups FOR ALL USING (true);

-- Modifier options policies
CREATE POLICY "Anyone can view modifier options" ON public.modifier_options FOR SELECT USING (true);
CREATE POLICY "Managers can manage modifier options" ON public.modifier_options FOR ALL USING (true);

-- ========================================
-- ADD TRIGGERS FOR UPDATED_AT
-- ========================================

CREATE TRIGGER update_modifier_groups_updated_at BEFORE UPDATE ON public.modifier_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modifier_options_updated_at BEFORE UPDATE ON public.modifier_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ENABLE REALTIME
-- ========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.modifier_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.modifier_options;

-- ========================================
-- SEED INITIAL DATA
-- ========================================

-- Insert Pilih Saiz Tenders group
INSERT INTO public.modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection)
VALUES 
  ('modgroup_size_tenders', 'Pilih Saiz Tenders', true, false, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert Pilih Flavour group
INSERT INTO public.modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection)
VALUES 
  ('modgroup_flavour', 'Pilih Flavour', true, false, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert Add On Sauce group
INSERT INTO public.modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection)
VALUES 
  ('modgroup_addon_sauce', 'Add On Sauce', false, false, 0, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert options for Pilih Saiz Tenders
INSERT INTO public.modifier_options (id, group_id, name, extra_price, is_available)
VALUES 
  ('modopt_tenders_3pcs', 'modgroup_size_tenders', '3 pieces', 0.00, true),
  ('modopt_tenders_6pcs', 'modgroup_size_tenders', '6 pieces', 4.00, true)
ON CONFLICT (id) DO NOTHING;

-- Insert options for Pilih Flavour
INSERT INTO public.modifier_options (id, group_id, name, extra_price, is_available)
VALUES 
  ('modopt_flavour_original', 'modgroup_flavour', 'Original', 0.00, true),
  ('modopt_flavour_spicy', 'modgroup_flavour', 'Spicy', 0.00, true)
ON CONFLICT (id) DO NOTHING;

-- Insert option for Add On Sauce
INSERT INTO public.modifier_options (id, group_id, name, extra_price, is_available)
VALUES 
  ('modopt_extra_sauce', 'modgroup_addon_sauce', 'Extra Sauce', 1.00, true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- LINK MENU ITEMS WITH MODIFIERS
-- ========================================

-- Update Chicken Tenders XL
UPDATE public.menu_items 
SET modifier_group_ids = ARRAY['modgroup_size_tenders']::TEXT[]
WHERE name = 'Chicken Tenders XL';

-- Update Chicken Crispy Wrap
UPDATE public.menu_items 
SET modifier_group_ids = ARRAY['modgroup_addon_sauce']::TEXT[]
WHERE name = 'Chicken Crispy Wrap';

-- Update Crispy Chicken Skin
UPDATE public.menu_items 
SET modifier_group_ids = ARRAY['modgroup_flavour', 'modgroup_addon_sauce']::TEXT[]
WHERE name = 'Crispy Chicken Skin';

-- Update Ayam Gunting XXXL
UPDATE public.menu_items 
SET modifier_group_ids = ARRAY['modgroup_flavour', 'modgroup_addon_sauce']::TEXT[]
WHERE name = 'Ayam Gunting XXXL';

-- Update Burger Crispy XXL
UPDATE public.menu_items 
SET modifier_group_ids = ARRAY['modgroup_addon_sauce']::TEXT[]
WHERE name = 'Burger Crispy XXL';

-- Update Chicken Popcorn
UPDATE public.menu_items 
SET modifier_group_ids = ARRAY['modgroup_flavour', 'modgroup_addon_sauce']::TEXT[]
WHERE name = 'Chicken Popcorn';

-- Update Crispy Enoki
UPDATE public.menu_items 
SET modifier_group_ids = ARRAY['modgroup_flavour', 'modgroup_addon_sauce']::TEXT[]
WHERE name = 'Crispy Enoki';

-- ========================================
-- VERIFICATION & TESTING
-- ========================================

-- After running this migration, verify the setup:

-- 1. Check modifier groups were created (should return 3 rows)
-- SELECT * FROM public.modifier_groups ORDER BY name;

-- 2. Check modifier options were created (should return 5 rows)
-- SELECT mo.name as option_name, mo.extra_price, mg.name as group_name
-- FROM public.modifier_options mo
-- JOIN public.modifier_groups mg ON mo.group_id = mg.id
-- ORDER BY mg.name, mo.name;

-- 3. Check menu items were linked with modifiers (should show 7 Alacart items)
-- SELECT name, category, price, modifier_group_ids 
-- FROM public.menu_items 
-- WHERE category = 'Alacart'
-- ORDER BY name;

-- 4. Detailed view - which products have which modifiers
-- SELECT 
--   name,
--   price,
--   CASE 
--     WHEN 'modgroup_size_tenders' = ANY(modifier_group_ids) THEN '✓ Size Selection' 
--     ELSE '' 
--   END as has_size,
--   CASE 
--     WHEN 'modgroup_flavour' = ANY(modifier_group_ids) THEN '✓ Flavour Choice' 
--     ELSE '' 
--   END as has_flavour,
--   CASE 
--     WHEN 'modgroup_addon_sauce' = ANY(modifier_group_ids) THEN '✓ Add-on Sauce' 
--     ELSE '' 
--   END as has_sauce
-- FROM public.menu_items
-- WHERE category = 'Alacart'
-- ORDER BY name;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- 
-- Next steps:
-- 1. Run this migration in your Supabase SQL Editor
-- 2. Uncomment and run the verification queries above to check
-- 3. Verify menu items were linked with modifier groups
-- 4. Clear localStorage in browser (DevTools > Application > Local Storage > Clear)
-- 5. Restart your app with hard refresh (Cmd/Ctrl + Shift + R)
-- 6. Test in POS:
--    - Click "Chicken Tenders XL" → Modal should open with size selection
--    - Click "Crispy Chicken Skin" → Modal should open with flavour + sauce
--    - Click "Chicken Crispy Wrap" → Modal should open with optional sauce
-- 7. Your app will now sync modifier groups and options with Supabase
--
