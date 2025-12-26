-- Enable RLS (idempotent)
ALTER TABLE allowed_locations ENABLE ROW LEVEL SECURITY;

-- 1. DROP ALL EXISTING POLICIES (Clean Slate)
-- We drop by name to be sure. We list all names seen in the inspection.

DROP POLICY IF EXISTS "Allow read for authenticated users" ON allowed_locations;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON allowed_locations;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON allowed_locations;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON allowed_locations;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON allowed_locations;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON allowed_locations;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON allowed_locations;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON allowed_locations;

DROP POLICY IF EXISTS "Enable read access for all users" ON allowed_locations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON allowed_locations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON allowed_locations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON allowed_locations;

-- 2. CREATE STANDARDIZED POLICIES

-- READ: Authenticated users can view locations
CREATE POLICY "policy_allow_select_authenticated"
ON allowed_locations FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can add locations
CREATE POLICY "policy_allow_insert_authenticated"
ON allowed_locations FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Authenticated users can update locations
CREATE POLICY "policy_allow_update_authenticated"
ON allowed_locations FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Authenticated users can delete locations
CREATE POLICY "policy_allow_delete_authenticated"
ON allowed_locations FOR DELETE
TO authenticated
USING (true);
