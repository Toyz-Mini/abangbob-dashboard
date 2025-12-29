-- Change approved_by column to TEXT to support non-UUID user IDs (e.g. from BetterAuth)
-- Also drop any foreign key constraint that might force it to be a UUID

DO $$ 
BEGIN
    -- 1. Try to drop the foreign key constraint if it exists
    -- We don't know the exact name, so we'll try standard naming conventions
    BEGIN
        ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_approved_by_fkey;
    EXCEPTION
        WHEN undefined_object THEN NULL;
    END;

    -- 2. Change the column type to TEXT
    ALTER TABLE public.leave_requests ALTER COLUMN approved_by TYPE TEXT;

    -- 3. Also ensure invalid uuid strings in the column (if any existed and validation was loose) doesn't break things
    -- (The ALTER above handles basic type conversion, but existing UUIDs convert to Text fine)

END $$;
