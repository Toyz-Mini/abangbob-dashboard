-- RLS Audit Script
-- Run this in Supabase SQL Editor to see all tables with RLS

-- 1. All tables with RLS enabled
SELECT 
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '🔒 RLS ON' ELSE '🔓 RLS OFF' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity DESC, tablename;

-- 2. All RLS policies (who can do what)
SELECT 
    tablename,
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 3. Tables with RLS ON but NO policies (LOCKED OUT!)
SELECT t.tablename as "⚠️ LOCKED TABLE"
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true
  AND p.policyname IS NULL;
