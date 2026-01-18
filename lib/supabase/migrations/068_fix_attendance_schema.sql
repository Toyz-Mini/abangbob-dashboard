-- Fix critical issues with Clock In/Out flow

-- 1. Drop restrictive foreign key constraint
-- The app sends allowed_location IDs (geofences) which don't match outlets table IDs
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS attendance_outlet_id_fkey;

-- 2. Add missing column for update trigger
-- The trigger 'update_attendance_updated_at' was failing because this column didn't exist
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
