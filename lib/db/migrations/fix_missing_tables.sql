-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Create cash_registers table
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opened_by UUID NOT NULL REFERENCES public.staff(id),
    closed_by UUID REFERENCES public.staff(id),
    start_cash NUMERIC(10, 2) NOT NULL DEFAULT 0,
    end_cash NUMERIC(10, 2),
    expected_cash NUMERIC(10, 2),
    actual_cash NUMERIC(10, 2),
    variance NUMERIC(10, 2),
    notes TEXT,
    status TEXT DEFAULT 'open', -- 'open', 'closed'
    outlet_id UUID REFERENCES public.outlets(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_cash_registers_opened_by ON public.cash_registers(opened_by);
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON public.cash_registers(status);
CREATE INDEX IF NOT EXISTS idx_cash_registers_outlet_id ON public.cash_registers(outlet_id);

-- Enable RLS
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

-- Policies

-- Manager/Admin can view all
DO $$ BEGIN
    CREATE POLICY "Managers can view all cash registers"
        ON public.cash_registers
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.staff
                WHERE staff.id = auth.uid()
                AND staff.role IN ('Manager', 'Admin')
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Staff can view only their own
DO $$ BEGIN
    CREATE POLICY "Staff can view their own cash registers"
        ON public.cash_registers
        FOR SELECT
        USING (
            opened_by = auth.uid() OR closed_by = auth.uid()
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Staff can insert their own (Opening register)
DO $$ BEGIN
    CREATE POLICY "Staff can insert their own cash registers"
        ON public.cash_registers
        FOR INSERT
        WITH CHECK (
            opened_by = auth.uid()
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Staff can update their own (Closing register)
DO $$ BEGIN
    CREATE POLICY "Staff can update their own cash registers"
        ON public.cash_registers
        FOR UPDATE
        USING (
            opened_by = auth.uid()
        )
        WITH CHECK (
            opened_by = auth.uid()
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.cash_registers;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.cash_registers
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Create cash_flows table
CREATE TABLE IF NOT EXISTS public.cash_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL UNIQUE,
    opening_cash DECIMAL(10,2) DEFAULT 0,
    total_sales DECIMAL(10,2) DEFAULT 0,
    cash_sales DECIMAL(10,2) DEFAULT 0,
    card_sales DECIMAL(10,2) DEFAULT 0,
    qr_sales DECIMAL(10,2) DEFAULT 0,
    ewallet_sales DECIMAL(10,2) DEFAULT 0,
    total_refunds DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    closing_cash DECIMAL(10,2) DEFAULT 0,
    variance DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    closed_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

-- Add indexes for cash_flows
CREATE INDEX IF NOT EXISTS idx_cash_flows_date ON public.cash_flows(date);
CREATE INDEX IF NOT EXISTS idx_cash_flows_outlet ON public.cash_flows(outlet_id);

-- Enable RLS for cash_flows
ALTER TABLE public.cash_flows ENABLE ROW LEVEL SECURITY;

-- Policies for cash_flows
DO $$ BEGIN
    CREATE POLICY "All access cash_flows" ON public.cash_flows FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trigger for cash_flows updated_at
DROP TRIGGER IF EXISTS update_cash_flows_updated_at ON public.cash_flows;
CREATE TRIGGER update_cash_flows_updated_at BEFORE UPDATE ON public.cash_flows
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
