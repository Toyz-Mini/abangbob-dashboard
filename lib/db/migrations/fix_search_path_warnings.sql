-- Fix Security Warnings: Function Search Path Mutable
-- remediating: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- 1. update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 2. update_payment_methods_updated_at
-- Note: Checking if exists first or just altering. Assuming specific name from error log.
ALTER FUNCTION public.update_payment_methods_updated_at() SET search_path = public;

-- 3. update_tax_rates_updated_at
ALTER FUNCTION public.update_tax_rates_updated_at() SET search_path = public;

-- 4. update_menu_categories_updated_at
ALTER FUNCTION public.update_menu_categories_updated_at() SET search_path = public;

-- Explanation:
-- Setting the search_path specifically to 'public' prevents malicious users 
-- from overriding objects (like tables or other functions) by creating them 
-- in a schema that is earlier in the search path.
