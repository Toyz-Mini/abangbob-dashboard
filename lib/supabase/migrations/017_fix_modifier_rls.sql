-- Fix Modifier Tables RLS Policies
-- Allow all operations on modifier tables for authenticated users

-- ==========================================
-- MODIFIER_GROUPS - Permissive Access
-- ==========================================
ALTER TABLE IF EXISTS public.modifier_groups ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Anyone can view modifier groups" ON public.modifier_groups;
DROP POLICY IF EXISTS "Anyone can manage modifier groups" ON public.modifier_groups;
DROP POLICY IF EXISTS "modifier_groups_all_access" ON public.modifier_groups;

-- Create permissive policy for all operations
CREATE POLICY "modifier_groups_all_access" ON public.modifier_groups
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- MODIFIER_OPTIONS - Permissive Access
-- ==========================================
ALTER TABLE IF EXISTS public.modifier_options ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Anyone can view modifier options" ON public.modifier_options;
DROP POLICY IF EXISTS "Anyone can manage modifier options" ON public.modifier_options;
DROP POLICY IF EXISTS "modifier_options_all_access" ON public.modifier_options;

-- Create permissive policy for all operations
CREATE POLICY "modifier_options_all_access" ON public.modifier_options
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- VERIFICATION
-- ==========================================
-- After running this, both modifier tables should allow:
-- SELECT, INSERT, UPDATE, DELETE for all users
