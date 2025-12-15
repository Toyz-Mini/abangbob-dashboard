# Manual Testing Checklist

**Production URL:** https://abangbob-dashboard.vercel.app

## Pre-Testing Verification ✅

- [x] All routes return HTTP 200
- [x] Build passes with no errors
- [x] Supabase connection verified (37 tables exist)
- [x] Environment variables configured

## Page-by-Page Testing

### 1. Login Page (`/login`)
- [ ] Email login works (admin@abangbob.com / Admin123!)
- [ ] Staff PIN login works (select staff, enter PIN 3456)
- [ ] Lockout after 5 failed attempts
- [ ] Session persists after refresh

### 2. Dashboard (`/`)
- [ ] Stats widgets load with data
- [ ] Charts render correctly
- [ ] Navigation sidebar works
- [ ] Language toggle (EN/MS) works

### 3. POS Page (`/pos`)
- [ ] Menu items display
- [ ] Modifiers work (add-ons, options)
- [ ] Cart updates correctly
- [ ] Checkout flow completes
- [ ] Receipt preview shows
- [ ] Order saves to database

### 4. Inventory (`/inventory`)
- [ ] Stock items list loads
- [ ] Add new item works
- [ ] Edit item works
- [ ] Low stock alerts show
- [ ] Search/filter works

### 5. HR (`/hr`)
- [ ] Staff list loads
- [ ] Add new staff works
- [ ] Attendance clock-in/out works
- [ ] Schedule view loads
- [ ] Payroll shows correctly

### 6. Kitchen Display (`/kds`)
- [ ] Orders display in real-time
- [ ] Order status updates work
- [ ] Priority sorting works

### 7. Staff Portal (`/staff-portal`)
- [ ] Checklist works
- [ ] Leave request submission works
- [ ] Schedule viewing works
- [ ] Profile edit works

### 8. Finance (`/finance`)
- [ ] Expenses list loads
- [ ] Add expense works
- [ ] Cash flow reports display
- [ ] Date filtering works

## Offline Mode Testing

- [ ] App works without internet (mock data)
- [ ] Data syncs when reconnected
- [ ] No critical errors in console

## Browser Testing

- [ ] Chrome (Desktop)
- [ ] Safari (Desktop)
- [ ] Firefox (Desktop)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

---

**Test Credentials:**

| Role | Login | Password/PIN |
|------|-------|--------------|
| Admin | admin@abangbob.com | Admin123! |
| Manager | manager@abangbob.com | Manager123! |
| Staff | Select "Staff Ahmad" | 3456 |

---

*Last updated: December 15, 2025*
