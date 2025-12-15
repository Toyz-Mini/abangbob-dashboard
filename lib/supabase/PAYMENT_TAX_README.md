# Payment Methods & Tax Rates Supabase Integration

## Setup Instructions

### 1. Run SQL Migration

Buka Supabase Dashboard dan jalankan SQL migration file ini:

**File**: `lib/supabase/create-payment-tax-system.sql`

Steps:
1. Pergi ke Supabase Dashboard → SQL Editor
2. Copy paste kandungan file `create-payment-tax-system.sql`
3. Klik "Run"

Migration ini akan create:
- ✅ `payment_methods` table dengan RLS policies
- ✅ `tax_rates` table dengan RLS policies  
- ✅ Default payment methods (Cash, Card, QR)
- ✅ Default tax rate (No Tax = 0%)

### 2. Verify Tables Created

Selepas run migration, verify tables exist:

```sql
SELECT * FROM payment_methods;
SELECT * FROM tax_rates;
```

### 3. Automatic Sync

Once tables exist, payment methods dan tax rates akan automatically sync dengan Supabase bila you:
- ✅ Add payment method baru
- ✅ Update payment method
- ✅ Delete payment method  
- ✅ Add tax rate baru
- ✅ Update tax rate
- ✅ Delete tax rate

Semua changes akan automatically save ke Supabase **dan** localStorage (sebagai backup).

## Features

### Payment Methods
- Fully configurable payment methods
- Color-coded untuk visual clarity
- Sort order untuk custom ordering
- Enable/disable toggle
- Sync ke Supabase automatically

### Tax Rates
- Multiple tax rates support
- Default tax rate selection
- Active/inactive status
- Proper validation (rate must be 0-100%)
- Sync ke Supabase automatically

## Migration Status

⏳ **Not yet applied** - Please run the SQL migration first baru features ni akan work dengan Supabase.

Sekarang payment methods & tax rates masih guna localStorage. Lepas run migration, automatic switch to Supabase.
