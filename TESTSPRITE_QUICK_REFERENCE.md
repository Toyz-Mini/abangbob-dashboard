# TestSprite Quick Reference Card

**AbangBob Dashboard Testing Setup**

---

## 🔗 URLs

**Live App:**
```
https://abangbob-dashboard.vercel.app
```

**Supabase API:**
```
https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1
```

---

## 🔐 Test Credentials

**Admin Login:**
```
Email: admin@abangbob.com
Password: Admin123!
```

**Manager Login:**
```
Email: manager@abangbob.com
Password: Manager123!
```

**Staff PIN:**
```
PIN: 3456
```

---

## 🔑 Supabase Authentication

**API Key (for all Supabase endpoints):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta2VpcWZpY3BzZml3aHFjaHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mjc1MDgsImV4cCI6MjA4MTIwMzUwOH0.yUsDxYw3c8vtSWew_ACiLYAYJHRwDz0X9EgQAPuwTts
```

**Headers Required:**
```
apikey: [KEY ABOVE]
Authorization: Bearer [KEY ABOVE]
Content-Type: application/json
```

---

## 📋 APIs Summary

**Frontend (7):**
1. Login Page - `/login`
2. Dashboard - `/`
3. POS System - `/pos`
4. Menu Management - `/menu-management`
5. Staff Portal - `/staff-portal`
6. HR Management - `/hr`
7. Inventory - `/inventory`

**Supabase (7):**
1. Menu Items - `/rest/v1/menu_items`
2. Orders - `/rest/v1/orders`
3. Staff - `/rest/v1/staff`
4. Inventory - `/rest/v1/inventory`
5. Customers - `/rest/v1/customers`
6. Attendance - `/rest/v1/attendance`
7. Expenses - `/rest/v1/expenses`

**Total: 14 APIs**

---

## 📁 Files Created

1. `testsprite-api-list.md` - Complete API details
2. `testsprite-api-docs.json` - JSON documentation
3. `testsprite-openapi-spec.yaml` - OpenAPI spec
4. `TESTSPRITE_SETUP_GUIDE.md` - Step-by-step guide
5. `TESTSPRITE_QUICK_REFERENCE.md` - This file

---

## ✅ Quick Checklist

**Setup:**
- [ ] Add all 14 APIs in TestSprite
- [ ] Configure authentication for Supabase APIs
- [ ] Upload API documentation (optional)

**Testing:**
- [ ] Run frontend page tests
- [ ] Run Supabase API tests
- [ ] Verify results
- [ ] Fix any failures

---

## 🚀 Next Steps

1. Open TestSprite
2. Follow `TESTSPRITE_SETUP_GUIDE.md`
3. Add all 14 APIs
4. Run tests
5. Monitor results

---

**Need help?** Check `TESTSPRITE_SETUP_GUIDE.md` for detailed instructions.

---

_Generated: December 14, 2024_
