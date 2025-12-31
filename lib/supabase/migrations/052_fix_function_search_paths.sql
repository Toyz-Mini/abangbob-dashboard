-- Migration: 052_fix_function_search_paths.sql
-- Description: Sets fixed search_path for functions to resolve security warnings (database-linter 0011)

-- 1. Fix handle_new_approved_staff (found in 030_sync_missing_staff.sql)
ALTER FUNCTION public.handle_new_approved_staff() SET search_path = public;

-- 2. Fix update_modified_column (found in 048_add_gamification_tables.sql)
ALTER FUNCTION public.update_modified_column() SET search_path = public;

-- 3. Fix update_updated_at_column (found in 043_fix_leave_requests_columns.sql)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
