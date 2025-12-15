-- AbangBob Dashboard - Seed Production Logs Data
-- Run this SQL in Supabase SQL Editor
-- Based on REPORTS spreadsheet - Production sheet

-- ========================================
-- STAFF IDs REFERENCE
-- ========================================
-- Bella (Manager): c1000000-0000-0000-0000-000000000001
-- Atoy (Supervisor): c1000000-0000-0000-0000-000000000002
-- Rina: c1000000-0000-0000-0000-000000000003
-- Pijol: c1000000-0000-0000-0000-000000000004
-- Shahirul: c1000000-0000-0000-0000-000000000005

-- ========================================
-- OUTLET ID REFERENCE
-- ========================================
-- Rimba Point: b1000000-0000-0000-0000-000000000001

-- ========================================
-- PRODUCTION LOGS (December 2024)
-- Based on Production sheet columns:
-- DATE, ITEM NAME, UNIT, STARTING BALANCE, ADD, TOTAL, FINAL BALANCE, REMARKS
-- ========================================

INSERT INTO public.production_logs (menu_item_name, quantity_produced, batch_number, produced_by, produced_by_name, notes, created_at, outlet_id)
VALUES
  -- Week 1: Dec 1-7, 2024
  ('Fried Chicken Drumstick', 50, 'BATCH-20241201-001', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Morning batch - Regular operation', '2024-12-01 08:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 40, 'BATCH-20241201-002', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Morning batch', '2024-12-01 08:45:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Chicken Skin Crispy', 20, 'BATCH-20241201-003', 'c1000000-0000-0000-0000-000000000004', 'Pijol', 'Snack item', '2024-12-01 10:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  ('Fried Chicken Drumstick', 45, 'BATCH-20241202-001', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Morning batch', '2024-12-02 08:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 35, 'BATCH-20241202-002', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Morning batch', '2024-12-02 08:45:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Wings', 30, 'BATCH-20241202-003', 'c1000000-0000-0000-0000-000000000004', 'Pijol', 'Afternoon batch', '2024-12-02 14:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  ('Fried Chicken Drumstick', 55, 'BATCH-20241203-001', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Extra batch for demand', '2024-12-03 08:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 45, 'BATCH-20241203-002', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Afternoon shift', '2024-12-03 14:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  -- Dec 4 - Bella OFF
  ('Fried Chicken Drumstick', 60, 'BATCH-20241204-001', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Full day operation', '2024-12-04 08:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 50, 'BATCH-20241204-002', 'c1000000-0000-0000-0000-000000000004', 'Pijol', 'PM shift production', '2024-12-04 14:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Chicken Skin Crispy', 25, 'BATCH-20241204-003', 'c1000000-0000-0000-0000-000000000004', 'Pijol', 'Snack batch', '2024-12-04 16:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  -- Dec 5-7 - Setia Point Event
  ('Fried Chicken Drumstick', 80, 'BATCH-20241205-001', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Event prep - Setia Point', '2024-12-05 07:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 70, 'BATCH-20241205-002', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Event prep - Setia Point', '2024-12-05 07:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Wings', 50, 'BATCH-20241205-003', 'c1000000-0000-0000-0000-000000000004', 'Pijol', 'Event stock', '2024-12-05 10:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  ('Fried Chicken Drumstick', 75, 'BATCH-20241206-001', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Friday peak - Event', '2024-12-06 07:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 65, 'BATCH-20241206-002', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Friday peak - Event', '2024-12-06 07:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  ('Fried Chicken Drumstick', 90, 'BATCH-20241207-001', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Saturday peak - Last day Setia Point', '2024-12-07 07:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 80, 'BATCH-20241207-002', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Saturday peak', '2024-12-07 07:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  -- Week 2: Dec 8-14 - Dewan Muhibbah & Indoor Stadium Events
  ('Fried Chicken Drumstick', 100, 'BATCH-20241208-001', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Dewan Muhibbah Event', '2024-12-08 06:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 85, 'BATCH-20241208-002', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Dewan Muhibbah Event', '2024-12-08 07:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Chicken Skin Crispy', 40, 'BATCH-20241208-003', 'c1000000-0000-0000-0000-000000000004', 'Pijol', 'Event special', '2024-12-08 09:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  ('Fried Chicken Drumstick', 85, 'BATCH-20241209-001', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Regular + Event', '2024-12-09 07:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 70, 'BATCH-20241209-002', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Regular + Event', '2024-12-09 07:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  ('Fried Chicken Drumstick', 65, 'BATCH-20241210-001', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Morning batch', '2024-12-10 08:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 55, 'BATCH-20241210-002', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Full day', '2024-12-10 08:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  ('Fried Chicken Drumstick', 80, 'BATCH-20241211-001', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Dewan Muhibbah prep', '2024-12-11 06:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 70, 'BATCH-20241211-002', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'PM shift', '2024-12-11 14:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  -- Dec 12-14 - Indoor Stadium (Booth 73)
  ('Fried Chicken Drumstick', 95, 'BATCH-20241212-001', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Indoor Stadium Event start', '2024-12-12 07:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 80, 'BATCH-20241212-002', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Event production', '2024-12-12 07:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Wings', 60, 'BATCH-20241212-003', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Event wings', '2024-12-12 15:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  ('Fried Chicken Drumstick', 90, 'BATCH-20241213-001', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Friday Stadium event', '2024-12-13 07:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 75, 'BATCH-20241213-002', 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'Friday peak', '2024-12-13 07:30:00+08', 'b1000000-0000-0000-0000-000000000001'),
  
  ('Fried Chicken Drumstick', 100, 'BATCH-20241214-001', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Saturday peak - Stadium', '2024-12-14 07:00:00+08', 'b1000000-0000-0000-0000-000000000001'),
  ('Fried Chicken Thigh', 85, 'BATCH-20241214-002', 'c1000000-0000-0000-0000-000000000001', 'Bella', 'Saturday peak', '2024-12-14 07:30:00+08', 'b1000000-0000-0000-0000-000000000001');

-- ========================================
-- FLOUR USAGE TRACKING (Penggunaan Tepung)
-- This goes into production_logs with ingredients_used
-- ========================================

-- Update production logs with ingredients used (flour)
UPDATE public.production_logs 
SET ingredients_used = '[{"item": "Tepung Asli", "quantity": 2.5, "unit": "kg"}, {"item": "Tepung Spicy", "quantity": 1.5, "unit": "kg"}]'::jsonb
WHERE batch_number LIKE 'BATCH-202412%' AND menu_item_name = 'Fried Chicken Drumstick';

UPDATE public.production_logs 
SET ingredients_used = '[{"item": "Tepung Asli", "quantity": 2.0, "unit": "kg"}, {"item": "Tepung Spicy", "quantity": 1.2, "unit": "kg"}]'::jsonb
WHERE batch_number LIKE 'BATCH-202412%' AND menu_item_name = 'Fried Chicken Thigh';

UPDATE public.production_logs 
SET ingredients_used = '[{"item": "Tepung Asli", "quantity": 1.5, "unit": "kg"}, {"item": "Tepung Spicy", "quantity": 1.0, "unit": "kg"}]'::jsonb
WHERE batch_number LIKE 'BATCH-202412%' AND menu_item_name = 'Fried Chicken Wings';

UPDATE public.production_logs 
SET ingredients_used = '[{"item": "Tepung Asli", "quantity": 0.8, "unit": "kg"}]'::jsonb
WHERE batch_number LIKE 'BATCH-202412%' AND menu_item_name = 'Chicken Skin Crispy';

-- Done! Production logs seeded successfully.
