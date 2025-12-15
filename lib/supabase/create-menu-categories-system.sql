-- Menu Categories Table
-- Purpose: Store menu category configurations in Supabase

-- ============================================
-- Menu Categories Table
-- ============================================
CREATE TABLE IF NOT EXISTS menu_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#3b82f6',
    sort_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for menu_categories
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read menu categories
CREATE POLICY "Allow authenticated read menu_categories"
    ON menu_categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert menu categories
CREATE POLICY "Allow authenticated insert menu_categories"
    ON menu_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update menu categories
CREATE POLICY "Allow authenticated update menu_categories"
    ON menu_categories
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete menu categories
CREATE POLICY "Allow authenticated delete menu_categories"
    ON menu_categories
    FOR DELETE
    TO authenticated
    USING (true);

-- Add updated_at trigger for menu_categories
CREATE OR REPLACE FUNCTION update_menu_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER menu_categories_updated_at
    BEFORE UPDATE ON menu_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_categories_updated_at();

-- ============================================
-- Insert Default Menu Categories (if not exist)
-- ============================================
INSERT INTO menu_categories (id, name, description, icon, color, sort_order, is_active)
VALUES 
    ('cat_nasi_lemak', 'Nasi Lemak', 'Traditional Malay rice dish', '🍚', '#ef4444', 1, true),
    ('cat_burger', 'Burger', 'Burgers and sandwiches', '🍔', '#f59e0b', 2, true),
    ('cat_western', 'Western', 'Western cuisine', '🍝', '#3b82f6', 3, true),
    ('cat_drinks', 'Minuman', 'Beverages and drinks', '🥤', '#8b5cf6', 4, true),
    ('cat_sides', 'Side Dishes', 'Side orders and extras', '🍟', '#10b981', 5, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_menu_categories_name ON menu_categories(name);
CREATE INDEX IF NOT EXISTS idx_menu_categories_active ON menu_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_categories_sort ON menu_categories(sort_order);

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE menu_categories IS 'Store menu category configurations for POS system';
