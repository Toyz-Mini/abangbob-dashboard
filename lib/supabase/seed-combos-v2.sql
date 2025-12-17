-- CLEANUP: Remove existing assignments to avoid duplicates
DELETE FROM menu_items WHERE category IN ('Combo', 'Party Set');

-- NOTE: We are NOT deleting modifier groups to avoid breaking other things, 
-- but we will insert NEW granular groups with specific UUIDs.

-- ============================================================================
-- MODIFIER GROUPS (GRANULAR / ONE-BY-ONE)
-- We need distinct groups for "Ayam 1", "Ayam 2", etc. to force detailed selection.
-- ============================================================================

-- VALID HEX CHARACTERS: 0-9, a-f
-- Replaced 's' with 'a' (Sauce), 'p' with 'e' (Popcorn/Extra)

-- 1. CHICKEN FLAVOR GROUPS (Up to 7 for Mega Box)
INSERT INTO modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection) VALUES
('c1111111-0001-4000-8000-000000000001', 'Pilih Flavour Ayam 1', true, false, 1, 1),
('c1111111-0002-4000-8000-000000000002', 'Pilih Flavour Ayam 2', true, false, 1, 1),
('c1111111-0003-4000-8000-000000000003', 'Pilih Flavour Ayam 3', true, false, 1, 1),
('c1111111-0004-4000-8000-000000000004', 'Pilih Flavour Ayam 4', true, false, 1, 1),
('c1111111-0005-4000-8000-000000000005', 'Pilih Flavour Ayam 5', true, false, 1, 1),
('c1111111-0006-4000-8000-000000000006', 'Pilih Flavour Ayam 6', true, false, 1, 1),
('c1111111-0007-4000-8000-000000000007', 'Pilih Flavour Ayam 7', true, false, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Options for ALL Chicken Groups (Original, Spicy, Cheese, Tom Yam)
-- We must insert options for EACH group ID.
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
     SELECT 'Cheese' as name, 1.00 as price) as o;


-- 2. BURGER FLAVOR GROUPS (Up to 5)
INSERT INTO modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection) VALUES
('b2222222-0001-4000-8000-000000000001', 'Pilih Flavour Burger 1', true, false, 1, 1),
('b2222222-0002-4000-8000-000000000002', 'Pilih Flavour Burger 2', true, false, 1, 1),
('b2222222-0003-4000-8000-000000000003', 'Pilih Flavour Burger 3', true, false, 1, 1),
('b2222222-0004-4000-8000-000000000004', 'Pilih Flavour Burger 4', true, false, 1, 1),
('b2222222-0005-4000-8000-000000000005', 'Pilih Flavour Burger 5', true, false, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Options for Burgers
INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) 
SELECT gen_random_uuid(), g.id, o.name, o.price, true
FROM 
    (SELECT 'b2222222-0001-4000-8000-000000000001' as id UNION ALL 
     SELECT 'b2222222-0002-4000-8000-000000000002' UNION ALL 
     SELECT 'b2222222-0003-4000-8000-000000000003' UNION ALL
     SELECT 'b2222222-0004-4000-8000-000000000004' UNION ALL 
     SELECT 'b2222222-0005-4000-8000-000000000005') as g,
    (SELECT 'Crispy Original' as name, 0.00 as price UNION ALL
     SELECT 'Crispy Spicy' as name, 0.00 as price) as o;


-- 3. DRINK CHOICE GROUPS (Up to 3)
INSERT INTO modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection) VALUES
('d3333333-0001-4000-8000-000000000001', 'Pilih Minuman 1', true, false, 1, 1),
('d3333333-0002-4000-8000-000000000002', 'Pilih Minuman 2', true, false, 1, 1),
('d3333333-0003-4000-8000-000000000003', 'Pilih Minuman 3', true, false, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Options for Drinks
INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) 
SELECT gen_random_uuid(), g.id, o.name, o.price, true
FROM 
    (SELECT 'd3333333-0001-4000-8000-000000000001' as id UNION ALL 
     SELECT 'd3333333-0002-4000-8000-000000000002' UNION ALL 
     SELECT 'd3333333-0003-4000-8000-000000000003') as g,
    (SELECT 'Pepsi' as name, 0.00 as price UNION ALL
     SELECT 'Coke' as name, 0.00 as price UNION ALL
     SELECT 'Mineral Water' as name, 0.00 as price) as o;


-- 4. BASIC COMBOS (Small) - Reuse generic single groups if needed, or define new ones. 
-- For simplicity, we create specific single ones to ensure no conflict.

-- REPLACED 's' (invalid hex) with 'a' (valid hex)
INSERT INTO modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection) VALUES
('a0000000-0001-4000-8000-000000000001', 'Pilih Sauce', true, false, 1, 1),
('e0000000-0001-4000-8000-000000000001', 'Pilih Flavour Popcorn', true, false, 1, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) VALUES
(gen_random_uuid(), 'a0000000-0001-4000-8000-000000000001', 'Black Pepper', 0.00, true),
(gen_random_uuid(), 'a0000000-0001-4000-8000-000000000001', 'Cheese Sauce', 0.00, true),
(gen_random_uuid(), 'a0000000-0001-4000-8000-000000000001', 'BBQ', 0.00, true),
(gen_random_uuid(), 'a0000000-0001-4000-8000-000000000001', 'Chili', 0.00, true);

INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) VALUES
(gen_random_uuid(), 'e0000000-0001-4000-8000-000000000001', 'Popcorn Original', 0.00, true),
(gen_random_uuid(), 'e0000000-0001-4000-8000-000000000001', 'Popcorn Spicy', 0.00, true);


