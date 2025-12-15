-- ========================================
-- COMPREHENSIVE MENU ITEMS + MODIFIERS SEED
-- ========================================
-- This script ensures all menu items and modifiers are properly set up
-- Run this if your menu_items table is empty or needs to be re-seeded
-- 
-- IMPORTANT: This will INSERT menu items with ON CONFLICT DO UPDATE
-- to ensure modifier_group_ids are properly set even if items exist

-- ========================================
-- ENSURE MODIFIER GROUPS EXIST
-- ========================================

INSERT INTO public.modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection)
VALUES 
  ('modgroup_size_tenders', 'Pilih Saiz Tenders', true, false, 1, 1),
  ('modgroup_flavour', 'Pilih Flavour', true, false, 1, 1),
  ('modgroup_addon_sauce', 'Add On Sauce', false, false, 0, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_required = EXCLUDED.is_required,
  allow_multiple = EXCLUDED.allow_multiple,
  min_selection = EXCLUDED.min_selection,
  max_selection = EXCLUDED.max_selection;

-- ========================================
-- ENSURE MODIFIER OPTIONS EXIST
-- ========================================

INSERT INTO public.modifier_options (id, group_id, name, extra_price, is_available)
VALUES 
  -- Size options for Chicken Tenders XL
  ('modopt_tenders_3pcs', 'modgroup_size_tenders', '3 pieces', 0.00, true),
  ('modopt_tenders_6pcs', 'modgroup_size_tenders', '6 pieces', 4.00, true),
  -- Flavour options
  ('modopt_flavour_original', 'modgroup_flavour', 'Original', 0.00, true),
  ('modopt_flavour_spicy', 'modgroup_flavour', 'Spicy', 0.00, true),
  -- Add-on sauce
  ('modopt_extra_sauce', 'modgroup_addon_sauce', 'Extra Sauce', 1.00, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  extra_price = EXCLUDED.extra_price,
  is_available = EXCLUDED.is_available;

-- ========================================
-- SEED ALACART MENU ITEMS WITH MODIFIERS
-- ========================================

-- Chicken Tenders XL (with size selection)
INSERT INTO public.menu_items (name, category, description, price, is_available, modifier_group_ids)
VALUES (
  'Chicken Tenders XL',
  'Alacart',
  'Crispy chicken tenders with free garlic mayo sauce',
  5.90,
  true,
  ARRAY['modgroup_size_tenders']::TEXT[]
)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_available = EXCLUDED.is_available,
  modifier_group_ids = EXCLUDED.modifier_group_ids;

-- Chicken Crispy Wrap (with optional sauce)
INSERT INTO public.menu_items (name, category, description, price, is_available, modifier_group_ids)
VALUES (
  'Chicken Crispy Wrap',
  'Alacart',
  'Crispy chicken wrap with fresh vegetables',
  2.90,
  true,
  ARRAY['modgroup_addon_sauce']::TEXT[]
)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_available = EXCLUDED.is_available,
  modifier_group_ids = EXCLUDED.modifier_group_ids;

-- Crispy Chicken Skin (with flavour + optional sauce)
INSERT INTO public.menu_items (name, category, description, price, is_available, modifier_group_ids)
VALUES (
  'Crispy Chicken Skin',
  'Alacart',
  'Crispy fried chicken skin',
  2.00,
  true,
  ARRAY['modgroup_flavour', 'modgroup_addon_sauce']::TEXT[]
)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_available = EXCLUDED.is_available,
  modifier_group_ids = EXCLUDED.modifier_group_ids;

-- Ayam Gunting XXXL (with flavour + optional sauce)
INSERT INTO public.menu_items (name, category, description, price, is_available, modifier_group_ids)
VALUES (
  'Ayam Gunting XXXL',
  'Alacart',
  'Extra large crispy fried chicken',
  5.90,
  true,
  ARRAY['modgroup_flavour', 'modgroup_addon_sauce']::TEXT[]
)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_available = EXCLUDED.is_available,
  modifier_group_ids = EXCLUDED.modifier_group_ids;

-- Burger Crispy XXL (with optional sauce)
INSERT INTO public.menu_items (name, category, description, price, is_available, modifier_group_ids)
VALUES (
  'Burger Crispy XXL',
  'Alacart',
  'Extra large crispy chicken burger with cheese',
  7.90,
  true,
  ARRAY['modgroup_addon_sauce']::TEXT[]
)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_available = EXCLUDED.is_available,
  modifier_group_ids = EXCLUDED.modifier_group_ids;

-- Chicken Popcorn (with flavour + optional sauce)
INSERT INTO public.menu_items (name, category, description, price, is_available, modifier_group_ids)
VALUES (
  'Chicken Popcorn',
  'Alacart',
  'Bite-sized crispy chicken popcorn',
  3.50,
  true,
  ARRAY['modgroup_flavour', 'modgroup_addon_sauce']::TEXT[]
)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_available = EXCLUDED.is_available,
  modifier_group_ids = EXCLUDED.modifier_group_ids;

-- Crispy Enoki (with flavour + optional sauce)
INSERT INTO public.menu_items (name, category, description, price, is_available, modifier_group_ids)
VALUES (
  'Crispy Enoki',
  'Alacart',
  'Crispy fried enoki mushrooms',
  2.00,
  true,
  ARRAY['modgroup_flavour', 'modgroup_addon_sauce']::TEXT[]
)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_available = EXCLUDED.is_available,
  modifier_group_ids = EXCLUDED.modifier_group_ids;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check modifier groups (should return 3 rows)
-- SELECT * FROM public.modifier_groups ORDER BY name;

-- Check modifier options (should return 5 rows)
-- SELECT mo.*, mg.name as group_name 
-- FROM public.modifier_options mo
-- JOIN public.modifier_groups mg ON mo.group_id = mg.id
-- ORDER BY mg.name, mo.name;

-- Check Alacart menu items with modifiers (should return 7 rows)
-- SELECT name, category, price, modifier_group_ids 
-- FROM public.menu_items 
-- WHERE category = 'Alacart'
-- ORDER BY name;

-- Check which products have which modifiers
-- SELECT 
--   name,
--   CASE 
--     WHEN 'modgroup_size_tenders' = ANY(modifier_group_ids) THEN '✓ Size' 
--     ELSE '' 
--   END as has_size,
--   CASE 
--     WHEN 'modgroup_flavour' = ANY(modifier_group_ids) THEN '✓ Flavour' 
--     ELSE '' 
--   END as has_flavour,
--   CASE 
--     WHEN 'modgroup_addon_sauce' = ANY(modifier_group_ids) THEN '✓ Sauce' 
--     ELSE '' 
--   END as has_sauce
-- FROM public.menu_items
-- WHERE category = 'Alacart'
-- ORDER BY name;

-- ========================================
-- SEED COMPLETE
-- ========================================
-- All Alacart menu items with modifiers have been seeded!
-- 
-- Next steps:
-- 1. Uncomment and run the verification queries above
-- 2. Restart your app to load the new data
-- 3. Test modifier selection in POS
--
