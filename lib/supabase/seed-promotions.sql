-- Seed dummy promotion data
INSERT INTO public.promotions (
  name, 
  type, 
  value, 
  min_order_amount, 
  code, 
  start_date, 
  end_date, 
  is_active,
  applicable_items
) VALUES (
  'Test Promo 10% Off', 
  'percentage', 
  10, 
  0, 
  'TEST10', 
  CURRENT_DATE, 
  CURRENT_DATE + INTERVAL '1 month', 
  true,
  '[]'::jsonb
);

INSERT INTO public.promotions (
  name, 
  type, 
  value, 
  min_order_amount, 
  code, 
  start_date, 
  end_date, 
  is_active,
  applicable_items
) VALUES (
  'Discount $5 (Min $20)', 
  'fixed', 
  5, 
  20, 
  'SAVE5', 
  CURRENT_DATE, 
  CURRENT_DATE + INTERVAL '1 month', 
  true,
  '[]'::jsonb
);
