-- Migration: Create RPC for submitting refund requests (Bypassing RLS for POS)
-- This is necessary because the POS authenticates locally with PIN, not via Supabase Auth

CREATE OR REPLACE FUNCTION public.submit_refund_request(
    p_order_id UUID,
    p_reason TEXT,
    p_staff_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres) to bypass RLS
SET search_path = public
AS $$
DECLARE
    v_order_number TEXT;
    v_order_total DECIMAL(10,2);
    v_items JSONB;
    v_staff_name TEXT;
    v_request_id UUID;
BEGIN
    -- 1. Get Order Details
    SELECT order_number, total, items
    INTO v_order_number, v_order_total, v_items
    FROM orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- 2. Get Staff Name
    SELECT name INTO v_staff_name
    FROM staff
    WHERE id = p_staff_id;

    IF v_staff_name IS NULL THEN
        -- Fallback if staff not found (shouldn't happen with valid logic)
        v_staff_name := 'Unknown Staff';
    END IF;

    -- 3. Insert Request
    INSERT INTO void_refund_requests (
        order_id,
        order_number,
        type,
        reason,
        amount,
        items_to_refund,
        requested_by,
        requested_by_name,
        status
    ) VALUES (
        p_order_id,
        v_order_number,
        'refund',
        p_reason,
        COALESCE(v_order_total, 0),
        v_items,
        p_staff_id,
        v_staff_name,
        'pending'
    ) RETURNING id INTO v_request_id;

    -- 4. Update Order Status
    UPDATE orders
    SET void_refund_status = 'pending_refund'
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true, 
        'request_id', v_request_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to anon/public so POS can call it
GRANT EXECUTE ON FUNCTION public.submit_refund_request(UUID, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_refund_request(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_refund_request(UUID, TEXT, UUID) TO service_role;
