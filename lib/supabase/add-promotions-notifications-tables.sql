-- Promotions & Notifications Tables
-- Phase 8: Marketing and system notifications

-- ========================================
-- PROMOTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'bogo', 'free_item')),
  value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  promo_code TEXT,
  applicable_items JSONB DEFAULT '[]'::jsonb, -- Array of menu item IDs
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_of_week JSONB, -- [0,1,2,3,4,5,6] for Sun-Sat
  start_time TIME,
  end_time TIME,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique promo code if provided
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_promo_code 
  ON public.promotions(promo_code) WHERE promo_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_outlet ON public.promotions(outlet_id);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (status = 'active');
CREATE POLICY "Managers can manage promotions" ON public.promotions FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.promotions;

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('low_stock', 'new_order', 'equipment', 'staff', 'finance', 'system')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.staff(id) ON DELETE CASCADE, -- Specific user or NULL for all
  metadata JSONB DEFAULT '{}'::jsonb -- Additional data (order_id, stock_item_id, etc)
);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON public.notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_outlet ON public.notifications(outlet_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Staff can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update notifications" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Staff can delete notifications" ON public.notifications FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

COMMENT ON TABLE public.promotions IS 'Promotional campaigns and discount codes';
COMMENT ON TABLE public.notifications IS 'System-wide notifications for staff';
COMMENT ON COLUMN public.notifications.target_user_id IS 'NULL = broadcast to all, UUID = specific user';

