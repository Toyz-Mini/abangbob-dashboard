-- Enable RLS on allowed_locations
ALTER TABLE allowed_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Enable read access for all users" ON allowed_locations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON allowed_locations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON allowed_locations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON allowed_locations;

-- Create comprehensive policies

-- 1. READ: Allow everyone (including anon for login page if needed, or just auth) to read
-- We'll restrict to authenticated users for safety, or public if needed for clock-in without login?
-- Usually clock-in requires login, so authenticated is safe.
CREATE POLICY "Enable read access for authenticated users"
ON allowed_locations FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT: Allow authenticated users (Admins/Managers) to add locations
CREATE POLICY "Enable insert access for authenticated users"
ON allowed_locations FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. UPDATE: Allow authenticated users to edit locations
CREATE POLICY "Enable update access for authenticated users"
ON allowed_locations FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. DELETE: Allow authenticated users to delete locations
CREATE POLICY "Enable delete access for authenticated users"
ON allowed_locations FOR DELETE
TO authenticated
USING (true);
