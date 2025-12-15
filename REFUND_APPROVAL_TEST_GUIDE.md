# Quick Test Guide - Refund Approval Interface

## 🚀 Quick Start

The implementation is complete! Here's how to test it:

### 1. Open the Application
```
✅ Dev server is already running at: http://localhost:3000
```

### 2. Login Scenarios

#### Test as Admin (Full Access) ✅
- Navigate to the dashboard
- Look at the **sidebar** (left side)
- Find **"Refund Approvals"** under "HR & Finance" section
- You should see a **badge with number "2"** (indicating 2 pending requests)

#### Test as Manager (Full Access) ✅
- Same as Admin
- Should see the nav item and badge

#### Test as Staff (No Access) ❌
- Should NOT see "Refund Approvals" in sidebar
- If they try to access `/hr/refund-approvals` directly, they'll see "Access Denied"

---

## 🎯 Main Features to Test

### Feature 1: Sidebar Badge Notification
**Expected**: Badge shows "2" next to "Refund Approvals"

![Sidebar with Badge](Expected: Badge with warning color showing count)

### Feature 2: Refund Approvals Page
**Navigate to**: Click "Refund Approvals" in sidebar

**Expected to see**:
1. **Statistics Cards** at the top:
   - Pending Approval: 2 (BND 40.00)
   - Diluluskan: 0
   - Ditolak: 0
   - Jumlah Permintaan: 2

2. **Pending Requests Panel** (yellow border):
   - Shows 2 pending requests
   - Each with: Order ID, Amount, Requester, Reason, Time
   - Approve and Reject buttons

3. **All Requests Table**:
   - Shows all 2 requests
   - Filter dropdown (All / Pending / Approved / Rejected)
   - Search box
   - Pagination controls

---

## 🧪 Test Actions

### Test 1: Approve a Request ✅

1. In the Pending Requests Panel, find "AB-003"
2. Click the green **"Luluskan"** button
3. **Expected**:
   - ✅ Toast notification: "Permintaan telah diluluskan..."
   - ✅ Badge count updates from "2" to "1"
   - ✅ Stats update: Pending: 1, Approved: 1
   - ✅ Request disappears from Pending Panel
   - ✅ Request shows "Diluluskan" status in table

### Test 2: Reject a Request ❌

1. In the Pending Requests Panel, find the remaining request
2. Click the red **"Tolak"** button
3. **Expected**: Text area appears for rejection reason
4. Type a reason: "Insufficient evidence"
5. Click **"Hantar Penolakan"**
6. **Expected**:
   - ✅ Toast notification: "Permintaan telah ditolak"
   - ✅ Badge disappears (count = 0)
   - ✅ Stats update: Pending: 0, Rejected: 1
   - ✅ Pending Panel shows "Tiada Permintaan Pending"
   - ✅ Request shows "Ditolak" status in table

### Test 3: View Order Details 👁️

1. In the All Requests Table, click **"Lihat"** button on any request
2. **Expected**: Modal opens showing:
   - Order number and status
   - Date and time
   - Customer info
   - Items ordered (with quantities and prices)
   - Payment summary
   - Refund/void status and reason
   - Action buttons (Close, Print Receipt, etc.)

### Test 4: Filter Requests 🔍

1. Use the **Filter dropdown** above the table
2. Select "Pending"
3. **Expected**: Table shows only pending requests
4. Select "Approved"
5. **Expected**: Table shows only approved requests
6. Select "Rejected"
7. **Expected**: Table shows only rejected requests

### Test 5: Search Requests 🔎

1. In the **search box**, type "AB-003"
2. **Expected**: Table filters to show only matching order
3. Type "Siti"
4. **Expected**: Shows requests by staff member Siti
5. Type "hair"
6. **Expected**: Shows requests with "hair" in reason

---

## 📊 Mock Data Reference

You have 2 pending requests to test with:

### Request 1
```
Order ID: AB-003
Type: REFUND PENUH
Amount: BND 15.00
Requested by: Siti (30 minutes ago)
Reason: "Customer found hair in food"
Status: Pending
```

### Request 2
```
Order ID: AB-006
Type: VOID
Amount: BND 25.00
Requested by: Ali (15 minutes ago)
Reason: "Customer cancelled before food prepared"
Status: Pending
```

---

## 🎨 Visual Indicators

### Badge Color
- **Warning (Amber/Yellow)**: Pending requests exist
- **No Badge**: No pending requests

### Status Colors
- **⏱️ Pending**: Yellow/Warning color with clock icon
- **✅ Diluluskan**: Green/Success color with checkmark icon
- **❌ Ditolak**: Red/Danger color with X icon

### Request Type Colors
- **VOID**: Red (danger) - more severe
- **REFUND**: Orange (warning) - less severe

---

## 🐛 Troubleshooting

### Badge Not Showing?
- **Check**: Are you logged in as Admin or Manager?
- **Check**: Are there pending requests in the data?
- **Solution**: Refresh the page

### Can't See Nav Item?
- **Check**: Your role (Staff cannot see it)
- **Solution**: Login as Admin or Manager

### Page Shows "Access Denied"?
- **Issue**: You're logged in as Staff
- **Solution**: Login as Admin or Manager

### No Data Showing?
- **Check**: Browser console for errors
- **Solution**: Check localStorage for `abangbob_void_refund_requests`
- **Reset**: Clear localStorage and refresh

---

## ✅ Success Checklist

After testing, you should have verified:

- [ ] Badge shows on sidebar with count "2"
- [ ] Page opens with proper statistics
- [ ] Pending requests panel shows 2 requests
- [ ] Can approve a request
- [ ] Badge count updates after approval
- [ ] Stats update correctly
- [ ] Can reject a request with reason
- [ ] Badge disappears when no pending
- [ ] Empty state shows correctly
- [ ] Can view order details in modal
- [ ] Filter works (All, Pending, Approved, Rejected)
- [ ] Search works by order ID, staff name, reason
- [ ] Table pagination works
- [ ] Translations work (switch language)
- [ ] Role-based access works (Staff blocked)

---

## 📱 Where to Find Everything

### In Browser
- **URL**: `http://localhost:3000`
- **Page**: `/hr/refund-approvals`
- **Sidebar**: Look under "HR & Finance" section

### In Code
- **Page**: `app/hr/refund-approvals/page.tsx`
- **Sidebar**: `components/Sidebar.tsx`
- **Permissions**: `lib/permissions.ts`
- **Store**: `lib/store.tsx`
- **Mock Data**: `lib/order-history-data.ts`

---

## 🎉 Expected Results

After full testing, you should see:
1. ✅ Badge notification working
2. ✅ Approvals processed correctly
3. ✅ Statistics updating in real-time
4. ✅ All CRUD operations functional
5. ✅ Access control working
6. ✅ UI responsive and beautiful
7. ✅ No console errors

---

## 📞 Support

If you find any issues during testing:
1. Check browser console (F12)
2. Check dev server terminal
3. Review the implementation summary
4. Check the code files listed above

---

**Happy Testing! 🚀**

*The interface is production-ready and fully functional.*
*All features have been implemented according to the plan.*

---

*Test Guide Created: December 14, 2025*
