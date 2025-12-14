# TestSprite API Configuration List

**Project:** AbangBob Dashboard  
**Deployment:** https://abangbob-dashboard.vercel.app/  
**Supabase:** https://gmkeiqficpsfiwhqchup.supabase.co  
**Date:** December 14, 2024

---

## 📋 Quick Summary

You have **2 types of APIs** to add in TestSprite:
1. **Frontend Pages** (7 APIs) - Test UI/UX and user journeys
2. **Supabase REST APIs** (7 APIs) - Test direct database operations

**Total APIs to add:** 14

---

## 🎯 Section 1: Frontend Page Testing

Test the actual web application pages and user flows.

### API #1: Login Page
```
API name: AbangBob - Login Page
API endpoint / URL: https://abangbob-dashboard.vercel.app/login
Authentication Type: None - No authentication required
Extra testing information:
Public login page. Test admin authentication flow.
Test credentials:
- Admin: admin@abangbob.com / Admin123!
- Manager: manager@abangbob.com / Manager123!
Verify successful login redirects to dashboard.
```

### API #2: Main Dashboard
```
API name: AbangBob - Main Dashboard
API endpoint / URL: https://abangbob-dashboard.vercel.app/
Authentication Type: None - No authentication required
Extra testing information:
Main dashboard showing sales summary, alerts, and KPIs.
Requires authenticated session (login first).
Test data visualization and real-time updates.
```

### API #3: POS System
```
API name: AbangBob - POS System
API endpoint / URL: https://abangbob-dashboard.vercel.app/pos
Authentication Type: None - No authentication required
Extra testing information:
Point of Sale system for order processing.
Test order creation flow:
1. Select menu items
2. Add to cart with modifiers
3. Apply discounts/promotions
4. Complete checkout with payment
Verify order total calculations and validation.
```

### API #4: Menu Management
```
API name: AbangBob - Menu Management
API endpoint / URL: https://abangbob-dashboard.vercel.app/menu-management
Authentication Type: None - No authentication required
Extra testing information:
CRUD operations for menu items and categories.
Test:
- View menu items list
- Add new menu item
- Edit existing item
- Delete item
Verify real-time updates and data persistence.
```

### API #5: Staff Portal
```
API name: AbangBob - Staff Portal
API endpoint / URL: https://abangbob-dashboard.vercel.app/staff-portal
Authentication Type: None - No authentication required
Extra testing information:
Self-service portal for staff members.
Test PIN login (PIN: 3456 for test staff).
Features: view schedule, apply leave, submit claims, checklist.
```

### API #6: HR Management
```
API name: AbangBob - HR Management
API endpoint / URL: https://abangbob-dashboard.vercel.app/hr
Authentication Type: None - No authentication required
Extra testing information:
HR module for staff management, attendance, payroll.
Test:
- Staff CRUD operations
- Clock in/out functionality
- Attendance tracking
- KPI monitoring
Requires manager/admin role.
```

### API #7: Inventory Management
```
API name: AbangBob - Inventory Management
API endpoint / URL: https://abangbob-dashboard.vercel.app/inventory
Authentication Type: None - No authentication required
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

## 🔌 Section 2: Supabase Direct API Testing

Test database operations directly through Supabase REST API.

**Important:** All Supabase APIs require these headers:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta2VpcWZpY3BzZml3aHFjaHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mjc1MDgsImV4cCI6MjA4MTIwMzUwOH0.yUsDxYw3c8vtSWew_ACiLYAYJHRwDz0X9EgQAPuwTts

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta2VpcWZpY3BzZml3aHFjaHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mjc1MDgsImV4cCI6MjA4MTIwMzUwOH0.yUsDxYw3c8vtSWew_ACiLYAYJHRwDz0X9EgQAPuwTts

Content-Type: application/json
```

### API #8: Menu Items API
```
API name: Supabase - Menu Items
API endpoint / URL: https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/menu_items
Authentication Type: API Key (add headers above)
Extra testing information:
Direct database access for menu items.
Test CRUD operations:
- GET: Fetch all menu items
- POST: Create new item with {name, category, price, available}
- PATCH: Update existing item by id
- DELETE: Remove item by id
Verify data persistence and validation.
```

