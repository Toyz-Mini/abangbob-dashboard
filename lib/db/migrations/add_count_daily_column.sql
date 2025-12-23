-- Add count_daily column to inventory table
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS count_daily BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.inventory.count_daily IS 'Flag to indicate if this item should be counted during daily opening/closing procedures';

-- Update RLS policies just in case (usually not needed for new columns if row level)
-- But ensuring it's queryable is good.
