-- Fix leave_requests table to ensure all columns exist
-- This migration ensures the table has all columns required by the frontend

-- First, ensure the table exists
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration NUMERIC(4, 1) NOT NULL,
    is_half_day BOOLEAN DEFAULT false,
    half_day_type TEXT,
    reason TEXT NOT NULL,
    attachments TEXT[],
    status TEXT DEFAULT 'pending',
    approved_by TEXT,
    approver_name TEXT,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add any missing columns to existing table
ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS staff_name TEXT DEFAULT '';

ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS is_half_day BOOLEAN DEFAULT false;

ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS half_day_type TEXT;

ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS attachments TEXT[];

ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS approver_name TEXT;

ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure RLS is configured properly
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to leave_requests" ON public.leave_requests;
CREATE POLICY "Allow all access to leave_requests" ON public.leave_requests
    FOR ALL USING (true) WITH CHECK (true);

-- Create or replace the update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON public.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
