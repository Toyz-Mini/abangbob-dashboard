-- Add mileage_rate to outlet_settings table
ALTER TABLE public.outlet_settings 
ADD COLUMN IF NOT EXISTS mileage_rate NUMERIC(10, 2) DEFAULT 0.60;

-- Update existing records to have default value if null
UPDATE public.outlet_settings 
SET mileage_rate = 0.60 
WHERE mileage_rate IS NULL;

-- Notify change
COMMENT ON COLUMN public.outlet_settings.mileage_rate IS 'Mileage rate in base currency per km';
