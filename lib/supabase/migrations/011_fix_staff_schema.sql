-- Fix Staff Table Schema
-- Adds missing columns required by the application for proper data persistence.
-- This fixes the issue where staff details disappear after refresh.

-- 1. Add extended_data column for flexible field storage (catch-all)
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS extended_data JSONB DEFAULT '{}'::jsonb;

-- 2. Add specific columns for core staff details to ensure data integrity
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS ic_number TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS bank_details JSONB;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- 3. Create indexes for frequently searched columns
CREATE INDEX IF NOT EXISTS idx_staff_ic_number ON public.staff(ic_number);
CREATE INDEX IF NOT EXISTS idx_staff_position ON public.staff(position);
CREATE INDEX IF NOT EXISTS idx_staff_department ON public.staff(department);

-- 4. Enable RLS on these columns (implicitly covered by existing table policy, just ensuring table exists)
-- (We assume table 'staff' exists from previous set up or implicit creation)
