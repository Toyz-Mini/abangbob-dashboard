-- Enable RLS on promotions table if not already enabled
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all promotions
CREATE POLICY "Enable read access for authenticated users" ON public.promotions
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users (staff/admin) to insert promotions
CREATE POLICY "Enable insert for authenticated users" ON public.promotions
FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update promotions
CREATE POLICY "Enable update for authenticated users" ON public.promotions
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to delete promotions
CREATE POLICY "Enable delete for authenticated users" ON public.promotions
FOR DELETE TO authenticated USING (true);
