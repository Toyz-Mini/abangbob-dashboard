-- ============================================================================
-- COMBO & PARTY SET SEED V4 (GRANULAR REFINEMENT)
-- ============================================================================

-- 1. ARCHIVE OLD ITEMS (Aggressive Cleanup)
-- Use ILIKE to catch 'Party Set', 'Party Sets', 'Combos', 'Combo', etc.
UPDATE menu_items 
SET 
  is_available = false, 
  name = name || ' (OLD)',
  category = category || ' (Archived)'
WHERE 
  (category ILIKE '%Combo%' OR category ILIKE '%Party%') 
  AND name NOT LIKE '%(OLD)';

-- 2. MODIFIER GROUPS
-- We define specific UUIDs for granular selections.

-- CHICKEN FLAVOR GROUPS (1-7)
INSERT INTO modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection) VALUES
('c1111111-0001-4000-8000-000000000001', 'Pilih Flavour Ayam 1', true, false, 1, 1),
('c1111111-0002-4000-8000-000000000002', 'Pilih Flavour Ayam 2', true, false, 1, 1),
('c1111111-0003-4000-8000-000000000003', 'Pilih Flavour Ayam 3', true, false, 1, 1),
('c1111111-0004-4000-8000-000000000004', 'Pilih Flavour Ayam 4', true, false, 1, 1),
('c1111111-0005-4000-8000-000000000005', 'Pilih Flavour Ayam 5', true, false, 1, 1),
('c1111111-0006-4000-8000-000000000006', 'Pilih Flavour Ayam 6', true, false, 1, 1),
('c1111111-0007-4000-8000-000000000007', 'Pilih Flavour Ayam 7', true, false, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- POPCORN FLAVOR GROUPS (1-4) - NEW REQUEST
INSERT INTO modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection) VALUES
('e0000000-0001-4000-8000-000000000001', 'Pilih Flavour Popcorn 1', true, false, 1, 1),
('e0000000-0002-4000-8000-000000000002', 'Pilih Flavour Popcorn 2', true, false, 1, 1),
('e0000000-0003-4000-8000-000000000003', 'Pilih Flavour Popcorn 3', true, false, 1, 1),
('e0000000-0004-4000-8000-000000000004', 'Pilih Flavour Popcorn 4', true, false, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- DRINK GROUPS (1-3)
INSERT INTO modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection) VALUES
('d3333333-0001-4000-8000-000000000001', 'Pilih Minuman 1', true, false, 1, 1),
('d3333333-0002-4000-8000-000000000002', 'Pilih Minuman 2', true, false, 1, 1),
('d3333333-0003-4000-8000-000000000003', 'Pilih Minuman 3', true, false, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- GENERIC SAUCE (Single)
INSERT INTO modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection) VALUES
('a0000000-0001-4000-8000-000000000001', 'Pilih Sauce', true, false, 1, 1)
ON CONFLICT (id) DO NOTHING;


-- 3. INSERT OPTIONS
-- Chicken Options (For Groups c1..c7)
INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) 
SELECT gen_random_uuid(), g.id, o.name, o.price, true
FROM 
    (SELECT 'c1111111-0001-4000-8000-000000000001' as id UNION ALL 
     SELECT 'c1111111-0002-4000-8000-000000000002' UNION ALL 
     SELECT 'c1111111-0003-4000-8000-000000000003' UNION ALL
     SELECT 'c1111111-0004-4000-8000-000000000004' UNION ALL 
     SELECT 'c1111111-0005-4000-8000-000000000005' UNION ALL 
     SELECT 'c1111111-0006-4000-8000-000000000006' UNION ALL
     SELECT 'c1111111-0007-4000-8000-000000000007') as g,
    (SELECT 'Original' as name, 0.00 as price UNION ALL
     SELECT 'Spicy' as name, 0.00 as price UNION ALL
     SELECT 'Tom Yam' as name, 0.00 as price UNION ALL
     SELECT 'Cheese' as name, 1.00 as price) as o
WHERE NOT EXISTS (SELECT 1 FROM modifier_options WHERE group_id = g.id AND name = o.name);

