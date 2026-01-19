-- Migration: Update RPC for submitting refund requests with correct types (v2)
-- Fixing: operator does not exist: text = uuid

DROP FUNCTION IF EXISTS public.submit_refund_request(UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.submit_refund_request(
    p_order_id UUID,
    p_reason TEXT,
    p_staff_id TEXT -- Changed from UUID to TEXT matching staff.id type
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_number TEXT;
    v_order_total DECIMAL(10,2);
    v_items JSONB;
    v_staff_name TEXT;
    v_request_id UUID;
    v_staff_uuid UUID;
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
    -- No waiting for casting, comparisons work directly with compatible text type
    SELECT name INTO v_staff_name
    FROM staff
    WHERE id = p_staff_id; -- Now TEXT = TEXT comparison

    IF v_staff_name IS NULL THEN
        v_staff_name := 'Unknown Staff';
    END IF;

    -- 3. Insert Request
    -- void_refund_requests.requested_by might be UUID in schema 020, but let's check if it was migrated to text in 042?
    -- Migration 042 doesn't explicitly list void_refund_requests, but it lists requested_by in step 3 verification for other tables.
    -- To be safe, we cast if needed, but if the table column is UUID, we might fail insertion with TEXT that isn't a valid UUID.
    -- However, the error was specifically "text = uuid", implying comparison failure in WHERE clause.
    -- If p_staff_id is a valid UUID string, casting to UUID for insert is fine IF the column is UUID.
    -- If column is text, it works directly.
    -- Let's try inserting directly first. If p_staff_id is a valid UUID string it will auto-cast to UUID column if needed.
    
    -- Check if we need to cast for insertion (if input is valid UUID string)
    BEGIN
        v_staff_uuid := p_staff_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_staff_uuid := NULL; -- Handle non-UUID staff IDs (e.g. from Better Auth) if table allows
    END;

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
        CASE WHEN v_staff_uuid IS NOT NULL THEN v_staff_uuid ELSE NULL END, -- Only insert if valid UUID, else NULL (or change column type in future)
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

GRANT EXECUTE ON FUNCTION public.submit_refund_request(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_refund_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_refund_request(UUID, TEXT, TEXT) TO service_role;
