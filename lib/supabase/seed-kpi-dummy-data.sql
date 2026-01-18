-- KPI Dummy Data Script
-- Run this in Supabase SQL Editor to add dummy KPI data

-- First, let's see what staff we have
-- SELECT id, name, role, status FROM staff WHERE status = 'active' LIMIT 10;

-- Insert KPI data for January 2026
-- Replace the staff_id values with actual staff IDs from your database

DO $$
DECLARE
    staff_row RECORD;
    counter INTEGER := 1;
    current_period TEXT := to_char(NOW(), 'YYYY-MM');
    last_period TEXT := to_char(NOW() - INTERVAL '1 month', 'YYYY-MM');
BEGIN
    -- Current month KPI
    FOR staff_row IN 
        SELECT id, name FROM public.staff 
        WHERE status = 'active' 
        LIMIT 6
    LOOP
        INSERT INTO public.staff_kpi (staff_id, period, metrics, overall_score, bonus_amount, rank)
        VALUES (
            staff_row.id,
            current_period,
            jsonb_build_object(
                'mealPrepTime', 70 + (counter * 5),
                'attendance', 75 + (counter * 4),
                'emergencyLeave', CASE WHEN counter <= 2 THEN 100 ELSE 85 END,
                'upselling', 60 + (counter * 6),
                'customerRating', 70 + (counter * 5),
                'wasteReduction', 65 + (counter * 5),
                'trainingComplete', CASE WHEN counter <= 3 THEN 100 ELSE 80 END,
                'otWillingness', 60 + (counter * 6)
            ),
            95 - (counter * 5), -- overall score decreasing for ranking
            (95 - (counter * 5)) * 2, -- bonus based on score
            counter -- rank
        )
        ON CONFLICT (staff_id, period) DO UPDATE SET
            metrics = EXCLUDED.metrics,
            overall_score = EXCLUDED.overall_score,
            bonus_amount = EXCLUDED.bonus_amount,
            rank = EXCLUDED.rank,
            updated_at = NOW();
            
        counter := counter + 1;
    END LOOP;
    
    -- Last month KPI for trend comparison
    counter := 1;
    FOR staff_row IN 
        SELECT id, name FROM public.staff 
        WHERE status = 'active' 
        LIMIT 6
    LOOP
        INSERT INTO public.staff_kpi (staff_id, period, metrics, overall_score, bonus_amount, rank)
        VALUES (
            staff_row.id,
            last_period,
            jsonb_build_object(
                'mealPrepTime', 68 + (counter * 4),
                'attendance', 72 + (counter * 4),
                'emergencyLeave', CASE WHEN counter <= 2 THEN 100 ELSE 80 END,
                'upselling', 55 + (counter * 5),
                'customerRating', 68 + (counter * 4),
                'wasteReduction', 62 + (counter * 4),
                'trainingComplete', CASE WHEN counter <= 3 THEN 90 ELSE 70 END,
                'otWillingness', 55 + (counter * 5)
            ),
            90 - (counter * 5), -- slightly lower than current month for positive trend
            (90 - (counter * 5)) * 2,
            counter
        )
        ON CONFLICT (staff_id, period) DO UPDATE SET
            metrics = EXCLUDED.metrics,
            overall_score = EXCLUDED.overall_score,
            bonus_amount = EXCLUDED.bonus_amount,
            rank = EXCLUDED.rank,
            updated_at = NOW();
            
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE 'KPI dummy data inserted successfully!';
END $$;

-- Verify inserted data
SELECT 
    k.id, 
    s.name as staff_name, 
    k.period, 
    k.overall_score, 
    k.bonus_amount, 
    k.rank
FROM public.staff_kpi k
JOIN public.staff s ON k.staff_id = s.id
ORDER BY k.period DESC, k.rank ASC;
