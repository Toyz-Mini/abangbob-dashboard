# HR Staff Registration - Quick Setup Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Run Database Migration
```sql
-- Copy and paste in Supabase SQL Editor
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS extended_data JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_staff_extended_data ON public.staff USING gin(extended_data);
```

### Step 2: Create Storage Bucket
```sql
-- Copy and paste in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-documents', 
  'staff-documents', 
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Add Storage Policies
CREATE POLICY "Authenticated users can upload staff documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'staff-documents');

CREATE POLICY "Authenticated users can view staff documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'staff-documents');

CREATE POLICY "Authenticated users can delete staff documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'staff-documents');
```

### Step 3: Test the Form
1. Navigate to `/hr/staff/new`
2. See default values pre-filled ✅
3. Drag & drop documents ✅
4. Submit form ✅

---

## 📋 What Changed?

### Before ❌
- Form fields all empty
- No helpful defaults
- Basic upload UI (plain boxes)
- Data not fully saved to database

### After ✅
- Sensible defaults (gender=male, maritalStatus=single, etc.)
- Modern drag-and-drop upload
- Beautiful animations and previews
- ALL data saved to Supabase (base + extended_data)

---

## 🎨 New Document Upload Features

| Feature | Description |
|---------|-------------|
| 🖱️ **Drag & Drop** | Drag files anywhere in the upload area |
| 👆 **Click to Browse** | Traditional file picker also works |
| 🖼️ **Image Preview** | See photos before submitting |
| 📄 **PDF Icons** | Clear indication for PDF files |
| ✅ **Validation** | Automatic type & size checking |
| 🎨 **Animations** | Smooth hover & drag effects |
| 🗑️ **Easy Delete** | One-click to remove files |

---

## 📊 Data Storage Structure

```json
// Base Fields (direct columns)
{
  "id": "uuid",
  "name": "Ahmad Bin Hassan",
  "email": "ahmad@example.com",
  "phone": "+6737123456",
  "role": "Staff",
  "status": "active",
  "pin": "1234",
  "hourly_rate": 5.00,
  "ic_number": "00-123456",
  "employment_type": "probation",
  "join_date": "2024-12-15"
}

// Extended Data (JSONB column)
{
  "extended_data": {
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "maritalStatus": "single",
    "nationality": "Bruneian",
    "religion": "Islam",
    "position": "Cashier",
    "department": "Front of House",
    "baseSalary": 800,
    "salaryType": "monthly",
    "bankDetails": {...},
    "statutoryContributions": {...},
    "emergencyContact": {...},
    "leaveEntitlement": {...},
    "permissions": {...},
    "schedulePreferences": {...},
    "documents": [...],
    "skills": [...],
    "certifications": [...]
  }
}
```

---

## 🔍 How to Verify

### Check Database
```sql
-- View latest staff with extended data
SELECT 
  id, 
  name, 
  email,
  extended_data 
FROM staff 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Storage
1. Go to Supabase Dashboard
2. Click Storage > staff-documents
3. See uploaded files

---

## 📁 Files Modified

✅ `lib/supabase/schema.sql` - Added extended_data column
✅ `lib/supabase/operations.ts` - Updated CRUD operations
✅ `lib/supabase/types.ts` - Added TypeScript types
✅ `app/hr/staff/new/page.tsx` - Improved form + upload UI

## 📁 Files Created

✅ `lib/supabase/add-staff-extended-data-migration.sql`
✅ `lib/supabase/add-staff-documents-bucket.sql`
✅ `HR_STAFF_REGISTRATION_IMPROVEMENTS.md`

---

## 💡 Tips

### For Testing
- Try dragging invalid file types (.txt) - should reject
- Try file > 5MB - should reject
- Try uploading images - should show preview
- Try uploading PDF - should show PDF icon

### Default Values Set
- Gender: **Male** (Lelaki)
- Marital Status: **Single** (Bujang)
- Employment Type: **Probation** (Percubaan)
- Salary Type: **Monthly** (Bulanan)
- Base Salary: **$800**
- Hourly Rate: **$5.00**
- Overtime Rate: **1.5x**
- Payment Frequency: **Monthly**

---

## 🎯 Success Criteria

✅ Form loads with default values
✅ Document upload shows modern UI
✅ Drag-and-drop works smoothly
✅ File validation prevents invalid uploads
✅ All form data saves to database
✅ Extended data stored in JSONB column
✅ No TypeScript/linter errors

---

**Status:** ✅ **COMPLETE & READY TO USE**

For detailed documentation, see: `HR_STAFF_REGISTRATION_IMPROVEMENTS.md`


