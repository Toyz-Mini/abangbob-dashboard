-- Migration to add missing foreign key indexes and drop unused indexes
-- Detected by Supabase Linter

-- Drop unused index
DROP INDEX IF EXISTS public."account_userId_idx";

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS announcements_outlet_id_idx ON public.announcements(outlet_id);
CREATE INDEX IF NOT EXISTS attendance_outlet_id_idx ON public.attendance(outlet_id);
CREATE INDEX IF NOT EXISTS cash_flows_outlet_id_idx ON public.cash_flows(outlet_id);
CREATE INDEX IF NOT EXISTS cash_registers_outlet_id_idx ON public.cash_registers(outlet_id);
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS checklist_completions_outlet_id_idx ON public.checklist_completions(outlet_id);
CREATE INDEX IF NOT EXISTS checklist_templates_outlet_id_idx ON public.checklist_templates(outlet_id);
CREATE INDEX IF NOT EXISTS customer_reviews_customer_id_idx ON public.customer_reviews(customer_id);
CREATE INDEX IF NOT EXISTS customer_reviews_order_id_idx ON public.customer_reviews(order_id);
CREATE INDEX IF NOT EXISTS delivery_orders_order_id_idx ON public.delivery_orders(order_id);
CREATE INDEX IF NOT EXISTS delivery_orders_outlet_id_idx ON public.delivery_orders(outlet_id);
CREATE INDEX IF NOT EXISTS event_checklists_outlet_id_idx ON public.event_checklists(outlet_id);
CREATE INDEX IF NOT EXISTS expenses_outlet_id_idx ON public.expenses(outlet_id);
CREATE INDEX IF NOT EXISTS inventory_supplier_id_idx ON public.inventory(supplier_id);
CREATE INDEX IF NOT EXISTS inventory_outlet_id_idx ON public.inventory(outlet_id);
CREATE INDEX IF NOT EXISTS inventory_logs_outlet_id_idx ON public.inventory_logs(outlet_id);
CREATE INDEX IF NOT EXISTS loyalty_transactions_customer_id_idx ON public.loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS loyalty_transactions_order_id_idx ON public.loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS maintenance_logs_equipment_id_idx ON public.maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS maintenance_logs_performed_by_idx ON public.maintenance_logs(performed_by);
CREATE INDEX IF NOT EXISTS maintenance_logs_scheduled_task_id_idx ON public.maintenance_logs(scheduled_task_id);
CREATE INDEX IF NOT EXISTS maintenance_schedule_equipment_id_idx ON public.maintenance_schedule(equipment_id);
CREATE INDEX IF NOT EXISTS modifier_groups_outlet_id_idx ON public.modifier_groups(outlet_id);
CREATE INDEX IF NOT EXISTS modifier_options_outlet_id_idx ON public.modifier_options(outlet_id);
CREATE INDEX IF NOT EXISTS notifications_outlet_id_idx ON public.notifications(outlet_id);
CREATE INDEX IF NOT EXISTS oil_action_history_fryer_id_idx ON public.oil_action_history(fryer_id);
CREATE INDEX IF NOT EXISTS oil_change_requests_fryer_id_idx ON public.oil_change_requests(fryer_id);
CREATE INDEX IF NOT EXISTS oil_trackers_outlet_id_idx ON public.oil_trackers(outlet_id);
CREATE INDEX IF NOT EXISTS orders_outlet_id_idx ON public.orders(outlet_id);
CREATE INDEX IF NOT EXISTS orders_promo_code_id_idx ON public.orders(promo_code_id);
CREATE INDEX IF NOT EXISTS production_logs_outlet_id_idx ON public.production_logs(outlet_id);
CREATE INDEX IF NOT EXISTS promo_codes_outlet_id_idx ON public.promo_codes(outlet_id);
CREATE INDEX IF NOT EXISTS promo_usages_customer_id_idx ON public.promo_usages(customer_id);
CREATE INDEX IF NOT EXISTS promo_usages_order_id_idx ON public.promo_usages(order_id);
CREATE INDEX IF NOT EXISTS promo_usages_promo_code_id_idx ON public.promo_usages(promo_code_id);
CREATE INDEX IF NOT EXISTS promotions_outlet_id_idx ON public.promotions(outlet_id);
CREATE INDEX IF NOT EXISTS purchase_orders_outlet_id_idx ON public.purchase_orders(outlet_id);
CREATE INDEX IF NOT EXISTS purchase_orders_supplier_id_idx ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS recipes_outlet_id_idx ON public.recipes(outlet_id);
CREATE INDEX IF NOT EXISTS replacement_leaves_holiday_work_log_id_idx ON public.replacement_leaves(holiday_work_log_id);
CREATE INDEX IF NOT EXISTS schedule_entries_outlet_id_idx ON public.schedule_entries(outlet_id);
CREATE INDEX IF NOT EXISTS schedule_entries_shift_id_idx ON public.schedule_entries(shift_id);
CREATE INDEX IF NOT EXISTS schedules_outlet_id_idx ON public.schedules(outlet_id);
CREATE INDEX IF NOT EXISTS shifts_outlet_id_idx ON public.shifts(outlet_id);
CREATE INDEX IF NOT EXISTS sop_log_items_log_id_idx ON public.sop_log_items(log_id);
CREATE INDEX IF NOT EXISTS sop_log_items_step_id_idx ON public.sop_log_items(step_id);
CREATE INDEX IF NOT EXISTS sop_logs_outlet_id_idx ON public.sop_logs(outlet_id);
CREATE INDEX IF NOT EXISTS sop_logs_template_id_idx ON public.sop_logs(template_id);
CREATE INDEX IF NOT EXISTS staff_shifts_shift_id_idx ON public.staff_shifts(shift_id);
CREATE INDEX IF NOT EXISTS void_refund_requests_order_id_idx ON public.void_refund_requests(order_id);
CREATE INDEX IF NOT EXISTS waste_logs_reported_by_idx ON public.waste_logs(reported_by);
CREATE INDEX IF NOT EXISTS xp_logs_staff_id_idx ON public.xp_logs(staff_id);
