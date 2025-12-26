-- 1. Clean up duplicate rows first (Keep the most recently updated one)
DELETE FROM public.leave_balances a USING (
      SELECT MIN(ctid) as ctid, staff_id, year
      FROM public.leave_balances 
      GROUP BY staff_id, year HAVING COUNT(*) > 1
      ) b
      WHERE a.staff_id = b.staff_id 
      AND a.year = b.year 
      AND a.ctid <> b.ctid;

-- 2. Add the unique constraint so UPSERT works correctly
ALTER TABLE public.leave_balances 
ADD CONSTRAINT unique_staff_year UNIQUE (staff_id, year);
