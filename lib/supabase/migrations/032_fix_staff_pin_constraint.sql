-- Fix 'pin' constraint preventing auto-creation of staff
-- We allow pin to be null for now, as new staff created from user table won't have a pin immediately.
ALTER TABLE public.staff ALTER COLUMN pin DROP NOT NULL;

-- Retrying the Admin role update for aliffharris
-- This might trigger the automatic sync again (handle_new_approved_staff)
UPDATE public."user"
SET role = 'Admin', status = 'approved'
WHERE email = 'aliffharris@gmail.com';

-- Ensure staff record is synced successfully
-- (In case the trigger didn't fire because status didn't change, or failed silently)
INSERT INTO public.staff (id, name, email, role, status, outlet_id, join_date)
SELECT 
    u.id::text, 
    u.name, 
    u.email, 
    u.role, 
    'active', 
    u."outletId"::text, 
    NOW()
FROM public."user" u
WHERE u.email = 'aliffharris@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role;
