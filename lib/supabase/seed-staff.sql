-- AbangBob Dashboard - Seed Staff Data
-- Run this SQL in Supabase SQL Editor
-- Using minimal columns that should exist in any version

-- ========================================
-- INSERT STAFF DATA
-- Based on spreadsheet schedule
-- ========================================

INSERT INTO public.staff (id, name, email, phone, role, status, pin, hourly_rate, employment_type, join_date)
VALUES
  -- Management
  (
    'c1000000-0000-0000-0000-000000000001',
    'Bella',
    'bella@abangbob.com',
    '+673-8000001',
    'Manager',
    'active',
    '1234',
    15.00,
    'full-time',
    '2023-01-01'
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'Atoy',
    'atoy@abangbob.com',
    '+673-8000002',
    'Staff',
    'active',
    '2345',
    10.00,
    'full-time',
    '2023-03-01'
  ),
  
  -- Regular Staff
  (
    'c1000000-0000-0000-0000-000000000003',
    'Rina',
    'rina@abangbob.com',
    '+673-8000003',
    'Staff',
    'active',
    '3456',
    7.50,
    'full-time',
    '2023-06-01'
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'Pijol',
    'pijol@abangbob.com',
    '+673-8000004',
    'Staff',
    'active',
    '4567',
    7.50,
    'full-time',
    '2024-01-01'
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'Shahirul',
    'shahirul@abangbob.com',
    '+673-8000005',
    'Staff',
    'active',
    '5678',
    7.50,
    'full-time',
    '2024-01-01'
  ),
  (
    'c1000000-0000-0000-0000-000000000006',
    'Nizam',
    'nizam@abangbob.com',
    '+673-8000006',
    'Staff',
    'active',
    '6789',
    6.00,
    'full-time',
    '2024-12-01'
  ),
  (
    'c1000000-0000-0000-0000-000000000007',
    'Md Shah',
    'mdshah@abangbob.com',
    '+673-8000007',
    'Staff',
    'active',
    '7890',
    7.50,
    'full-time',
    '2024-12-01'
  ),
  
  -- Part Timer
  (
    'c1000000-0000-0000-0000-000000000008',
    'Sina',
    'sina@abangbob.com',
    '+673-8000008',
    'Staff',
    'active',
    '8901',
    5.00,
    'part-time',
    '2024-10-01'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  hourly_rate = EXCLUDED.hourly_rate,
  employment_type = EXCLUDED.employment_type;

-- ========================================
-- INSERT LEAVE BALANCES FOR 2024-2025
-- ========================================

INSERT INTO public.leave_balances (staff_id, year, annual_leave, annual_leave_used, sick_leave, sick_leave_used)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 2024, 14, 2, 14, 2),
  ('c1000000-0000-0000-0000-000000000002', 2024, 14, 2, 14, 0),
  ('c1000000-0000-0000-0000-000000000003', 2024, 14, 1, 14, 0),
  ('c1000000-0000-0000-0000-000000000004', 2024, 14, 0, 14, 0),
  ('c1000000-0000-0000-0000-000000000005', 2024, 14, 0, 14, 0),
  ('c1000000-0000-0000-0000-000000000006', 2024, 14, 0, 14, 0),
  ('c1000000-0000-0000-0000-000000000007', 2024, 14, 0, 14, 0),
  ('c1000000-0000-0000-0000-000000000008', 2024, 7, 0, 7, 0)
ON CONFLICT (staff_id, year) DO UPDATE SET
  annual_leave_used = EXCLUDED.annual_leave_used,
  sick_leave_used = EXCLUDED.sick_leave_used;

-- Insert 2025 balances
INSERT INTO public.leave_balances (staff_id, year, annual_leave, annual_leave_used, sick_leave, sick_leave_used)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 2025, 14, 0, 14, 0),
  ('c1000000-0000-0000-0000-000000000002', 2025, 14, 0, 14, 0),
  ('c1000000-0000-0000-0000-000000000003', 2025, 14, 0, 14, 0),
  ('c1000000-0000-0000-0000-000000000004', 2025, 14, 0, 14, 0),
  ('c1000000-0000-0000-0000-000000000005', 2025, 14, 0, 14, 0),
  ('c1000000-0000-0000-0000-000000000006', 2025, 14, 0, 14, 0),
  ('c1000000-0000-0000-0000-000000000007', 2025, 14, 0, 14, 0),
  ('c1000000-0000-0000-0000-000000000008', 2025, 7, 0, 7, 0)
ON CONFLICT (staff_id, year) DO NOTHING;

-- Done! Staff data seeded successfully.