### API #9: Orders API
```
API name: Supabase - Orders
API endpoint / URL: https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/orders
Authentication Type: API Key (add headers above)
Extra testing information:
Order management and sales tracking.
Test operations:
- GET: Fetch order history
- POST: Create new order with items array and customer info
- PATCH: Update order status (pending/preparing/completed/cancelled)
Verify order calculations and status transitions.
```

### API #10: Staff API
```
API name: Supabase - Staff
API endpoint / URL: https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/staff
Authentication Type: API Key (add headers above)
Extra testing information:
Employee data and profile management.
Test operations:
- GET: List all staff members
- POST: Create new staff with {name, role, pin, email}
- PATCH: Update staff details
- DELETE: Remove staff member
Verify role-based access and PIN validation.
```

### API #11: Inventory API
```
API name: Supabase - Inventory
API endpoint / URL: https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/inventory
Authentication Type: API Key (add headers above)
Extra testing information:
Stock and inventory management.
Test operations:
- GET: Fetch all inventory items with current quantities
- POST: Add new inventory item with {name, quantity, unit, min_stock}
- PATCH: Update stock levels and trigger low stock alerts
Verify stock calculations and alert thresholds.
```

### API #12: Customers API
```
API name: Supabase - Customers
API endpoint / URL: https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/customers
Authentication Type: API Key (add headers above)
Extra testing information:
Customer relationship management and loyalty tracking.
Test operations:
- GET: List customers with loyalty points
- POST: Register new customer with {name, phone, email}
- PATCH: Update customer profile and loyalty points
Verify phone number validation (Brunei format).
```

### API #13: Attendance API
```
API name: Supabase - Attendance
API endpoint / URL: https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/attendance
Authentication Type: API Key (add headers above)
Extra testing information:
Staff attendance and time tracking.
Test operations:
- GET: Fetch attendance records with date filters
- POST: Clock in with {staff_id, date, clock_in_time}
- PATCH: Clock out with clock_out_time
Verify work hours calculation and photo proof validation.
```

### API #14: Expenses API
```
API name: Supabase - Expenses
API endpoint / URL: https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/expenses
Authentication Type: API Key (add headers above)
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

## 🎯 How to Add These to TestSprite

### Step 1: Click "+ Add API" Button
In the left panel, click the green "+ Add API" button.

### Step 2: Fill in the Form
For each API above:
1. Copy the **API name**
2. Copy the **API endpoint / URL**
3. Select **Authentication Type**
4. If "API Key", add the headers (see Section 2 headers)
5. Paste **Extra testing information**

### Step 3: Save Each API
Click save/confirm after entering each API details.

### Step 4: Repeat
Add all 14 APIs one by one.

---

## 📝 Test Credentials Reference

**Admin Login:**
- Email: `admin@abangbob.com`
- Password: `Admin123!`

**Manager Login:**
- Email: `manager@abangbob.com`
- Password: `Manager123!`

**Staff Login (PIN):**
- Staff Name: "Staff Ahmad"
- PIN: `3456`

---

## ✅ What to Test

### Frontend Tests Should Verify:
- ✅ Page loads successfully
- ✅ Authentication flow works
- ✅ Forms validate correctly
- ✅ CRUD operations work through UI
- ✅ Data persists after operations
- ✅ Error messages display properly
- ✅ Responsive design works

### Supabase API Tests Should Verify:
- ✅ GET requests return correct data structure
- ✅ POST requests create records successfully
- ✅ PATCH requests update records correctly
- ✅ DELETE requests remove records properly
- ✅ Authentication headers required
- ✅ Data validation enforced
- ✅ Error responses have proper status codes

---

## 🔗 Useful Links

- **Live App:** https://abangbob-dashboard.vercel.app/
- **Supabase Dashboard:** https://supabase.com/dashboard/project/gmkeiqficpsfiwhqchup
- **API Documentation:** (see testsprite-api-docs.json)

---

**Next Step:** Copy each API configuration above into TestSprite form! 🚀
