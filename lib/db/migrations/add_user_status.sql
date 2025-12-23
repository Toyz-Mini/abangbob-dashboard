-- Add status and profile fields to Better Auth user table
-- Run this in Supabase SQL Editor

-- Add status column
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'profile_incomplete';

-- Add profile completion fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "icNumber" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "address" TEXT;

-- Emergency contact as JSON
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emergencyContact" JSONB;

-- Profile photo
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- Approval tracking
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Link to staff table after approval
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "staffId" TEXT;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS "user_status_idx" ON "user"("status");
