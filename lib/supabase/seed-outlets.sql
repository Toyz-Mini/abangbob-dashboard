-- AbangBob Dashboard - Seed Outlets/Locations Data
-- Run this SQL in Supabase SQL Editor after creating tables

-- ========================================
-- INSERT OUTLET/LOCATION DATA
-- Based on spreadsheet schedule locations
-- Matches actual outlets table schema
-- ========================================

INSERT INTO public.outlets (id, name, address, phone, is_active, settings)
VALUES
  -- Main Outlets
  (
    'b1000000-0000-0000-0000-000000000001',
    'Rimba Point',
    'Rimba Point, Brunei',
    NULL,
    true,
    '{"code": "RP", "type": "Main Outlet"}'::jsonb
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'Setia Point',
    'Setia Point, Brunei',
    NULL,
    true,
    '{"code": "SP", "type": "Outlet"}'::jsonb
  ),
  
  -- Event Venues
  (
    'b1000000-0000-0000-0000-000000000003',
    'Dewan Muhibbah',
    'Dewan Muhibbah, Brunei',
    NULL,
    true,
    '{"code": "DM", "type": "Event Venue"}'::jsonb
  ),
  (
    'b1000000-0000-0000-0000-000000000004',
    'Indoor Stadium',
    'Indoor Stadium, Brunei',
    NULL,
    true,
    '{"code": "IS", "type": "Event Venue"}'::jsonb
  ),
  (
    'b1000000-0000-0000-0000-000000000005',
    'Youth Center Tanah Jambu',
    'Youth Center, Tanah Jambu, Brunei',
    NULL,
    true,
    '{"code": "YCTJ", "type": "Event Venue"}'::jsonb
  ),
  (
    'b1000000-0000-0000-0000-000000000006',
    'LCB Outdoor Booth',
    'LCB, Brunei',
    NULL,
    true,
    '{"code": "LCB", "type": "Event Booth"}'::jsonb
  ),
  (
    'b1000000-0000-0000-0000-000000000007',
    'TBHM',
    'TBHM, Brunei',
    NULL,
    true,
    '{"code": "TBHM", "type": "Event Venue"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  settings = EXCLUDED.settings;

-- Done! Outlets seeded successfully.
