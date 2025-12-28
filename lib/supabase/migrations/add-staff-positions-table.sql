-- Staff Positions Table
-- This table stores staff positions (e.g., Supervisor, Manager, Senior Crew, Runner)
-- with permissions for each position

CREATE TABLE IF NOT EXISTS public.staff_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  role TEXT NOT NULL DEFAULT 'Staff' CHECK (role IN ('Manager', 'Staff')),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  -- Permissions (similar to StaffPermissions interface)
  permissions JSONB DEFAULT '{
    "canApproveLeave": false,
    "canApproveClaims": false,
    "canViewReports": false,
    "canManageStaff": false,
    "canAccessPOS": true,
    "canGiveDiscount": false,
    "maxDiscountPercent": 0,
    "canVoidTransaction": false,
    "canAccessInventory": false,
    "canAccessFinance": false,
    "canAccessKDS": false,
    "canManageMenu": false
  }'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_positions_role ON public.staff_positions(role);
CREATE INDEX IF NOT EXISTS idx_staff_positions_active ON public.staff_positions(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_positions_order ON public.staff_positions(display_order);

-- Enable RLS
ALTER TABLE public.staff_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read access for anon key
CREATE POLICY "Allow public read access" 
ON public.staff_positions 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow authenticated users to manage (insert/update/delete)
CREATE POLICY "Allow authenticated manage" 
ON public.staff_positions 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_staff_positions_updated_at BEFORE UPDATE ON public.staff_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_positions;

-- Seed default positions
INSERT INTO public.staff_positions (name, description, role, is_active, display_order, permissions) VALUES
-- Manager positions
('Outlet Manager', 'Pengurus outlet utama', 'Manager', true, 1, '{
  "canApproveLeave": true,
  "canApproveClaims": true,
  "canViewReports": true,
  "canManageStaff": true,
  "canAccessPOS": true,
  "canGiveDiscount": true,
  "maxDiscountPercent": 30,
  "canVoidTransaction": true,
  "canAccessInventory": true,
  "canAccessFinance": true,
  "canAccessKDS": true,
  "canManageMenu": true
}'::jsonb),
('Assistant Manager', 'Penolong pengurus', 'Manager', true, 2, '{
  "canApproveLeave": true,
  "canApproveClaims": true,
  "canViewReports": true,
  "canManageStaff": false,
  "canAccessPOS": true,
  "canGiveDiscount": true,
  "maxDiscountPercent": 20,
  "canVoidTransaction": true,
  "canAccessInventory": true,
  "canAccessFinance": false,
  "canAccessKDS": true,
  "canManageMenu": true
}'::jsonb),
('Shift Supervisor', 'Penyelia shift', 'Manager', true, 3, '{
  "canApproveLeave": false,
  "canApproveClaims": false,
  "canViewReports": true,
  "canManageStaff": false,
  "canAccessPOS": true,
  "canGiveDiscount": true,
  "maxDiscountPercent": 15,
  "canVoidTransaction": true,
  "canAccessInventory": true,
  "canAccessFinance": false,
  "canAccessKDS": true,
  "canManageMenu": false
}'::jsonb),
('Kitchen Manager', 'Pengurus dapur', 'Manager', true, 4, '{
  "canApproveLeave": false,
  "canApproveClaims": false,
  "canViewReports": true,
  "canManageStaff": false,
  "canAccessPOS": false,
  "canGiveDiscount": false,
  "maxDiscountPercent": 0,
  "canVoidTransaction": false,
  "canAccessInventory": true,
  "canAccessFinance": false,
  "canAccessKDS": true,
  "canManageMenu": true
}'::jsonb),
-- Staff positions
('Senior Cashier', 'Juruwang senior', 'Staff', true, 5, '{
  "canApproveLeave": false,
  "canApproveClaims": false,
  "canViewReports": false,
  "canManageStaff": false,
  "canAccessPOS": true,
  "canGiveDiscount": true,
  "maxDiscountPercent": 10,
  "canVoidTransaction": false,
  "canAccessInventory": true,
  "canAccessFinance": false,
  "canAccessKDS": false,
  "canManageMenu": false
}'::jsonb),
('Cashier', 'Juruwang', 'Staff', true, 6, '{
  "canApproveLeave": false,
  "canApproveClaims": false,
  "canViewReports": false,
  "canManageStaff": false,
  "canAccessPOS": true,
  "canGiveDiscount": false,
  "maxDiscountPercent": 0,
  "canVoidTransaction": false,
  "canAccessInventory": false,
  "canAccessFinance": false,
  "canAccessKDS": false,
  "canManageMenu": false
}'::jsonb),
('Kitchen Crew', 'Pekerja dapur', 'Staff', true, 7, '{
  "canApproveLeave": false,
  "canApproveClaims": false,
  "canViewReports": false,
  "canManageStaff": false,
  "canAccessPOS": false,
  "canGiveDiscount": false,
  "maxDiscountPercent": 0,
  "canVoidTransaction": false,
  "canAccessInventory": false,
  "canAccessFinance": false,
  "canAccessKDS": true,
  "canManageMenu": false
}'::jsonb),
('Cook', 'Tukang masak', 'Staff', true, 8, '{
  "canApproveLeave": false,
  "canApproveClaims": false,
  "canViewReports": false,
  "canManageStaff": false,
  "canAccessPOS": false,
  "canGiveDiscount": false,
  "maxDiscountPercent": 0,
  "canVoidTransaction": false,
  "canAccessInventory": true,
  "canAccessFinance": false,
  "canAccessKDS": true,
  "canManageMenu": false
}'::jsonb),
('Runner', 'Pembawa makanan', 'Staff', true, 9, '{
  "canApproveLeave": false,
  "canApproveClaims": false,
  "canViewReports": false,
  "canManageStaff": false,
  "canAccessPOS": false,
  "canGiveDiscount": false,
  "maxDiscountPercent": 0,
  "canVoidTransaction": false,
  "canAccessInventory": false,
  "canAccessFinance": false,
  "canAccessKDS": true,
  "canManageMenu": false
}'::jsonb),
('Cleaner', 'Pekerja kebersihan', 'Staff', true, 10, '{
  "canApproveLeave": false,
  "canApproveClaims": false,
  "canViewReports": false,
  "canManageStaff": false,
  "canAccessPOS": false,
  "canGiveDiscount": false,
  "maxDiscountPercent": 0,
  "canVoidTransaction": false,
  "canAccessInventory": false,
  "canAccessFinance": false,
  "canAccessKDS": false,
  "canManageMenu": false
}'::jsonb),
('Delivery Rider', 'Penghantar', 'Staff', true, 11, '{
  "canApproveLeave": false,
  "canApproveClaims": false,
  "canViewReports": false,
  "canManageStaff": false,
  "canAccessPOS": false,
  "canGiveDiscount": false,
  "maxDiscountPercent": 0,
  "canVoidTransaction": false,
  "canAccessInventory": false,
  "canAccessFinance": false,
  "canAccessKDS": false,
  "canManageMenu": false
}'::jsonb),
('Trainee', 'Pelatih', 'Staff', true, 12, '{
  "canApproveLeave": false,
  "canApproveClaims": false,
  "canViewReports": false,
  "canManageStaff": false,
  "canAccessPOS": true,
  "canGiveDiscount": false,
  "maxDiscountPercent": 0,
  "canVoidTransaction": false,
  "canAccessInventory": false,
  "canAccessFinance": false,
  "canAccessKDS": false,
  "canManageMenu": false
}'::jsonb)
ON CONFLICT (name) DO NOTHING;
