# 🚀 Step-by-Step Guide: Fill TestSprite Form

**Untuk:** AbangBob Dashboard  
**URL:** https://abangbob-dashboard.vercel.app  
**Tarikh:** 14 Disember 2024

---

## 📖 Table of Contents

1. [Quick Overview](#quick-overview)
2. [Before You Start](#before-you-start)
3. [Section A: Frontend APIs (7 APIs)](#section-a-frontend-apis)
4. [Section B: Supabase APIs (7 APIs)](#section-b-supabase-apis)
5. [Troubleshooting](#troubleshooting)
6. [Verification Checklist](#verification-checklist)

---

## Quick Overview

Kamu akan add **14 APIs** dalam TestSprite:
- ✅ **7 Frontend APIs** - Test UI pages
- ✅ **7 Supabase APIs** - Test database operations

**Estimated Time:** 20-30 minit

---

## Before You Start

### What You Need:
- ✅ TestSprite account (logged in)
- ✅ Browser terbuka di screenshot page kamu
- ✅ File `testsprite-api-list.md` untuk reference
- ✅ Credentials untuk test:
  - Admin: admin@abangbob.com / Admin123!
  - Supabase key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### TestSprite Form Fields:
Setiap API akan ada 4 fields utama:
1. **API name** - Nama descriptive
2. **API endpoint / URL** - Full URL
3. **Authentication Type** - Dropdown selection
4. **Extra testing information** - Optional notes

---

## Section A: Frontend APIs

Test frontend pages through browser. Semua ni guna **Authentication Type: None**

### 🔐 API #1: Login Page

**Steps:**
1. Click "+ Add API" button (hijau, sebelah kiri)
2. Fill in form:

```
API name:
AbangBob - Login Page

API endpoint / URL:
https://abangbob-dashboard.vercel.app/login

Authentication Type:
[Select] None - No authentication required

Extra testing information:
Public login page. Test admin authentication flow.
Test credentials:
- Admin: admin@abangbob.com / Admin123!
- Manager: manager@abangbob.com / Manager123!
Verify successful login redirects to dashboard.
```

3. Click "Save" atau "Add"
4. Verify "Login Page" muncul dalam left panel

---

### 🏠 API #2: Main Dashboard

**Steps:**
1. Click "+ Add API" lagi
2. Fill in:

```
API name:
AbangBob - Main Dashboard

API endpoint / URL:
https://abangbob-dashboard.vercel.app/

Authentication Type:
[Select] None - No authentication required

Extra testing information:
Main dashboard showing sales summary, alerts, and KPIs.
Requires authenticated session (login first).
Test data visualization and real-time updates.
```

3. Click "Save"

---

### 🛒 API #3: POS System

```
API name:
AbangBob - POS System

API endpoint / URL:
https://abangbob-dashboard.vercel.app/pos

Authentication Type:
[Select] None - No authentication required

Extra testing information:
Point of Sale system for order processing.
Test order creation flow:
1. Select menu items
2. Add to cart with modifiers
3. Apply discounts/promotions
4. Complete checkout with payment
Verify order total calculations and validation.
```

---

### 🍽️ API #4: Menu Management

```
API name:
AbangBob - Menu Management

API endpoint / URL:
https://abangbob-dashboard.vercel.app/menu-management

Authentication Type:
[Select] None - No authentication required

Extra testing information:
CRUD operations for menu items and categories.
Test:
- View menu items list
- Add new menu item
- Edit existing item
- Delete item
Verify real-time updates and data persistence.
```

---

### 👤 API #5: Staff Portal

```
API name:
AbangBob - Staff Portal

API endpoint / URL:
https://abangbob-dashboard.vercel.app/staff-portal

Authentication Type:
[Select] None - No authentication required

Extra testing information:
Self-service portal for staff members.
Test PIN login (PIN: 3456 for test staff).
Features: view schedule, apply leave, submit claims, checklist.
```

---

### 👥 API #6: HR Management

```
API name:
AbangBob - HR Management

API endpoint / URL:
https://abangbob-dashboard.vercel.app/hr

Authentication Type:
[Select] None - No authentication required

Extra testing information:
HR module for staff management, attendance, payroll.
Test:
- Staff CRUD operations
- Clock in/out functionality
- Attendance tracking
- KPI monitoring
Requires manager/admin role.
```

---

### 📦 API #7: Inventory Management

```
API name:
AbangBob - Inventory Management

API endpoint / URL:
https://abangbob-dashboard.vercel.app/inventory

Authentication Type:
[Select] None - No authentication required

Extra testing information:
Inventory tracking and stock management.
Test:
- View stock levels
- Add/update inventory items
- Low stock alerts
- Stock adjustments
Verify real-time stock calculations.
```

---

## Section B: Supabase APIs

Test direct database operations. Semua ni guna **Authentication Type: API Key**

### 🔑 IMPORTANT: API Key Setup

Untuk semua Supabase APIs (8-14), kamu kena add **3 headers**:

**Kalau TestSprite ada field untuk headers, masukkan:**

```
Header 1:
Key: apikey
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta2VpcWZpY3BzZml3aHFjaHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mjc1MDgsImV4cCI6MjA4MTIwMzUwOH0.yUsDxYw3c8vtSWew_ACiLYAYJHRwDz0X9EgQAPuwTts

Header 2:
Key: Authorization
Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta2VpcWZpY3BzZml3aHFjaHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mjc1MDgsImV4cCI6MjA4MTIwMzUwOH0.yUsDxYw3c8vtSWew_ACiLYAYJHRwDz0X9EgQAPuwTts

Header 3:
Key: Content-Type
Value: application/json
```

---

### 🍽️ API #8: Menu Items API

**Steps:**
1. Click "+ Add API"
2. Fill in:

```
API name:
Supabase - Menu Items

API endpoint / URL:
https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/menu_items

Authentication Type:
[Select] API Key
```

3. **PENTING:** Add headers (kalau ada field untuk ni):
   - Ikut format atas (apikey, Authorization, Content-Type)

4. Extra testing information:

```
Direct database access for menu items.
Test CRUD operations:
- GET: Fetch all menu items
- POST: Create new item with {name, category, price, available}
- PATCH: Update existing item by id
- DELETE: Remove item by id
Verify data persistence and validation.
```

5. Click "Save"

---

### 🛍️ API #9: Orders API

```
API name:
Supabase - Orders

API endpoint / URL:
https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/orders

Authentication Type:
[Select] API Key
[Add the 3 headers dari atas]

Extra testing information:
Order management and sales tracking.
Test operations:
- GET: Fetch order history
- POST: Create new order with items array and customer info
- PATCH: Update order status (pending/preparing/completed/cancelled)
Verify order calculations and status transitions.
```

---

### 👨‍💼 API #10: Staff API

```
API name:
Supabase - Staff

API endpoint / URL:
https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/staff

Authentication Type:
[Select] API Key
[Add the 3 headers]

Extra testing information:
Employee data and profile management.
Test operations:
- GET: List all staff members
- POST: Create new staff with {name, role, pin, email}
- PATCH: Update staff details
- DELETE: Remove staff member
Verify role-based access and PIN validation.
```

---

### 📦 API #11: Inventory API

```
API name:
Supabase - Inventory

API endpoint / URL:
https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/inventory

Authentication Type:
[Select] API Key
[Add the 3 headers]

Extra testing information:
Stock and inventory management.
Test operations:
- GET: Fetch all inventory items with current quantities
- POST: Add new inventory item with {name, quantity, unit, min_stock}
- PATCH: Update stock levels and trigger low stock alerts
Verify stock calculations and alert thresholds.
```

---

### 👥 API #12: Customers API

```
API name:
Supabase - Customers

API endpoint / URL:
https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/customers

Authentication Type:
[Select] API Key
[Add the 3 headers]

Extra testing information:
Customer relationship management and loyalty tracking.
Test operations:
- GET: List customers with loyalty points
- POST: Register new customer with {name, phone, email}
- PATCH: Update customer profile and loyalty points
Verify phone number validation (Brunei format).
```

---

### ⏰ API #13: Attendance API

```
API name:
Supabase - Attendance

API endpoint / URL:
https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/attendance

Authentication Type:
[Select] API Key
[Add the 3 headers]

Extra testing information:
Staff attendance and time tracking.
Test operations:
- GET: Fetch attendance records with date filters
- POST: Clock in with {staff_id, date, clock_in_time}
- PATCH: Clock out with clock_out_time
Verify work hours calculation and photo proof validation.
```

---

### 💰 API #14: Expenses API

```
API name:
Supabase - Expenses

API endpoint / URL:
https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/expenses

Authentication Type:
[Select] API Key
[Add the 3 headers]

Extra testing information:
Financial expense tracking and reporting.
Test operations:
- GET: Fetch expenses with date range and category filters
- POST: Create expense with {category, amount, date, description}
- PATCH: Update expense details
- DELETE: Remove expense record
Verify amount calculations and category validation.
```

---

## Troubleshooting

### Problem: "Authentication Type dropdown tak ada API Key option"

**Solution:**
- Look for "Bearer Token" atau "Custom Headers"
- Manually add headers dalam field yang provided
- Atau tulis dalam "Extra testing information"

### Problem: "Tak tau macam mana nak add multiple headers"

**Solution:**
- Check kalau ada "Add Header" button
- Atau TestSprite might have format: `Key: Value` separated by newlines
- Cuba format ni dalam notes:

```
Authentication Headers:
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Problem: "TestSprite reject URL format"

**Solution:**
- Make sure tiada extra spaces
- URL mesti start dengan `https://`
- Copy paste exactly dari guide ni

### Problem: "Nak test tapi tak tau sequence"

**Solution:**
Recommended test order:
1. Frontend: Login → Dashboard → POS
2. Supabase: Menu Items → Orders → Staff
3. Then test the rest

---

## Verification Checklist

Selepas add semua APIs, verify:

### Left Panel (API List)
- [ ] Ada 14 APIs total
- [ ] 7 APIs start dengan "AbangBob -"
- [ ] 7 APIs start dengan "Supabase -"
- [ ] Tiada duplicate names

### Each API Should Have:
- [ ] ✅ API name filled
- [ ] ✅ API endpoint URL filled
- [ ] ✅ Authentication type selected
- [ ] ✅ Extra info (optional but recommended)

### Supabase APIs Specifically:
- [ ] ✅ All use API Key authentication
- [ ] ✅ Headers configured (or documented)
- [ ] ✅ URLs contain `/rest/v1/` path

---

## 🎉 Next Steps After Setup

1. **Run Initial Tests**
   - Click "Run Tests" atau "Generate Tests" button
   - Monitor test execution
   - Check results

2. **Upload Documentation (Optional)**
   - Kalau TestSprite support file upload
   - Upload `testsprite-api-docs.json`
   - Atau `testsprite-openapi-spec.yaml`

3. **Monitor Results**
   - Check test reports
   - Look for failures or issues
   - Review test coverage

4. **Iterate**
   - Fix any failing tests
   - Add more test scenarios if needed
   - Re-run tests to verify fixes

---

## 📞 Quick Reference

| What | Value |
|------|-------|
| **Frontend URL** | https://abangbob-dashboard.vercel.app |
| **Supabase URL** | https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1 |
| **Admin Email** | admin@abangbob.com |
| **Admin Password** | Admin123! |
| **Test Staff PIN** | 3456 |
| **Supabase Key** | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |

---

## 💡 Tips untuk Best Results

1. **Start Simple**: Test frontend APIs dulu (easier to setup)
2. **Copy-Paste**: Jangan type manual - copy dari guide ni
3. **One at a Time**: Add 1 API, test, then proceed
4. **Check Headers**: Supabase APIs need correct headers
5. **Read Errors**: TestSprite error messages helpful untuk debug

---

## 📄 Related Files

Created for you dalam project root:
- `testsprite-api-list.md` - Complete API list with details
- `testsprite-api-docs.json` - JSON format documentation
- `testsprite-openapi-spec.yaml` - OpenAPI specification

---

**Good luck dengan testing! Kalau ada masalah, check Troubleshooting section. 🚀**

---

_Last Updated: December 14, 2024_
