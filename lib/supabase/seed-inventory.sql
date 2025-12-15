-- AbangBob Dashboard - Seed Inventory Data
-- Run this SQL in Supabase SQL Editor after all tables are created
-- Based on REPORTS spreadsheet data - Stock In, Raw Dec, Packaging, Wansing Stock

-- ========================================
-- RIMBA POINT OUTLET ID REFERENCE
-- ========================================
-- Rimba Point: b1000000-0000-0000-0000-000000000001

-- ========================================
-- INVENTORY ITEMS (Main Stock)
-- Based on Stock In & Raw Dec sheets
-- ========================================

-- First, clear existing inventory data (optional - comment out if needed)
-- DELETE FROM public.inventory WHERE outlet_id = 'b1000000-0000-0000-0000-000000000001';

-- Insert Raw Materials
INSERT INTO public.inventory (id, name, sku, category, unit, quantity, min_quantity, max_quantity, cost_price, supplier, outlet_id)
VALUES
  -- CHICKEN & MEAT
  ('e1000000-0000-0000-0000-000000000001', 'Ayam Drumstick', 'RAW-001', 'raw_materials', 'kg', 45, 20, 100, 12.50, 'Ayamas Fresh', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000002', 'Ayam Thigh', 'RAW-002', 'raw_materials', 'kg', 38, 15, 80, 13.00, 'Ayamas Fresh', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000003', 'Chicken Skin', 'RAW-003', 'raw_materials', 'kg', 12, 5, 30, 8.00, 'Ayamas Fresh', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000004', 'Chicken Wings', 'RAW-004', 'raw_materials', 'kg', 25, 10, 50, 14.50, 'Ayamas Fresh', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000005', 'Whole Chicken', 'RAW-005', 'raw_materials', 'pcs', 20, 10, 40, 18.00, 'Ayamas Fresh', 'b1000000-0000-0000-0000-000000000001'),
  
  -- FLOUR & DRY GOODS
  ('e1000000-0000-0000-0000-000000000010', 'Tepung Asli (Original Flour)', 'FLR-001', 'dry_goods', 'kg', 85, 30, 150, 3.50, 'Zuis Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000011', 'Tepung Spicy', 'FLR-002', 'dry_goods', 'kg', 65, 25, 120, 4.00, 'Zuis Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000012', 'Tepung Goreng Ayam', 'FLR-003', 'dry_goods', 'kg', 40, 20, 80, 4.50, 'Zuis Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000013', 'Breadcrumbs', 'FLR-004', 'dry_goods', 'kg', 15, 10, 40, 6.00, 'Zuis Supplier', 'b1000000-0000-0000-0000-000000000001'),
  
  -- COOKING OIL
  ('e1000000-0000-0000-0000-000000000020', 'Minyak Masak (Cooking Oil)', 'OIL-001', 'cooking_oil', 'litre', 120, 50, 200, 4.50, 'Zuis Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000021', 'Minyak Sawit (Palm Oil)', 'OIL-002', 'cooking_oil', 'litre', 80, 30, 150, 4.00, 'Zuis Supplier', 'b1000000-0000-0000-0000-000000000001'),
  
  -- SAUCES & CONDIMENTS
  ('e1000000-0000-0000-0000-000000000030', 'Sos Cili', 'SAU-001', 'condiments', 'bottle', 24, 12, 48, 5.50, 'Zuis Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000031', 'Sos Tomato', 'SAU-002', 'condiments', 'bottle', 18, 10, 36, 4.50, 'Zuis Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000032', 'Mayonnaise', 'SAU-003', 'condiments', 'bottle', 12, 6, 24, 8.00, 'Zuis Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000033', 'Sambal', 'SAU-004', 'condiments', 'bottle', 20, 10, 40, 6.00, 'In-house', 'b1000000-0000-0000-0000-000000000001'),
  
  -- VEGETABLES
  ('e1000000-0000-0000-0000-000000000040', 'Coleslaw Mix', 'VEG-001', 'vegetables', 'kg', 8, 5, 20, 12.00, 'Fresh Market', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000041', 'Cucumber', 'VEG-002', 'vegetables', 'kg', 5, 3, 15, 4.00, 'Fresh Market', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000042', 'Lettuce', 'VEG-003', 'vegetables', 'kg', 3, 2, 10, 8.00, 'Fresh Market', 'b1000000-0000-0000-0000-000000000001'),
  
  -- DRINKS
  ('e1000000-0000-0000-0000-000000000050', 'Coca-Cola (Can)', 'DRK-001', 'beverages', 'can', 144, 48, 288, 1.80, 'Coca-Cola Distributor', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000051', 'Sprite (Can)', 'DRK-002', 'beverages', 'can', 96, 36, 192, 1.80, 'Coca-Cola Distributor', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000052', 'Mineral Water', 'DRK-003', 'beverages', 'bottle', 120, 48, 240, 0.80, 'Spritzer', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000053', 'Milo', 'DRK-004', 'beverages', 'kg', 5, 2, 10, 25.00, 'Nestle', 'b1000000-0000-0000-0000-000000000001'),
  
  -- PACKAGING (Based on Packaging sheet)
  ('e1000000-0000-0000-0000-000000000060', 'Box 2pcs', 'PKG-001', 'packaging', 'pcs', 500, 200, 1000, 0.35, 'Box Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000061', 'Box 5pcs', 'PKG-002', 'packaging', 'pcs', 400, 150, 800, 0.50, 'Box Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000062', 'Box 10pcs', 'PKG-003', 'packaging', 'pcs', 300, 100, 600, 0.75, 'Box Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000063', 'Paper Bag Small', 'PKG-004', 'packaging', 'pcs', 800, 300, 1500, 0.15, 'Box Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000064', 'Paper Bag Large', 'PKG-005', 'packaging', 'pcs', 600, 200, 1200, 0.25, 'Box Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000065', 'Plastic Bag', 'PKG-006', 'packaging', 'pcs', 1000, 400, 2000, 0.08, 'Box Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000066', 'Cup 12oz', 'PKG-007', 'packaging', 'pcs', 400, 150, 800, 0.20, 'Cup Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000067', 'Cup Lid', 'PKG-008', 'packaging', 'pcs', 400, 150, 800, 0.10, 'Cup Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000068', 'Straw', 'PKG-009', 'packaging', 'pcs', 1000, 500, 2000, 0.03, 'Cup Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000069', 'Napkin', 'PKG-010', 'packaging', 'pcs', 2000, 800, 4000, 0.02, 'Paper Supplier', 'b1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000070', 'Tissue Box', 'PKG-011', 'packaging', 'box', 50, 20, 100, 2.50, 'Paper Supplier', 'b1000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  cost_price = EXCLUDED.cost_price,
  updated_at = NOW();

-- ========================================
-- INVENTORY LOGS (Stock In records from December 2024)
-- Based on Stock In sheet
-- ========================================

INSERT INTO public.inventory_logs (stock_item_id, stock_item_name, type, quantity, previous_quantity, new_quantity, reason, created_at)
VALUES
  -- December 2024 Stock In records
  ('e1000000-0000-0000-0000-000000000001', 'Ayam Drumstick', 'in', 20, 25, 45, 'Delivery from Ayamas Fresh', '2024-12-01 08:00:00+08'),
  ('e1000000-0000-0000-0000-000000000002', 'Ayam Thigh', 'in', 15, 23, 38, 'Delivery from Ayamas Fresh', '2024-12-01 08:00:00+08'),
  ('e1000000-0000-0000-0000-000000000010', 'Tepung Asli (Original Flour)', 'in', 30, 55, 85, 'Delivery from Zuis', '2024-12-02 09:30:00+08'),
  ('e1000000-0000-0000-0000-000000000011', 'Tepung Spicy', 'in', 25, 40, 65, 'Delivery from Zuis', '2024-12-02 09:30:00+08'),
  ('e1000000-0000-0000-0000-000000000020', 'Minyak Masak (Cooking Oil)', 'in', 50, 70, 120, 'Weekly oil delivery', '2024-12-03 10:00:00+08'),
  ('e1000000-0000-0000-0000-000000000060', 'Box 2pcs', 'in', 200, 300, 500, 'Packaging restock', '2024-12-04 11:00:00+08'),
  ('e1000000-0000-0000-0000-000000000061', 'Box 5pcs', 'in', 150, 250, 400, 'Packaging restock', '2024-12-04 11:00:00+08'),
  ('e1000000-0000-0000-0000-000000000050', 'Coca-Cola (Can)', 'in', 72, 72, 144, 'Drink restock', '2024-12-05 09:00:00+08'),
  ('e1000000-0000-0000-0000-000000000001', 'Ayam Drumstick', 'in', 25, 20, 45, 'Mid-week restock', '2024-12-08 08:30:00+08'),
  ('e1000000-0000-0000-0000-000000000003', 'Chicken Skin', 'in', 10, 2, 12, 'Delivery from Ayamas Fresh', '2024-12-08 08:30:00+08'),
  ('e1000000-0000-0000-0000-000000000010', 'Tepung Asli (Original Flour)', 'in', 40, 45, 85, 'Event preparation - Dewan Muhibbah', '2024-12-10 08:00:00+08'),
  ('e1000000-0000-0000-0000-000000000011', 'Tepung Spicy', 'in', 30, 35, 65, 'Event preparation - Dewan Muhibbah', '2024-12-10 08:00:00+08'),
  ('e1000000-0000-0000-0000-000000000020', 'Minyak Masak (Cooking Oil)', 'in', 60, 60, 120, 'Event preparation', '2024-12-11 09:00:00+08'),
  ('e1000000-0000-0000-0000-000000000001', 'Ayam Drumstick', 'in', 30, 15, 45, 'Weekend preparation', '2024-12-13 08:00:00+08'),
  ('e1000000-0000-0000-0000-000000000002', 'Ayam Thigh', 'in', 20, 18, 38, 'Weekend preparation', '2024-12-13 08:00:00+08');

-- Done! Inventory and stock logs seeded successfully.
