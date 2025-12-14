-- ========================================
-- AbangBob Dashboard - Test Users Seed Data
-- ========================================
-- Run this SQL in your Supabase SQL Editor to create test users
-- for testing all functionalities with different roles

-- ========================================
-- 1. CREATE DEFAULT OUTLET (if not exists)
-- ========================================
INSERT INTO public.outlets (id, name, address, phone, email, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'AbangBob Main Outlet',
  'Gadong, Bandar Seri Begawan',
  '+673 123 4567',
  'main@abangbob.com',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. CREATE TEST USERS IN STAFF TABLE
-- ========================================

-- Clear existing test users (optional - remove if you want to keep existing data)
-- DELETE FROM public.staff WHERE email IN ('admin@abangbob.com', 'manager@abangbob.com', 'staff@abangbob.com');

-- Insert 3 test users
INSERT INTO public.staff (
  id,
  name,
  email,
  phone,
  role,
  pin,
  status,
  hourly_rate,
  employment_type,
  join_date,
  outlet_id,
  ic_number
) VALUES 
  -- Admin User
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'Admin AbangBob',
    'admin@abangbob.com',
    '+673 111 1111',
    'Admin',
    '1234',
    'active',
    15.00,
    'full-time',
    CURRENT_DATE,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00-111111'
  ),
  
  -- Manager User
  (
    '10000000-0000-0000-0000-000000000002'::uuid,
    'Manager Azri',
    'manager@abangbob.com',
    '+673 222 2222',
    'Manager',
    '2345',
    'active',
    12.00,
    'full-time',
    CURRENT_DATE,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00-222222'
  ),
  
  -- Staff User
  (
    '10000000-0000-0000-0000-000000000003'::uuid,
    'Staff Ahmad',
    'staff@abangbob.com',
    '+673 333 3333',
    'Staff',
    '3456',
    'active',
    8.00,
    'full-time',
    CURRENT_DATE,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00-333333'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  pin = EXCLUDED.pin,
  status = EXCLUDED.status;

-- ========================================
-- 3. CREATE SAMPLE MENU ITEMS
-- ========================================

INSERT INTO public.menu_items (
  id,
  name,
  category,
  description,
  price,
  cost,
  is_available,
  preparation_time,
  outlet_id
) VALUES
  (
    '20000000-0000-0000-0000-000000000001'::uuid,
    'Nasi Lemak Special',
    'Main Course',
    'Nasi lemak dengan ayam goreng, telur, ikan bilis, kacang dan sambal',
    5.00,
    2.50,
    true,
    15,
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  (
    '20000000-0000-0000-0000-000000000002'::uuid,
    'Burger Cheese',
    'Burgers',
    'Burger daging dengan keju cheddar, sayur dan sos special',
    4.50,
    2.00,
    true,
    10,
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  (
    '20000000-0000-0000-0000-000000000003'::uuid,
    'Teh Tarik',
    'Beverages',
    'Teh susu tradisional',
    1.50,
    0.50,
    true,
    5,
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  (
    '20000000-0000-0000-0000-000000000004'::uuid,
    'Milo Ais',
    'Beverages',
    'Minuman coklat sejuk',
    2.00,
    0.60,
    true,
    5,
    '00000000-0000-0000-0000-000000000001'::uuid
  )
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 4. CREATE SAMPLE INVENTORY ITEMS
-- ========================================

INSERT INTO public.inventory (
  id,
  name,
  category,
  unit,
  current_quantity,
  min_quantity,
  cost,
  outlet_id
) VALUES
  (
    '30000000-0000-0000-0000-000000000001'::uuid,
    'Beras',
    'Raw Materials',
    'kg',
    50.00,
    20.00,
    2.50,
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  (
    '30000000-0000-0000-0000-000000000002'::uuid,
    'Ayam',
    'Raw Materials',
    'kg',
    15.00,
    10.00,
    8.00,
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  (
    '30000000-0000-0000-0000-000000000003'::uuid,
    'Minyak Masak',
    'Raw Materials',
    'liter',
    8.00,
    15.00,
    3.50,
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  (
    '30000000-0000-0000-0000-000000000004'::uuid,
    'Roti Burger',
    'Raw Materials',
    'pcs',
    30.00,
    20.00,
    0.30,
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  (
    '30000000-0000-0000-0000-000000000005'::uuid,
    'Teh Powder',
    'Raw Materials',
    'kg',
    3.00,
    5.00,
    12.00,
    '00000000-0000-0000-0000-000000000001'::uuid
  )
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 5. CREATE SAMPLE ORDER (for testing)
-- ========================================

INSERT INTO public.orders (
  id,
  order_number,
  order_type,
  status,
  items,
  subtotal,
  discount,
  tax,
  total,
  payment_method,
  customer_name,
  customer_phone,
  cashier_id,
  outlet_id,
  void_refund_status,
  created_at
) VALUES
  (
    '40000000-0000-0000-0000-000000000001'::uuid,
    'AB-001',
    'takeaway',
    'completed',
    '[
      {
        "id": "20000000-0000-0000-0000-000000000001",
        "name": "Nasi Lemak Special",
        "price": 5.00,
        "quantity": 2,
        "itemTotal": 10.00,
        "selectedModifiers": []
      },
      {
        "id": "20000000-0000-0000-0000-000000000003",
        "name": "Teh Tarik",
        "price": 1.50,
        "quantity": 2,
        "itemTotal": 3.00,
        "selectedModifiers": []
      }
    ]'::jsonb,
    13.00,
    0.00,
    0.00,
    13.00,
    'cash',
    'Walk-in Customer',
    null,
    '10000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'none',
    NOW() - INTERVAL '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 6. CREATE SAMPLE CUSTOMER
-- ========================================

INSERT INTO public.customers (
  id,
  name,
  phone,
  email,
  birthday,
  loyalty_points,
  total_spent,
  total_orders,
  segment
) VALUES
  (
    '50000000-0000-0000-0000-000000000001'::uuid,
    'Ahmad Abdullah',
    '+673 888 8888',
    'ahmad@email.com',
    '1990-05-15',
    150,
    250.00,
    25,
    'regular'
  )
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 7. VERIFICATION QUERY
-- ========================================
-- Run this to verify the data was inserted correctly

SELECT 
  'Staff Users' as table_name,
  COUNT(*) as count
FROM public.staff 
WHERE email IN ('admin@abangbob.com', 'manager@abangbob.com', 'staff@abangbob.com')

UNION ALL

SELECT 
  'Menu Items' as table_name,
  COUNT(*) as count
FROM public.menu_items
WHERE outlet_id = '00000000-0000-0000-0000-000000000001'::uuid

UNION ALL

SELECT 
  'Inventory Items' as table_name,
  COUNT(*) as count
FROM public.inventory
WHERE outlet_id = '00000000-0000-0000-0000-000000000001'::uuid

UNION ALL

SELECT 
  'Sample Orders' as table_name,
  COUNT(*) as count
FROM public.orders
WHERE outlet_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- ========================================
-- IMPORTANT NOTES
-- ========================================

/*
  ⚠️  SUPABASE AUTH USERS MUST BE CREATED MANUALLY ⚠️
  
  This SQL script creates staff records in the database, but Supabase Auth users
  (needed for email/password login) CANNOT be created via SQL.
  
  FOR ADMIN & MANAGER EMAIL LOGIN:
  1. Go to Supabase Dashboard > Authentication > Users
  2. Click "Add User" > "Create new user"
  3. Create these users:
  
     Admin:
     - Email: admin@abangbob.com
     - Password: Admin123!
     - Auto Confirm User: YES
     
     Manager:
     - Email: manager@abangbob.com
     - Password: Manager123!
     - Auto Confirm User: YES
  
  FOR STAFF PIN LOGIN:
  - Staff does NOT need Supabase Auth user
  - PIN login uses the staff table directly (PIN: 3456)
  
  TEST CREDENTIALS:
  ------------------
  Admin:
    Email: admin@abangbob.com
    Password: Admin123!
    PIN: 1234
  
  Manager:
    Email: manager@abangbob.com
    Password: Manager123!
    PIN: 2345
  
  Staff:
    PIN: 3456 (select "Staff Ahmad" from PIN login screen)
  
  For detailed setup instructions, see: docs/TEST_USERS_SETUP.md
*/


