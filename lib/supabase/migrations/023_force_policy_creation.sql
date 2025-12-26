-- 1. Ensure RLS is enabled (Force it)
ALTER TABLE allowed_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_locations ENABLE ROW LEVEL SECURITY;

-- 2. Grant permissions explicitly (just in case)
GRANT ALL ON allowed_locations TO authenticated;
GRANT ALL ON allowed_locations TO service_role;

-- 3. Create a SINGLE "Omnipotent" Policy for authenticated users
-- This avoids any confusion with multiple policies
DROP POLICY IF EXISTS "policy_omnipotent_authenticated" ON allowed_locations;

CREATE POLICY "policy_omnipotent_authenticated"
ON allowed_locations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Verify it exists (The query result will show the policy)
SELECT * FROM pg_policies WHERE tablename = 'allowed_locations';
