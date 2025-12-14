# AbangBob Dashboard - Quick Test Credentials

Quick reference untuk test users. For detailed setup, see [`docs/TEST_USERS_SETUP.md`](docs/TEST_USERS_SETUP.md).

## Test Users

### 👨‍💼 Admin User
```
Login Method: Email (Login Admin button)
Email:        admin@abangbob.com
Password:     Admin123!
PIN:          1234

Access Level: Full access to everything
- Settings ✅
- Finance ✅
- HR Management ✅
- Analytics ✅
- Audit Logs ✅
```

### 👔 Manager User
```
Login Method: Email (Login Admin button)
Email:        manager@abangbob.com
Password:     Manager123!
PIN:          2345

Access Level: Operations & Approvals
- Operations ✅
- Approvals ✅
- Reports ✅
- Settings ❌ (Admin only)
```

### 👷 Staff User
```
Login Method: PIN (Login Staf button)
Select:       "Staff Ahmad"
PIN:          3456

Access Level: Frontline Operations
- POS ✅
- KDS ✅
- Clock In/Out ✅
- Staff Portal ✅
- HR Admin ❌
- Finance ❌
```

## Quick Setup

1. **Run Database Schema** (if not done yet):
   - Open Supabase SQL Editor
   - Run `lib/supabase/schema.sql`

2. **Seed Test Data**:
   - Open Supabase SQL Editor
   - Run `lib/supabase/seed-test-users.sql`

3. **Create Supabase Auth Users** (Manual step):
   - Supabase Dashboard → Authentication → Users
   - Click "Add User" → Create:
     - Admin: `admin@abangbob.com` / `Admin123!` (Auto confirm: ✅)
     - Manager: `manager@abangbob.com` / `Manager123!` (Auto confirm: ✅)
   - Staff does NOT need Auth user (PIN login only)

4. **Start Testing**:
   - Go to http://localhost:3000/login
   - Try all 3 users to test different permissions

## Test Data Included

- ✅ 3 Users (Admin, Manager, Staff)
- ✅ 4 Menu Items (Nasi Lemak, Burger, Teh Tarik, Milo)
- ✅ 5 Inventory Items (Rice, Chicken, Oil, Buns, Tea)
- ✅ 1 Sample Order
- ✅ 1 Sample Customer
- ✅ 1 Default Outlet

## Need Help?

- **Full Setup Guide**: [`docs/TEST_USERS_SETUP.md`](docs/TEST_USERS_SETUP.md)
- **Supabase Setup**: [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md)
- **Permissions System**: [`lib/permissions.ts`](lib/permissions.ts)

## Security Warning ⚠️

These are TEST CREDENTIALS for development only!

**Before production:**
- Change all passwords to strong, unique passwords
- Enable Multi-Factor Authentication (MFA)
- Rotate PINs regularly
- Delete test users and create real accounts
- Review and update RLS policies

---

**Last Updated**: December 2024
