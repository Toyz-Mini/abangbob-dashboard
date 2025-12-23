# Quick Start Guide - Logo Upload Fix

## Apa Yang Telah Diperbaiki? 🎯

Sebelum ini, bila cuba upload logo, anda dapat error:
> ❌ **"Gagal memuat naik logo. Sila cuba lagi."**

Sekarang, sistem lebih pintar dan akan:
- ✅ **Automatically fallback ke local storage** bila Supabase tidak available
- ✅ **Show clear error messages** dalam Bahasa Melayu
- ✅ **Save logo permanently** (tidak hilang selepas refresh)
- ✅ **Provide setup guide** bila perlu configure Supabase

---

## Untuk Pengguna Tanpa Supabase Setup

**Kabar baik!** Anda tidak perlu buat apa-apa. Upload logo akan berfungsi dengan automatic local storage.

1. Pergi ke **Settings > Outlet Profile**
2. Klik pada logo upload area
3. Pilih gambar (JPG, PNG, WebP, atau GIF)
4. Logo akan disimpan secara local dan persist selepas refresh

Anda akan nampak indicator: **🖴 Local Storage**

---

## Untuk Pengguna Dengan Supabase Setup

### Langkah 1: Semak Status Setup

1. Pergi ke **Settings > Supabase**
2. Lihat **"Supabase Storage Configuration"** card
3. Klik expand button untuk detailed checks

### Langkah 2: Fix Issues (Jika Ada)

#### ❌ Jika Environment Variables Tiada:

Buat file `.env.local` dalam root folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### ❌ Jika Bucket Tidak Wujud:

**Option A - Via Dashboard** (Mudah):
1. Pergi ke Supabase Dashboard
2. Storage > Create New Bucket
3. Name: `outlet-logos`
4. Public: ✅ **Yes** (checked)
5. Create

**Option B - Via SQL** (Copy-paste):

Di **SupabaseSetupChecker**, klik **Copy** button untuk SQL commands, kemudian:
1. Pergi ke Supabase Dashboard > SQL Editor
2. Paste SQL commands
3. Run

#### ❌ Jika Storage Policies Tiada:

1. Di **SupabaseSetupChecker**, scroll ke "Storage Policies SQL"
2. Klik **Copy** button
3. Pergi ke Supabase Dashboard > SQL Editor
4. Paste dan Run

### Langkah 3: Test

1. Klik **"Test Semula"** button dalam SupabaseSetupChecker
2. Semua checks should show ✅ green
3. Upload logo - should show **☁️ Cloud Storage**

---

## Tempat-Tempat Upload Logo

Logo upload boleh digunakan di:

1. **Settings > Outlet Profile** 
   - Logo utama untuk outlet

2. **Settings > Receipt Settings > Receipt Designer**
   - Logo Atas (Header)
   - Logo Bawah (Footer)

Semua menggunakan system yang sama dengan consistent behavior.

---

## Troubleshooting

### ❓ "Bucket storage belum dibuat..."

**Maksudnya**: Supabase connected tapi bucket tidak wujud.

**Solution**: 
- Logo akan auto-save ke local storage
- Follow "Langkah 2" di atas untuk create bucket
- Kemudian boleh upload semula untuk cloud storage

---

### ❓ "Tiada kebenaran untuk upload..."

**Maksudnya**: Bucket wujud tapi policies tidak setup.

**Solution**:
- Copy SQL policies dari SupabaseSetupChecker
- Run dalam SQL Editor
- Test semula

---

### ❓ "Saiz fail terlalu besar. Maksimum 2MB."

**Maksudnya**: Gambar terlalu besar.

**Solution**:
- Compress gambar menggunakan tool online
- Atau crop gambar untuk kurangkan size
- Try upload semula

---

### ❓ "Format fail tidak disokong..."

**Maksudnya**: File type tidak sesuai.

**Solution**:
- Gunakan JPG, PNG, WebP, atau GIF sahaja
- Convert file ke format yang betul
- Try upload semula

---

## Migration dari Local ke Cloud

Bila anda sudah setup Supabase kemudian, anda boleh migrate local files:

```typescript
// Untuk developers - dalam browser console:
import { migrateLocalFilesToSupabase } from '@/lib/supabase/storage-utils';

const result = await migrateLocalFilesToSupabase('outlet-logos');
console.log(`✅ Migrated: ${result.success} files`);
console.log(`❌ Failed: ${result.failed} files`);
```

**Auto-migration UI coming soon!**

---

## File Locations

Semua files yang diubah:
- ✅ `components/LogoUpload.tsx` - Main upload component
- ✅ `components/SupabaseSetupChecker.tsx` - Setup validation (NEW)
- ✅ `components/DocumentUpload.tsx` - HR documents
- ✅ `components/staff-portal/DocumentUpload.tsx` - Staff portal
- ✅ `lib/supabase/storage-utils.ts` - Storage utilities (NEW)
- ✅ `app/settings/page.tsx` - Settings page

---

## Need Help?

Check full documentation: `UPLOAD_FIX_SUMMARY.md`

---

**🎉 Upload logo sekarang sudah berfungsi dengan baik!**

Sama ada dengan atau tanpa Supabase, sistem akan ensure logo anda tersimpan dengan selamat.


