-- =====================================================
-- Migration 028: Enhanced Attendance System
-- Created: 2025-12-26
-- Features: Shift Management, Late Detection, Overtime
-- =====================================================

-- =====================================================
-- 1. SHIFT DEFINITIONS TABLE (Admin Configurable)
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ms TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default 3 Shifts (8 AM - 10 PM operation)
INSERT INTO shift_definitions (name, name_ms, code, start_time, end_time, color, sort_order) VALUES
  ('Morning', 'Pagi', 'MORNING', '08:00', '14:00', '#f59e0b', 1),
  ('Evening', 'Petang', 'EVENING', '14:00', '18:00', '#3b82f6', 2),
  ('Night', 'Malam', 'NIGHT', '18:00', '22:00', '#8b5cf6', 3)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 2. STAFF SHIFT ASSIGNMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id TEXT NOT NULL,
  shift_id UUID REFERENCES shift_definitions(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_off_day BOOLEAN DEFAULT FALSE,
  outlet_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, day_of_week)
);

-- =====================================================
-- 3. HOLIDAYS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ms TEXT,
  is_national BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2025 Brunei Public Holidays
INSERT INTO holidays (date, name, name_ms) VALUES
  ('2025-01-01', 'New Year', 'Tahun Baru'),
  ('2025-02-23', 'National Day', 'Hari Kebangsaan'),
  ('2025-03-31', 'Hari Raya Aidilfitri', 'Hari Raya'),
  ('2025-04-01', 'Hari Raya Aidilfitri Day 2', 'Hari Raya Hari Ke-2'),
  ('2025-05-01', 'Labour Day', 'Hari Pekerja'),
  ('2025-06-07', 'Hari Raya Haji', 'Hari Raya Haji'),
  ('2025-07-15', 'Sultan Birthday', 'Hari Keputeraan'),
  ('2025-12-25', 'Christmas', 'Hari Krismas')
ON CONFLICT (date) DO NOTHING;

-- =====================================================
-- 4. SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Default Attendance Settings
INSERT INTO system_settings (key, value, category, description) VALUES
  ('late_threshold_minutes', '15', 'attendance', 'Grace period before late'),
  ('early_clock_in_limit_minutes', '30', 'attendance', 'Max minutes before shift to clock in'),
  ('overtime_threshold_minutes', '30', 'attendance', 'Minutes after shift to count as OT'),
  ('forgot_clock_out_hours', '10', 'attendance', 'Hours before auto clock-out'),
  ('max_late_per_month', '3', 'attendance', 'Late limit before escalation'),
  ('standard_shift_hours', '8', 'attendance', 'Default work hours'),
  ('timezone', 'Asia/Brunei', 'system', 'System timezone'),
  ('gps_required', 'true', 'attendance', 'Require GPS for clock in'),
  ('selfie_required', 'true', 'attendance', 'Require selfie for clock in')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 5. LATE REASON CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS late_reason_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ms TEXT NOT NULL,
  icon TEXT,
  requires_note BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO late_reason_categories (code, name, name_ms, icon, requires_note, sort_order) VALUES
  ('TRAFFIC', 'Traffic Jam', 'Kesesakan Lalu Lintas', '🚗', FALSE, 1),
  ('MEDICAL', 'Medical Appointment', 'Temu Janji Perubatan', '🏥', FALSE, 2),
  ('FAMILY', 'Family Emergency', 'Kecemasan Keluarga', '🏠', FALSE, 3),
  ('TRANSPORT', 'Transport Issue', 'Masalah Pengangkutan', '🚌', FALSE, 4),
  ('WEATHER', 'Bad Weather', 'Cuaca Buruk', '🌧️', FALSE, 5),
  ('VEHICLE', 'Vehicle Breakdown', 'Kerosakan Kenderaan', '🔧', FALSE, 6),
  ('OTHER', 'Other', 'Lain-lain', '📝', TRUE, 99)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 6. ENHANCE ATTENDANCE TABLE
-- =====================================================
ALTER TABLE attendance 
  ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS late_reason_code TEXT,
  ADD COLUMN IF NOT EXISTS late_reason_note TEXT,
  ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_early_leave BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS overtime_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_approved BOOLEAN,
  ADD COLUMN IF NOT EXISTS overtime_approved_by TEXT,
  ADD COLUMN IF NOT EXISTS overtime_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shift_id UUID,
  ADD COLUMN IF NOT EXISTS expected_clock_in TIME,
  ADD COLUMN IF NOT EXISTS expected_clock_out TIME,
  ADD COLUMN IF NOT EXISTS is_holiday BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS clock_in_method TEXT DEFAULT 'manual';

-- =====================================================
-- 7. SETTINGS AUDIT LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS settings_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_attendance_late ON attendance(is_late) WHERE is_late = TRUE;
CREATE INDEX IF NOT EXISTS idx_attendance_date_staff ON attendance(date, staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_overtime ON attendance(overtime_minutes) WHERE overtime_minutes > 0;
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff ON staff_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_day ON staff_shifts(day_of_week);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_shift_definitions_active ON shift_definitions(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 9. DISABLE RLS (Following Existing Pattern)
-- =====================================================
ALTER TABLE shift_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE late_reason_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings_audit_log DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Migration 028 completed successfully!' AS status;
