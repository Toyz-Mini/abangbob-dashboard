# AbangBob Dashboard - Product Specification Document

**Version:** 1.0.0  
**Date:** December 2024  
**Document Type:** Technical Specification for Developers  
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Core Modules](#5-core-modules)
6. [Data Models](#6-data-models)
7. [State Management](#7-state-management)
8. [User Interface](#8-user-interface)
9. [Services & Integrations](#9-services--integrations)
10. [Internationalization](#10-internationalization)
11. [PWA Features](#11-pwa-features)
12. [Security Considerations](#12-security-considerations)
13. [Future Roadmap](#13-future-roadmap)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### 1.1 Product Vision

AbangBob Dashboard is a **Centralized F&B Management System** designed specifically for food and beverage businesses in Brunei. The platform consolidates multiple operational functions—POS, Inventory, HR, Finance, and Delivery—into a single, unified dashboard.

### 1.2 Target Users

| User Type | Description | Primary Modules |
|-----------|-------------|-----------------|
| **Business Owner** | Restaurant/café owners requiring oversight | Dashboard, Analytics, Finance |
| **Manager** | Operational managers handling day-to-day | HR, Inventory, Approvals |
| **Staff** | Front-line employees | Staff Portal, POS, Clock In/Out |
| **Kitchen Staff** | Food preparation team | KDS, Production |

### 1.3 Key Value Propositions

1. **Unified Operations** - Single platform for all F&B operations
2. **Brunei-Localized** - BND currency, TAP/SCP contributions, bilingual support
3. **Offline-First** - PWA with localStorage persistence
4. **Zero Backend Dependency** - Works without server infrastructure (demo mode)
5. **Mobile-Responsive** - Optimized for tablets and mobile devices

### 1.4 Business Context

- **Primary Market:** Brunei Darussalam
- **Currency:** Brunei Dollar (BND)
- **Languages:** English, Bahasa Melayu
- **Statutory Compliance:** TAP (Tabung Amanah Pekerja), SCP (Supplemental Contribution Plan)

---

## 2. Product Overview

### 2.1 Application Structure

```
AbangBob Dashboard
├── Main Dashboard (/)
│   └── Sales summary, alerts, staff status, charts
│
├── Staff Portal (/staff-portal)
│   ├── Schedule viewing
│   ├── Checklist completion
│   ├── Leave requests
│   ├── Claims submission
│   └── Profile management
│
├── Operations
│   ├── POS System (/pos)
│   ├── Menu Management (/menu-management)
│   ├── Kitchen Display (/kds)
│   ├── Table Management (/tables)
│   └── Delivery Hub (/delivery)
│
├── Inventory & Production
│   ├── Inventory (/inventory)
│   ├── Production (/production)
│   ├── Recipes (/recipes)
│   └── Suppliers (/suppliers)
│
├── HR & Finance
│   ├── HR Management (/hr)
│   ├── KPI & Leaderboard (/hr/kpi)
│   ├── Payroll (/hr/payroll)
│   ├── Approvals (/hr/approvals)
│   └── Finance (/finance)
│
└── Marketing & Reports
    ├── Customers (/customers)
    ├── Promotions (/promotions)
    ├── Analytics (/analytics)
    └── Audit Log (/audit-log)
```

### 2.2 Module Summary

| Module | Pages | Primary Function |
|--------|-------|------------------|
| Dashboard | 1 | Central overview with KPIs and alerts |
| Staff Portal | 10 | Employee self-service features |
| POS | 1 | Point of sale with cart and checkout |
| Menu Management | 1 | Menu items and modifiers configuration |
| KDS | 1 | Kitchen display for order preparation |
| Delivery Hub | 1 | Multi-platform delivery order management |
| Inventory | 1 | Stock tracking and adjustments |
| Production | 1 | Oil tracking and production logs |
| Recipes | 1 | Ingredient costing and profit margins |
| Suppliers | 1 | Supplier and purchase order management |
| HR | 8 | Staff profiles, attendance, KPI, payroll |
| Finance | 1 | Expenses, cash flow, P&L reports |
| Customers | 1 | CRM with loyalty points |
| Promotions | 1 | Promo codes and discounts |
| Analytics | 1 | Business intelligence dashboards |
| Settings | 1 | System configuration |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Next.js 14 App Router                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │ │
│  │  │   Pages     │  │ Components  │  │   Layouts   │          │ │
│  │  │  (app/)     │  │(components/)│  │             │          │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   STATE MANAGEMENT LAYER                     │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │              React Context (lib/store.tsx)               │ │ │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │ │ │
│  │  │  │useStore │  │useMenu  │  │useStaff │  │useOrders│     │ │ │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    PERSISTENCE LAYER                         │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │                    LocalStorage                          │ │ │
│  │  │  abangbob_orders, abangbob_staff, abangbob_inventory...  │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SERVICES LAYER                            │ │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │ │
│  │  │ WhatsApp  │  │    PDF    │  │   Excel   │  │ Realtime  │ │ │
│  │  │ Service   │  │ Generator │  │  Export   │  │  Updates  │ │ │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow Architecture

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   User     │────▶│  UI Layer  │────▶│   Store    │────▶│ Storage    │
│  Action    │     │ (Component)│     │  (Context) │     │(LocalStore)│
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                          │                  │
                          │                  │
                          ▼                  ▼
                   ┌────────────┐     ┌────────────┐
                   │  Services  │     │  Effects   │
                   │  (PDF,WA)  │     │ (Persist)  │
                   └────────────┘     └────────────┘
```

### 3.3 Component Architecture

```
MainLayout
├── TopNav (Navigation bar with search, notifications)
├── Sidebar (Navigation menu with grouped items)
├── BottomNav (Mobile navigation)
└── Page Content
    ├── StatCard (Metric display)
    ├── ChartCard (Chart containers)
    ├── DataTable (Table components)
    ├── Modal (Dialog overlays)
    └── FormField (Form inputs)
```

---

## 4. Technology Stack

### 4.1 Core Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 14.x | React framework with App Router |
| **UI Library** | React | 18.2.x | Component-based UI |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Vanilla CSS | - | Custom styling with CSS variables |
| **Charts** | Recharts | 2.10.x | Data visualization |
| **Icons** | Lucide React | 0.294.x | Icon library |

### 4.2 Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| TypeScript | Type checking |
| npm | Package management |

### 4.3 Package Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.3",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

### 4.4 File Structure

```
abangbob-dashboard/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Dashboard home
│   ├── globals.css           # Global styles
│   ├── pos/                  # POS module
│   ├── hr/                   # HR module
│   ├── inventory/            # Inventory module
│   ├── staff-portal/         # Staff portal
│   └── ...                   # Other modules
├── components/               # Reusable components
│   ├── MainLayout.tsx        # Main layout wrapper
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── Modal.tsx             # Modal dialog
│   ├── charts/               # Chart components
│   ├── staff-portal/         # Staff portal components
│   └── ui/                   # UI primitives
├── lib/                      # Utilities and logic
│   ├── types.ts              # TypeScript interfaces
│   ├── store.tsx             # State management
│   ├── contexts/             # React contexts
│   ├── services/             # External services
│   ├── i18n/                 # Translations
│   └── *-data.ts             # Mock data files
├── public/                   # Static assets
│   ├── manifest.json         # PWA manifest
│   └── sw.js                 # Service worker
└── package.json              # Dependencies
```

---

## 5. Core Modules

### 5.1 Dashboard Module

**Path:** `/`  
**File:** `app/page.tsx`

#### Features

- Real-time sales summary (BND currency)
- Order count and status breakdown
- Low stock alerts
- Staff attendance status
- Sales trend chart (7 days)
- Inventory levels chart
- Staff attendance chart
- Quick action buttons
- Recent orders table

#### Key Components

```typescript
// Dashboard data sources
const { inventory } = useInventory();
const { staff, getStaffAttendanceToday } = useStaff();
const { getTodayOrders } = useOrders();

// Calculated metrics
const salesToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
const lowStockItems = inventory.filter(item => item.currentQuantity <= item.minQuantity);
const onDutyStaff = activeStaff.filter(s => {
  const record = getStaffAttendanceToday(s.id);
  return record?.clockInTime && !record?.clockOutTime;
});
```

---

### 5.2 POS System Module

**Path:** `/pos`  
**File:** `app/pos/page.tsx`

#### Features

| Feature | Description |
|---------|-------------|
| **Menu Display** | Grid view with category filtering |
| **Cart Management** | Add, remove, quantity adjustment |
| **Modifier System** | Required/optional modifiers with pricing |
| **Upselling** | Forced drink upsell before checkout |
| **Discount** | Percentage-based discounts (0-20%) |
| **Order Types** | Takeaway, GoMamam delivery |
| **Phone Validation** | Brunei +673 format validation |
| **Receipt Printing** | Browser-based print functionality |
| **Order Queue** | Kanban-style order status management |
| **Order History** | Today's orders with status |

#### Order Flow

```
1. Select Menu Items
      │
      ▼
2. Modifier Selection (if applicable)
      │
      ▼
3. Add to Cart
      │
      ▼
4. Upsell Check (drinks required)
      │
      ▼
5. Checkout Form (phone, order type)
      │
      ▼
6. Payment Processing
      │
      ▼
7. Receipt Generation
      │
      ▼
8. Order Queue (pending → preparing → ready → completed)
```

#### Order Status Flow

```
pending ──▶ preparing ──▶ ready ──▶ completed
```

---

### 5.3 Menu Management Module

**Path:** `/menu-management`  
**File:** `app/menu-management/page.tsx`

#### Features

- Menu item CRUD operations
- Category management
- Modifier group configuration
- Modifier options with extra pricing
- Item availability toggle
- Price management

#### Modifier System

```typescript
interface ModifierGroup {
  id: string;
  name: string;           // "Pilih Sos"
  isRequired: boolean;    // Wajib pilih?
  allowMultiple: boolean; // Multiple selection?
  minSelection: number;   // Minimum choices
  maxSelection: number;   // Maximum choices
}

interface ModifierOption {
  id: string;
  groupId: string;
  name: string;           // "Extra Cheese"
  extraPrice: number;     // Additional cost
  isAvailable: boolean;
}
```

---

### 5.4 HR Management Module

**Path:** `/hr/*`  
**Files:** `app/hr/page.tsx`, `app/hr/*/page.tsx`

#### Sub-Modules

| Path | Function |
|------|----------|
| `/hr` | HR Dashboard with live roster |
| `/hr/staff` | Staff list and search |
| `/hr/staff/new` | Staff registration form |
| `/hr/timeclock` | Clock in/out with PIN |
| `/hr/kpi` | KPI leaderboard |
| `/hr/kpi/[staffId]` | Individual KPI details |
| `/hr/payroll` | Payroll generation |
| `/hr/schedule` | Shift scheduling |
| `/hr/approvals` | Leave/claim approvals |
| `/hr/leave-calendar` | Visual leave calendar |
| `/hr/checklist-config` | Checklist template config |

#### Staff Profile Fields

```typescript
interface StaffProfile {
  // Personal Information
  id: string;
  employeeNumber?: string;
  name: string;
  icNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  nationality?: string;
  phone: string;
  email?: string;
  address?: string;
  
  // Employment Details
  role: 'Manager' | 'Staff';
  position?: string;
  department?: string;
  employmentType?: 'permanent' | 'contract' | 'part-time' | 'probation';
  joinDate?: string;
  status: 'active' | 'on-leave' | 'terminated';
  
  // Authentication
  pin: string;  // 4-digit PIN for clock in
  
  // Compensation
  salaryType?: 'monthly' | 'hourly' | 'daily';
  baseSalary: number;
  hourlyRate: number;
  
  // Statutory (Brunei)
  statutoryContributions?: {
    tapNumber?: string;
    tapEmployeeRate?: number;
    tapEmployerRate?: number;
    scpNumber?: string;
    scpEmployeeRate?: number;
    scpEmployerRate?: number;
  };
  
  // Permissions
  permissions?: StaffPermissions;
}
```

#### KPI System

```typescript
interface KPIMetrics {
  mealPrepTime: number;      // 0-100
  attendance: number;         // 0-100
  emergencyLeave: number;     // 0-100
  upselling: number;          // 0-100
  customerRating: number;     // 0-100
  wasteReduction: number;     // 0-100
  trainingComplete: number;   // 0-100
  otWillingness: number;      // 0-100
}

// Scoring tiers
const RANK_TIERS = [
  { min: 90, tier: 'S', icon: '👑', color: '#f59e0b' },
  { min: 80, tier: 'A', icon: '🌟', color: '#22c55e' },
  { min: 70, tier: 'B', icon: '💪', color: '#3b82f6' },
  { min: 60, tier: 'C', icon: '📈', color: '#8b5cf6' },
  { min: 0, tier: 'D', icon: '🎯', color: '#6b7280' },
];
```

---

### 5.5 Inventory Module

**Path:** `/inventory`  
**File:** `app/inventory/page.tsx`

#### Features

- Stock item management (CRUD)
- Category filtering (Protein, Staple, Condiment, etc.)
- Unit tracking (kg, pcs, litre, etc.)
- Minimum quantity alerts
- Stock adjustment (in/out)
- Adjustment history logging
- Cost tracking per unit
- Supplier association

#### Stock Categories

```typescript
const STOCK_CATEGORIES = [
  'Protein',
  'Staple',
  'Condiment',
  'Bread',
  'Dairy',
  'Beverage',
  'Packaging',
  'Other'
];

const STOCK_UNITS = ['kg', 'pcs', 'litre', 'gram', 'slices', 'boxes', 'packets'];
```

#### Adjustment Reasons

```typescript
const ADJUSTMENT_REASONS = [
  'Pembelian baru',
  'Penambahan stok',
  'Penggunaan harian',
  'Rosak/Expired',
  'Pembaziran',
  'Stock take adjustment',
  'Lain-lain'
];
```

---

### 5.6 Delivery Hub Module

**Path:** `/delivery`  
**File:** `app/delivery/page.tsx`

#### Features

- Multi-platform order aggregation (Grab, FoodPanda, Shopee)
- Kanban-style order board
- Audio notification for new orders
- Status progression (new → preparing → ready → picked_up)
- Delivery slip printing
- Driver information display
- Platform connection status

#### Supported Platforms

```typescript
const DELIVERY_PLATFORMS = [
  { name: 'Grab', color: '#00b14f', status: 'online' },
  { name: 'Panda', color: '#d70f64', status: 'online' },
  { name: 'Shopee', color: '#ee4d2d', status: 'online' }
];
```

---

### 5.7 Staff Portal Module

**Path:** `/staff-portal/*`  
**Files:** `app/staff-portal/*/page.tsx`

#### Sub-Modules

| Path | Function |
|------|----------|
| `/staff-portal` | Portal home with quick links |
| `/staff-portal/schedule` | Personal schedule view |
| `/staff-portal/checklist` | Opening/closing checklists |
| `/staff-portal/checklist/history` | Completed checklists |
| `/staff-portal/leave` | Leave balance and requests |
| `/staff-portal/leave/apply` | New leave application |
| `/staff-portal/claims` | Expense claims |
| `/staff-portal/claims/new` | Submit new claim |
| `/staff-portal/requests` | General HR requests |
| `/staff-portal/payslip` | Payslip viewing |
| `/staff-portal/profile` | Personal profile |
| `/staff-portal/training` | Training modules |
| `/staff-portal/swap-shift` | Shift swap requests |

#### Leave Types

```typescript
type LeaveType = 
  | 'annual' 
  | 'medical' 
  | 'emergency' 
  | 'unpaid' 
  | 'maternity' 
  | 'paternity' 
  | 'compassionate'
  | 'replacement'
  | 'study';
```

#### Claim Types

```typescript
type ClaimType = 
  | 'medical'
  | 'transport'
  | 'meal'
  | 'training'
  | 'phone'
  | 'uniform'
  | 'equipment'
  | 'other';
```

---

### 5.8 Finance Module

**Path:** `/finance`  
**File:** `app/finance/page.tsx`

#### Features

- Expense tracking
- Daily cash flow management
- Profit & Loss reports
- Expense categorization
- Payment method tracking
- Monthly summaries

#### Expense Categories

```typescript
type ExpenseCategory = 
  | 'rent' 
  | 'utilities' 
  | 'supplies' 
  | 'wages' 
  | 'marketing' 
  | 'maintenance' 
  | 'ingredients' 
  | 'equipment' 
  | 'other';
```

#### Cash Flow Structure

```typescript
interface DailyCashFlow {
  id: string;
  date: string;
  openingCash: number;
  salesCash: number;
  salesCard: number;
  salesEwallet: number;
  expensesCash: number;
  closingCash: number;
  notes?: string;
  closedBy?: string;
  closedAt?: string;
}
```

---

### 5.9 Customer CRM Module

**Path:** `/customers`  
**File:** `app/customers/page.tsx`

#### Features

- Customer database
- Loyalty points system
- Customer segmentation
- Order history per customer
- Birthday tracking

#### Customer Segments

```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  segment: 'new' | 'regular' | 'vip';
  lastOrderAt?: string;
}

// Segment calculation
// Points >= 500: VIP
// Points >= 100: Regular
// Points < 100: New
```

---

### 5.10 Promotions Module

**Path:** `/promotions`  
**File:** `app/promotions/page.tsx`

#### Features

- Promo code creation
- Discount types (percentage, fixed, BOGO)
- Date range validity
- Usage limits
- Applicable item selection
- Day/time restrictions

#### Promotion Types

```typescript
interface Promotion {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'bogo' | 'free_item';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  promoCode?: string;
  applicableItems: string[];  // Empty = all items
  startDate: string;
  endDate: string;
  daysOfWeek?: number[];      // 0-6 (Sun-Sat)
  startTime?: string;
  endTime?: string;
  usageLimit?: number;
  usageCount: number;
  status: 'active' | 'inactive' | 'expired';
}
```

---

### 5.11 Production Module

**Path:** `/production`  
**File:** `app/production/page.tsx`

#### Features

- Oil tracker for fryers
- Cycle counting
- Change date tracking
- Production logs
- Waste tracking

#### Oil Tracker

```typescript
interface OilTracker {
  fryerId: string;
  name: string;
  currentCycles: number;
  cycleLimit: number;
  lastChangedDate: string;
  status: 'good' | 'warning' | 'critical';
}
```

---

## 6. Data Models

### 6.1 Complete Type Definitions

All TypeScript interfaces are defined in `lib/types.ts`. The system includes 50+ interfaces covering:

#### Order & Menu Types
- `MenuItem` - Menu item definition
- `ModifierGroup` - Modifier group configuration
- `ModifierOption` - Individual modifier options
- `SelectedModifier` - Selected modifiers in cart
- `CartItem` - Cart item with modifiers
- `Order` - Complete order structure

#### Staff & HR Types
- `StaffProfile` - Comprehensive staff profile
- `AttendanceRecord` - Clock in/out records
- `PayrollEntry` - Payroll calculations
- `StaffKPI` - KPI scores and rankings
- `LeaveBalance` - Leave entitlements
- `LeaveRequest` - Leave applications
- `ClaimRequest` - Expense claims
- `StaffRequest` - General requests
- `Shift` - Shift definitions
- `ScheduleEntry` - Schedule assignments

#### Inventory Types
- `StockItem` - Inventory items
- `InventoryLog` - Stock adjustments

#### Finance Types
- `Expense` - Expense records
- `DailyCashFlow` - Daily cash management
- `ProfitLossReport` - P&L structure

#### Customer & Marketing Types
- `Customer` - Customer profiles
- `LoyaltyTransaction` - Points transactions
- `Promotion` - Promo configurations

#### Supplier Types
- `Supplier` - Supplier profiles
- `PurchaseOrder` - PO management

#### Recipe Types
- `Recipe` - Recipe definitions
- `RecipeIngredient` - Ingredient costing

#### Delivery Types
- `DeliveryOrder` - Platform orders

#### Checklist Types
- `ChecklistItemTemplate` - Checklist templates
- `ChecklistCompletion` - Completed checklists

---

## 7. State Management

### 7.1 Store Architecture

The application uses React Context with a centralized store pattern defined in `lib/store.tsx`.

#### Store Provider

```typescript
export function StoreProvider({ children }: { children: ReactNode }) {
  // State declarations
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  // ... more states

  // Actions
  const addOrder = useCallback((orderData) => {
    // Implementation
  }, []);

  // Context value
  const value: StoreState = {
    inventory,
    orders,
    addOrder,
    // ... more
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}
```

### 7.2 Custom Hooks

| Hook | Purpose |
|------|---------|
| `useStore()` | Full store access |
| `useInventory()` | Inventory operations |
| `useStaff()` | Staff management |
| `useOrders()` | Order operations |
| `useFinance()` | Finance data |
| `useCustomers()` | Customer management |
| `useSuppliers()` | Supplier operations |
| `useRecipes()` | Recipe management |
| `useSchedules()` | Schedule operations |
| `usePromotions()` | Promotion management |
| `useNotifications()` | Notification handling |
| `useMenu()` | Menu and modifiers |
| `useKPI()` | KPI operations |
| `useStaffPortal()` | Staff portal features |

### 7.3 LocalStorage Keys

```typescript
const STORAGE_KEYS = {
  INVENTORY: 'abangbob_inventory',
  STAFF: 'abangbob_staff',
  ATTENDANCE: 'abangbob_attendance',
  ORDERS: 'abangbob_orders',
  PRODUCTION_LOGS: 'abangbob_production_logs',
  DELIVERY_ORDERS: 'abangbob_delivery_orders',
  INVENTORY_LOGS: 'abangbob_inventory_logs',
  EXPENSES: 'abangbob_expenses',
  CASH_FLOWS: 'abangbob_cash_flows',
  CUSTOMERS: 'abangbob_customers',
  SUPPLIERS: 'abangbob_suppliers',
  PURCHASE_ORDERS: 'abangbob_purchase_orders',
  RECIPES: 'abangbob_recipes',
  SHIFTS: 'abangbob_shifts',
  SCHEDULES: 'abangbob_schedules',
  PROMOTIONS: 'abangbob_promotions',
  NOTIFICATIONS: 'abangbob_notifications',
  MENU_ITEMS: 'abangbob_menu_items',
  MODIFIER_GROUPS: 'abangbob_modifier_groups',
  MODIFIER_OPTIONS: 'abangbob_modifier_options',
  STAFF_KPI: 'abangbob_staff_kpi',
  LEAVE_RECORDS: 'abangbob_leave_records',
  TRAINING_RECORDS: 'abangbob_training_records',
  OT_RECORDS: 'abangbob_ot_records',
  CUSTOMER_REVIEWS: 'abangbob_customer_reviews',
  CHECKLIST_TEMPLATES: 'abangbob_checklist_templates',
  CHECKLIST_COMPLETIONS: 'abangbob_checklist_completions',
  LEAVE_BALANCES: 'abangbob_leave_balances',
  LEAVE_REQUESTS: 'abangbob_leave_requests',
  CLAIM_REQUESTS: 'abangbob_claim_requests',
  STAFF_REQUESTS: 'abangbob_staff_requests',
  ANNOUNCEMENTS: 'abangbob_announcements',
};
```

### 7.4 Persistence Pattern

```typescript
// Load from storage on mount
useEffect(() => {
  setInventory(getFromStorage(STORAGE_KEYS.INVENTORY, MOCK_STOCK));
  setIsInitialized(true);
}, []);

// Persist on change
useEffect(() => {
  if (isInitialized) {
    setToStorage(STORAGE_KEYS.INVENTORY, inventory);
  }
}, [inventory, isInitialized]);
```

---

## 8. User Interface

### 8.1 Navigation Structure

#### Sidebar Groups

```typescript
const navGroups = [
  {
    title: 'Utama',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Staff Portal',
    items: [
      { href: '/staff-portal', label: 'Portal Staf', icon: UserCircle },
      { href: '/staff-portal/schedule', label: 'Jadual Saya', icon: Calendar },
      { href: '/staff-portal/checklist', label: 'Checklist', icon: CheckSquare }
    ]
  },
  {
    title: 'Operasi',
    items: [
      { href: '/pos', label: 'POS', icon: ShoppingCart },
      { href: '/menu-management', label: 'Menu', icon: BookOpen },
      { href: '/kds', label: 'Kitchen Display', icon: Monitor },
      { href: '/tables', label: 'Meja', icon: LayoutGrid },
      { href: '/delivery', label: 'Delivery Hub', icon: Truck }
    ]
  },
  {
    title: 'Inventori & Produksi',
    items: [
      { href: '/inventory', label: 'Inventori', icon: Package },
      { href: '/production', label: 'Production', icon: Factory },
      { href: '/recipes', label: 'Resepi', icon: ChefHat },
      { href: '/suppliers', label: 'Supplier', icon: Boxes }
    ]
  },
  {
    title: 'HR & Kewangan',
    items: [
      { href: '/hr', label: 'HR & Staf', icon: Users },
      { href: '/hr/approvals', label: 'Kelulusan', icon: ClipboardCheck },
      { href: '/hr/leave-calendar', label: 'Kalendar Cuti', icon: Calendar },
      { href: '/hr/checklist-config', label: 'Config Checklist', icon: CheckSquare },
      { href: '/finance', label: 'Kewangan', icon: DollarSign }
    ]
  },
  {
    title: 'Pemasaran',
    items: [
      { href: '/customers', label: 'Pelanggan', icon: UserCheck },
      { href: '/promotions', label: 'Promosi', icon: Tag }
    ]
  },
  {
    title: 'Laporan & Tetapan',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/audit-log', label: 'Audit Log', icon: FileText },
      { href: '/notifications', label: 'Notifikasi', icon: Bell },
      { href: '/settings', label: 'Tetapan', icon: Settings }
    ]
  }
];
```

### 8.2 Component Library

#### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| `MainLayout` | `components/MainLayout.tsx` | Page layout wrapper |
| `Sidebar` | `components/Sidebar.tsx` | Navigation sidebar |
| `TopNav` | `components/TopNav.tsx` | Top navigation bar |
| `BottomNav` | `components/BottomNav.tsx` | Mobile navigation |
| `Modal` | `components/Modal.tsx` | Dialog overlays |
| `DataTable` | `components/DataTable.tsx` | Table component |
| `StatCard` | `components/StatCard.tsx` | Metric cards |
| `ChartCard` | `components/ChartCard.tsx` | Chart containers |
| `FormField` | `components/FormField.tsx` | Form inputs |
| `LoadingSpinner` | `components/LoadingSpinner.tsx` | Loading states |
| `EmptyState` | `components/EmptyState.tsx` | Empty data display |
| `Skeleton` | `components/Skeleton.tsx` | Loading skeletons |
| `Tabs` | `components/Tabs.tsx` | Tab navigation |
| `Tooltip` | `components/Tooltip.tsx` | Hover tooltips |
| `Popover` | `components/Popover.tsx` | Popover menus |
| `Sheet` | `components/Sheet.tsx` | Slide-out panels |
| `Timeline` | `components/Timeline.tsx` | Timeline display |

#### Chart Components

| Component | File | Purpose |
|-----------|------|---------|
| `SalesTrendChart` | `components/charts/SalesTrendChart.tsx` | Line chart for sales |
| `InventoryLevelChart` | `components/charts/InventoryLevelChart.tsx` | Bar chart for inventory |
| `StaffAttendanceChart` | `components/charts/StaffAttendanceChart.tsx` | Pie chart for attendance |

#### Staff Portal Components

| Component | File | Purpose |
|-----------|------|---------|
| `AchievementBadge` | `components/staff-portal/AchievementBadge.tsx` | Badge display |
| `BirthdayBanner` | `components/staff-portal/BirthdayBanner.tsx` | Birthday celebrations |
| `DarkModeToggle` | `components/staff-portal/DarkModeToggle.tsx` | Theme toggle |
| `DocumentUpload` | `components/staff-portal/DocumentUpload.tsx` | File upload |
| `EmergencySOS` | `components/staff-portal/EmergencySOS.tsx` | Emergency alert |
| `FeedbackModal` | `components/staff-portal/FeedbackModal.tsx` | Feedback form |
| `MoodCheckIn` | `components/staff-portal/MoodCheckIn.tsx` | Mood tracking |
| `NotificationCenter` | `components/staff-portal/NotificationCenter.tsx` | Notifications |
| `TeamTodayWidget` | `components/staff-portal/TeamTodayWidget.tsx` | Team status |

### 8.3 CSS Styling

#### CSS Variables

```css
:root {
  /* Colors */
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --primary-light: #dbeafe;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  
  /* Grays */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  
  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-light: #94a3b8;
  
  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  
  /* Spacing */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #2563eb, #1d4ed8);
  --gradient-success: linear-gradient(135deg, #22c55e, #16a34a);
  --gradient-warning: linear-gradient(135deg, #f59e0b, #d97706);
}
```

#### Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

---

## 9. Services & Integrations

### 9.1 WhatsApp Service

**File:** `lib/services/whatsapp.ts`

#### Functions

| Function | Purpose |
|----------|---------|
| `isWhatsAppConfigured()` | Check configuration status |
| `getWhatsAppConfig()` | Get API configuration |
| `saveWhatsAppConfig()` | Save API credentials |
| `formatPhoneNumber()` | Format to Brunei format |
| `generateOrderReceiptMessage()` | Create receipt message |
| `generateOrderReadyMessage()` | Create ready notification |
| `generateLowStockAlertMessage()` | Create stock alert |
| `generateDailySummaryMessage()` | Create daily summary |
| `sendWhatsAppMessage()` | Send via API (mock) |
| `openWhatsAppWeb()` | Open WhatsApp Web |
| `sendReceiptViaWhatsAppWeb()` | Send via WhatsApp Web |

### 9.2 PDF Generator Service

**File:** `lib/services/pdf-generator.ts`

#### Functions

| Function | Purpose |
|----------|---------|
| `generatePrintableReport()` | Create printable HTML |
| `printReport()` | Open print dialog |
| `generateDailySalesReport()` | Daily sales PDF |
| `generateInventoryReport()` | Inventory PDF |
| `generateStaffAttendanceReport()` | Attendance PDF |
| `generateExpenseReport()` | Expense PDF |

### 9.3 Excel Export Service

**File:** `lib/services/excel-export.ts`

Handles CSV/Excel export functionality for:
- Orders
- Inventory
- Attendance
- Expenses

### 9.4 Multi-Outlet Service

**File:** `lib/services/multi-outlet.ts`

Prepares for multi-location support:
- Outlet configuration
- Data segregation
- Cross-outlet reporting

### 9.5 Realtime Service

**File:** `lib/services/realtime.ts`

Placeholder for real-time functionality:
- WebSocket connections
- Live updates
- Push notifications

### 9.6 Forecasting Service

**File:** `lib/services/forecasting.ts`

Placeholder for AI/ML features:
- Sales predictions
- Inventory forecasting
- Demand planning

---

## 10. Internationalization

### 10.1 Supported Languages

| Code | Language |
|------|----------|
| `en` | English |
| `ms` | Bahasa Melayu |

### 10.2 Translation Files

**Location:** `lib/i18n/`

```
lib/i18n/
├── en.json    # English translations
└── ms.json    # Malay translations
```

### 10.3 Language Context

**File:** `lib/contexts/LanguageContext.tsx`

```typescript
interface LanguageContextType {
  language: 'en' | 'ms';
  setLanguage: (lang: 'en' | 'ms') => void;
  t: (key: string) => string;
}
```

---

## 11. PWA Features

### 11.1 Manifest Configuration

**File:** `public/manifest.json`

```json
{
  "name": "AbangBob Dashboard",
  "short_name": "AbangBob",
  "description": "Sistem Pengurusan Kedai Nasi Lemak & Burger",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#2563eb",
  "orientation": "any",
  "categories": ["business", "food", "productivity"]
}
```

### 11.2 App Shortcuts

```json
{
  "shortcuts": [
    {
      "name": "POS",
      "url": "/pos"
    },
    {
      "name": "Kitchen Display",
      "url": "/kds"
    },
    {
      "name": "Inventori",
      "url": "/inventory"
    }
  ]
}
```

### 11.3 Service Worker

**File:** `public/sw.js`

Features:
- Offline caching
- Background sync
- Push notifications (placeholder)

### 11.4 Service Worker Registration

**File:** `components/ServiceWorkerRegistration.tsx`

Handles SW registration and update prompts.

---

## 12. Security Considerations

### 12.1 Authentication

Currently implemented:
- PIN-based authentication for clock in/out
- Role-based UI display (Manager/Staff)

Future implementation needed:
- JWT-based authentication
- Session management
- Password hashing

### 12.2 Permissions System

```typescript
interface StaffPermissions {
  canApproveLeave: boolean;
  canApproveClaims: boolean;
  canViewReports: boolean;
  canManageStaff: boolean;
  canAccessPOS: boolean;
  canGiveDiscount: boolean;
  maxDiscountPercent: number;
  canVoidTransaction: boolean;
  canAccessInventory: boolean;
  canAccessFinance: boolean;
  canAccessKDS: boolean;
  canManageMenu: boolean;
}
```

### 12.3 Data Validation

- Phone number format validation (Brunei +673)
- Required field validation
- Numeric range validation
- Date validation

### 12.4 Security Recommendations

1. **Implement proper authentication** with bcrypt password hashing
2. **Add HTTPS enforcement** in production
3. **Implement CSRF protection** for form submissions
4. **Add rate limiting** for API endpoints
5. **Encrypt sensitive data** in localStorage
6. **Implement audit logging** for sensitive operations
7. **Add input sanitization** for all user inputs

---

## 13. Future Roadmap

### 13.1 Phase 1: Backend Integration

- [ ] Supabase database integration
- [ ] Real authentication system
- [ ] API endpoints for all CRUD operations
- [ ] Real-time subscriptions
- [ ] File storage for documents

### 13.2 Phase 2: Advanced Features

- [ ] WhatsApp Business API integration
- [ ] Payment gateway integration (HNB, BIBD)
- [ ] QR code ordering for customers
- [ ] Advanced analytics with AI insights
- [ ] Automated inventory reordering

### 13.3 Phase 3: Enterprise Features

- [ ] Multi-outlet support
- [ ] Franchise management
- [ ] Advanced reporting
- [ ] IoT integration (temperature sensors, scales)
- [ ] Third-party POS hardware integration

### 13.4 Phase 4: Platform Expansion

- [ ] Mobile app (React Native)
- [ ] Customer-facing app
- [ ] Supplier portal
- [ ] API for third-party integrations

---

## 14. Appendices

### 14.1 Environment Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 14.2 Directory Reference

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js pages and layouts |
| `components/` | React components |
| `lib/` | Utilities, types, store |
| `lib/contexts/` | React context providers |
| `lib/services/` | External service integrations |
| `lib/i18n/` | Translation files |
| `public/` | Static assets |

### 14.3 Mock Data Files

| File | Content |
|------|---------|
| `lib/inventory-data.ts` | Sample inventory items |
| `lib/hr-data.ts` | Sample staff and attendance |
| `lib/production-data.ts` | Sample production logs |
| `lib/delivery-data.ts` | Sample delivery orders |
| `lib/finance-data.ts` | Sample expenses |
| `lib/menu-data.ts` | Sample menu items |
| `lib/kpi-data.ts` | KPI configuration |
| `lib/staff-portal-data.ts` | Staff portal mock data |
| `lib/sales-data.ts` | Sales analytics data |
| `lib/audit-data.ts` | Audit log data |

### 14.4 Context Providers

| Context | File | Purpose |
|---------|------|---------|
| `ThemeContext` | `lib/contexts/ThemeContext.tsx` | Dark/light mode |
| `LanguageContext` | `lib/contexts/LanguageContext.tsx` | i18n |
| `ToastContext` | `lib/contexts/ToastContext.tsx` | Toast notifications |
| `SoundContext` | `lib/contexts/SoundContext.tsx` | Sound effects |
| `KeyboardShortcutsContext` | `lib/contexts/KeyboardShortcutsContext.tsx` | Keyboard shortcuts |

### 14.5 Contact Information

- **Project:** AbangBob Dashboard
- **Version:** 1.0.0
- **Platform:** Web (PWA)
- **Target Market:** Brunei F&B Industry

---

*Document generated: December 2024*  
*Last updated: December 2024*

