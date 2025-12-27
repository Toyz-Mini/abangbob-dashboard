-- Add extendedData column to user table for additional profile information
-- Run this in Supabase SQL Editor

-- Add extendedData JSONB column for storing additional user info
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "extendedData" JSONB DEFAULT '{}'::jsonb;

-- Create index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS "user_extendedData_idx" ON "user" USING gin("extendedData");

-- Comment for documentation
COMMENT ON COLUMN "user"."extendedData" IS 'Additional profile data: bloodType, allergies, medicalConditions, bankName, bankAccountNo, uniformSize, shoeSize';
