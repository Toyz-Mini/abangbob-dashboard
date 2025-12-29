-- Fix staff_advances ID column type
-- The application uses text-based IDs (e.g. adv_...) but the database expects UUID
-- This migration changes the ID column to TEXT

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_advances') THEN
        
        -- 1. Drop primary key constraint if it exists (to allow type change if needed, though usually ALTER COLUMN handles it)
        -- In some postgres versions, altering a PK column type might require dropping constraints referencing it.
        -- For simplicity, we try direct ALTER first. If it fails due to dependencies, we'd need a more complex script.
        -- TEXT is compatible with UUID for values that ARE UUIDs, but not vice-versa. 
        -- Since we have "bad" data coming in, current data might be UUIDs. 
        -- But we want to store TEXT.
        
        ALTER TABLE public.staff_advances ALTER COLUMN id TYPE TEXT;
        
    END IF;
END $$;
