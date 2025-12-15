-- Payment Methods & Tax Rates Tables
-- Purpose: Store payment method configurations and tax rates in Supabase

-- ============================================
-- Payment Methods Table
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3b82f6',
    is_enabled BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read payment methods
CREATE POLICY "Allow authenticated read payment_methods"
    ON payment_methods
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert payment methods
CREATE POLICY "Allow authenticated insert payment_methods"
    ON payment_methods
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update payment methods
CREATE POLICY "Allow authenticated update payment_methods"
    ON payment_methods
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete payment methods
CREATE POLICY "Allow authenticated delete payment_methods"
    ON payment_methods
    FOR DELETE
    TO authenticated
    USING (true);

-- Add updated_at trigger for payment_methods
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_updated_at();

-- ============================================
-- Tax Rates Table
-- ============================================
CREATE TABLE IF NOT EXISTS tax_rates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rate NUMERIC(5, 2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for tax_rates
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read tax rates
CREATE POLICY "Allow authenticated read tax_rates"
    ON tax_rates
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert tax rates
CREATE POLICY "Allow authenticated insert tax_rates"
    ON tax_rates
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update tax rates
CREATE POLICY "Allow authenticated update tax_rates"
    ON tax_rates
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete tax rates
CREATE POLICY "Allow authenticated delete tax_rates"
    ON tax_rates
    FOR DELETE
    TO authenticated
    USING (true);

-- Add updated_at trigger for tax_rates
CREATE OR REPLACE FUNCTION update_tax_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tax_rates_updated_at
    BEFORE UPDATE ON tax_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_tax_rates_updated_at();

-- ============================================
-- Insert Default Payment Methods (if not exist)
-- ============================================
INSERT INTO payment_methods (id, name, code, color, is_enabled, sort_order)
VALUES 
    ('pm_cash_default', 'Tunai (Cash)', 'cash', '#10b981', true, 1),
    ('pm_card_default', 'Kad (Card)', 'card', '#3b82f6', true, 2),
    ('pm_qr_default', 'QR Code', 'qr', '#8b5cf6', true, 3)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Insert Default Tax Rate (if not exist)
-- ============================================
INSERT INTO tax_rates (id, name, rate, description, is_default, is_active)
VALUES 
    ('tax_none_default', 'No Tax', 0, 'Brunei has no sales tax', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON payment_methods(code);
CREATE INDEX IF NOT EXISTS idx_payment_methods_enabled ON payment_methods(is_enabled);
CREATE INDEX IF NOT EXISTS idx_tax_rates_default ON tax_rates(is_default);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON tax_rates(is_active);

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE payment_methods IS 'Store payment method configurations for POS system';
COMMENT ON TABLE tax_rates IS 'Store tax rate configurations for POS system';
