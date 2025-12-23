-- Fix Performance Warnings: Unindexed Foreign Keys
-- remediating: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

-- Announcements
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_outlet_id ON public.announcements(outlet_id);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_outlet_id ON public.attendance(outlet_id);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_outlet_id ON public.audit_logs(outlet_id);

-- Cash Flows
CREATE INDEX IF NOT EXISTS idx_cash_flows_closed_by ON public.cash_flows(closed_by);

-- Cash Registers
CREATE INDEX IF NOT EXISTS idx_cash_registers_closed_by ON public.cash_registers(closed_by);

-- Checklist Completions
CREATE INDEX IF NOT EXISTS idx_checklist_completions_outlet_id ON public.checklist_completions(outlet_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_shift_id ON public.checklist_completions(shift_id);

-- Checklist Templates
CREATE INDEX IF NOT EXISTS idx_checklist_templates_outlet_id ON public.checklist_templates(outlet_id);

-- Claim Requests
CREATE INDEX IF NOT EXISTS idx_claim_requests_approved_by ON public.claim_requests(approved_by);

-- Customer Reviews
CREATE INDEX IF NOT EXISTS idx_customer_reviews_customer_id ON public.customer_reviews(customer_id);

-- Delivery Orders
CREATE INDEX IF NOT EXISTS idx_delivery_orders_outlet_id ON public.delivery_orders(outlet_id);

-- Event Checklists
CREATE INDEX IF NOT EXISTS idx_event_checklists_checked_by ON public.event_checklists(checked_by);
CREATE INDEX IF NOT EXISTS idx_event_checklists_outlet_id ON public.event_checklists(outlet_id);
CREATE INDEX IF NOT EXISTS idx_event_checklists_prepared_by ON public.event_checklists(prepared_by);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_outlet_id ON public.expenses(outlet_id);

-- Interview Candidates
CREATE INDEX IF NOT EXISTS idx_interview_candidates_interviewer_id ON public.interview_candidates(interviewer_id);

-- Inventory
CREATE INDEX IF NOT EXISTS idx_inventory_outlet_id ON public.inventory(outlet_id);

-- Inventory Logs
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_by ON public.inventory_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_outlet_id ON public.inventory_logs(outlet_id);

-- Leave Records
CREATE INDEX IF NOT EXISTS idx_leave_records_approved_by ON public.leave_records(approved_by);

-- Leave Requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_approved_by ON public.leave_requests(approved_by);

-- Menu Items
CREATE INDEX IF NOT EXISTS idx_menu_items_outlet_id ON public.menu_items(outlet_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_outlet_id ON public.notifications(outlet_id);

-- Oil Action History
CREATE INDEX IF NOT EXISTS idx_oil_action_history_performed_by ON public.oil_action_history(performed_by);

-- Oil Change Requests
CREATE INDEX IF NOT EXISTS idx_oil_change_requests_approved_by ON public.oil_change_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_oil_change_requests_requested_by ON public.oil_change_requests(requested_by);

-- Oil Trackers
CREATE INDEX IF NOT EXISTS idx_oil_trackers_outlet_id ON public.oil_trackers(outlet_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_outlet_id ON public.orders(outlet_id);
CREATE INDEX IF NOT EXISTS idx_orders_refunded_by ON public.orders(refunded_by);
CREATE INDEX IF NOT EXISTS idx_orders_voided_by ON public.orders(voided_by);

-- OT Records
CREATE INDEX IF NOT EXISTS idx_ot_records_approved_by ON public.ot_records(approved_by);

-- Production Logs
CREATE INDEX IF NOT EXISTS idx_production_logs_outlet_id ON public.production_logs(outlet_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_produced_by ON public.production_logs(produced_by);

-- Promotions
CREATE INDEX IF NOT EXISTS idx_promotions_outlet_id ON public.promotions(outlet_id);

-- Purchase Orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_outlet_id ON public.purchase_orders(outlet_id);

-- Schedules
CREATE INDEX IF NOT EXISTS idx_schedules_shift_id ON public.schedules(shift_id);

-- Staff
CREATE INDEX IF NOT EXISTS idx_staff_outlet_id ON public.staff(outlet_id);

-- Staff Advances
CREATE INDEX IF NOT EXISTS idx_staff_advances_approved_by ON public.staff_advances(approved_by);

-- Staff Requests
CREATE INDEX IF NOT EXISTS idx_staff_requests_assigned_to ON public.staff_requests(assigned_to);
