-- Fuzzy match update to catch whitespace or partial matches
-- 1. Check who matches
SELECT id, email, role FROM public."user" WHERE email ILIKE '%aliffharris%';

-- 2. Force Update User
UPDATE public."user"
SET role = 'Admin', status = 'approved'
WHERE email ILIKE '%aliffharris%';

-- 3. Force Update Staff
UPDATE public.staff
SET role = 'Admin'
WHERE email ILIKE '%aliffharris%';
