-- =====================================================
-- COMPREHENSIVE RLS FIX FOR ALL OPERATIONAL TABLES
-- =====================================================
-- Run this in Supabase Dashboard -> SQL Editor
-- This disables RLS on all tables to ensure full CRUD access
-- =====================================================

-- ========================================
-- CORE HR/SCHEDULING TABLES
-- ========================================
ALTER TABLE IF EXISTS public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedule_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shift_definitions DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STAFF PORTAL TABLES (requests, leaves, claims)
-- ========================================
ALTER TABLE IF EXISTS public.staff_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leave_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.claim_requests DISABLE ROW LEVEL SECURITY;

-- ========================================
-- ATTENDANCE & HOLIDAYS
-- ========================================
ALTER TABLE IF EXISTS public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.allowed_locations DISABLE ROW LEVEL SECURITY;

-- ========================================
-- CHECKLISTS & COMPLETIONS
-- ========================================
ALTER TABLE IF EXISTS public.checklist_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.checklist_completions DISABLE ROW LEVEL SECURITY;

-- ========================================
-- ANNOUNCEMENTS & COMMUNICATIONS
-- ========================================
ALTER TABLE IF EXISTS public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages DISABLE ROW LEVEL SECURITY;

-- ========================================
-- INVENTORY & STOCK
-- ========================================
ALTER TABLE IF EXISTS public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_logs DISABLE ROW LEVEL SECURITY;

-- ========================================
-- MENU & MODIFIERS
-- ========================================
ALTER TABLE IF EXISTS public.menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.modifier_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.modifier_options DISABLE ROW LEVEL SECURITY;

-- ========================================
-- ORDERS & TRANSACTIONS
-- ========================================
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cash_registers DISABLE ROW LEVEL SECURITY;

-- ========================================
-- SETTINGS & CONFIGURATIONS
-- ========================================
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.outlet_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tax_rates DISABLE ROW LEVEL SECURITY;

-- ========================================
-- PERFORMANCE & REVIEWS
-- ========================================
ALTER TABLE IF EXISTS public.performance_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.onboarding_checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_training DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_complaints DISABLE ROW LEVEL SECURITY;

-- ========================================
-- GAMIFICATION
-- ========================================
ALTER TABLE IF EXISTS public.staff_xp DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.xp_logs DISABLE ROW LEVEL SECURITY;

-- ========================================
-- EQUIPMENT & MAINTENANCE
-- ========================================
ALTER TABLE IF EXISTS public.equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance_logs DISABLE ROW LEVEL SECURITY;

-- ========================================
-- SOP & PROCEDURES
-- ========================================
ALTER TABLE IF EXISTS public.sop_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sop_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sop_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sop_log_items DISABLE ROW LEVEL SECURITY;

-- ========================================
-- WASTE & AUDIT
-- ========================================
ALTER TABLE IF EXISTS public.waste_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;

-- ========================================
-- PROMOS & LOYALTY
-- ========================================
ALTER TABLE IF EXISTS public.promo_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.promo_usages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.loyalty_transactions DISABLE ROW LEVEL SECURITY;

-- ========================================
-- OTHER TABLES
-- ========================================
ALTER TABLE IF EXISTS public.staff_positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disciplinary_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exit_interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ot_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.late_reason_categories DISABLE ROW LEVEL SECURITY;

-- ========================================
-- CUSTOMERS & SUPPLIERS (Optional POS tables)
-- ========================================
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.outlets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.production_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stock_transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stock_movements DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION: Check RLS status of key tables
-- =====================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS STATUS CHECK FOR KEY TABLES:';
    RAISE NOTICE '========================================';
    
    FOR r IN 
        SELECT c.relname as table_name, c.relrowsecurity as rls_enabled
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' 
        AND c.relkind = 'r'
        AND c.relname IN (
            'staff_requests', 'shifts', 'schedule_entries', 
            'leave_requests', 'claim_requests', 'attendance',
            'staff', 'inventory', 'orders'
        )
        ORDER BY c.relname
    LOOP
        IF r.rls_enabled THEN
            RAISE NOTICE 'WARNING: % still has RLS ENABLED', r.table_name;
        ELSE
            RAISE NOTICE 'OK: % RLS disabled', r.table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS has been disabled on all operational tables!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables fixed:';
    RAISE NOTICE '- staff_requests (shift_swap, off_day, etc.)';
    RAISE NOTICE '- shifts, schedule_entries, schedules';
    RAISE NOTICE '- leave_requests, claim_requests';
    RAISE NOTICE '- attendance, staff, inventory';
    RAISE NOTICE '- And 40+ more tables...';
    RAISE NOTICE '';
    RAISE NOTICE 'All CRUD operations should now work correctly!';
END $$;
