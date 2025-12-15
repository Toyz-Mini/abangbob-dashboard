-- AbangBob Dashboard - Seed Oil Tracking Data
-- Run this SQL in Supabase SQL Editor
-- Based on REPORTS spreadsheet - Oil Changing sheet

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
-- OIL TRACKERS (Fryer Setup)
-- Based on Oil Changing sheet - FRYER NO column
-- ========================================

INSERT INTO public.oil_trackers (fryer_id, fryer_name, location, oil_type, capacity_liters, current_oil_level, last_full_change, total_frying_hours, hours_since_change, status, outlet_id)
VALUES
  ('FRYER-RP-01', 'Fryer 1 (Main)', 'Rimba Point - Kitchen', 'Palm Oil', 15.0, 85, '2024-12-10 08:00:00+08', 850, 45, 'good', 'b1000000-0000-0000-0000-000000000001'),
  ('FRYER-RP-02', 'Fryer 2 (Backup)', 'Rimba Point - Kitchen', 'Palm Oil', 15.0, 70, '2024-12-08 08:00:00+08', 720, 72, 'warning', 'b1000000-0000-0000-0000-000000000001'),
  ('FRYER-RP-03', 'Fryer 3 (Wings)', 'Rimba Point - Kitchen', 'Palm Oil', 10.0, 95, '2024-12-12 08:00:00+08', 480, 24, 'good', 'b1000000-0000-0000-0000-000000000001'),
  ('FRYER-RP-04', 'Fryer 4 (Skin/Snack)', 'Rimba Point - Kitchen', 'Palm Oil', 8.0, 60, '2024-12-06 08:00:00+08', 560, 96, 'critical', 'b1000000-0000-0000-0000-000000000001'),
  ('FRYER-EVENT-01', 'Event Fryer 1', 'Mobile/Event', 'Palm Oil', 12.0, 100, '2024-12-14 07:00:00+08', 120, 8, 'good', 'b1000000-0000-0000-0000-000000000001'),
  ('FRYER-EVENT-02', 'Event Fryer 2', 'Mobile/Event', 'Palm Oil', 12.0, 90, '2024-12-13 07:00:00+08', 150, 16, 'good', 'b1000000-0000-0000-0000-000000000001')
ON CONFLICT (fryer_id) DO UPDATE SET
  current_oil_level = EXCLUDED.current_oil_level,
  last_full_change = EXCLUDED.last_full_change,
  hours_since_change = EXCLUDED.hours_since_change,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ========================================
-- OIL CHANGE REQUESTS (December 2024)
-- Based on Oil Changing sheet
-- ========================================

