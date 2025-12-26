-- Migration: Fix void_refund_requests columns to accept non-UUID IDs from Better Auth
-- The approved_by column was UUID type, but Better Auth uses non-UUID string IDs

-- Change approved_by from UUID to TEXT
ALTER TABLE void_refund_requests 
  ALTER COLUMN approved_by TYPE TEXT;

-- Also change requested_by if it's UUID
ALTER TABLE void_refund_requests 
  ALTER COLUMN requested_by TYPE TEXT;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'void_refund_requests' 
AND column_name IN ('approved_by', 'requested_by');
