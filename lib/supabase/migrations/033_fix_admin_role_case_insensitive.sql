-- Fix Admin Role (Case Insensitive)
-- In case the email in DB has different casing (e.g. AliffHarris@gmail.com)
UPDATE public."user"
SET role = 'Admin', status = 'approved'
WHERE LOWER(email) = LOWER('aliffharris@gmail.com');

-- Sync to staff (Case Insensitive)
UPDATE public.staff
SET role = 'Admin'
WHERE LOWER(email) = LOWER('aliffharris@gmail.com');
