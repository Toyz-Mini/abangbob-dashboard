# Test Users Setup Guide

Complete step-by-step guide untuk setup test users (Admin, Manager, Staff) supaya boleh login dan test semua functionalities dalam AbangBob Dashboard.

## Overview

Dashboard ni ada 3 jenis users dengan different permissions:

- **Admin** - Full access, boleh manage everything
- **Manager** - Manage operations, approve requests, view reports (no Settings access)
- **Staff** - Limited access, use POS/KDS, clock in/out, staff portal

## Prerequisites

1. ✅ Supabase project dah setup (ada Project URL & Anon Key)
2. ✅ Database schema dah run (`lib/supabase/schema.sql`)
3. ✅ Environment variables configured (`.env.local`)
4. ✅ Development server running (`npm run dev`)

## Step 1: Run SQL Seed Script

### 1.1 Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New query**

### 1.2 Copy and Run Seed Script

1. Open file: `lib/supabase/seed-test-users.sql`
2. Copy **ALL** the SQL content
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### 1.3 Verify Data Inserted

Kalau success, you should see output like:

```
table_name       | count
-----------------+-------
Staff Users      | 3
Menu Items       | 4
Inventory Items  | 5
Sample Orders    | 1
```

### 1.4 Fix Column Errors (If Needed)

If you get error: **"column cashier_id does not exist"**, it means your schema is outdated.

**Solution:**
1. Open a new query in Supabase SQL Editor
2. Copy and run: `lib/supabase/fix-orders-columns.sql`
3. This will add missing columns to the orders table
4. Then re-run the seed script from Step 1.2

**Alternative:** Re-run the complete schema from `lib/supabase/schema.sql` (will recreate all tables)

## Step 2: Create Supabase Auth Users

**IMPORTANT:** Supabase Auth users cannot be created via SQL. Kena create manually untuk Admin dan Manager.

### 2.1 Create Admin User

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Fill in:
   - **Email:** `admin@abangbob.com`
   - **Password:** `Admin123!`
   - **Auto Confirm User:** ✅ YES (important!)
4. Click **Create user**

### 2.2 Create Manager User

1. Click **Add User** → **Create new user** again
2. Fill in:
   - **Email:** `manager@abangbob.com`
   - **Password:** `Manager123!`
   - **Auto Confirm User:** ✅ YES (important!)
3. Click **Create user**

### 2.3 Staff User (No Auth Needed)

Staff user TIDAK perlu Supabase Auth account sebab login guna PIN sahaja. Staff record dah auto-created dalam Step 1.

## Step 3: Test Login

Now test semua 3 roles untuk ensure everything working correctly.

### 3.1 Test Admin Login (Email)

1. Go to http://localhost:3000/login
2. Click **"Login Admin"** button
3. Enter credentials:
   - Email: `admin@abangbob.com`
   - Password: `Admin123!`
4. Click **"Log Masuk"**

**Expected Result:**
- ✅ Redirects to dashboard
- ✅ Can see "Settings" in navigation
- ✅ Can access all modules (HR, Finance, Analytics, etc.)
- ✅ Profile shows "Admin AbangBob"

### 3.2 Test Manager Login (Email)

1. Logout (if still logged in as Admin)
2. Go to http://localhost:3000/login
3. Click **"Login Admin"** button
4. Enter credentials:
   - Email: `manager@abangbob.com`
   - Password: `Manager123!`
5. Click **"Log Masuk"**

**Expected Result:**
- ✅ Redirects to dashboard
- ✅ Can see HR, Finance, Operations modules
- ✅ CANNOT see "Settings" (admin only)
- ✅ Profile shows "Manager Azri"

### 3.3 Test Staff Login (PIN)

1. Logout (if still logged in)
2. Go to http://localhost:3000/login
3. Click **"Login Staf"** button
4. Select **"Staff Ahmad"** from staff grid
5. Enter PIN: `3456` using the PIN pad
6. Click **"Log Masuk"**

**Expected Result:**
- ✅ Redirects to dashboard
- ✅ Limited navigation (POS, KDS, Staff Portal)
- ✅ CANNOT access HR Admin, Finance, Settings
- ✅ Profile shows "Staff Ahmad"

## Step 4: Verify Permissions

Test role-based access control untuk ensure permissions working correctly.

### Admin Permissions Test

Login as Admin, then test:

