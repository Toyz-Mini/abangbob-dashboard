-- Migration: Fix target_staff_id column type
-- Masalah: Column target_staff_id dicipta sebagai UUID, tetapi ID staff 
--          dalam sistem ini menggunakan format TEXT (Better Auth).
--          Ini menyebabkan carian/filter gagal.

DO $$ 
BEGIN
    -- Tukar type ke TEXT supaya sama dengan staff_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'staff_requests' 
        AND column_name = 'target_staff_id'
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.staff_requests ALTER COLUMN target_staff_id TYPE TEXT;
        RAISE NOTICE 'Converted target_staff_id to TEXT';
    END IF;
END $$;

-- Pastikan schema cache dikemaskini
NOTIFY pgrst, 'reload schema';
