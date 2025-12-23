-- Account Lockout & Audit Logs Tables
-- Run this in Supabase SQL Editor

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS "failed_login_attempts" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "ipAddress" TEXT,
  "attemptedAt" TIMESTAMP DEFAULT NOW(),
  "reason" TEXT
);

CREATE INDEX IF NOT EXISTS idx_failed_login_email ON "failed_login_attempts" ("email");
CREATE INDEX IF NOT EXISTS idx_failed_login_time ON "failed_login_attempts" ("attemptedAt");

-- Account lockout tracking
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lastFailedLogin" TIMESTAMP;

-- Audit logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "resource" TEXT,
  "resourceId" TEXT,
  "details" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON "audit_logs" ("userId");
CREATE INDEX IF NOT EXISTS idx_audit_action ON "audit_logs" ("action");
CREATE INDEX IF NOT EXISTS idx_audit_time ON "audit_logs" ("createdAt");

-- Active sessions tracking
CREATE TABLE IF NOT EXISTS "active_sessions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "deviceInfo" TEXT,
  "ipAddress" TEXT,
  "lastActive" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON "active_sessions" ("userId");
