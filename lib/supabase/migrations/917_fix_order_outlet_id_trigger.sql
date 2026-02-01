-- Migration: 917_fix_order_outlet_id_trigger.sql
-- Description: Auto-populate outlet_id in orders table if missing, using staff allocation or open register.

CREATE OR REPLACE FUNCTION public.populate_order_outlet_id()
RETURNS TRIGGER AS $$
DECLARE
    found_outlet_id UUID;
BEGIN
    -- If outlet_id is already set, do nothing
    IF NEW.outlet_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Strategy 1: Look for open cash register for this user (staff_id or auth.uid)
    -- We cast IDs to text to assume compatibility if they are UUIDs in DB but strings in code/auth
    SELECT outlet_id INTO found_outlet_id
    FROM public.cash_registers
    WHERE 
        status = 'open'
        AND (
            opened_by = NEW.staff_id 
            OR opened_by = auth.uid()::text
        )
    LIMIT 1;

    -- Strategy 2: If no open register, check staff profile's assigned outlet
    IF found_outlet_id IS NULL THEN
        -- Explicitly cast outlet_id to UUID because staff.outlet_id is TEXT but variable is UUID
        SELECT outlet_id::uuid INTO found_outlet_id
        FROM public.staff
        WHERE id = NEW.staff_id OR id = auth.uid()::text
        LIMIT 1;
    END IF;

    -- If found, set it
    IF found_outlet_id IS NOT NULL THEN
        NEW.outlet_id := found_outlet_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (for safety/idempotency)
DROP TRIGGER IF EXISTS trigger_populate_order_outlet_id ON public.orders;

-- Create the trigger
CREATE TRIGGER trigger_populate_order_outlet_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.populate_order_outlet_id();
