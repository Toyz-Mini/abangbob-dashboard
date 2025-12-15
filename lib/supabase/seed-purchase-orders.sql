-- AbangBob Dashboard - Seed Purchase Orders Data
-- Run this SQL in Supabase SQL Editor
-- Based on REPORTS spreadsheet - PO Zuis sheet

-- ========================================
-- STAFF IDs REFERENCE
-- ========================================
-- Bella (Manager): c1000000-0000-0000-0000-000000000001
-- Atoy (Supervisor): c1000000-0000-0000-0000-000000000002

-- ========================================
-- OUTLET ID REFERENCE
-- ========================================
-- Rimba Point: b1000000-0000-0000-0000-000000000001

-- ========================================
-- First, create the purchase_orders table if not exists
-- ========================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID,
  supplier_name TEXT NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery DATE,
  actual_delivery DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled')),
  items JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON public.purchase_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier_name);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "All access purchase_orders" ON public.purchase_orders FOR ALL USING (true);

CREATE TRIGGER IF NOT EXISTS update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PURCHASE ORDERS (December 2024)
-- Based on PO Zuis sheet
-- Columns: DATE, SUPPLIER, PO NO, ITEM DESCRIPTION, UOM, QTY, PRICE, TOTAL, STATUS, RECEIVED DATE
-- ========================================

