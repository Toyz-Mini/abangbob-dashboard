-- Fix: Add ALL missing columns to leave_requests table
-- Errors seen: "Could not find the 'duration' column", "Could not find the 'type' column"

ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'annual',
ADD COLUMN IF NOT EXISTS duration NUMERIC(4, 1) DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_half_day BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS half_day_type TEXT,
ADD COLUMN IF NOT EXISTS attachments TEXT[],
ADD COLUMN IF NOT EXISTS approver_name TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
