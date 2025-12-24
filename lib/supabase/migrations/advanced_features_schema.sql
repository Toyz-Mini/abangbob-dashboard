-- Migration: Advanced Features (Loyalty, Promos, Order Tracking)
-- Created at: 2025-12-24

-- 1. Promo Codes Table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL, -- e.g. 10 for 10% or 5 for RM5
    min_spend NUMERIC DEFAULT 0,
    max_discount_amount NUMERIC, -- Cap for percentage discount
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    usage_limit INTEGER, -- Total times code can be used globally
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL
);

-- 2. Promo Usages Table (Track who used what)
CREATE TABLE IF NOT EXISTS promo_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, -- Nullable if guest checkout
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_amount NUMERIC NOT NULL
);

-- 3. Loyalty Transactions Table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'adjust', 'expire')),
    points INTEGER NOT NULL, -- Positive for earn, Negative for redeem
    description TEXT -- e.g. "Earned from Order #123"
);

-- 4. Update Orders Table with new columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER DEFAULT 0;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_usages_customer ON promo_usages(customer_id);
CREATE INDEX IF NOT EXISTS idx_promo_usages_promo ON promo_usages(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_transactions(customer_id);

-- 6. RLS Policies

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Promo Codes: Everyone can read active codes (to validate), only Admin/Manager can manage
CREATE POLICY "Public read active promos" ON promo_codes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Staff manage promos" ON promo_codes
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM staff WHERE role IN ('Admin', 'Manager')
        )
    );

-- Promo Usages: Users see their own usages, Staff see all
CREATE POLICY "Admin view all usages" ON promo_usages
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM staff WHERE role IN ('Admin', 'Manager', 'Staff')
        )
    );

-- Loyalty: Users see their own txns, Staff see all
CREATE POLICY "Admin view all loyalty" ON loyalty_transactions
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM staff WHERE role IN ('Admin', 'Manager', 'Staff')
        )
    );

-- Note: Customer policies (if using Supabase Auth for customers later) would be added here.
-- Currently customers are often guest or soft-auth, so public select might be needed depending on implementation details,
-- but for security we restrict to Staff for now and handle customer interaction via backend/edge functions or client with anon key carefully.
-- For this prototype/MVP, we'll allow public insert for loyalty/usages via client if the app uses client-side logic, 
-- but ideally this happens via a secure function. 
-- For simplicity in this "Staff Dashboard" context, we assume staff/server handles this or we open up INSERT for the anon key if needed for the Kiosk.

-- Allow Public Insert (Required for Kiosk/Web without auth to create records)
CREATE POLICY "Public insert promo usages" ON promo_usages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert loyalty" ON loyalty_transactions FOR INSERT WITH CHECK (true);
