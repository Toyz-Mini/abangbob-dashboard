-- Migration: Create Void & Refund Requests Table
-- Run this in Supabase SQL Editor

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.void_refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('void', 'refund', 'partial_refund')),
    reason TEXT NOT NULL,
    amount DECIMAL(10,2),
    items_to_refund JSONB, -- Stores array of items
    
    -- Requester Info
    requested_by UUID REFERENCES public.staff(id),
    requested_by_name TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Approval Info
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES public.staff(id),
    approved_by_name TEXT,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Reversal Tracking
    sales_reversed BOOLEAN DEFAULT FALSE,
    inventory_reversed BOOLEAN DEFAULT FALSE,
    reversal_details JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.void_refund_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to View (Admin need to see all, Staff need to see their own)
-- We simplify by allowing view all for authenticated users, filtering handles the rest in UI
CREATE POLICY "Enable read access for all users" ON public.void_refund_requests
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow all authenticated users to Insert (Staff creates request)
CREATE POLICY "Enable insert for authenticated users" ON public.void_refund_requests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow all authenticated users to Update (Admin approves/rejects)
CREATE POLICY "Enable update for authenticated users" ON public.void_refund_requests
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_void_refund_order_id ON public.void_refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_void_refund_status ON public.void_refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_void_refund_requested_by ON public.void_refund_requests(requested_by);
