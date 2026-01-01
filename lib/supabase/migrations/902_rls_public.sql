-- Migration: 902_rls_public.sql
-- Purpose: Secure Public Read-Only tables (Menu, Config, content).
-- Strategy:
--    - SELECT: TRUE (Public/Anon can view).
--    - INSERT/UPDATE/DELETE: Staff Only (is_staff()).

-- List of tables to apply this pattern to:
-- 1. menu_items
-- 2. modifier_groups
-- 3. modifier_options
-- 4. announcements
-- 5. app_settings
-- 6. tax_rates

-- Helper macro to apply policies (to avoid repetition)
-- Note: Postgres doesn't have macros in pure SQL like this, so we write explicitly.

-- =============================================================================
-- 1. MENU ITEMS
-- =============================================================================
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.menu_items;
DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Staff can edit menu items" ON public.menu_items;

CREATE POLICY "Public can view menu_items"
ON public.menu_items FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Staff can manage menu_items"
ON public.menu_items FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- =============================================================================
-- 2. MODIFIER GROUPS
-- =============================================================================
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.modifier_groups;
DROP POLICY IF EXISTS "Public can view modifier_groups" ON public.modifier_groups;

CREATE POLICY "Public can view modifier_groups"
ON public.modifier_groups FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Staff can manage modifier_groups"
ON public.modifier_groups FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- =============================================================================
-- 3. MODIFIER OPTIONS
-- =============================================================================
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.modifier_options;
DROP POLICY IF EXISTS "Public can view modifier_options" ON public.modifier_options;

CREATE POLICY "Public can view modifier_options"
ON public.modifier_options FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Staff can manage modifier_options"
ON public.modifier_options FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- =============================================================================
-- 4. ANNOUNCEMENTS
-- =============================================================================
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.announcements;

CREATE POLICY "Public can view announcements"
ON public.announcements FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Staff can manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- =============================================================================
-- 5. APP SETTINGS
-- =============================================================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.app_settings;

CREATE POLICY "Public can view app_settings"
ON public.app_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Staff can manage app_settings"
ON public.app_settings FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- =============================================================================
-- 6. TAX RATES
-- =============================================================================
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.tax_rates;

CREATE POLICY "Public can view tax_rates"
ON public.tax_rates FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Staff can manage tax_rates"
ON public.tax_rates FOR ALL
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());
