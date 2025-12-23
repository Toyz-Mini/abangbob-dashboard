-- Create Waste Tracking Tables

-- Drop table if exists
DROP TABLE IF EXISTS waste_logs CASCADE;

-- Waste Logs Table
CREATE TABLE IF NOT EXISTS waste_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- 'kg', 'unit', 'pack'
    cost_per_unit DECIMAL(10, 2) NOT NULL, -- Snapshot of cost at time of waste
    total_loss DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * cost_per_unit) STORED,
    reason VARCHAR(50) NOT NULL, -- 'Expired', 'Spilled', 'Burned', 'Customer Return', 'Staff Meal', 'Other'
    reported_by TEXT REFERENCES "user"(id),
    reported_by_name VARCHAR(100),
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies

-- Enable RLS
ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;

-- Policies for waste_logs
CREATE POLICY "Enable read access for all users" ON waste_logs FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON waste_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for admins and managers" ON waste_logs FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM "user"
        WHERE "user".id = auth.uid()::text
        AND "user".role IN ('Admin', 'Manager')
    )
);

-- Indexes
CREATE INDEX idx_waste_logs_stock_id ON waste_logs(stock_id);
CREATE INDEX idx_waste_logs_created_at ON waste_logs(created_at);
CREATE INDEX idx_waste_logs_reason ON waste_logs(reason);
