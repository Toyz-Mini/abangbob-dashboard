-- NUCLEAR OPTION: Allow Anonymous (Not Logged In) Users
-- If this works, then your "Login Session" is broken/expired.

CREATE POLICY "policy_allow_anon_all"
ON allowed_locations
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Ensure authenticated also has explicit access (redundant but safe)
GRANT ALL ON allowed_locations TO anon;
GRANT ALL ON allowed_locations TO authenticated;
GRANT ALL ON allowed_locations TO service_role;
