# Multi-Outlet Architecture Design

**Date**: 2026-01-23  
**Author**: System Design  
**Status**: Approved

## Executive Summary

This document outlines the architecture for implementing multi-outlet support in the AbangBob dashboard and POS system. The design uses an **Incremental Multi-Tenant Architecture** approach that builds on the existing codebase while supporting 1 current outlet expanding to 2-4 outlets in the near term.

### Business Requirements

- **Scale**: 1 outlet currently → 2-4 outlets within 6-12 months
- **Management Model**: Centralized management from HQ
- **Staff Model**: Flexible rotation - staff can work across different outlets
- **Inventory Model**: Central warehouse + outlet stock with transfer tracking
- **Reporting**: Real-time monitoring dashboard with alerts
- **Access Control**: Role-based (staff vs management)

---

## 1. Architecture Overview

### Core Principle: Outlet-Centric Data Model

All transactional data will be linked to an `outlet` entity via `outlet_id` foreign key. This includes:

- **Sales**: orders, payments, refunds
- **Inventory**: stock_items, stock_movements, waste_records, purchase_orders
- **Operations**: attendance, cash_registers, daily_reports
- **HR**: staff outlet assignments

### Database Schema: Outlets Table

```sql
CREATE TABLE outlets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  is_warehouse BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'under_renovation'
  opening_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outlets_status ON outlets(status);
CREATE INDEX idx_outlets_is_warehouse ON outlets(is_warehouse);
```

**Special Outlet Types**:
- Regular outlets: `is_warehouse = false`
- Central warehouse: `is_warehouse = true`

---

## 2. Staff Management & Flexible Rotation

### Staff-Outlet Assignment Tracking

To support flexible rotation (staff working across outlets), we track daily assignments.

```sql
CREATE TABLE staff_outlet_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT NOT NULL REFERENCES staff(id),
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  assignment_date DATE NOT NULL,
  is_primary_outlet BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT REFERENCES staff(id)
);

CREATE INDEX idx_staff_assignments_date ON staff_outlet_assignments(assignment_date);
CREATE INDEX idx_staff_assignments_staff ON staff_outlet_assignments(staff_id);
CREATE UNIQUE INDEX idx_staff_assignment_unique 
  ON staff_outlet_assignments(staff_id, assignment_date);
```

### Assignment Methods

1. **Scheduling**: Manager creates schedule → assignment record created
2. **Clock-in**: Staff clocks in → system records outlet based on device config
3. **Manual Override**: Manager manually assigns staff to outlets

### Enhanced Attendance

```sql
ALTER TABLE attendance 
ADD COLUMN outlet_id TEXT REFERENCES outlets(id);

CREATE INDEX idx_attendance_outlet ON attendance(outlet_id);
```

When staff clock in via Android POS app, `outlet_id` is automatically captured from device configuration.

---

## 3. Inventory Management: Central Warehouse Model

### Stock Item Tracking

Each outlet (including warehouse) maintains its own stock records.

```sql
ALTER TABLE stock_items 
ADD COLUMN outlet_id TEXT REFERENCES outlets(id);

CREATE INDEX idx_stock_items_outlet ON stock_items(outlet_id);
CREATE UNIQUE INDEX idx_stock_items_outlet_ingredient 
  ON stock_items(outlet_id, ingredient_id);
```

### Stock Movement Tracking

Track all inventory movements with source/destination outlets.

```sql
ALTER TABLE stock_movements
ADD COLUMN source_outlet_id TEXT REFERENCES outlets(id),
ADD COLUMN destination_outlet_id TEXT REFERENCES outlets(id);

CREATE INDEX idx_stock_movements_source ON stock_movements(source_outlet_id);
CREATE INDEX idx_stock_movements_dest ON stock_movements(destination_outlet_id);
```

**Movement Types**:

