-- Seed file for Combo and Party Sets Menu Items
-- Generated based on user request and image

-- Insert new categories first to ensure they exist (though schema allows text, good practice)
INSERT INTO menu_categories (id, name, description, icon, color, sort_order, is_active)
VALUES 
    ('cat_combo', 'Combo', 'Value combos and sets', '🍱', '#ec4899', 6, true),
    ('cat_party', 'Party Sets', 'Large sets for groups', '🎉', '#8b5cf6', 7, true)
ON CONFLICT (name) DO NOTHING;

-- Insert new menu items
INSERT INTO menu_items (id, name, category, price, description, is_available, image_url)
VALUES
    -- Combo Category
    ('20', 'Ayam Gunting Value Box', 'Combo', 10.90, '1x Ayam Gunting XXXL, 1x Chicken Popcorn, 1x Crispy Enoki, 1x Sauce', true, NULL),
    ('21', 'Super Wrap Combo', 'Combo', 4.90, '1x Chicken Wrap, 1x Crispy Enoki, 1x Sauce', true, NULL),
    ('22', 'Crunchy Duo Set', 'Combo', 10.90, '1x Chicken Tender XL (3 pcs), 1x Crispy Enoki, 1x Chicken Popcorn, 1x Sauce', true, NULL),
    ('23', 'Popcorn Snack Combo', 'Combo', 5.00, '1x Chicken Popcorn, 1x Crispy Chicken Skin, 1x Sauce', true, NULL),
    ('24', 'Burger Crispy XXL Meal', 'Combo', 11.00, '1x Burger Crispy XXL, 1x Potato Bowl, 1x Sauce', true, NULL),
    ('25', 'Potato Bowl Set', 'Combo', 5.90, '1x Potato Bowl, 1x Chicken Popcorn', true, NULL),
    ('26', 'Nashville Combo', 'Combo', 14.00, '1x Nashville Mozzarella Cheese (3 pcs), 1x Chicken Popcorn, 1x Sauce', true, NULL),

    -- Party Sets Category
    ('27', 'Squad Bundle (5-7 Pax)', 'Party Sets', 49.90, '3x Ayam Gunting XXXL, 2x Burger Crispy XXL, 2x Potato Bowl, 3x Crispy Enoki', true, NULL),
    ('28', 'Party Box (10-14 Pax)', 'Party Sets', 99.90, '5x Burger Crispy XXL, 5x Ayam Gunting XXXL, 5x Chicken Tender XL (3pcs), 3x Crispy Chicken Wrap, 3x Potato Bowl, 2x Pepsi (1.5L Bottle)', true, NULL),
    ('29', 'Mega Celebration Box (18-25 Pax)', 'Party Sets', 149.90, '7x Ayam Gunting XXXL, 5x Burger Crispy XXL, 4x Chicken Popcorn, 4x Crispy Enoki, 3x Nashville Mozzarella Cheese (3pcs), 3x Chicken Tender XL (6pcs), 3x Pepsi (1.5L Bottle)', true, NULL)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    description = EXCLUDED.description,
    is_available = EXCLUDED.is_available;
