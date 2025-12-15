-- AbangBob Dashboard - Seed Shifts Data
-- Run this SQL in Supabase SQL Editor after creating tables

-- ========================================
-- INSERT SHIFT DEFINITIONS
-- Based on spreadsheet shift schedule
-- ========================================

-- Clear existing shifts (optional - comment out if you want to keep existing)
-- DELETE FROM public.shifts;

INSERT INTO public.shifts (id, name, start_time, end_time, break_duration, color, is_active)
VALUES
  -- Regular Shifts (Sunday - Thursday)
  (
    'a1000000-0000-0000-0000-000000000001',
    'AM Shift',
    '08:00:00',
    '17:00:00',
    60,
    '#22C55E', -- Green
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'PM Shift',
    '13:00:00',
    '22:00:00',
    60,
    '#3B82F6', -- Blue
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Manager Shift',
    '10:00:00',
    '19:00:00',
    60,
    '#8B5CF6', -- Purple
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'MID Shift',
    '10:00:00',
    '19:00:00',
    60,
    '#F59E0B', -- Amber
    true
  ),
  
  -- Friday Shifts
  (
    'a1000000-0000-0000-0000-000000000005',
    'Friday AM',
    '08:00:00',
    '12:00:00',
    0,
    '#10B981', -- Emerald
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000006',
    'Friday PM',
    '14:00:00',
    '22:00:00',
    60,
    '#06B6D4', -- Cyan
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000007',
    'Friday Split',
    '08:00:00',
    '18:00:00',
    120, -- 2 hour break for Friday prayers
    '#14B8A6', -- Teal
    true
  ),
  
  -- Full Day Shift
  (
    'a1000000-0000-0000-0000-000000000008',
    'FULL',
    '08:00:00',
    '22:00:00',
    120,
    '#EF4444', -- Red
    true
  ),
  
  -- Event/Special Shifts
  (
    'a1000000-0000-0000-0000-000000000009',
    'Event Morning',
    '07:00:00',
    '16:00:00',
    60,
    '#EC4899', -- Pink
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000010',
    'Event Afternoon',
    '14:00:00',
    '23:00:00',
    60,
    '#F97316', -- Orange
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000011',
    'Event Full',
    '08:00:00',
    '22:00:00',
    120,
    '#DC2626', -- Red-600
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  break_duration = EXCLUDED.break_duration,
  color = EXCLUDED.color,
  is_active = EXCLUDED.is_active;

-- Done! Shift definitions seeded successfully.