INSERT INTO public.oil_change_requests (fryer_id, action_type, topup_percentage, requested_by, requested_by_name, status, approved_by, approved_by_name, approved_at, notes, created_at)
VALUES
  -- Full changes
  ('FRYER-RP-01', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-01 09:00:00+08', 'December start - full oil change', '2024-12-01 08:30:00+08'),
  ('FRYER-RP-02', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-01 09:30:00+08', 'December start - full oil change', '2024-12-01 08:45:00+08'),
  ('FRYER-RP-03', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000004', 'Pijol', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-03 09:00:00+08', 'Pre-event preparation', '2024-12-03 08:30:00+08'),
  ('FRYER-RP-04', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000004', 'Pijol', 'approved', 'c1000000-0000-0000-0000-000000000002', 'Atoy', '2024-12-06 08:30:00+08', 'Snack fryer change', '2024-12-06 08:00:00+08'),
  
  -- Topups
  ('FRYER-RP-01', 'topup', 15, 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-05 10:00:00+08', 'Event prep topup', '2024-12-05 09:30:00+08'),
  ('FRYER-RP-02', 'topup', 20, 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-07 11:00:00+08', 'Busy Saturday topup', '2024-12-07 10:30:00+08'),
  ('FRYER-RP-01', 'topup', 10, 'c1000000-0000-0000-0000-000000000004', 'Pijol', 'approved', 'c1000000-0000-0000-0000-000000000002', 'Atoy', '2024-12-09 14:00:00+08', 'Regular topup', '2024-12-09 13:30:00+08'),
  
  -- Event fryers
  ('FRYER-EVENT-01', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000001', 'Bella', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-08 07:00:00+08', 'Dewan Muhibbah event prep', '2024-12-08 06:30:00+08'),
  ('FRYER-EVENT-02', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-08 07:30:00+08', 'Dewan Muhibbah event prep', '2024-12-08 06:45:00+08'),
  
  ('FRYER-RP-01', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-10 08:30:00+08', 'Weekly full change', '2024-12-10 08:00:00+08'),
  ('FRYER-RP-02', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-08 08:30:00+08', 'Weekly full change', '2024-12-08 08:00:00+08'),
  ('FRYER-RP-03', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000004', 'Pijol', 'approved', 'c1000000-0000-0000-0000-000000000002', 'Atoy', '2024-12-12 08:30:00+08', 'Indoor Stadium event prep', '2024-12-12 08:00:00+08'),
  
  ('FRYER-EVENT-01', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000001', 'Bella', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-12 16:00:00+08', 'Indoor Stadium Day 1', '2024-12-12 15:30:00+08'),
  ('FRYER-EVENT-02', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000002', 'Atoy', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-13 07:30:00+08', 'Indoor Stadium Day 2', '2024-12-13 07:00:00+08'),
  ('FRYER-EVENT-01', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000001', 'Bella', 'approved', 'c1000000-0000-0000-0000-000000000001', 'Bella', '2024-12-14 07:30:00+08', 'Indoor Stadium Day 3', '2024-12-14 07:00:00+08'),
  
  -- Pending request for critical fryer
  ('FRYER-RP-04', 'full_change', NULL, 'c1000000-0000-0000-0000-000000000004', 'Pijol', 'pending', NULL, NULL, NULL, 'Oil color dark - needs change', '2024-12-14 16:00:00+08');

-- ========================================
-- OIL ACTION HISTORY
-- ========================================

INSERT INTO public.oil_action_history (fryer_id, action_type, performed_by, performed_by_name, details, notes, created_at)
VALUES
  ('FRYER-RP-01', 'full_change', 'c1000000-0000-0000-0000-000000000002', 'Atoy', '{"oil_amount_liters": 15, "oil_type": "Palm Oil", "old_oil_disposed": true}', 'December start', '2024-12-01 09:00:00+08'),
  ('FRYER-RP-02', 'full_change', 'c1000000-0000-0000-0000-000000000002', 'Atoy', '{"oil_amount_liters": 15, "oil_type": "Palm Oil", "old_oil_disposed": true}', 'December start', '2024-12-01 09:30:00+08'),
  ('FRYER-RP-03', 'full_change', 'c1000000-0000-0000-0000-000000000004', 'Pijol', '{"oil_amount_liters": 10, "oil_type": "Palm Oil", "old_oil_disposed": true}', 'Pre-event', '2024-12-03 09:00:00+08'),
  ('FRYER-RP-01', 'topup', 'c1000000-0000-0000-0000-000000000002', 'Atoy', '{"topup_liters": 2.25}', 'Event prep', '2024-12-05 10:00:00+08'),
  ('FRYER-RP-04', 'full_change', 'c1000000-0000-0000-0000-000000000004', 'Pijol', '{"oil_amount_liters": 8, "oil_type": "Palm Oil", "old_oil_disposed": true}', 'Snack fryer', '2024-12-06 08:30:00+08'),
  ('FRYER-RP-02', 'topup', 'c1000000-0000-0000-0000-000000000002', 'Atoy', '{"topup_liters": 3}', 'Busy Saturday', '2024-12-07 11:00:00+08'),
  ('FRYER-EVENT-01', 'full_change', 'c1000000-0000-0000-0000-000000000001', 'Bella', '{"oil_amount_liters": 12, "oil_type": "Palm Oil", "location": "Dewan Muhibbah"}', 'Event Day 1', '2024-12-08 07:00:00+08'),
  ('FRYER-EVENT-02', 'full_change', 'c1000000-0000-0000-0000-000000000002', 'Atoy', '{"oil_amount_liters": 12, "oil_type": "Palm Oil", "location": "Dewan Muhibbah"}', 'Event Day 1', '2024-12-08 07:30:00+08'),
  ('FRYER-RP-02', 'full_change', 'c1000000-0000-0000-0000-000000000002', 'Atoy', '{"oil_amount_liters": 15, "oil_type": "Palm Oil", "old_oil_disposed": true}', 'Weekly change', '2024-12-08 08:30:00+08'),
  ('FRYER-RP-01', 'topup', 'c1000000-0000-0000-0000-000000000004', 'Pijol', '{"topup_liters": 1.5}', 'Regular maintenance', '2024-12-09 14:00:00+08'),
  ('FRYER-RP-01', 'full_change', 'c1000000-0000-0000-0000-000000000002', 'Atoy', '{"oil_amount_liters": 15, "oil_type": "Palm Oil", "old_oil_disposed": true}', 'Weekly change', '2024-12-10 08:30:00+08'),
  ('FRYER-RP-03', 'full_change', 'c1000000-0000-0000-0000-000000000004', 'Pijol', '{"oil_amount_liters": 10, "oil_type": "Palm Oil", "old_oil_disposed": true}', 'Indoor Stadium prep', '2024-12-12 08:30:00+08'),
  ('FRYER-EVENT-01', 'full_change', 'c1000000-0000-0000-0000-000000000001', 'Bella', '{"oil_amount_liters": 12, "oil_type": "Palm Oil", "location": "Indoor Stadium"}', 'Stadium Day 1', '2024-12-12 16:00:00+08'),
  ('FRYER-EVENT-02', 'full_change', 'c1000000-0000-0000-0000-000000000002', 'Atoy', '{"oil_amount_liters": 12, "oil_type": "Palm Oil", "location": "Indoor Stadium"}', 'Stadium Day 2', '2024-12-13 07:30:00+08'),
  ('FRYER-EVENT-01', 'full_change', 'c1000000-0000-0000-0000-000000000001', 'Bella', '{"oil_amount_liters": 12, "oil_type": "Palm Oil", "location": "Indoor Stadium"}', 'Stadium Day 3', '2024-12-14 07:30:00+08'),
  ('FRYER-RP-04', 'quality_check', 'c1000000-0000-0000-0000-000000000004', 'Pijol', '{"color": "dark", "smell": "slightly burnt", "tds_reading": 28}', 'Needs change soon', '2024-12-14 15:00:00+08');

-- Done! Oil tracking data seeded successfully.
