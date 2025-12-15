-- ========================================
-- SEED NEW MENU ITEMS: POTATO BOWL & NASHVILLE MOZZARELLA
-- ========================================
-- Run this in Supabase SQL Editor to add new items

-- 1. Add Nashville size modifier group
INSERT INTO public.modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection)
VALUES 
  ('modgroup_size_nashville', 'Pilih Saiz', true, false, 1, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

-- 2. Add Nashville size options
INSERT INTO public.modifier_options (id, group_id, name, extra_price, is_available)
VALUES 
  ('modopt_nashville_1pc', 'modgroup_size_nashville', '1 piece', 0.00, true),
  ('modopt_nashville_3pcs', 'modgroup_size_nashville', '3 pieces (FREE Dipping Sauce)', 7.00, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  extra_price = EXCLUDED.extra_price;

-- 3. Delete existing items if any (to avoid duplicates)
DELETE FROM public.menu_items WHERE name IN ('Potato Bowl', 'Nashville Mozzarella Cheese');

-- 4. Add Potato Bowl menu item
INSERT INTO public.menu_items (name, category, description, price, is_available)
VALUES (
  'Potato Bowl',
  'Alacart',
  'NEW! Creamy potato bowl with special mayo topping',
  3.50,
  true
);

-- 5. Add Nashville Mozzarella Cheese menu item (without modifiers - link via Menu Management UI)
INSERT INTO public.menu_items (name, category, description, price, is_available)
VALUES (
  'Nashville Mozzarella Cheese',
  'Alacart',
  'Crispy Nashville-style mozzarella cheese sticks',
  3.90,
  true
);

-- Done! New menu items added.
-- NOTE: To link Nashville with size modifier, go to Menu Management and edit the item
SELECT 'Menu items added! Link Nashville with Pilih Saiz modifier via Menu Management UI' as result;

