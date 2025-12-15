-- =====================================================
-- ATTENDANCE SYSTEM WITH GEOLOCATION & SELFIE
-- =====================================================

-- Create allowed_locations table
CREATE TABLE IF NOT EXISTS public.allowed_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  date DATE NOT NULL,
  location_verified BOOLEAN DEFAULT false,
  location_id UUID REFERENCES public.allowed_locations(id) ON DELETE SET NULL,
  actual_latitude DECIMAL(10, 8),
  actual_longitude DECIMAL(11, 8),
  distance_meters DECIMAL(10, 2),
  selfie_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON public.attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_allowed_locations_active ON public.allowed_locations(is_active);

-- Enable RLS
ALTER TABLE public.allowed_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for allowed_locations
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.allowed_locations;
CREATE POLICY "Allow read for authenticated users" ON public.allowed_locations
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Allow admins to manage locations" ON public.allowed_locations;
CREATE POLICY "Allow admins to manage locations" ON public.allowed_locations
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.staff 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for attendance
DROP POLICY IF EXISTS "Staff can view own attendance" ON public.attendance;
CREATE POLICY "Staff can view own attendance" ON public.attendance
  FOR SELECT TO authenticated USING (staff_id = auth.uid());

DROP POLICY IF EXISTS "Staff can insert own attendance" ON public.attendance;
CREATE POLICY "Staff can insert own attendance" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (staff_id = auth.uid());

DROP POLICY IF EXISTS "Staff can update own attendance" ON public.attendance;
CREATE POLICY "Staff can update own attendance" ON public.attendance
  FOR UPDATE TO authenticated USING (staff_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
CREATE POLICY "Admins can view all attendance" ON public.attendance
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.staff 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Insert sample locations (optional - remove if not needed)
INSERT INTO public.allowed_locations (name, address, latitude, longitude, radius_meters)
VALUES 
  ('Outlet Gadong', 'Gadong, Brunei-Muara', 4.9083, 114.9136, 100),
  ('Outlet Kiulap', 'Kiulap, Brunei-Muara', 4.8897, 114.9309, 100)
ON CONFLICT DO NOTHING;

-- Create storage bucket for attendance photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-photos',
  'attendance-photos',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attendance photos
DROP POLICY IF EXISTS "Staff can upload own attendance photos" ON storage.objects;
CREATE POLICY "Staff can upload own attendance photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'attendance-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Staff can view own photos" ON storage.objects;
CREATE POLICY "Staff can view own photos" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'attendance-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins can view all attendance photos" ON storage.objects;
CREATE POLICY "Admins can view all attendance photos" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'attendance-photos' AND
    EXISTS (
      SELECT 1 FROM public.staff 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Staff can delete own photos" ON storage.objects;
CREATE POLICY "Staff can delete own photos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'attendance-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_allowed_locations_updated_at ON public.allowed_locations;
CREATE TRIGGER update_allowed_locations_updated_at
  BEFORE UPDATE ON public.allowed_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Attendance system tables and policies created successfully!';
  RAISE NOTICE 'Tables: allowed_locations, attendance';
  RAISE NOTICE 'Storage bucket: attendance-photos';
  RAISE NOTICE 'RLS policies: enabled';
END $$;
