-- Force update user aliffharris@gmail.com to Admin role
UPDATE public."user"
SET role = 'Admin', status = 'approved'
WHERE email = 'aliffharris@gmail.com';

-- Sync to staff table as well to ensure consistency
UPDATE public.staff
SET role = 'Admin'
WHERE email = 'aliffharris@gmail.com';
