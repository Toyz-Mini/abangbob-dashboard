-- Master Migration File
-- Run this file to execute all migrations in the correct order
-- This is safe to run multiple times (idempotent)

-- Prerequisites check
DO $$ 
BEGIN
  -- Check if uuid-ossp extension exists
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE EXCEPTION 'uuid-ossp extension not found. Please run the main schema.sql first.';
  END IF;
END $$;

-- =================================================
-- Phase 1: Fix & Enhance Existing Tables
-- =================================================

\echo '================================================='
\echo 'Phase 1: Enhancing existing tables...'
\echo '================================================='

\i lib/supabase/add-inventory-logs-table.sql
\echo '✓ Inventory logs table created'

\i lib/supabase/enhance-orders-table.sql
\echo '✓ Orders table enhanced with void/refund tracking'

-- =================================================
-- Phase 2: Core Missing Tables
-- =================================================

\echo ''
\echo '================================================='
\echo 'Phase 2: Creating core missing tables...'
\echo '================================================='

\i lib/supabase/add-production-delivery-tables.sql
\echo '✓ Production and delivery tables created'

\i lib/supabase/add-finance-tables.sql
\echo '✓ Finance tables created'

\i lib/supabase/add-recipe-tables.sql
\echo '✓ Recipe tables created'

-- =================================================
-- Phase 3: Staff Portal Tables
-- =================================================

\echo ''
\echo '================================================='
\echo 'Phase 3: Creating staff portal tables...'
\echo '================================================='

\i lib/supabase/add-staff-portal-tables.sql
\echo '✓ Staff portal tables created (checklists, leaves, claims, requests, announcements)'

-- =================================================
-- Phase 5: Equipment Tables
-- =================================================

\echo ''
\echo '================================================='
\echo 'Phase 5: Creating equipment tracking tables...'
\echo '================================================='

\i lib/supabase/add-equipment-tables.sql
\echo '✓ Oil tracker and equipment tables created'

-- =================================================
-- Phase 6: KPI & Gamification Tables
-- =================================================

\echo ''
\echo '================================================='
\echo 'Phase 6: Creating KPI and gamification tables...'
\echo '================================================='

\i lib/supabase/add-kpi-tables.sql
\echo '✓ KPI and gamification tables created'

-- =================================================
-- Phase 7: Scheduling Tables
-- =================================================

\echo ''
\echo '================================================='
\echo 'Phase 7: Creating scheduling tables...'
\echo '================================================='

\i lib/supabase/add-scheduling-tables.sql
\echo '✓ Shift and schedule tables created'

-- =================================================
-- Phase 8: Promotions & Notifications Tables
-- =================================================

\echo ''
\echo '================================================='
\echo 'Phase 8: Creating promotions and notifications tables...'
\echo '================================================='

\i lib/supabase/add-promotions-notifications-tables.sql
\echo '✓ Promotions and notifications tables created'

-- =================================================
-- Phase 9: Enable Realtime
-- =================================================

\echo ''
\echo '================================================='
\echo 'Phase 9: Enabling realtime subscriptions...'
\echo '================================================='

\i lib/supabase/enable-realtime-all-tables.sql
\echo '✓ Realtime enabled for all tables'

-- =================================================
-- Final Summary
-- =================================================

\echo ''
\echo '================================================='
\echo 'Migration Complete!'
\echo '================================================='
\echo ''
\echo 'Summary of created tables:'
\echo '- inventory_logs'
\echo '- production_logs'
\echo '- delivery_orders'
\echo '- daily_cash_flows'
\echo '- recipes'
\echo '- checklist_templates'
\echo '- checklist_completions'
\echo '- leave_balances'
\echo '- leave_requests'
\echo '- claim_requests'
\echo '- staff_requests'
\echo '- announcements'
\echo '- oil_trackers'
\echo '- oil_change_requests'
\echo '- oil_action_history'
\echo '- staff_kpi'
\echo '- training_records'
\echo '- ot_records'
\echo '- customer_reviews'
\echo '- leave_records'
\echo '- shifts'
\echo '- schedule_entries'
\echo '- promotions'
\echo '- notifications'
\echo ''
\echo 'Realtime subscriptions enabled for ALL tables!'
\echo ''
\echo 'Next steps:'
\echo '1. Update operations.ts with new CRUD functions (DONE)'
\echo '2. Update store.tsx to use Supabase instead of localStorage'
\echo '3. Run migration script to import localStorage data'
\echo '4. Test realtime synchronization'
\echo ''

-- Verify table count
SELECT 
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE table_schema = 'public') as public_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- List all tables with row counts
\echo 'Current database tables:'
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

