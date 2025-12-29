-- Force fix for staff_advances ID column
-- Use this to ensure ID column is TEXT type

DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Starting migration to fix staff_advances ID type...';

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_advances' AND table_schema = 'public') THEN
        RAISE NOTICE 'Table staff_advances found.';
        
        -- Check current type
        FOR r IN SELECT data_type FROM information_schema.columns WHERE table_name = 'staff_advances' AND column_name = 'id'
        LOOP
            RAISE NOTICE 'Current ID type: %', r.data_type;
        END LOOP;

        -- Change to TEXT
        BEGIN
            ALTER TABLE public.staff_advances ALTER COLUMN id TYPE TEXT;
            RAISE NOTICE 'ID column changed to TEXT successfully.';
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to alter ID column: %', SQLERRM;
        END;

    ELSE
        RAISE WARNING 'Table staff_advances NOT found in public schema!';
    END IF;
END $$;
