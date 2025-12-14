-- Scheduling Tables: Shifts and Schedule Entries
-- Phase 7: Staff scheduling system

-- ========================================
-- SHIFTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL, -- HH:mm format
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 0, -- minutes
  color TEXT DEFAULT '#3b82f6',
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_outlet ON public.shifts(outlet_id);
CREATE INDEX IF NOT EXISTS idx_shifts_active ON public.shifts(is_active);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shifts" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Managers can manage shifts" ON public.shifts FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;

-- ========================================
-- SCHEDULE ENTRIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.schedule_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  shift_name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'absent', 'cancelled')),
  notes TEXT,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_entries_staff ON public.schedule_entries(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_shift ON public.schedule_entries(shift_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_date ON public.schedule_entries(date);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_status ON public.schedule_entries(status);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_outlet ON public.schedule_entries(outlet_id);

-- Unique constraint: one staff cannot have overlapping shifts
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_entries_unique 
  ON public.schedule_entries(staff_id, date, start_time);

ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view schedule entries" ON public.schedule_entries FOR SELECT USING (true);
CREATE POLICY "Managers can manage schedule entries" ON public.schedule_entries FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_entries;

CREATE TRIGGER update_schedule_entries_updated_at BEFORE UPDATE ON public.schedule_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.shifts IS 'Shift definitions (morning, evening, night, etc)';
COMMENT ON TABLE public.schedule_entries IS 'Staff roster and schedule assignments';

