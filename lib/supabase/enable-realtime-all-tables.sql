-- Enable Realtime for ALL New Tables
-- Phase 9: Setup realtime subscriptions

-- Note: Run this AFTER all tables are created
-- This script is idempotent and safe to run multiple times

-- Enable realtime for existing tables that might not have it
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.staff;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.modifier_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.modifier_options;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.outlets;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.suppliers;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.void_refund_requests;

-- Enable realtime for NEW tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.inventory_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.production_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.delivery_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.daily_cash_flows;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.recipes;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.checklist_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.checklist_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.leave_balances;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.claim_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.staff_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.oil_trackers;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.oil_change_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.oil_action_history;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.staff_kpi;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.training_records;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.ot_records;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.customer_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.leave_records;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.schedule_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.promotions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.notifications;

-- Verify realtime is enabled (for debugging)
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

COMMENT ON PUBLICATION supabase_realtime IS 'Realtime subscriptions enabled for all AbangBob tables';

