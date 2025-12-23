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
CREATE INDEX idx_cash_registers_opened_by ON public.cash_registers(opened_by);
CREATE INDEX idx_cash_registers_status ON public.cash_registers(status);
CREATE INDEX idx_cash_registers_outlet_id ON public.cash_registers(outlet_id);

-- Enable RLS
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

-- Policies

-- Manager/Admin can view all
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

-- Staff can view only their own
CREATE POLICY "Staff can view their own cash registers"
    ON public.cash_registers
    FOR SELECT
    USING (
        opened_by = auth.uid() OR closed_by = auth.uid()
    );

-- Staff can insert their own (Opening register)
CREATE POLICY "Staff can insert their own cash registers"
    ON public.cash_registers
    FOR INSERT
    WITH CHECK (
        opened_by = auth.uid()
    );

-- Staff can update their own (Closing register)
CREATE POLICY "Staff can update their own cash registers"
    ON public.cash_registers
    FOR UPDATE
    USING (
        opened_by = auth.uid()
    )
    WITH CHECK (
        opened_by = auth.uid()
    );

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.cash_registers
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
