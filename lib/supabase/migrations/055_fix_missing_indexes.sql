-- loyalty_transactions(order_id)
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order_id ON public.loyalty_transactions(order_id);

-- maintenance_logs(equipment_id)
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_equipment_id ON public.maintenance_logs(equipment_id);

-- maintenance_logs(performed_by)
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_performed_by ON public.maintenance_logs(performed_by);

-- maintenance_logs(scheduled_task_id)
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_scheduled_task_id ON public.maintenance_logs(scheduled_task_id);

-- maintenance_schedule(equipment_id)
CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_equipment_id ON public.maintenance_schedule(equipment_id);

-- orders(promo_code_id)
CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON public.orders(promo_code_id);

-- promo_codes(outlet_id)
CREATE INDEX IF NOT EXISTS idx_promo_codes_outlet_id ON public.promo_codes(outlet_id);

-- promo_usages(order_id)
CREATE INDEX IF NOT EXISTS idx_promo_usages_order_id ON public.promo_usages(order_id);

-- replacement_leaves(holiday_work_log_id)
CREATE INDEX IF NOT EXISTS idx_replacement_leaves_holiday_work_log_id ON public.replacement_leaves(holiday_work_log_id);

-- schedule_entries(outlet_id)
CREATE INDEX IF NOT EXISTS idx_schedule_entries_outlet_id ON public.schedule_entries(outlet_id);

-- sop_log_items(log_id)
CREATE INDEX IF NOT EXISTS idx_sop_log_items_log_id ON public.sop_log_items(log_id);

-- sop_log_items(step_id)
CREATE INDEX IF NOT EXISTS idx_sop_log_items_step_id ON public.sop_log_items(step_id);

-- sop_logs(outlet_id)
CREATE INDEX IF NOT EXISTS idx_sop_logs_outlet_id ON public.sop_logs(outlet_id);

-- sop_logs(template_id)
CREATE INDEX IF NOT EXISTS idx_sop_logs_template_id ON public.sop_logs(template_id);

-- staff_shifts(shift_id)
CREATE INDEX IF NOT EXISTS idx_staff_shifts_shift_id ON public.staff_shifts(shift_id);

-- waste_logs(reported_by)
CREATE INDEX IF NOT EXISTS idx_waste_logs_reported_by ON public.waste_logs(reported_by);

-- xp_logs(staff_id)
CREATE INDEX IF NOT EXISTS idx_xp_logs_staff_id ON public.xp_logs(staff_id);