| Movement Type | Source | Destination | Description |
|--------------|--------|-------------|-------------|
| `purchase` | NULL | Warehouse | Supplier delivery to warehouse |
| `transfer` | Warehouse | Outlet | Stock transfer to outlet |
| `production` | Outlet | NULL | Ingredients used in recipes |
| `sale` | Outlet | NULL | Stock sold to customers |
| `waste` | Outlet | NULL | Damaged/expired stock |
| `adjustment` | Outlet | Outlet | Stock count adjustments |

### Stock Transfer Requests

Enable outlets to request stock from warehouse.

```sql
CREATE TABLE stock_transfer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_outlet_id TEXT NOT NULL REFERENCES outlets(id),
  to_outlet_id TEXT NOT NULL REFERENCES outlets(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  requested_quantity DECIMAL(10,2) NOT NULL,
  approved_quantity DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'fulfilled', 'rejected'
  requested_by TEXT NOT NULL REFERENCES staff(id),
  approved_by TEXT REFERENCES staff(id),
  fulfilled_by TEXT REFERENCES staff(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ
);

CREATE INDEX idx_transfer_requests_status ON stock_transfer_requests(status);
CREATE INDEX idx_transfer_requests_to_outlet ON stock_transfer_requests(to_outlet_id);
```

**Workflow**:
1. Outlet manager submits request for stock
2. Central management approves request
3. Warehouse staff fulfills transfer
4. System creates `stock_movements` record (warehouse → outlet)

---

## 4. Real-Time Monitoring & Alerts

### Central Command Dashboard

Management dashboard shows consolidated + per-outlet metrics in real-time.

