-- Ensure leave_balances is accessible
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Anyone can view leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Staff can manage leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Enable all access to leave_balances" ON public.leave_balances;

-- Create permissive policy
CREATE POLICY "Enable all access to leave_balances"
ON public.leave_balances
FOR ALL
USING (true)
WITH CHECK (true);
