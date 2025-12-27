-- Migration 039: Restore Deleted Staff
-- Purpose: Re-sync staff records from user table for users who were deleted from staff table
-- Run this in Supabase SQL Editor

-- Step 1: View users who should be in staff table but are not (preview)
-- Uncomment to preview before running the insert
/*
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.status,
    u."outletId" as outlet_id
FROM public."user" u
WHERE u.status = 'approved' 
  AND NOT EXISTS (SELECT 1 FROM public.staff s WHERE s.id = u.id::text);
*/

-- Step 2: Restore deleted staff from user table
INSERT INTO public.staff (id, name, email, role, status, outlet_id, join_date)
SELECT 
    u.id::text,
    u.name,
    u.email,
    u.role,
    'active',
    u."outletId"::text,
    COALESCE(u.created_at, NOW())
FROM public."user" u
WHERE u.status = 'approved' 
  AND NOT EXISTS (SELECT 1 FROM public.staff s WHERE s.id = u.id::text)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = 'active';

-- Step 3: Verify restored staff
SELECT 
    s.id,
    s.name,
    s.email,
    s.role,
    s.status,
    s.join_date
FROM public.staff s
ORDER BY s.join_date DESC
LIMIT 10;
