-- Force update by EXACT ID from debug banner
UPDATE public."user" 
SET role = 'Admin', status = 'approved' 
WHERE id = 'F5q0RzbK0TjKvvFK6eThHAdxUZHyP52L';

UPDATE public.staff 
SET role = 'Admin' 
WHERE id = 'F5q0RzbK0TjKvvFK6eThHAdxUZHyP52L';
