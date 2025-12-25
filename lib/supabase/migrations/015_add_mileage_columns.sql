-- Migration: Add Mileage fields to claim_requests table

-- 1. Add new columns for Mileage Claims
ALTER TABLE public.claim_requests
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general', -- 'general' or 'mileage'
ADD COLUMN IF NOT EXISTS odometer_start NUMERIC(10, 1),
ADD COLUMN IF NOT EXISTS odometer_end NUMERIC(10, 1),
ADD COLUMN IF NOT EXISTS distance_km NUMERIC(10, 1),
ADD COLUMN IF NOT EXISTS rate_per_km NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS locations TEXT; -- "From X to Y"

-- 2. Add comment for clarity
COMMENT ON COLUMN public.claim_requests.category IS 'Distinguishes between general receipts and mileage claims';
COMMENT ON COLUMN public.claim_requests.rate_per_km IS 'Snapshot of the mileage rate at the time of claim';

-- 3. Check existing data (Optional: defaults are handled by DEFAULT 'general')
