# Supabase Full Integration - Deployment Guide

## 📋 Overview

This guide walks you through deploying the complete Supabase integration for the AbangBob Dashboard. All SQL migration files have been created and are ready to run.

---

## ✅ Prerequisites

1. **Supabase Project**: Have your Supabase project created
2. **Database Access**: Get your Supabase database credentials
3. **Environment Variables**: Ensure `.env.local` has:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## 🚀 Deployment Steps

### Step 1: Run Main Schema (if not already done)

```bash
# Connect to your Supabase database
psql -h db.your-project.supabase.co -U postgres -d postgres

# Or use Supabase SQL Editor in dashboard
```

Run the main schema if you haven't:
```sql
\i lib/supabase/schema.sql
```

### Step 2: Run All Migrations

**Option A: Run Master Migration File (Recommended)**

In Supabase SQL Editor or via psql:

```bash
# From project root
psql -h db.your-project.supabase.co -U postgres -d postgres -f lib/supabase/run-all-migrations.sql
```

This will execute all migrations in the correct order:
1. ✅ inventory_logs table
2. ✅ Enhanced orders table (void/refund)
3. ✅ production_logs & delivery_orders
4. ✅ daily_cash_flows
5. ✅ recipes
6. ✅ Staff portal tables (7 tables)
7. ✅ Equipment/oil tracker tables (3 tables)
8. ✅ KPI tables (5 tables)
9. ✅ Scheduling tables (2 tables)
10. ✅ Promotions & notifications
11. ✅ Realtime subscriptions enabled

**Option B: Run Individual Migration Files**

If you prefer to run them individually:

```sql
-- Phase 1: Fix Existing
\i lib/supabase/add-inventory-logs-table.sql
\i lib/supabase/enhance-orders-table.sql

-- Phase 2: Core Tables
\i lib/supabase/add-production-delivery-tables.sql
\i lib/supabase/add-finance-tables.sql
\i lib/supabase/add-recipe-tables.sql

-- Phase 3: Staff Portal
\i lib/supabase/add-staff-portal-tables.sql

-- Phase 5: Equipment
\i lib/supabase/add-equipment-tables.sql

-- Phase 6: KPI
\i lib/supabase/add-kpi-tables.sql

-- Phase 7: Scheduling
\i lib/supabase/add-scheduling-tables.sql

-- Phase 8: Promotions & Notifications
\i lib/supabase/add-promotions-notifications-tables.sql

-- Phase 9: Enable Realtime
\i lib/supabase/enable-realtime-all-tables.sql
```

### Step 3: Verify Tables Created

```sql
-- Check all public tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Should return 40+ tables including:
-- - inventory, inventory_logs
-- - staff, attendance
-- - menu_items, modifier_groups, modifier_options
-- - orders, order_items, payments, void_refund_requests
-- - customers, expenses
-- - suppliers, purchase_orders
-- - production_logs, delivery_orders
-- - daily_cash_flows, recipes
-- - checklist_templates, checklist_completions
-- - leave_balances, leave_requests
-- - claim_requests, staff_requests, announcements
-- - oil_trackers, oil_change_requests, oil_action_history
-- - staff_kpi, training_records, ot_records, customer_reviews, leave_records
-- - shifts, schedule_entries
-- - promotions, notifications
-- - outlets, outlet_settings, audit_logs
```

### Step 4: Verify Realtime Enabled

```sql
-- Check realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Should show ALL your tables
```

### Step 5: Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true
ORDER BY tablename;

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🔄 Data Migration (LocalStorage → Supabase)

### Option A: Manual Import via Supabase Dashboard

1. Go to **Table Editor** in Supabase Dashboard
2. For each table, click **Insert** → **Insert row**
3. Copy data from localStorage and paste

### Option B: Run Migration Script (Coming Soon)

```bash
# Script will be created to automate this
npm run migrate:supabase
```

The migration script will:
- Read all localStorage data
- Transform to Supabase format
- Batch insert to Supabase
- Verify data integrity
- Optionally clear localStorage

---

## 🧪 Testing

### Test 1: CRUD Operations

```typescript
// Test in browser console after deployment
import { fetchInventory, insertInventoryItem } from '@/lib/supabase/operations';

// Test fetch
const items = await fetchInventory();
console.log('Inventory items:', items);

// Test insert
const newItem = await insertInventoryItem({
  name: 'Test Item',
  category: 'Test',
  unit: 'kg',
  currentQuantity: 10,
  minQuantity: 5,
  cost: 100
});
console.log('Created item:', newItem);
```

### Test 2: Realtime Sync

Open two browser tabs:
1. In Tab 1: Create a new order
2. In Tab 2: Should see order appear instantly
3. In Tab 1: Update order status
4. In Tab 2: Should see status update instantly