| Feature | Expected Access |
|---------|----------------|
| Dashboard | ✅ Full view with all stats |
| POS | ✅ Can create orders, void |
| Menu Management | ✅ Can add/edit/delete items |
| Inventory | ✅ Can add/edit/delete items |
| HR → Staff Management | ✅ Can add/edit/delete staff |
| HR → Payroll | ✅ Full access to payroll |
| HR → Approvals | ✅ Can approve all requests |
| Finance | ✅ Can view/edit expenses |
| Analytics | ✅ Full access to all reports |
| Settings | ✅ Can edit all settings |
| Order History | ✅ View all orders, approve void/refund |

### Manager Permissions Test

Login as Manager, then test:

| Feature | Expected Access |
|---------|----------------|
| Dashboard | ✅ Full view with all stats |
| POS | ✅ Can create orders |
| Menu Management | ✅ Can add/edit (no delete) |
| Inventory | ✅ Can view/edit |
| HR → Staff Management | ✅ Can view/edit (no delete) |
| HR → Payroll | ✅ View only |
| HR → Approvals | ✅ Can approve requests |
| Finance | ✅ View only |
| Analytics | ✅ View all reports |
| Settings | ❌ NO ACCESS |
| Order History | ✅ View all orders, approve void/refund |

### Staff Permissions Test

Login as Staff (PIN), then test:

| Feature | Expected Access |
|---------|----------------|
| Dashboard | ✅ Limited view (basic stats) |
| POS | ✅ Can create orders |
| KDS | ✅ Can update order status |
| Menu Management | ❌ NO ACCESS |
| Inventory | ✅ View only |
| HR → Timeclock | ✅ Can clock in/out |
| HR → Staff Management | ❌ NO ACCESS |
| HR → Payroll | ❌ NO ACCESS |
| Finance | ❌ NO ACCESS |
| Settings | ❌ NO ACCESS |
| Staff Portal | ✅ Full access to own data |
| Order History | ✅ View own orders only |

## Step 5: Test Sample Data

Seed script dah create sample data untuk testing:

### 5.1 Test Menu Items (POS)

1. Go to **POS** page
2. You should see 4 menu items:
   - Nasi Lemak Special (BND 5.00)
   - Burger Cheese (BND 4.50)
   - Teh Tarik (BND 1.50)
   - Milo Ais (BND 2.00)
3. Try creating a test order

### 5.2 Test Inventory

1. Go to **Inventory** page
2. You should see 5 items:
   - Beras (50 kg - sufficient)
   - Ayam (15 kg - sufficient)
   - Minyak Masak (8 liter - ⚠️ LOW STOCK)
   - Roti Burger (30 pcs - sufficient)
   - Teh Powder (3 kg - ⚠️ LOW STOCK)
3. Low stock alert should show on dashboard

### 5.3 Test Order History

1. Go to **Order History** page
2. You should see 1 sample order:
   - Order #AB-001
   - 2x Nasi Lemak Special + 2x Teh Tarik
   - Total: BND 13.00
   - Status: Completed

### 5.4 Test Customer Data

1. Go to **Customers** page (Admin/Manager only)
2. You should see 1 customer:
   - Ahmad Abdullah
   - Phone: +673 888 8888
   - Loyalty Points: 150
   - Total Spent: BND 250.00

## Troubleshooting

### Issue: Cannot login with Admin/Manager email

**Possible Causes:**
1. ❌ Supabase Auth user not created
2. ❌ Email not confirmed
3. ❌ Wrong password
4. ❌ Environment variables not set

**Solution:**
1. Check Supabase Dashboard → Authentication → Users
2. Ensure user exists with correct email
3. Ensure "Email Confirmed" = true
4. Verify `.env.local` has correct Supabase URL and Key
5. Restart dev server after changing `.env.local`

### Issue: Error "column cashier_id does not exist"

**Cause:**
The orders table is missing newer columns added for order history features.

**Solution:**
1. Go to Supabase SQL Editor
2. Copy and run: `lib/supabase/fix-orders-columns.sql`
3. Verify columns added (query at end of script shows results)
4. Re-run seed script: `lib/supabase/seed-test-users.sql`

**Alternative:** Drop and recreate orders table by re-running `lib/supabase/schema.sql` (warning: will lose existing order data)

### Issue: Cannot login with Staff PIN