INSERT INTO public.purchase_orders (po_number, supplier_name, order_date, expected_delivery, actual_delivery, status, items, subtotal, total, notes, created_by, outlet_id)
VALUES
  -- Week 1 orders
  ('PO-2024-12-001', 'Zuis Supplier', '2024-12-01', '2024-12-02', '2024-12-02', 'received', 
   '[{"barcode": "ZS-FLR-001", "description": "Tepung Asli 25kg", "uom": "bag", "qty": 3, "price": 87.50, "total": 262.50}, {"barcode": "ZS-FLR-002", "description": "Tepung Spicy 25kg", "uom": "bag", "qty": 2, "price": 100.00, "total": 200.00}, {"barcode": "ZS-OIL-001", "description": "Minyak Masak 17L", "uom": "tin", "qty": 5, "price": 76.50, "total": 382.50}]'::jsonb,
   845.00, 845.00, 'Regular weekly order', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  
  ('PO-2024-12-002', 'Ayamas Fresh', '2024-12-01', '2024-12-02', '2024-12-01', 'received',
   '[{"barcode": "AF-CHK-001", "description": "Ayam Drumstick 10kg", "uom": "box", "qty": 4, "price": 125.00, "total": 500.00}, {"barcode": "AF-CHK-002", "description": "Ayam Thigh 10kg", "uom": "box", "qty": 3, "price": 130.00, "total": 390.00}, {"barcode": "AF-CHK-003", "description": "Chicken Skin 5kg", "uom": "box", "qty": 2, "price": 40.00, "total": 80.00}]'::jsonb,
   970.00, 970.00, 'Fresh chicken delivery', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  
  ('PO-2024-12-003', 'Box Supplier', '2024-12-03', '2024-12-04', '2024-12-04', 'received',
   '[{"barcode": "BX-002", "description": "Box 2pcs (500pcs)", "uom": "carton", "qty": 2, "price": 175.00, "total": 350.00}, {"barcode": "BX-005", "description": "Box 5pcs (400pcs)", "uom": "carton", "qty": 2, "price": 200.00, "total": 400.00}, {"barcode": "BX-010", "description": "Box 10pcs (200pcs)", "uom": "carton", "qty": 1, "price": 150.00, "total": 150.00}]'::jsonb,
   900.00, 900.00, 'Packaging restock', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001'),
  
  -- Event preparation orders (Setia Point)
  ('PO-2024-12-004', 'Zuis Supplier', '2024-12-04', '2024-12-05', '2024-12-05', 'received',
   '[{"barcode": "ZS-FLR-001", "description": "Tepung Asli 25kg", "uom": "bag", "qty": 4, "price": 87.50, "total": 350.00}, {"barcode": "ZS-FLR-002", "description": "Tepung Spicy 25kg", "uom": "bag", "qty": 3, "price": 100.00, "total": 300.00}, {"barcode": "ZS-OIL-001", "description": "Minyak Masak 17L", "uom": "tin", "qty": 6, "price": 76.50, "total": 459.00}]'::jsonb,
   1109.00, 1109.00, 'Extra order for Setia Point event', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  
  ('PO-2024-12-005', 'Ayamas Fresh', '2024-12-04', '2024-12-05', '2024-12-05', 'received',
   '[{"barcode": "AF-CHK-001", "description": "Ayam Drumstick 10kg", "uom": "box", "qty": 6, "price": 125.00, "total": 750.00}, {"barcode": "AF-CHK-002", "description": "Ayam Thigh 10kg", "uom": "box", "qty": 5, "price": 130.00, "total": 650.00}, {"barcode": "AF-CHK-004", "description": "Chicken Wings 5kg", "uom": "box", "qty": 4, "price": 72.50, "total": 290.00}]'::jsonb,
   1690.00, 1690.00, 'Event stock - Setia Point', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  
  -- Week 2 orders (Dewan Muhibbah event)
  ('PO-2024-12-006', 'Zuis Supplier', '2024-12-07', '2024-12-08', '2024-12-08', 'received',
   '[{"barcode": "ZS-FLR-001", "description": "Tepung Asli 25kg", "uom": "bag", "qty": 5, "price": 87.50, "total": 437.50}, {"barcode": "ZS-FLR-002", "description": "Tepung Spicy 25kg", "uom": "bag", "qty": 4, "price": 100.00, "total": 400.00}, {"barcode": "ZS-OIL-001", "description": "Minyak Masak 17L", "uom": "tin", "qty": 8, "price": 76.50, "total": 612.00}]'::jsonb,
   1449.50, 1449.50, 'Dewan Muhibbah event preparation', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  
  ('PO-2024-12-007', 'Ayamas Fresh', '2024-12-07', '2024-12-08', '2024-12-08', 'received',
   '[{"barcode": "AF-CHK-001", "description": "Ayam Drumstick 10kg", "uom": "box", "qty": 8, "price": 125.00, "total": 1000.00}, {"barcode": "AF-CHK-002", "description": "Ayam Thigh 10kg", "uom": "box", "qty": 6, "price": 130.00, "total": 780.00}, {"barcode": "AF-CHK-003", "description": "Chicken Skin 5kg", "uom": "box", "qty": 4, "price": 40.00, "total": 160.00}, {"barcode": "AF-CHK-004", "description": "Chicken Wings 5kg", "uom": "box", "qty": 5, "price": 72.50, "total": 362.50}]'::jsonb,
   2302.50, 2302.50, 'Large event order - Dewan Muhibbah', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  
  ('PO-2024-12-008', 'Coca-Cola Distributor', '2024-12-08', '2024-12-09', '2024-12-09', 'received',
   '[{"barcode": "CC-001", "description": "Coca-Cola 330ml (24 cans)", "uom": "carton", "qty": 4, "price": 43.20, "total": 172.80}, {"barcode": "CC-002", "description": "Sprite 330ml (24 cans)", "uom": "carton", "qty": 3, "price": 43.20, "total": 129.60}, {"barcode": "MW-001", "description": "Mineral Water 500ml (24 bottles)", "uom": "carton", "qty": 4, "price": 19.20, "total": 76.80}]'::jsonb,
   379.20, 379.20, 'Drinks for events', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001'),
  
  -- Week 2 continued (Indoor Stadium event prep)
  ('PO-2024-12-009', 'Zuis Supplier', '2024-12-10', '2024-12-11', '2024-12-11', 'received',
   '[{"barcode": "ZS-FLR-001", "description": "Tepung Asli 25kg", "uom": "bag", "qty": 3, "price": 87.50, "total": 262.50}, {"barcode": "ZS-FLR-002", "description": "Tepung Spicy 25kg", "uom": "bag", "qty": 2, "price": 100.00, "total": 200.00}, {"barcode": "ZS-OIL-001", "description": "Minyak Masak 17L", "uom": "tin", "qty": 5, "price": 76.50, "total": 382.50}]'::jsonb,
   845.00, 845.00, 'Regular restock + Indoor Stadium prep', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  
  ('PO-2024-12-010', 'Ayamas Fresh', '2024-12-11', '2024-12-12', '2024-12-12', 'received',
   '[{"barcode": "AF-CHK-001", "description": "Ayam Drumstick 10kg", "uom": "box", "qty": 7, "price": 125.00, "total": 875.00}, {"barcode": "AF-CHK-002", "description": "Ayam Thigh 10kg", "uom": "box", "qty": 6, "price": 130.00, "total": 780.00}, {"barcode": "AF-CHK-004", "description": "Chicken Wings 5kg", "uom": "box", "qty": 5, "price": 72.50, "total": 362.50}]'::jsonb,
   2017.50, 2017.50, 'Indoor Stadium (Booth 73) event stock', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  
  ('PO-2024-12-011', 'Box Supplier', '2024-12-11', '2024-12-12', '2024-12-12', 'received',
   '[{"barcode": "BX-002", "description": "Box 2pcs (500pcs)", "uom": "carton", "qty": 3, "price": 175.00, "total": 525.00}, {"barcode": "BX-005", "description": "Box 5pcs (400pcs)", "uom": "carton", "qty": 2, "price": 200.00, "total": 400.00}, {"barcode": "PB-S", "description": "Paper Bag Small (1000pcs)", "uom": "carton", "qty": 1, "price": 150.00, "total": 150.00}]'::jsonb,
   1075.00, 1075.00, 'Packaging for Indoor Stadium event', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001'),
  
  -- Pending/upcoming orders
  ('PO-2024-12-012', 'Zuis Supplier', '2024-12-14', '2024-12-15', NULL, 'ordered',
   '[{"barcode": "ZS-FLR-001", "description": "Tepung Asli 25kg", "uom": "bag", "qty": 4, "price": 87.50, "total": 350.00}, {"barcode": "ZS-FLR-002", "description": "Tepung Spicy 25kg", "uom": "bag", "qty": 3, "price": 100.00, "total": 300.00}, {"barcode": "ZS-OIL-001", "description": "Minyak Masak 17L", "uom": "tin", "qty": 6, "price": 76.50, "total": 459.00}]'::jsonb,
   1109.00, 1109.00, 'Weekly restock - expected tomorrow', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  
  ('PO-2024-12-013', 'Ayamas Fresh', '2024-12-14', '2024-12-15', NULL, 'ordered',
   '[{"barcode": "AF-CHK-001", "description": "Ayam Drumstick 10kg", "uom": "box", "qty": 5, "price": 125.00, "total": 625.00}, {"barcode": "AF-CHK-002", "description": "Ayam Thigh 10kg", "uom": "box", "qty": 4, "price": 130.00, "total": 520.00}]'::jsonb,
   1145.00, 1145.00, 'Regular restock - expected tomorrow', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001');

-- Done! Purchase orders seeded successfully.