### Test 3: Multi-Device Sync

1. Open dashboard on Device 1 (tablet/laptop)
2. Open dashboard on Device 2 (phone/another tablet)
3. Create order on Device 1
4. Verify order appears on Device 2 within 500ms

---

## 📊 Performance Optimization

After deployment, add indexes for common queries:

```sql
-- Example: Add custom indexes for your most common queries
CREATE INDEX IF NOT EXISTS idx_orders_created_date 
  ON orders(created_at::date);

CREATE INDEX IF NOT EXISTS idx_inventory_low_stock 
  ON inventory(current_quantity) 
  WHERE current_quantity <= min_quantity;

-- Add more as needed based on your query patterns
```

---

## 🔐 Security Considerations

### RLS Policies

Current policies are permissive (allow all authenticated users). For production, consider restricting:

```sql
-- Example: Restrict manager-only operations
DROP POLICY "Managers can manage menu items" ON menu_items;

CREATE POLICY "Managers can manage menu items" ON menu_items 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.id = auth.uid() 
        AND staff.role IN ('Manager', 'Admin')
    )
  );
```

### API Keys

- Keep `SUPABASE_ANON_KEY` public (it's designed for client-side)
- **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- Use RLS policies to restrict access, not API key hiding

---

## 🐛 Troubleshooting

### Issue: "permission denied for table xyz"

**Solution**: Check RLS policies

```sql
-- Temporarily disable RLS to test (NOT for production)
ALTER TABLE xyz DISABLE ROW LEVEL SECURITY;

-- Then create proper policy
CREATE POLICY "Allow all for testing" ON xyz FOR ALL USING (true);
```

### Issue: "relation xyz does not exist"

**Solution**: Table not created. Re-run migration:

```sql
\i lib/supabase/add-xyz-tables.sql
```

### Issue: Realtime not working

**Solution**: Check realtime is enabled

```sql
-- Re-enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE xyz;

-- Verify
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### Issue: Slow queries

**Solution**: Add indexes

```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Add indexes for common WHERE clauses
CREATE INDEX idx_xyz ON table_name(column_name);
```

---

## 📈 Monitoring

### Database Size

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY bytes DESC;
```

### Active Connections

```sql
-- Check active connections
SELECT 
  datname,
  count(*) as connections
FROM pg_stat_activity
GROUP BY datname;
```

### Query Performance

Enable `pg_stat_statements` in Supabase Dashboard → Database → Extensions

```sql
-- Top 10 slowest queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 🎯 Next Steps After Deployment

1. ✅ **Verify all tables created** (Step 3)
2. ✅ **Test CRUD operations** (Test 1)
3. ✅ **Test realtime sync** (Test 2)
4. ⏳ **Migrate localStorage data** (manual or script)
5. ⏳ **Update store.tsx** to use Supabase operations
6. ⏳ **Test on multiple devices**
7. ⏳ **Monitor performance** for 24-48 hours
8. ⏳ **Optimize indexes** based on slow query log
9. ⏳ **Review RLS policies** for production security
10. ⏳ **Setup automated backups** (Supabase Dashboard → Database → Backups)

---

## 📞 Support

### Supabase Resources

- [Supabase Docs](https://supabase.com/docs)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

### Common Commands

```sql
-- Show all tables
\dt

-- Show table schema
\d table_name

-- Show indexes
\di

-- Show policies
\ddp table_name

-- Export data
\copy table_name TO 'backup.csv' CSV HEADER;

-- Import data
\copy table_name FROM 'backup.csv' CSV HEADER;
```

---

## ✨ Benefits Achieved

After full deployment, you'll have:

✅ **Realtime Multi-Device Sync** - All tablets/devices sync instantly
✅ **Centralized Data** - All data in cloud, no localStorage conflicts
✅ **Better Performance** - Supabase query optimization + indexes
✅ **Complete Audit Trail** - All changes tracked with timestamps
✅ **Scalability** - Add outlets/devices without limits
✅ **Auto Backup** - Daily backups by Supabase
✅ **Analytics Ready** - Complex queries & reports from database
✅ **Future Ready** - Easy integration with mobile apps/external systems

---

## 📝 Rollback Plan (If Needed)

If something goes wrong:

1. **Keep localStorage backup** - Don't clear it immediately
2. **Revert operations.ts** - Comment out Supabase calls
3. **Disable Supabase sync** - Set `supabaseSyncEnabled = false` in `supabase-sync.ts`
4. **Use localStorage fallback** - System will work offline

To rollback migrations:

```sql
-- Drop tables in reverse order (be careful!)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
-- ... continue for all new tables

-- Or restore from backup
-- Supabase Dashboard → Database → Backups → Restore
```

---

**Good luck with your deployment! 🚀**

