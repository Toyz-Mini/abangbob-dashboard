-- Migration: Add target_staff_id to staff_requests
-- Implementation for shift swap visibility to both parties

DO $$ 
BEGIN
  -- Add 'target_staff_id' column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_requests' 
    AND column_name = 'target_staff_id'
  ) THEN
    ALTER TABLE public.staff_requests 
    ADD COLUMN target_staff_id UUID;
    
    RAISE NOTICE 'Added target_staff_id column to staff_requests';
  END IF;
END $$;

-- Create index for faster filtering if missing
CREATE INDEX IF NOT EXISTS idx_staff_requests_target_staff_id ON public.staff_requests(target_staff_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
