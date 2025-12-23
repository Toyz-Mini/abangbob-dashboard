-- Create Equipment & Facilities Management Tables

-- Drop tables if they exist to ensure clean state (especially for type changes)
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS maintenance_schedule CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;

-- 1. Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'fridge', 'freezer', 'ac', 'grill', 'fryer', 'pos', 'other'
    location VARCHAR(100), -- 'Kitchen', 'Counter', 'Store Room'
    model_number VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    warranty_expiry DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'maintenance', 'repair', 'broken', 'retired'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Maintenance Tasks / Schedule
CREATE TABLE IF NOT EXISTS maintenance_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL, -- 'Deep Cleaning', 'Gas Check', 'Filter Change'
    frequency_days INTEGER, -- e.g., 30 for monthly, 7 for weekly
    last_performed DATE,
    next_due DATE,
    assigned_role VARCHAR(50), -- 'Staff', 'Manager', 'Technician'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Maintenance Logs (History & Issues)
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
    scheduled_task_id UUID REFERENCES maintenance_schedule(id) ON DELETE SET NULL, -- Null if ad-hoc issue
    type VARCHAR(20) NOT NULL, -- 'routine', 'repair', 'issue'
    performed_by TEXT REFERENCES "user"(id), -- Changed to TEXT and referencing "user" table
    performed_by_name VARCHAR(100),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    cost DECIMAL(10, 2) DEFAULT 0,
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'in_progress', 'completed' (for issues reported)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies

-- Enable RLS
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Policies for equipment
CREATE POLICY "Enable read access for all users" ON equipment FOR SELECT USING (true);
CREATE POLICY "Enable write access for admins and managers" ON equipment FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "user"
        WHERE "user".id = auth.uid()::text
        AND "user".role IN ('Admin', 'Manager')
    )
);

-- Policies for maintenance_schedule
CREATE POLICY "Enable read access for all users" ON maintenance_schedule FOR SELECT USING (true);
CREATE POLICY "Enable write access for admins and managers" ON maintenance_schedule FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "user"
        WHERE "user".id = auth.uid()::text
        AND "user".role IN ('Admin', 'Manager')
    )
);

-- Policies for maintenance_logs
CREATE POLICY "Enable read access for all users" ON maintenance_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for all authenticated users" ON maintenance_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for admins and managers or creator" ON maintenance_logs FOR UPDATE USING (
    auth.uid()::text = performed_by OR
    EXISTS (
        SELECT 1 FROM "user"
        WHERE "user".id = auth.uid()::text
        AND "user".role IN ('Admin', 'Manager')
    )
);

-- Indexes for performance
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_maintenance_schedule_due ON maintenance_schedule(next_due);
CREATE INDEX idx_maintenance_logs_equipment ON maintenance_logs(equipment_id);
