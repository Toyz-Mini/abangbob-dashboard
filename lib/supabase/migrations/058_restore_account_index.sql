-- Migration to restore missing index on public.account("userId")
-- This was previously removed but is needed for a foreign key constraint

CREATE INDEX IF NOT EXISTS "account_userId_idx" ON public.account("userId");