**Key Metrics by Outlet**:
- Current sales (today, MTD, YTD)
- Order count and average order value
- Active staff count (who's clocked in)
- Low stock alerts
- Cash variance alerts
- Equipment issues

### Outlet Alerts System

```sql
CREATE TABLE outlet_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  alert_type TEXT NOT NULL, -- 'low_stock', 'staff_shortage', 'cash_variance', 'equipment_issue', 'high_waste'
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT REFERENCES staff(id),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT REFERENCES staff(id)
);

CREATE INDEX idx_alerts_outlet ON outlet_alerts(outlet_id);
CREATE INDEX idx_alerts_status ON outlet_alerts(status);
CREATE INDEX idx_alerts_severity ON outlet_alerts(severity);
```

**Alert Triggers**:
- **Low Stock**: Ingredient quantity < reorder level
- **Staff Shortage**: Scheduled staff hasn't clocked in 15+ mins after shift start
- **Cash Variance**: Register closing variance exceeds threshold
- **High Waste**: Daily waste exceeds percentage threshold
- **Equipment Issues**: Staff reports critical equipment down

### Performance Analytics View

```sql
CREATE VIEW outlet_daily_performance AS
SELECT 
  o.id as outlet_id,
  o.name as outlet_name,
  o.status,
  COUNT(DISTINCT ord.id) as order_count,
  COALESCE(SUM(ord.total), 0) as sales_total,
  COALESCE(AVG(ord.total), 0) as avg_order_value,
  COUNT(DISTINCT CASE WHEN a.status = 'clocked_in' THEN a.staff_id END) as active_staff,
  COUNT(DISTINCT a.staff_id) as total_staff_today,
  COALESCE(SUM(w.cost_value), 0) as waste_value,
  COUNT(DISTINCT CASE WHEN al.severity = 'critical' AND al.status = 'active' THEN al.id END) as critical_alerts
FROM outlets o
LEFT JOIN orders ord ON ord.outlet_id = o.id 
  AND DATE(ord.created_at) = CURRENT_DATE
LEFT JOIN attendance a ON a.outlet_id = o.id 
  AND DATE(a.clock_in) = CURRENT_DATE
LEFT JOIN waste_records w ON w.outlet_id = o.id 
  AND DATE(w.created_at) = CURRENT_DATE
LEFT JOIN outlet_alerts al ON al.outlet_id = o.id
WHERE o.is_warehouse = false
GROUP BY o.id, o.name, o.status;
```

### Real-Time Data Sync

Using Supabase Realtime subscriptions:
- Dashboard subscribes to changes in `orders`, `attendance`, `stock_movements`, `outlet_alerts`
- New order at any outlet → dashboard updates instantly
- Staff clock in/out → headcount refreshes
- Alert created → notification appears in real-time

---

## 5. Access Control & Security

### Role-Based Access Control (RBAC)

**Access Matrix**:

| Role | Outlet Data Access | Cross-Outlet View | Management Features |
|------|-------------------|-------------------|---------------------|
| Staff (Cashier, Cook) | Own outlet only | ❌ No | ❌ No |
| Supervisor | Assigned outlets | Limited | Limited approval |
| Manager/Admin/Owner | All outlets | ✅ Yes | ✅ Full access |

### Row Level Security (RLS) Policies

**Example: Orders Table**

```sql
-- Staff can only see orders from outlets they're assigned to today
CREATE POLICY "staff_view_own_outlet_orders" ON orders
FOR SELECT TO authenticated
USING (
  outlet_id IN (
    SELECT outlet_id FROM staff_outlet_assignments
    WHERE staff_id = auth.uid()
    AND assignment_date = CURRENT_DATE
  )
  OR
  EXISTS (
    SELECT 1 FROM staff
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner', 'manager')
  )
);

-- Staff can only insert orders for outlets they're currently assigned to
CREATE POLICY "staff_insert_own_outlet_orders" ON orders
FOR INSERT TO authenticated
WITH CHECK (
  outlet_id IN (
    SELECT outlet_id FROM staff_outlet_assignments
    WHERE staff_id = auth.uid()
    AND assignment_date = CURRENT_DATE
  )
  OR
  EXISTS (
    SELECT 1 FROM staff
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner', 'manager')
  )
);
```

Apply similar policies to all outlet-scoped tables: `attendance`, `stock_movements`, `waste_records`, etc.

---

## 6. Android POS App Integration

### Device Configuration

Each Android POS device/tablet is configured with outlet information stored in SharedPreferences.

```kotlin
data class DeviceConfig(
  val outletId: String,        // "GDG", "KLP", "WAREHOUSE"
  val outletName: String,       // "Outlet Gadong"
  val registerId: String,       // "REG-GDG-01"
  val deviceId: String          // unique device identifier
)
```

### First-Time Setup Flow

When new device is initialized:

1. Admin logs in with management credentials
2. Setup wizard displays list of available outlets (fetched from `outlets` table)
3. Admin selects outlet for this device
4. Admin enters register name/ID
5. Configuration saved to device storage
6. Device reboots and ready for staff use

### Transaction Tagging

All transactions from Android app automatically include `outlet_id` from device config:

```kotlin
// When creating order
val order = Order(
  // ... other fields
  outletId = deviceConfig.outletId
)

// When staff clocks in
val attendance = Attendance(
  staffId = currentStaff.id,
  outletId = deviceConfig.outletId,
  clockIn = Timestamp.now()
)

// When recording stock movement
val stockMovement = StockMovement(
  // ... other fields
  destinationOutletId = deviceConfig.outletId
)
```

### Benefits

- ✅ Staff doesn't need to select outlet manually - automatic from device
- ✅ Simplified UX - one less input field
- ✅ Audit trail - know which physical device/location generated transaction
- ✅ Offline capability - device knows its outlet even offline

---

## 7. Implementation Strategy

### Phased Rollout

**Phase 1: Foundation (Week 1-2)**
- Create `outlets` table and seed with main outlet + warehouse
- Add `outlet_id` columns to existing tables
- Create migration scripts to assign existing data to "Main Outlet"
- Update RLS policies for outlet-based access
- Deploy database changes

**Phase 2: Android App Integration (Week 2-3)**
- Implement device setup wizard in Android app
- Update order creation to include `outlet_id`
- Update stock movement sync to include outlet information
- Update attendance clock-in to include `outlet_id`
- Test end-to-end sync with multi-outlet structure

**Phase 3: Web Dashboard Enhancement (Week 3-4)**
- Build outlet management page (CRUD operations)
- Add outlet filter/selector to existing pages
- Build multi-outlet real-time monitoring dashboard
- Update reports to support outlet breakdown
- Implement alert system UI

**Phase 4: Advanced Features (Week 4-6)**
- Implement stock transfer request workflow
- Build staff outlet assignment interface
- Create outlet performance comparison reports
- Implement alert notification system
- Add outlet-specific analytics

**Phase 5: New Outlet Onboarding (Week 6+)**
- Create new outlet records in database
- Configure Android devices for new outlets
- Execute initial stock transfer from warehouse to new outlets
- Assign and train staff for new outlets
- Monitor and optimize

### Data Migration Strategy

```sql
-- Step 1: Create default outlet for existing data
INSERT INTO outlets (id, name, code, is_warehouse, status)
VALUES ('MAIN', 'Main Outlet', 'MAIN', false, 'active');

-- Step 2: Create warehouse outlet
INSERT INTO outlets (id, name, code, is_warehouse, status)
VALUES ('WAREHOUSE', 'Central Warehouse', 'WH', true, 'active');

-- Step 3: Migrate existing data to main outlet
UPDATE orders SET outlet_id = 'MAIN' WHERE outlet_id IS NULL;
UPDATE payments SET outlet_id = 'MAIN' WHERE outlet_id IS NULL;
UPDATE refunds SET outlet_id = 'MAIN' WHERE outlet_id IS NULL;
UPDATE attendance SET outlet_id = 'MAIN' WHERE outlet_id IS NULL;
UPDATE stock_items SET outlet_id = 'MAIN' WHERE outlet_id IS NULL;
UPDATE stock_movements 
SET destination_outlet_id = 'MAIN' 
WHERE destination_outlet_id IS NULL AND movement_type IN ('purchase', 'adjustment');
UPDATE waste_records SET outlet_id = 'MAIN' WHERE outlet_id IS NULL;
UPDATE cash_registers SET outlet_id = 'MAIN' WHERE outlet_id IS NULL;

-- Step 4: Make outlet_id NOT NULL to enforce data integrity
ALTER TABLE orders ALTER COLUMN outlet_id SET NOT NULL;
ALTER TABLE attendance ALTER COLUMN outlet_id SET NOT NULL;
ALTER TABLE stock_items ALTER COLUMN outlet_id SET NOT NULL;
-- etc.
```

### Rollback Plan

If critical issues arise during deployment:

1. **Phase 1-2**: Revert database migrations, restore from backup
2. **Phase 3+**: Disable multi-outlet features via feature flag, fall back to single-outlet mode
3. **Emergency**: All outlets continue operating independently via Android apps (offline mode)

---

## 8. Success Metrics

### Technical Metrics
- ✅ Zero data loss during migration
- ✅ <2s dashboard load time with 4 outlets
- ✅ Real-time updates within 1s of transaction
- ✅ 99.9% uptime for multi-outlet dashboard

### Business Metrics
- ✅ Successful onboarding of 2-4 new outlets
- ✅ Staff can work across outlets without system friction
- ✅ Inventory transfers tracked with 100% accuracy
- ✅ Management has real-time visibility across all outlets
- ✅ Alert system catches critical issues within 5 minutes

---

## 9. Future Enhancements (Post-MVP)

- **Inter-outlet Stock Transfers**: Direct transfers between outlets (not just warehouse → outlet)
- **Outlet-specific Pricing**: Different prices for different outlets/regions
- **Performance Leaderboards**: Gamification for outlet competition
- **Predictive Analytics**: ML-based demand forecasting per outlet
- **Mobile Management App**: iOS/Android app for managers to monitor on-the-go
- **Multi-currency Support**: For international expansion
- **Franchise Management**: If scaling to franchise model

---

## Conclusion

This incremental multi-tenant architecture provides a solid foundation for AbangBob's multi-outlet expansion while minimizing risk and maintaining operational continuity. The phased approach allows for learning and adjustment at each stage, ensuring successful scaling from 1 to 4+ outlets.
