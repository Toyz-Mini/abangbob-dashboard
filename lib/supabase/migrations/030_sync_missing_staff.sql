-- Sync Missing Approved Users to Staff Table
-- Fixes issue where user is 'approved' but has no record in 'staff' table

INSERT INTO public.staff (
  id, 
  name, 
  email, 
  role, 
  status, 
  outlet_id, 
  join_date
)
SELECT 
  u.id, 
  u.name, 
  u.email, 
  u.role, 
  'active', 
  u."outletId", -- camelCase column needs quotes
  NOW()
FROM public."user" u
WHERE u.status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM public.staff s WHERE s.id::text = u.id::text
);

-- Note: We cast to text to avoid UUID mismatch errors
