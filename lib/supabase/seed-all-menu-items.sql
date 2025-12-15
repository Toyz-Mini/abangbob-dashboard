-- ========================================
-- SEED ALACART MENU ITEMS ONLY
-- ========================================
-- Run this to add all Alacart items to Supabase

-- First, delete existing items to avoid duplicates
DELETE FROM public.menu_items;

-- Seed Alacart menu items only (from your menu image)
INSERT INTO public.menu_items (name, category, description, price, is_available) VALUES
('Chicken Tender XL', 'Alacart', 'Crispy chicken tenders with free garlic mayo sauce (3pcs $5.80, 5pcs $9.90)', 5.80, true),
('Crispy Chicken Wrap', 'Alacart', 'Crispy chicken wrap with fresh vegetables', 2.90, true),
('Crispy Chicken Skin', 'Alacart', 'Crispy fried chicken skin (Original/Spicy)', 2.00, true),
('Ayam Gunting XXXL', 'Alacart', 'Extra large crispy fried chicken (Original/Spicy)', 5.90, true),
('Burger Crispy XXL', 'Alacart', 'Extra large crispy chicken burger with cheese', 7.90, true),
('Chicken Popcorn', 'Alacart', 'Bite-sized crispy chicken popcorn (Original/Spicy)', 3.50, true),
('Crispy Enoki', 'Alacart', 'Crispy fried enoki mushrooms (Original/Spicy)', 2.00, true),
('Potato Bowl', 'Alacart', 'NEW! Creamy potato bowl with special mayo topping', 3.50, true),
('Nashville Mozzarella Cheese', 'Alacart', 'Crispy Nashville-style mozzarella cheese sticks (1pc $3.90, 3pcs $10.90)', 3.90, true);

-- Done! All Alacart items seeded
SELECT COUNT(*) as total_items, 'Alacart menu items seeded successfully!' as result FROM public.menu_items;

