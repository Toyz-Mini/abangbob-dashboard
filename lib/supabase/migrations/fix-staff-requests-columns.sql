-- Migration: Fix staff_requests table schema
-- Masalah: Table mungkin guna schema lama dengan 'request_type' dan 'subject'
--          tapi app expect 'category' dan 'title'
-- Tarikh: 2025-12-28

-- Step 1: Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add 'category' column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_requests' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE public.staff_requests 
    ADD COLUMN category TEXT;
    
    -- Copy data from request_type if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'staff_requests' 
      AND column_name = 'request_type'
    ) THEN
      UPDATE public.staff_requests SET category = request_type WHERE category IS NULL;
    END IF;
    
    RAISE NOTICE 'Added category column to staff_requests';
  END IF;

  -- Add 'title' column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_requests' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.staff_requests 
    ADD COLUMN title TEXT;
    
    -- Copy data from subject if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'staff_requests' 
      AND column_name = 'subject'
    ) THEN
      UPDATE public.staff_requests SET title = subject WHERE title IS NULL;
    END IF;
    
    RAISE NOTICE 'Added title column to staff_requests';
  END IF;

  -- Add 'description' column if it doesn't exist (might be missing in some schemas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_requests' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.staff_requests 
    ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column to staff_requests';
  END IF;

  -- Add 'priority' column with default if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_requests' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.staff_requests 
    ADD COLUMN priority TEXT DEFAULT 'medium';
    RAISE NOTICE 'Added priority column to staff_requests';
  END IF;

  -- Add 'attachments' column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_requests' 
    AND column_name = 'attachments'
  ) THEN
    ALTER TABLE public.staff_requests 
    ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added attachments column to staff_requests';
  END IF;

  -- Add 'assignee_name' column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_requests' 
    AND column_name = 'assignee_name'
  ) THEN
    ALTER TABLE public.staff_requests 
    ADD COLUMN assignee_name TEXT;
    RAISE NOTICE 'Added assignee_name column to staff_requests';
  END IF;

  -- Add 'outlet_id' column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_requests' 
    AND column_name = 'outlet_id'
  ) THEN
    ALTER TABLE public.staff_requests 
    ADD COLUMN outlet_id UUID;
    RAISE NOTICE 'Added outlet_id column to staff_requests';
  END IF;
END $$;

-- Step 2: Create index on category if missing
CREATE INDEX IF NOT EXISTS idx_staff_requests_category ON public.staff_requests(category);

-- Step 3: Create index on priority if missing
CREATE INDEX IF NOT EXISTS idx_staff_requests_priority ON public.staff_requests(priority);

-- Step 4: Make old columns nullable (to avoid NOT NULL constraint errors)
ALTER TABLE public.staff_requests ALTER COLUMN request_type DROP NOT NULL;
ALTER TABLE public.staff_requests ALTER COLUMN subject DROP NOT NULL;

-- Step 5: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Done!
SELECT 'staff_requests table schema has been fully updated!' as result;

