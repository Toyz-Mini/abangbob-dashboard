# Quick Start: Supplier & Inventory Setup

## 🚀 3-Step Setup

### 1️⃣ Run SQL Migration
```bash
# 1. Open Supabase Dashboard
# 2. Go to SQL Editor
# 3. Copy ALL content from: lib/supabase/add-suppliers-table.sql
# 4. Paste and click "Run"
```

### 2️⃣ Install & Seed Data
```bash
# Install dependencies
npm install

# Import all suppliers & inventory
npx tsx scripts/seed-suppliers-inventory.ts
```

### 3️⃣ Start App
```bash
npm run dev
```

## ✨ What You'll Get

- **11 Suppliers** with full contact details
- **63+ Inventory Items** with pricing & stock levels
- **Bank Accounts** tracked (Bake Culture has BIBD & Baiduri accounts)
- **Purchase Order System** ready to use

## 📋 Suppliers Imported

1. ✅ Zuis Enterprise / MZ
2. ✅ Fayze Department Salambigar (25 items)
3. ✅ Bake Culture (2 bank accounts)
4. ✅ Wan Sing
5. ✅ Ecopack
6. ✅ SKP
7. ✅ Yin Bee
8. ✅ Ji-Mart
9. ✅ Food Stuff (29 items)
10. ✅ Guan Hock Lee
11. ✅ Tayeem Majid

## 📦 Item Categories

- Baking Supplies (flour, baking powder, sugar)
- Condiments (mayonnaise, mustard, vinegar)
- Spices (paprika, curry powder, pepper)
- Sauces (chili sauce, tomato sauce, sriracha)
- Oils (cooking oil, frying oil)
- Herbs (parsley, oregano)
- Packaging (gloves, wraps, breadcrumbs)
- Seasonings (MSG, salt, chicken stock)

## 🎯 Key Features

### Supplier Cards Show:
- Company name & status
- Contact person & phone
- Email (if available)
- Lead time
- Payment terms
- **Bank account numbers** 💳

### Add/Edit Suppliers:
- Multiple bank accounts
- Easy add/remove accounts
- All contact info
- Payment terms
- Notes

### Inventory:
- Linked to suppliers
- Current stock & min levels
- Pricing
- Units
- Categories

## ❓ Need Help?

See detailed guide: `SUPPLIER_SETUP_GUIDE.md`

## ✅ Done!

Your supplier management system is ready to use! 🎉