-- Popcorn Options (For Groups e1..e4)
INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) 
SELECT gen_random_uuid(), g.id, o.name, o.price, true
FROM 
    (SELECT 'e0000000-0001-4000-8000-000000000001' as id UNION ALL 
     SELECT 'e0000000-0002-4000-8000-000000000002' UNION ALL 
     SELECT 'e0000000-0003-4000-8000-000000000003' UNION ALL 
     SELECT 'e0000000-0004-4000-8000-000000000004') as g,
    (SELECT 'Original' as name, 0.00 as price UNION ALL
     SELECT 'Spicy' as name, 0.00 as price) as o
WHERE NOT EXISTS (SELECT 1 FROM modifier_options WHERE group_id = g.id AND name = o.name);

-- Drink Options (For Groups d1..d3)
INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) 
SELECT gen_random_uuid(), g.id, o.name, o.price, true
FROM 
    (SELECT 'd3333333-0001-4000-8000-000000000001' as id UNION ALL 
     SELECT 'd3333333-0002-4000-8000-000000000002' UNION ALL 
     SELECT 'd3333333-0003-4000-8000-000000000003') as g,
    (SELECT 'Pepsi' as name, 0.00 as price UNION ALL
     SELECT 'Coke' as name, 0.00 as price UNION ALL
     SELECT 'Mineral Water' as name, 0.00 as price) as o
WHERE NOT EXISTS (SELECT 1 FROM modifier_options WHERE group_id = g.id AND name = o.name);

-- Options for Sauce
INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) 
SELECT gen_random_uuid(), 'a0000000-0001-4000-8000-000000000001', name, 0.00, true
FROM (VALUES ('Black Pepper'), ('Cheese Sauce'), ('BBQ'), ('Chili')) AS t(name)
WHERE NOT EXISTS (SELECT 1 FROM modifier_options WHERE group_id = 'a0000000-0001-4000-8000-000000000001' AND name = t.name);


-- ============================================================================
-- 4. INSERT MENU ITEMS (UPDATED REQ)
-- ============================================================================

-- 1. Ayam Gunting Value Box
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Ayam Gunting Value Box', 'Combo', 10.90, 'Includes: 1x Ayam Gunting XXXL, 1x Enoki, 1x Popcorn, 1x Sauce', true, 'https://example.com/ayam-value-box.jpg', 
ARRAY[
    'c1111111-0001-4000-8000-000000000001'::uuid, -- Ayam 1
    'e0000000-0001-4000-8000-000000000001'::uuid, -- Popcorn 1
    'a0000000-0001-4000-8000-000000000001'::uuid  -- Sauce
]);

-- 2. Crunchy Duo Set
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Crunchy Duo Set', 'Combo', 10.90, 'Includes: 3pcs Tender, 1x Enoki, 1x Popcorn, 1x Sauce', true, 'https://example.com/crunchy-duo.jpg', 
ARRAY[
    'c1111111-0001-4000-8000-000000000001'::uuid, -- Tender (Ayam 1)
    'e0000000-0001-4000-8000-000000000001'::uuid, -- Popcorn 1
    'a0000000-0001-4000-8000-000000000001'::uuid  -- Sauce
]);

-- 3. Super Wrap Combo
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Super Wrap Combo', 'Combo', 4.90, 'Includes: 1x Chicken Wrap, 1x Crispy Enoki, 1x Sauce', true, 'https://example.com/wrap-combo.jpg', 
ARRAY[
    'a0000000-0001-4000-8000-000000000001'::uuid  -- Sauce
]);

-- 4. Popcorn Snack Combo
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Popcorn Snack Combo', 'Combo', 5.00, 'Includes: 1x Chicken Popcorn, 1x Crispy Chicken Skin, 1x Sauce', true, 'https://example.com/popcorn-combo.jpg', 
ARRAY[
    'e0000000-0001-4000-8000-000000000001'::uuid, -- Popcorn 1
    'a0000000-0001-4000-8000-000000000001'::uuid  -- Sauce
]);

-- 5. Burger Crispy XXL Meal (No Burger Flavor)
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Burger Crispy XXL Meal', 'Combo', 11.00, 'Includes: 1x Burger Crispy XXL, 1x Potato Bowl, 1x Sauce', true, 'https://example.com/burger-xxl.jpg', 
ARRAY[
    'a0000000-0001-4000-8000-000000000001'::uuid  -- Sauce
]);

