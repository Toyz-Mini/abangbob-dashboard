-- AbangBob Dashboard - Outlet Settings Migration
-- Run this SQL in Supabase SQL Editor to add all settings columns
-- This enables Settings page data to persist across deploys

-- ========================================
-- UPDATE OUTLET_SETTINGS TABLE
-- ========================================

-- Add new columns for comprehensive outlet settings
ALTER TABLE public.outlet_settings 
ADD COLUMN IF NOT EXISTS outlet_name TEXT,
ADD COLUMN IF NOT EXISTS outlet_address TEXT,
ADD COLUMN IF NOT EXISTS outlet_phone TEXT,
ADD COLUMN IF NOT EXISTS outlet_email TEXT,
ADD COLUMN IF NOT EXISTS outlet_logo_url TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BND',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Brunei',
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS receipt_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS appearance JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS security JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS whatsapp_config JSONB DEFAULT '{}'::jsonb;

-- ========================================
-- INSERT DEFAULT OUTLET SETTINGS (if not exists)
-- ========================================

-- Get the default outlet ID and create settings for it
INSERT INTO public.outlet_settings (
  outlet_id,
  outlet_name,
  outlet_address,
  outlet_phone,
  outlet_email,
  currency,
  timezone,
  tax_rate,
  payment_methods
)
SELECT 
  id,
  'AbangBob',
  'Door B, Rimba Point',
  '+673 712 3456',
  'order@abangbob.com',
  'BND',
  'Asia/Brunei',
  0,
  '{"cash": true, "card": true, "qr": true, "ewallet": false}'::jsonb
FROM public.outlets 
WHERE id = 'b1000000-0000-0000-0000-000000000001'
ON CONFLICT (outlet_id) DO NOTHING;

-- ========================================
-- CREATE GLOBAL SETTINGS TABLE (for non-outlet-specific settings)
-- ========================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB DEFAULT '{}'::jsonb,
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(setting_key);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "All access app_settings" ON public.app_settings FOR ALL USING (true);

-- Insert default app settings
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES 
  ('receipt_settings', '{}'::jsonb, 'Receipt printing configuration'),
  ('notification_settings', '{"lowStock": true, "orderReminder": true, "equipmentReminder": true}'::jsonb, 'Notification preferences'),
  ('appearance_settings', '{"sidebarCollapsed": false}'::jsonb, 'UI appearance settings'),
  ('security_settings', '{"requirePIN": true, "autoLogout": false, "autoLogoutMinutes": 30}'::jsonb, 'Security settings'),
  ('whatsapp_config', '{}'::jsonb, 'WhatsApp integration settings')
ON CONFLICT (setting_key) DO NOTHING;

-- Done! Run this SQL, then the settings page will sync to Supabase.