-- ============================================================================
-- INSERT MENU ITEMS WITH GRANULAR MODIFIERS
-- ============================================================================

-- 1. Ayam Gunting Value Box (Ayam Gunting XXXL, Popcorn, Sauce)
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Ayam Gunting Value Box', 'Combo', 10.90, 'Includes: 1x Ayam Gunting XXXL, 1x Enoki, 1x Popcorn, 1x Sauce', true, 'https://example.com/ayam-value-box.jpg', 
ARRAY[
    'c1111111-0001-4000-8000-000000000001'::uuid, -- Ayam 1
    'e0000000-0001-4000-8000-000000000001'::uuid, -- Popcorn
    'a0000000-0001-4000-8000-000000000001'::uuid  -- Sauce
]);

-- 2. Crunchy Duo Set (3pcs Tender, Popcorn, Sauce)
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Crunchy Duo Set', 'Combo', 10.90, 'Includes: 3pcs Tender, 1x Enoki, 1x Popcorn, 1x Sauce', true, 'https://example.com/crunchy-duo.jpg', 
ARRAY[
    'c1111111-0001-4000-8000-000000000001'::uuid, -- Tender (using Ayam group for flavor)
    'e0000000-0001-4000-8000-000000000001'::uuid, -- Popcorn
    'a0000000-0001-4000-8000-000000000001'::uuid  -- Sauce
]);

-- 3. Squad Bundle (5-7 Pax) - 3 Ayam, 2 Burger
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Squad Bundle (5-7 Pax)', 'Party Set', 49.90, 'Includes: 3x Ayam, 2x Burger, 2x Potato, 3x Enoki', true, 'https://example.com/squad-bundle.jpg', 
ARRAY[
    'c1111111-0001-4000-8000-000000000001'::uuid, -- Ayam 1
    'c1111111-0002-4000-8000-000000000002'::uuid, -- Ayam 2
    'c1111111-0003-4000-8000-000000000003'::uuid, -- Ayam 3
    'b2222222-0001-4000-8000-000000000001'::uuid, -- Burger 1
    'b2222222-0002-4000-8000-000000000002'::uuid, -- Burger 2
    'a0000000-0001-4000-8000-000000000001'::uuid  -- Sauce
]);

-- 4. Party Box (10-14 Pax) - 5 Ayam, 5 Burger, 2 Pepsi (partial list for brevty, mapped mapped max available)
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Party Box (10-14 Pax)', 'Party Set', 99.90, 'Includes: 5x Ayam, 5x Burger, 1x Tender, 3x Enoki, 2x Potato, 2x Pepsi', true, 'https://example.com/party-box.jpg', 
ARRAY[
    'c1111111-0001-4000-8000-000000000001'::uuid, -- Ayam 1
    'c1111111-0002-4000-8000-000000000002'::uuid, -- Ayam 2
    'c1111111-0003-4000-8000-000000000003'::uuid, -- Ayam 3
    'c1111111-0004-4000-8000-000000000004'::uuid, -- Ayam 4
    'c1111111-0005-4000-8000-000000000005'::uuid, -- Ayam 5
    'b2222222-0001-4000-8000-000000000001'::uuid, -- Burger 1
    'b2222222-0002-4000-8000-000000000002'::uuid, -- Burger 2
    'b2222222-0003-4000-8000-000000000003'::uuid, -- Burger 3
    'b2222222-0004-4000-8000-000000000004'::uuid, -- Burger 4
    'b2222222-0005-4000-8000-000000000005'::uuid, -- Burger 5
    'd3333333-0001-4000-8000-000000000001'::uuid, -- Drink 1
    'd3333333-0002-4000-8000-000000000002'::uuid  -- Drink 2
]);

-- 5. Mega Celebration Box (18-25 Pax) - 7 Ayam, 5 Burger, 3 Pepsi
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Mega Celebration Box (18-25 Pax)', 'Party Set', 149.90, 'Includes: 7x Ayam, 5x Burger, 4x Popcorn, 4x Enoki, 3x Nashville, 3x Pepsi', true, 'https://example.com/mega-box.jpg', 
ARRAY[
    'c1111111-0001-4000-8000-000000000001'::uuid, -- Ayam 1
    'c1111111-0002-4000-8000-000000000002'::uuid, -- Ayam 2
    'c1111111-0003-4000-8000-000000000003'::uuid, -- Ayam 3
    'c1111111-0004-4000-8000-000000000004'::uuid, -- Ayam 4
    'c1111111-0005-4000-8000-000000000005'::uuid, -- Ayam 5
    'c1111111-0006-4000-8000-000000000006'::uuid, -- Ayam 6 (Mega)
    'c1111111-0007-4000-8000-000000000007'::uuid, -- Ayam 7 (Mega)
    'b2222222-0001-4000-8000-000000000001'::uuid, -- Burger 1
    'b2222222-0002-4000-8000-000000000002'::uuid, -- Burger 2
    'b2222222-0003-4000-8000-000000000003'::uuid, -- Burger 3
    'b2222222-0004-4000-8000-000000000004'::uuid, -- Burger 4
    'b2222222-0005-4000-8000-000000000005'::uuid, -- Burger 5
    'd3333333-0001-4000-8000-000000000001'::uuid, -- Drink 1
    'd3333333-0002-4000-8000-000000000002'::uuid, -- Drink 2
    'd3333333-0003-4000-8000-000000000003'::uuid  -- Drink 3
]);
