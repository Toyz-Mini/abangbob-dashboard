-- Add extendedData column to staff table
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "extended_data" JSONB DEFAULT '{}::jsonb';

-- Add index for efficient extendedData queries
CREATE INDEX IF NOT EXISTS "staff_extendedData_idx" ON "staff" USING gin("extendedData");

-- Comment for documentation
COMMENT ON COLUMN "staff"."extendedData" IS 'Extended profile data for MFA, sessions, and additional profile settings';
