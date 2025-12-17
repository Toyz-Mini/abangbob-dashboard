-- NEW/UPDATED MODIFIER GROUPS FOR COMBOS
-- Using valid UUIDs for referencing in Menu Items

-- UUID Constants used:
-- Chicken Flavour: 11111111-1111-4111-8111-111111111111
-- Popcorn Flavour: 22222222-2222-4222-8222-222222222222
-- Sauce Choice:    33333333-3333-4333-8333-333333333333
-- Drink Choice:    44444444-4444-4444-8444-444444444444
-- Party Chicken:   55555555-5555-4555-8555-555555555555

-- 1. Insert Modifier Groups
INSERT INTO modifier_groups (id, name, is_required, allow_multiple, min_selection, max_selection) VALUES
('11111111-1111-4111-8111-111111111111', 'Pilih Flavour Ayam', true, false, 1, 1),
('22222222-2222-4222-8222-222222222222', 'Pilih Flavour Popcorn', true, false, 1, 1),
('33333333-3333-4333-8333-333333333333', 'Pilih Sauce', true, false, 1, 1),
('44444444-4444-4444-8444-444444444444', 'Pilih Minuman', true, false, 1, 1),
('55555555-5555-4555-8555-555555555555', 'Pilih 3 Flavour Ayam', true, true, 3, 3)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Modifier Options (using gen_random_uuid() for IDs)

-- Options for Chicken Flavour
INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) VALUES
(gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'Original', 0.00, true),
(gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'Spicy', 0.00, true),
(gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'Tom Yam', 0.00, true),
(gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'Cheese', 0.00, true);

-- Options for Popcorn Flavour
INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) VALUES
(gen_random_uuid(), '22222222-2222-4222-8222-222222222222', 'Original', 0.00, true),
(gen_random_uuid(), '22222222-2222-4222-8222-222222222222', 'Spicy', 0.00, true);

-- Options for Sauce Choice
INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) VALUES
(gen_random_uuid(), '33333333-3333-4333-8333-333333333333', 'Chili Sauce', 0.00, true),
(gen_random_uuid(), '33333333-3333-4333-8333-333333333333', 'Cheese Sauce', 0.00, true),
(gen_random_uuid(), '33333333-3333-4333-8333-333333333333', 'Black Pepper', 0.00, true),
(gen_random_uuid(), '33333333-3333-4333-8333-333333333333', 'BBQ Sauce', 0.00, true);

-- Options for Drink Choice
INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) VALUES
(gen_random_uuid(), '44444444-4444-4444-8444-444444444444', 'Coke', 0.00, true),
(gen_random_uuid(), '44444444-4444-4444-8444-444444444444', 'Pepsi', 0.00, true),
(gen_random_uuid(), '44444444-4444-4444-8444-444444444444', 'Mineral Water', 0.00, true);

-- Options for Party Chicken Flavour
INSERT INTO modifier_options (id, group_id, name, extra_price, is_available) VALUES
(gen_random_uuid(), '55555555-5555-4555-8555-555555555555', 'Original', 0.00, true),
(gen_random_uuid(), '55555555-5555-4555-8555-555555555555', 'Spicy', 0.00, true),
(gen_random_uuid(), '55555555-5555-4555-8555-555555555555', 'Cheese', 0.00, true);


-- 3. MENU ITEMS: COMBOS (Small)
-- Using gen_random_uuid() for IDs and referencing the specific UUIDs above

INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Ayam Gunting Value Box', 'Combo', 10.90, '1x Ayam Gunting XXXL, 1x Crispy Enoki, 1x Chicken Popcorn, 1x Sauce', true, 'https://example.com/ayam-value-box.jpg', ARRAY['11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, '33333333-3333-4333-8333-333333333333'::uuid]),

(gen_random_uuid(), 'Super Wrap Combo', 'Combo', 4.90, '1x Chicken Wrap, 1x Crispy Enoki, 1x Sauce', true, 'https://example.com/wrap-combo.jpg', ARRAY['33333333-3333-4333-8333-333333333333'::uuid]),

(gen_random_uuid(), 'Crunchy Duo Set', 'Combo', 10.90, '1x Chicken Tender XL (3pcs), 1x Crispy Enoki, 1x Chicken Popcorn, 1x Sauce', true, 'https://example.com/crunchy-duo.jpg', ARRAY['11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, '33333333-3333-4333-8333-333333333333'::uuid]),

(gen_random_uuid(), 'Popcorn Snack Combo', 'Combo', 5.00, '1x Chicken Popcorn, 1x Crispy Chicken Skin, 1x Sauce', true, 'https://example.com/popcorn-combo.jpg', ARRAY['22222222-2222-4222-8222-222222222222'::uuid, '33333333-3333-4333-8333-333333333333'::uuid]),

(gen_random_uuid(), 'Burger Crispy XXL Meal', 'Combo', 11.00, '1x Burger Crispy XXL, 1x Potato Bowl, 1x Sauce', true, 'https://example.com/burger-xxl.jpg', ARRAY['33333333-3333-4333-8333-333333333333'::uuid]),

(gen_random_uuid(), 'Potato Bowl Set', 'Combo', 5.90, '1x Potato Bowl, 1x Chicken Popcorn', true, 'https://example.com/potato-set.jpg', ARRAY['22222222-2222-4222-8222-222222222222'::uuid]),

(gen_random_uuid(), 'Nashville Combo', 'Combo', 14.00, '1x Nashville Mozzarella Cheese (3pcs), 1x Chicken Popcorn, 1x Sauce', true, 'https://example.com/nashville.jpg', ARRAY['22222222-2222-4222-8222-222222222222'::uuid, '33333333-3333-4333-8333-333333333333'::uuid]);


-- 4. MENU ITEMS: PARTY SETS
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url, modifier_group_ids) VALUES
(gen_random_uuid(), 'Squad Bundle (5-7 Pax)', 'Party Set', 49.90, '3x Ayam Gunting, 2x Burger, 2x Potato Bowl, 3x Crispy Enoki', true, 'https://example.com/squad-bundle.jpg', ARRAY['55555555-5555-4555-8555-555555555555'::uuid, '33333333-3333-4333-8333-333333333333'::uuid]),

(gen_random_uuid(), 'Party Box (10-14 Pax)', 'Party Set', 99.90, '5x Burger, 5x Ayam Gunting, 1x Tender (5pcs), 3x Enoki, 2x Potato Bowl, 2x Pepsi', true, 'https://example.com/party-box.jpg', ARRAY['55555555-5555-4555-8555-555555555555'::uuid, '33333333-3333-4333-8333-333333333333'::uuid]),

(gen_random_uuid(), 'Mega Celebration Box (18-25 Pax)', 'Party Set', 149.90, '7x Ayam Gunting, 5x Burger, 4x Popcorn, 4x Enoki, 3x Nashville, 2x Tender (6pcs), 3x Pepsi', true, 'https://example.com/mega-box.jpg', ARRAY['55555555-5555-4555-8555-555555555555'::uuid, '33333333-3333-4333-8333-333333333333'::uuid]);
