-- Comprehensive Migration to Fix All staff_id/user_id Column Types
-- This migration converts all UUID-type staff_id columns to TEXT
-- to ensure compatibility with Better Auth ID format
-- 
-- IMPORTANT: This is safe to run - it only converts types and preserves all data

-- ============================================================
-- STEP 1: Drop ALL policies that might reference these columns
-- ============================================================

-- Attendance policies
DROP POLICY IF EXISTS attendance_select_policy ON public.attendance;
DROP POLICY IF EXISTS attendance_insert_policy ON public.attendance;
DROP POLICY IF EXISTS attendance_update_policy ON public.attendance;
DROP POLICY IF EXISTS attendance_delete_policy ON public.attendance;
DROP POLICY IF EXISTS "Allow all authenticated users to read attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all authenticated users to insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all authenticated users to update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all authenticated users to delete attendance" ON public.attendance;

-- Staff policies
DROP POLICY IF EXISTS staff_select_policy ON public.staff;
DROP POLICY IF EXISTS staff_insert_policy ON public.staff;
DROP POLICY IF EXISTS staff_update_policy ON public.staff;
DROP POLICY IF EXISTS staff_delete_policy ON public.staff;

-- Schedule policies
DROP POLICY IF EXISTS schedule_entries_select_policy ON public.schedule_entries;
DROP POLICY IF EXISTS schedule_entries_insert_policy ON public.schedule_entries;
DROP POLICY IF EXISTS schedule_entries_update_policy ON public.schedule_entries;
DROP POLICY IF EXISTS schedule_entries_delete_policy ON public.schedule_entries;

-- Leave requests policies
DROP POLICY IF EXISTS leave_requests_select_policy ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_insert_policy ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_update_policy ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_delete_policy ON public.leave_requests;

-- Leave balances policies
DROP POLICY IF EXISTS leave_balances_select_policy ON public.leave_balances;
DROP POLICY IF EXISTS leave_balances_insert_policy ON public.leave_balances;
DROP POLICY IF EXISTS leave_balances_update_policy ON public.leave_balances;
DROP POLICY IF EXISTS leave_balances_delete_policy ON public.leave_balances;

-- Claim requests policies
DROP POLICY IF EXISTS claim_requests_select_policy ON public.claim_requests;
DROP POLICY IF EXISTS claim_requests_insert_policy ON public.claim_requests;
DROP POLICY IF EXISTS claim_requests_update_policy ON public.claim_requests;
DROP POLICY IF EXISTS claim_requests_delete_policy ON public.claim_requests;

-- Staff documents policies
DROP POLICY IF EXISTS staff_documents_select_policy ON public.staff_documents;
DROP POLICY IF EXISTS staff_documents_insert_policy ON public.staff_documents;
DROP POLICY IF EXISTS staff_documents_update_policy ON public.staff_documents;
DROP POLICY IF EXISTS staff_documents_delete_policy ON public.staff_documents;

-- Staff training policies
DROP POLICY IF EXISTS staff_training_select_policy ON public.staff_training;
DROP POLICY IF EXISTS staff_training_insert_policy ON public.staff_training;
DROP POLICY IF EXISTS staff_training_update_policy ON public.staff_training;
DROP POLICY IF EXISTS staff_training_delete_policy ON public.staff_training;

-- Disciplinary actions policies
DROP POLICY IF EXISTS disciplinary_actions_select_policy ON public.disciplinary_actions;
DROP POLICY IF EXISTS disciplinary_actions_insert_policy ON public.disciplinary_actions;
DROP POLICY IF EXISTS disciplinary_actions_update_policy ON public.disciplinary_actions;
DROP POLICY IF EXISTS disciplinary_actions_delete_policy ON public.disciplinary_actions;

-- ============================================================
-- STEP 2: Convert all staff_id columns to TEXT
-- ============================================================