-- 6. Potato Bowl Set
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Potato Bowl Set', 'Combo', 5.90, 'Includes: 1x Potato Bowl, 1x Chicken Popcorn', true, 'https://example.com/potato-set.jpg', 
ARRAY[
    'e0000000-0001-4000-8000-000000000001'::uuid -- Popcorn 1
]);

-- 7. Nashville Combo (Nashville 3pcs + Popcorn + Sauce)
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Nashville Combo', 'Combo', 14.00, 'Includes: 1x Nashville Cheese (3pcs), 1x Popcorn, 1x Sauce', true, 'https://example.com/nashville.jpg', 
ARRAY[
    'e0000000-0001-4000-8000-000000000001'::uuid, -- Popcorn 1
    'a0000000-0001-4000-8000-000000000001'::uuid  -- Sauce
]);

-- 8. Squad Bundle (5-7 Pax) - 3 Ayam, 2 Burger (No flavor), 3 Enoki (Std), 2 Potato (Std)
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Squad Bundle (5-7 Pax)', 'Party Set', 49.90, 'Includes: 3x Ayam, 2x Burger, 2x Potato, 3x Enoki', true, 'https://example.com/squad-bundle.jpg', 
ARRAY[
    'c1111111-0001-4000-8000-000000000001'::uuid, -- Ayam 1
    'c1111111-0002-4000-8000-000000000002'::uuid, -- Ayam 2
    'c1111111-0003-4000-8000-000000000003'::uuid, -- Ayam 3
    'a0000000-0001-4000-8000-000000000001'::uuid  -- Sauce
]);

-- 9. Party Box (10-14 Pax) - 5 Ayam, 5 Burger (No flavor), 1 Tender (Flavor?), 3 Enoki, 2 Potato, 2 Pepsi
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Party Box (10-14 Pax)', 'Party Set', 99.90, 'Includes: 5x Ayam, 5x Burger, 1x Tender (5pcs), 3x Enoki, 2x Potato, 2x Pepsi', true, 'https://example.com/party-box.jpg', 
ARRAY[
    'c1111111-0001-4000-8000-000000000001'::uuid, -- Ayam 1
    'c1111111-0002-4000-8000-000000000002'::uuid, -- Ayam 2
    'c1111111-0003-4000-8000-000000000003'::uuid, -- Ayam 3
    'c1111111-0004-4000-8000-000000000004'::uuid, -- Ayam 4
    'c1111111-0005-4000-8000-000000000005'::uuid, -- Ayam 5
    'c1111111-0006-4000-8000-000000000006'::uuid, -- Tender (Using Ayam 6 group)
    'd3333333-0001-4000-8000-000000000001'::uuid, -- Drink 1
    'd3333333-0002-4000-8000-000000000002'::uuid  -- Drink 2
]);

-- 10. Mega Celebration Box (18-25 Pax) - 7 Ayam, 5 Burger, 4 Popcorn, 4 Enoki, 3 Nashville, 3 Pepsi
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Mega Celebration Box (18-25 Pax)', 'Party Set', 149.90, 'Includes: 7x Ayam, 5x Burger, 4x Popcorn, 4x Enoki, 3x Nashville, 3x Pepsi', true, 'https://example.com/mega-box.jpg', 
ARRAY[
    'c1111111-0001-4000-8000-000000000001'::uuid, -- Ayam 1
    'c1111111-0002-4000-8000-000000000002'::uuid, -- Ayam 2
    'c1111111-0003-4000-8000-000000000003'::uuid, -- Ayam 3
    'c1111111-0004-4000-8000-000000000004'::uuid, -- Ayam 4
    'c1111111-0005-4000-8000-000000000005'::uuid, -- Ayam 5
    'c1111111-0006-4000-8000-000000000006'::uuid, -- Ayam 6
    'c1111111-0007-4000-8000-000000000007'::uuid, -- Ayam 7
    'e0000000-0001-4000-8000-000000000001'::uuid, -- Popcorn 1
    'e0000000-0002-4000-8000-000000000002'::uuid, -- Popcorn 2
    'e0000000-0003-4000-8000-000000000003'::uuid, -- Popcorn 3
    'e0000000-0004-4000-8000-000000000004'::uuid, -- Popcorn 4
    'd3333333-0001-4000-8000-000000000001'::uuid, -- Drink 1
    'd3333333-0002-4000-8000-000000000002'::uuid, -- Drink 2
    'd3333333-0003-4000-8000-000000000003'::uuid  -- Drink 3
]);
