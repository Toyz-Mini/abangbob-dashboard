-- Seeding dummy attendance data for Aliff and Syahmi for the last 3 days

-- Staff IDs:
-- Aliff: e3d8ee23-a00a-4e16-9e0b-bd6e269456bb
-- Syahmi: YxnKMNJsyONqVsCBAOr0zepZeFv5Jcrh

-- Location IDs:
-- Kiulap: 40cfa29a-e10c-4e6a-83b3-bbec6c85cd90
-- Meragang: 03738015-2ed8-4866-aff1-735d55a688b0

INSERT INTO attendance (
    staff_id,
    date,
    clock_in_time,
    clock_in_photo_url,
    clock_out_time,
    clock_out_photo_url,
    outlet_id,
    notes,
    created_at
) VALUES
-- Day 1: Aliff at Kiulap (Normal shift)
(
    'e3d8ee23-a00a-4e16-9e0b-bd6e269456bb',
    CURRENT_DATE - INTERVAL '2 days',
    '08:55:00',
    'https://placehold.co/600x400/orange/white?text=Aliff+In',
    '17:05:00',
    'https://placehold.co/600x400/orange/white?text=Aliff+Out',
    '00000000-0000-0000-0000-000000000001', -- Main Outlet
    '[Location Stats] Lat: 4.9514, Lng: 114.9074, Dist: 10m\n[Clock Out] Time: 17:05:00 Verified at: Lat 4.9514, Lng 114.9074',
    NOW() - INTERVAL '2 days'
),
-- Day 1: Syahmi at Meragang (Late)
(
    'YxnKMNJsyONqVsCBAOr0zepZeFv5Jcrh',
    CURRENT_DATE - INTERVAL '2 days',
    '09:15:00',
    'https://placehold.co/600x400/blue/white?text=Syahmi+In',
    '18:00:00',
    'https://placehold.co/600x400/blue/white?text=Syahmi+Out',
    'b1000000-0000-0000-0000-000000000001', -- Rimba Point
    '[Location Stats] Lat: 5.0264, Lng: 115.0171, Dist: 50m\n[Clock Out] Time: 18:00:00 Verified at: Lat 5.0264, Lng 115.0171',
    NOW() - INTERVAL '2 days'
),
-- Day 2: Aliff at Kiulap (Forgot clock out / still working?) let's make it complete
(
    'e3d8ee23-a00a-4e16-9e0b-bd6e269456bb',
    CURRENT_DATE - INTERVAL '1 day',
    '09:00:00',
    'https://placehold.co/600x400/orange/white?text=Aliff+In+Day2',
    '17:00:00',
    'https://placehold.co/600x400/orange/white?text=Aliff+Out+Day2',
    '00000000-0000-0000-0000-000000000001', -- Main Outlet
    '[Location Stats] Lat: 4.9514, Lng: 114.9074, Dist: 12m',
    NOW() - INTERVAL '1 day'
),
-- Day 3 (Today): Aliff currently clocked in
(
    'e3d8ee23-a00a-4e16-9e0b-bd6e269456bb',
    CURRENT_DATE,
    '08:45:00',
    'https://placehold.co/600x400/orange/white?text=Aliff+In+Today',
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001', -- Main Outlet
    '[Location Stats] Lat: 4.9514, Lng: 114.9074, Dist: 8m',
    NOW()
);
