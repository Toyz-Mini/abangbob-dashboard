-- Insert a test void request manualy
-- Replace ORDER_ID with a valid order ID from your orders table if possible, 
-- or just use a random UUID if not checking FK strictly (but FK exists so should use valid ID)

-- First, let's find a valid order ID to attach to
DO $$
DECLARE
    v_order_id UUID;
    v_staff_id UUID;
BEGIN
    SELECT id INTO v_order_id FROM public.orders LIMIT 1;
    SELECT id INTO v_staff_id FROM public.staff LIMIT 1;

    IF v_order_id IS NOT NULL THEN
        INSERT INTO public.void_refund_requests (
            id,
            order_id,
            order_number,
            type,
            reason,
            amount,
            requested_by,
            requested_by_name,
            status,
            created_at
        ) VALUES (
            gen_random_uuid(),
            v_order_id,
            'TEST-VOID-001',
            'void',
            'Testing manual insertion',
            10.00,
            v_staff_id,
            'Test Staff',
            'pending',
            NOW()
        );
    END IF;
END $$;
