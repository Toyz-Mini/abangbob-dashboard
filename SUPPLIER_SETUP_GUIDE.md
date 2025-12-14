# Supplier & Inventory Setup Guide

This guide will help you set up suppliers and inventory data in your Supabase database.

## Prerequisites

- Supabase account with a project set up
- `.env.local` file with Supabase credentials

## Step 1: Update Database Schema

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `lib/supabase/add-suppliers-table.sql`
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute the migration

This will create:
- `suppliers` table
- `purchase_orders` table
- Foreign key constraints
- Indexes and RLS policies

## Step 2: Install Dependencies

Run the following command in your terminal:

```bash
npm install
```

This will install `tsx` and `dotenv` packages needed for the seed script.

## Step 3: Verify Environment Variables

Make sure your `.env.local` file has the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Step 4: Run the Seed Script

Execute the seed script to populate your database:

```bash
npx tsx scripts/seed-suppliers-inventory.ts
```

The script will:
1. Connect to your Supabase database
2. Insert 11 suppliers (including Fayze, Food Stuff, Bake Culture, etc.)
3. Insert 63+ inventory items with pricing and supplier relationships
4. Display a summary of imported data

### Expected Output

```
🌱 Starting seed process...

📦 Inserting suppliers...
✅ Inserted 11 suppliers

📦 Inserting inventory items...
✅ Inserted 63 inventory items

📊 SEED SUMMARY
================
Suppliers: 11
Inventory Items: 63

✨ Seed completed successfully!

📋 Suppliers with item counts:
  - Fayze Department Salambigar: 25 items
  - Food Stuff: 29 items
  - Guan Hock Lee: 3 items
  - Ji-Mart: 4 items
  - Tayeem Majid: 1 items
  - Yin Bee: 1 items
```

## Step 5: Verify Data

1. Go to Supabase dashboard → **Table Editor**
2. Check the `suppliers` table - you should see 11 suppliers
3. Check the `inventory` table - you should see 63+ items
4. Verify that items have `supplier_id` linking them to suppliers

## Step 6: View in Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the **Suppliers** page in your dashboard
3. You should see all suppliers with their contact details and account numbers
4. Navigate to the **Inventory** page
5. You should see all inventory items linked to their suppliers

## Troubleshooting

### Error: "Missing Supabase credentials"

- Make sure `.env.local` exists in your project root
- Verify that the environment variables are correctly set

### Error: "relation 'suppliers' does not exist"

- Run the SQL migration first (Step 1)
- Make sure you ran it in the correct Supabase project

### Error: Network or permission issues

- Check your Supabase project is active
- Verify your API keys are correct
- Ensure RLS policies allow the operations

### No data showing in UI

- Check browser console for errors
- Verify data exists in Supabase Table Editor
- Try refreshing the page
- Check that Supabase client is properly initialized

## Data Included

### Suppliers (11 total)
1. Zuis Enterprise / MZ
2. Fayze Department Salambigar
3. Bake Culture (with BIBD & Baiduri accounts)
4. Wan Sing
5. Ecopack
6. SKP
7. Yin Bee
8. Ji-Mart
9. Food Stuff
10. Guan Hock Lee
11. Tayeem Majid

### Inventory Categories
- Baking Supplies
- Condiments
- Spices & Seasonings
- Sauces
- Oils
- Packaging
- Herbs
- Breading
- Dairy
- Vegetables

## Next Steps

After successful setup:
1. Review and adjust minimum stock levels
2. Update current stock quantities
3. Add any missing contact details for suppliers
4. Create purchase orders as needed
5. Set up reorder alerts for low stock items

## Need Help?

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Review the seed script output for specific errors
3. Verify all environment variables are set correctly
4. Check that your Supabase project has sufficient resources


