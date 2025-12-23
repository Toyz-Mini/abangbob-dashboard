# Quick Reference: Data Protection Setup

## ⚡ TL;DR

Your AbangBob Dashboard now saves data to Supabase automatically. Data won't be lost even if you:
- Clear browser cache
- Switch devices
- Close the browser
- Have a power outage

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Open Setup Page
```
http://localhost:3000/setup
```

### Step 2: Complete the Wizard
Follow these 5 steps in order:

1. **Test Connection** - Verify Supabase is working
2. **Export Backup** - Download a safety backup
3. **Check Schema** - Ensure database is ready
4. **Migrate Data** - Move data to Supabase
5. **Test Persistence** - Confirm everything works

### Step 3: Verify
After migration, test:
- Add a new product
- Check Supabase dashboard (data should appear)
- Clear browser data
- Reload page (data should still be there!)

---

## 📍 Important Locations

| What | Where |
|------|-------|
| Setup Wizard | `/setup` page in your app |
| Supabase Dashboard | https://supabase.com/dashboard |
| Environment File | `.env.local` in project root |
| Database Schema | `lib/supabase/schema.sql` |

---

## 🔍 Quick Checks

### Is Supabase Connected?
Visit `/setup` → Click "Test Connection" → Should see ✅

### Is Data Being Saved?
1. Add a product in menu management
2. Go to Supabase Dashboard → Table Editor → `menu_items`
3. Your product should appear there

### Is Real-time Working?
1. Open app in 2 browser tabs
2. Add item in tab 1
3. Tab 2 should update automatically

---

## 🆘 Quick Fixes

### "Supabase not configured" error
→ Check `.env.local` file exists with correct keys

### Tables not found
→ Run `lib/supabase/schema.sql` in Supabase Dashboard → SQL Editor

### Data not syncing
→ Check internet connection
→ Restart development server: `npm run dev`

---

## 📱 What Data is Protected?

✅ Products/Menu Items
✅ Inventory/Stock
✅ Staff Profiles
✅ Orders & Sales
✅ Customers
✅ Expenses
✅ Attendance Records

---

## 🎯 Key Features

**Auto-Save**: Every change saves to Supabase automatically

**Offline Mode**: Works without internet (syncs when back online)

**Multi-Device**: Access same data from different devices

**Real-time**: Changes appear instantly on all screens

**Backup**: localStorage keeps local copy as backup

---

## 📞 Need Help?

1. Check `/setup` page for errors
2. Read full guide: `docs/SUPABASE_INTEGRATION_COMPLETE.md`
3. View original setup: `docs/SUPABASE_SETUP.md`

---

Last Updated: December 2024