**Possible Causes:**
1. ❌ Seed script not run successfully
2. ❌ Staff record not in database
3. ❌ Wrong PIN entered
4. ❌ Staff status not 'active'

**Solution:**
1. Check database: Go to Supabase → Table Editor → staff
2. Verify Staff Ahmad exists with:
   - Name: "Staff Ahmad"
   - PIN: "3456"
   - Status: "active"
3. If missing, run seed script again

### Issue: "Supabase not configured" error

**Solution:**
1. Create `.env.local` file in project root
2. Add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Get values from Supabase Dashboard → Settings → API
4. Restart dev server: `npm run dev`

### Issue: Dashboard shows "No access" or redirect to unauthorized

**Solution:**
1. Check user role in database
2. Go to Supabase → Table Editor → staff
3. Verify role is exactly: 'Admin', 'Manager', or 'Staff' (case-sensitive!)
4. Logout and login again

### Issue: Sample data not showing

**Solution:**
1. Verify seed script ran successfully
2. Check for errors in Supabase SQL Editor
3. Run verification query at end of seed script
4. Check outlet_id matches in all tables

## Test Credentials Summary

Quick reference untuk all test users:

### Admin User
```
Login Method: Email
Email:        admin@abangbob.com
Password:     Admin123!
PIN:          1234
Access Level: Full access to everything
```

### Manager User
```
Login Method: Email
Email:        manager@abangbob.com
Password:     Manager123!
PIN:          2345
Access Level: Operations, reports, approvals (no Settings)
```

### Staff User
```
Login Method: PIN only
Select:       "Staff Ahmad" from staff list
PIN:          3456
Access Level: POS, KDS, Staff Portal only
```

## Security Notes

⚠️ **IMPORTANT - PRODUCTION USE:**

1. **Change Default Passwords**: Test passwords are simple for development only
2. **Use Strong Passwords**: Minimum 12 characters, mix of letters/numbers/symbols
3. **Enable MFA**: Set up Multi-Factor Authentication in Supabase for admin accounts
4. **Rotate PINs**: Change staff PINs regularly (monthly recommended)
5. **Audit Logs**: Monitor access logs for suspicious activity
6. **Remove Test Data**: Delete test users before going to production

## Additional Testing Checklist

Use this checklist untuk comprehensive testing:

### Admin Testing
- [ ] Login with email successful
- [ ] Dashboard shows all stats
- [ ] Can create/edit/delete staff
- [ ] Can approve leave requests
- [ ] Can approve void/refund requests
- [ ] Can access Settings page
- [ ] Can edit outlet settings
- [ ] Can view audit logs
- [ ] Can export reports
- [ ] Can manage payroll

### Manager Testing
- [ ] Login with email successful
- [ ] Dashboard shows all stats
- [ ] Can view staff (limited edit)
- [ ] Can approve leave requests
- [ ] Can approve void/refund requests
- [ ] CANNOT access Settings
- [ ] Can view finance (read-only)
- [ ] Can create/edit menu items
- [ ] Can manage inventory
- [ ] Can view analytics

### Staff Testing
- [ ] PIN login successful
- [ ] Dashboard shows basic stats
- [ ] Can use POS to create orders
- [ ] Can update KDS order status
- [ ] Can clock in/out
- [ ] Can view own schedule
- [ ] Can request leave
- [ ] CANNOT access HR admin
- [ ] CANNOT access Finance
- [ ] CANNOT access Settings

## Next Steps

After successfully setting up test users:

1. ✅ Test all role permissions thoroughly
2. ✅ Test PIN login flow for staff
3. ✅ Test email login flow for admin/manager
4. ✅ Verify navigation items show/hide based on role
5. ✅ Test void/refund approval workflow
6. ✅ Test leave approval workflow
7. ✅ Create more sample data as needed
8. ✅ Test offline mode (disconnect Supabase)

## Need Help?

- Check main setup guide: [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)
- Review permissions system: [`lib/permissions.ts`](../lib/permissions.ts)
- Check auth implementation: [`lib/contexts/AuthContext.tsx`](../lib/contexts/AuthContext.tsx)
- Supabase Documentation: https://supabase.com/docs

## Video Tutorial (Optional)

For visual learners, consider creating a quick video showing:
1. Running SQL seed script
2. Creating Supabase Auth users
3. Testing login for all 3 roles
4. Verifying permissions

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Maintained by:** AbangBob Development Team


