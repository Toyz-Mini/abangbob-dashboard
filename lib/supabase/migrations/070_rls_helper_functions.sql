-- =====================================================
-- STEP 1: RLS HELPER FUNCTIONS
-- =====================================================
-- Migration: 070_rls_helper_functions.sql
-- Purpose: Create reusable functions for role-based access control
-- =====================================================

-- ========================================
-- 1. Drop existing functions if they exist
-- ========================================
DROP FUNCTION IF EXISTS is_manager_or_above();
DROP FUNCTION IF EXISTS get_user_role();
DROP FUNCTION IF EXISTS is_own_data(TEXT);

-- ========================================
-- 2. Create is_manager_or_above() function
-- ========================================
-- Returns true if current user has Admin or Manager role
-- Uses COALESCE to safely return false if user not found
-- SECURITY DEFINER: Runs with owner privileges (can access staff table)
-- STABLE: Function result is consistent within same query

CREATE OR REPLACE FUNCTION is_manager_or_above() 
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (
      SELECT role IN ('Admin', 'Manager') 
      FROM public.staff 
      WHERE id::text = auth.uid()::text
      LIMIT 1
    ),
    false  -- Return false if user not found in staff table
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_manager_or_above() TO authenticated;

-- ========================================
-- 3. Create get_user_role() function
-- ========================================
-- Returns the role of the current user (Admin/Manager/Staff)
-- Returns NULL if user not found

CREATE OR REPLACE FUNCTION get_user_role() 
RETURNS TEXT AS $$
  SELECT role 
  FROM public.staff 
  WHERE id::text = auth.uid()::text
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

-- ========================================
-- 4. Create is_own_data() function
-- ========================================
-- Returns true if given staff_id matches current user
-- Useful for row-level checks

CREATE OR REPLACE FUNCTION is_own_data(check_staff_id TEXT) 
RETURNS BOOLEAN AS $$
  SELECT check_staff_id = auth.uid()::text
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_own_data(TEXT) TO authenticated;

-- ========================================
-- 5. Create can_access_own_or_manage() function
-- ========================================
-- Returns true if:
-- - User is Admin/Manager (can access all), OR
-- - User owns the data (staff_id matches)
-- This is the most common pattern for "own data" tables

CREATE OR REPLACE FUNCTION can_access_own_or_manage(check_staff_id TEXT) 
RETURNS BOOLEAN AS $$
  SELECT check_staff_id = auth.uid()::text OR is_manager_or_above()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION can_access_own_or_manage(TEXT) TO authenticated;

-- ========================================
-- VERIFICATION TESTS
-- ========================================
-- Run these after applying migration to verify functions work:

DO $$
DECLARE
  test_result BOOLEAN;
  role_result TEXT;
BEGIN
  -- Test is_manager_or_above
  SELECT is_manager_or_above() INTO test_result;
  RAISE NOTICE 'is_manager_or_above() = %', test_result;
  
  -- Test get_user_role
  SELECT get_user_role() INTO role_result;
  RAISE NOTICE 'get_user_role() = %', role_result;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Step 1 Complete: RLS helper functions created!';
  RAISE NOTICE '';
  RAISE NOTICE 'Available functions:';
  RAISE NOTICE '  - is_manager_or_above() → Returns true if Admin/Manager';
  RAISE NOTICE '  - get_user_role() → Returns role name (Admin/Manager/Staff)';
  RAISE NOTICE '  - is_own_data(staff_id) → Returns true if data belongs to current user';
  RAISE NOTICE '  - can_access_own_or_manage(staff_id) → Own data OR Admin/Manager';
END $$;