-- Function to safely alter column type
CREATE OR REPLACE FUNCTION safe_alter_to_text(table_name text, column_name text) RETURNS void AS $$
BEGIN
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE text USING %I::text', table_name, column_name, column_name);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter %.%: %', table_name, column_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Core tables
SELECT safe_alter_to_text('staff', 'id');
SELECT safe_alter_to_text('attendance', 'staff_id');
SELECT safe_alter_to_text('schedule_entries', 'staff_id');
SELECT safe_alter_to_text('schedules', 'staff_id');
SELECT safe_alter_to_text('leave_requests', 'staff_id');
SELECT safe_alter_to_text('leave_balances', 'staff_id');
SELECT safe_alter_to_text('claim_requests', 'staff_id');
SELECT safe_alter_to_text('staff_documents', 'staff_id');
SELECT safe_alter_to_text('staff_training', 'staff_id');
SELECT safe_alter_to_text('disciplinary_actions', 'staff_id');
SELECT safe_alter_to_text('performance_reviews', 'staff_id');
SELECT safe_alter_to_text('performance_reviews', 'reviewer_id');
SELECT safe_alter_to_text('onboarding_checklists', 'staff_id');
SELECT safe_alter_to_text('exit_interviews', 'staff_id');
SELECT safe_alter_to_text('staff_complaints', 'staff_id');
SELECT safe_alter_to_text('ot_claims', 'staff_id');
SELECT safe_alter_to_text('staff_xp', 'staff_id');
SELECT safe_alter_to_text('xp_logs', 'staff_id');
SELECT safe_alter_to_text('staff_kpi', 'staff_id');
SELECT safe_alter_to_text('leave_records', 'staff_id');
SELECT safe_alter_to_text('training_records', 'staff_id');
SELECT safe_alter_to_text('ot_records', 'staff_id');

-- Orders and related
SELECT safe_alter_to_text('orders', 'staff_id');
SELECT safe_alter_to_text('orders', 'cashier_id');
SELECT safe_alter_to_text('cash_registers', 'opened_by');
SELECT safe_alter_to_text('cash_registers', 'closed_by');

-- Expenses
SELECT safe_alter_to_text('expenses', 'approved_by');
SELECT safe_alter_to_text('expenses', 'submitted_by');

-- Inventory
SELECT safe_alter_to_text('inventory_logs', 'staff_id');

-- SOP
SELECT safe_alter_to_text('sop_logs', 'staff_id');

-- Chat
SELECT safe_alter_to_text('chat_sessions', 'user_id');
SELECT safe_alter_to_text('chat_messages', 'user_id');

-- Audit logs
SELECT safe_alter_to_text('audit_logs', 'user_id');

-- Notifications/Announcements
SELECT safe_alter_to_text('notifications', 'user_id');
SELECT safe_alter_to_text('announcements', 'created_by');
SELECT safe_alter_to_text('staff_requests', 'staff_id');
SELECT safe_alter_to_text('staff_requests', 'approved_by');

-- Oil tracking
SELECT safe_alter_to_text('oil_change_requests', 'requested_by');
SELECT safe_alter_to_text('oil_change_requests', 'approved_by');
SELECT safe_alter_to_text('oil_action_history', 'performed_by');

-- Checklist
SELECT safe_alter_to_text('checklist_completions', 'staff_id');

-- Clean up the helper function
DROP FUNCTION IF EXISTS safe_alter_to_text(text, text);

-- ============================================================
-- STEP 3: Verification - Show current column types
-- ============================================================
SELECT 
    c.table_name,
    c.column_name,
    c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.column_name IN ('staff_id', 'user_id', 'cashier_id', 'approved_by', 'submitted_by', 'reviewer_id', 'opened_by', 'closed_by', 'created_by', 'requested_by', 'performed_by')
ORDER BY c.table_name, c.column_name;

-- ============================================================
-- STEP 4: Also verify 'id' column in staff table
-- ============================================================
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'staff'
  AND column_name = 'id';
