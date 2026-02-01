ALTER TABLE IF EXISTS "outlets" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON "outlets";
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "outlets";
    
    CREATE POLICY "Enable read access for all users" ON "outlets" FOR SELECT USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON "outlets" FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
END
$$;
