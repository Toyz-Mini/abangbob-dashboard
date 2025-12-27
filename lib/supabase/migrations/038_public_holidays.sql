-- ==========================================
-- 038_public_holidays.sql
-- Public Holiday Calendar System
-- ==========================================

-- ==========================================
-- TABLE 1: public_holidays - Master list cuti umum
-- ==========================================

CREATE TABLE IF NOT EXISTS public_holidays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_month INTEGER CHECK (recurring_month >= 1 AND recurring_month <= 12),
  recurring_day INTEGER CHECK (recurring_day >= 1 AND recurring_day <= 31),
  country TEXT DEFAULT 'BN',
  is_national BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to public_holidays" ON public_holidays
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public_holidays;

CREATE INDEX IF NOT EXISTS idx_public_holidays_date ON public_holidays(date);
CREATE INDEX IF NOT EXISTS idx_public_holidays_country ON public_holidays(country);
CREATE INDEX IF NOT EXISTS idx_public_holidays_recurring ON public_holidays(is_recurring);

-- ==========================================
-- TABLE 2: holiday_policies - Policy compensation untuk setiap holiday
-- ==========================================

CREATE TABLE IF NOT EXISTS holiday_policies (
  id TEXT PRIMARY KEY,
  holiday_id TEXT NOT NULL REFERENCES public_holidays(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  is_operating BOOLEAN DEFAULT false,
  compensation_type TEXT NOT NULL DEFAULT 'none' CHECK (compensation_type IN ('none', 'double_pay', 'replacement_leave', 'staff_choice')),
  pay_multiplier NUMERIC DEFAULT 2.0,
  allow_staff_choice BOOLEAN DEFAULT true,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(holiday_id, year)
);

ALTER TABLE holiday_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to holiday_policies" ON holiday_policies
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE holiday_policies;

CREATE INDEX IF NOT EXISTS idx_holiday_policies_holiday_id ON holiday_policies(holiday_id);
CREATE INDEX IF NOT EXISTS idx_holiday_policies_year ON holiday_policies(year);
CREATE INDEX IF NOT EXISTS idx_holiday_policies_compensation_type ON holiday_policies(compensation_type);

-- ==========================================
-- TABLE 3: holiday_work_logs - Record siapa kerja pada holiday
-- ==========================================

CREATE TABLE IF NOT EXISTS holiday_work_logs (
  id TEXT PRIMARY KEY,
  holiday_id TEXT NOT NULL REFERENCES public_holidays(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  work_date DATE NOT NULL,
  shift_id TEXT,
  hours_worked NUMERIC,
  compensation_choice TEXT NOT NULL CHECK (compensation_choice IN ('double_pay', 'replacement_leave')),
  compensation_processed BOOLEAN DEFAULT false,
  payroll_entry_id TEXT,
  replacement_leave_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE holiday_work_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to holiday_work_logs" ON holiday_work_logs
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE holiday_work_logs;

CREATE INDEX IF NOT EXISTS idx_holiday_work_logs_holiday_id ON holiday_work_logs(holiday_id);
CREATE INDEX IF NOT EXISTS idx_holiday_work_logs_staff_id ON holiday_work_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_holiday_work_logs_work_date ON holiday_work_logs(work_date);
CREATE INDEX IF NOT EXISTS idx_holiday_work_logs_processed ON holiday_work_logs(compensation_processed);

-- ==========================================
-- TABLE 4: replacement_leaves - Track replacement leave balance
-- ==========================================

CREATE TABLE IF NOT EXISTS replacement_leaves (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  holiday_work_log_id TEXT REFERENCES holiday_work_logs(id) ON DELETE SET NULL,
  holiday_name TEXT,
  earned_date DATE NOT NULL,
  expires_at DATE NOT NULL,
  days NUMERIC DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used', 'expired')),
  used_leave_request_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE replacement_leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to replacement_leaves" ON replacement_leaves
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE replacement_leaves;

CREATE INDEX IF NOT EXISTS idx_replacement_leaves_staff_id ON replacement_leaves(staff_id);
CREATE INDEX IF NOT EXISTS idx_replacement_leaves_status ON replacement_leaves(status);
CREATE INDEX IF NOT EXISTS idx_replacement_leaves_expires_at ON replacement_leaves(expires_at);
CREATE INDEX IF NOT EXISTS idx_replacement_leaves_earned_date ON replacement_leaves(earned_date DESC);

-- ==========================================
-- SEED: Brunei Public Holidays 2025
-- ==========================================

INSERT INTO public_holidays (id, name, date, is_recurring, recurring_month, recurring_day, country, is_national) VALUES
  ('ph_2025_new_year', 'Tahun Baru', '2025-01-01', true, 1, 1, 'BN', true),
  ('ph_2025_israk_mikraj', 'Israk Mikraj', '2025-01-27', false, NULL, NULL, 'BN', true),
  ('ph_2025_national_day', 'Hari Kebangsaan', '2025-02-23', true, 2, 23, 'BN', true),
  ('ph_2025_nuzul_quran', 'Nuzul Al-Quran', '2025-02-28', false, NULL, NULL, 'BN', true),
  ('ph_2025_hari_raya_1', 'Hari Raya Aidilfitri (Hari 1)', '2025-03-30', false, NULL, NULL, 'BN', true),
  ('ph_2025_hari_raya_2', 'Hari Raya Aidilfitri (Hari 2)', '2025-03-31', false, NULL, NULL, 'BN', true),
  ('ph_2025_raf_day', 'Hari Pasukan Angkatan Bersenjata', '2025-05-31', true, 5, 31, 'BN', true),
  ('ph_2025_aidiladha_1', 'Hari Raya Aidiladha (Hari 1)', '2025-06-06', false, NULL, NULL, 'BN', true),
  ('ph_2025_aidiladha_2', 'Hari Raya Aidiladha (Hari 2)', '2025-06-07', false, NULL, NULL, 'BN', true),
  ('ph_2025_hijrah', 'Awal Muharam (Hijrah)', '2025-06-27', false, NULL, NULL, 'BN', true),
  ('ph_2025_kdymm_bday', 'Hari Keputeraan KDYMM', '2025-07-15', true, 7, 15, 'BN', true),
  ('ph_2025_maulidur_rasul', 'Maulidur Rasul', '2025-09-05', false, NULL, NULL, 'BN', true),
  ('ph_2025_christmas', 'Hari Krismas', '2025-12-25', true, 12, 25, 'BN', true)
ON CONFLICT (id) DO NOTHING;

-- Create default policies for 2025 holidays (Staff Choice with 2x pay)
INSERT INTO holiday_policies (id, holiday_id, year, is_operating, compensation_type, pay_multiplier, allow_staff_choice) VALUES
  ('hp_2025_new_year', 'ph_2025_new_year', 2025, true, 'staff_choice', 2.0, true),
  ('hp_2025_israk_mikraj', 'ph_2025_israk_mikraj', 2025, true, 'staff_choice', 2.0, true),
  ('hp_2025_national_day', 'ph_2025_national_day', 2025, false, 'none', 2.0, false),
  ('hp_2025_nuzul_quran', 'ph_2025_nuzul_quran', 2025, true, 'staff_choice', 2.0, true),
  ('hp_2025_hari_raya_1', 'ph_2025_hari_raya_1', 2025, false, 'none', 2.0, false),
  ('hp_2025_hari_raya_2', 'ph_2025_hari_raya_2', 2025, false, 'none', 2.0, false),
  ('hp_2025_raf_day', 'ph_2025_raf_day', 2025, true, 'staff_choice', 2.0, true),
  ('hp_2025_aidiladha_1', 'ph_2025_aidiladha_1', 2025, false, 'none', 2.0, false),
  ('hp_2025_aidiladha_2', 'ph_2025_aidiladha_2', 2025, false, 'none', 2.0, false),
  ('hp_2025_hijrah', 'ph_2025_hijrah', 2025, true, 'staff_choice', 2.0, true),
  ('hp_2025_kdymm_bday', 'hp_2025_kdymm_bday', 2025, false, 'none', 2.0, false),
  ('hp_2025_maulidur_rasul', 'ph_2025_maulidur_rasul', 2025, true, 'staff_choice', 2.0, true),
  ('hp_2025_christmas', 'ph_2025_christmas', 2025, true, 'staff_choice', 2.0, true)
ON CONFLICT (id) DO NOTHING;
