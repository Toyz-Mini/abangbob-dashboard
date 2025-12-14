# TestSprite Fix Action Plan

**Project:** AbangBob Dashboard  
**Plan Created:** December 14, 2024  
**Target:** Fix all test failures and achieve 80%+ pass rate  
**Total Estimated Time:** 2-3 hours

---

## 🚨 CRITICAL: Start Here

**The #1 issue is simple:** Tests ran against `localhost` instead of production.

**Quick Fix (5 minutes):**
1. Reconfigure TestSprite to test `https://abangbob-dashboard.vercel.app`
2. Re-run all tests
3. Get ACTUAL results for production

**Everything else depends on this fix!**

---

## Phase 1: Immediate Fixes (Priority 0) - DO FIRST

### ⚡ Action 1.1: Reconfigure Test Environment

**Priority:** P0 - CRITICAL  
**Estimated Time:** 5 minutes  
**Impact:** Fixes 100% of current test failures  
**Risk:** Low

#### Steps:

1. **Open TestSprite Configuration**
   - Go to TestSprite dashboard
   - Find test configuration settings
   - Locate "Base URL" or "Environment" setting

2. **Update Test URL**
   ```
   Old: http://localhost:3000
   New: https://abangbob-dashboard.vercel.app
   ```

3. **Verify Change**
   - Save configuration
   - Check that all test cases now point to production
   - Confirm no hardcoded localhost references

4. **Test One Endpoint Manually**
   ```bash
   # Quick verification
   curl https://abangbob-dashboard.vercel.app/ | grep -i "abangbob"
   ```

#### Success Criteria:
- ✅ TestSprite configured with production URL
- ✅ Manual curl returns HTML (not 404)
- ✅ Ready to re-run tests

#### Files to Reference:
- `TESTSPRITE_QUICK_REFERENCE.md` - Production URL
- `TESTSPRITE_CONFIG_REVIEW.md` - Configuration comparison

---

### ⚡ Action 1.2: Re-run All Frontend Tests

**Priority:** P0 - CRITICAL  
**Estimated Time:** 10 minutes  
**Impact:** Get valid test results  
**Risk:** Low

#### Steps:

1. **In TestSprite Dashboard**
   - Click "Run All Tests" or "Re-test"
   - Monitor execution progress

2. **Wait for Completion**
   - 20 tests should execute
   - Takes ~5-10 minutes typically

3. **Review New Results**
   - Check pass/fail rate
   - Identify any new failures
   - Compare with previous run

4. **Document Findings**
   - Note which tests now pass
   - Identify remaining failures
   - Categorize by type

#### Success Criteria:
- ✅ All 20 tests execute against production
- ✅ Pass rate > 0% (expecting 50-80%)
- ✅ Valid results to analyze

#### Expected Outcome:
- Most tests should now pass (if production is working)
- Some tests may fail due to:
  - Missing test data
  - Authentication requirements
  - Specific business logic issues

---

### ⚡ Action 1.3: Verify Production Deployment

**Priority:** P0 - CRITICAL  
**Estimated Time:** 10 minutes  
**Impact:** Confirm production is working  
**Risk:** Low

#### Steps:

1. **Manual Browser Test**
   ```
   Open: https://abangbob-dashboard.vercel.app
   ```

2. **Check Key Pages:**
   - [ ] Homepage loads
   - [ ] Login page accessible
   - [ ] No console errors
   - [ ] No 404 errors

3. **Verify Environment Variables**
   - Go to Vercel Dashboard
   - Project Settings > Environment Variables
   - Confirm these exist:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://gmkeiqficpsfiwhqchup.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

4. **Test Basic Functionality**
   - Try to log in with: `admin@abangbob.com` / `Admin123!`
   - Check if redirect works
   - Verify data loads

#### Success Criteria:
- ✅ Production site loads correctly
- ✅ Environment variables configured
- ✅ Basic functionality works
- ✅ No critical console errors

#### If Production Has Issues:
- **Deploy latest code:**
  ```bash
  git push origin main
  # Vercel will auto-deploy
  ```
- **Or trigger manual deploy in Vercel dashboard**

---

## Phase 2: Backend API Testing (Priority 1) - DO SECOND

### ⚡ Action 2.1: Configure Supabase API Tests

**Priority:** P1 - HIGH  
**Estimated Time:** 30 minutes  
**Impact:** Test database operations  
**Risk:** Low

#### Steps:

**For Each of 7 Supabase APIs:**

Use reference: `testsprite-api-list.md` Section B (APIs #8-14)

**1. Menu Items API**
```
In TestSprite, click "+ Add API"

API name: Supabase - Menu Items
API endpoint: https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/menu_items
Authentication Type: API Key

Headers (if TestSprite supports):
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta2VpcWZpY3BzZml3aHFjaHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mjc1MDgsImV4cCI6MjA4MTIwMzUwOH0.yUsDxYw3c8vtSWew_ACiLYAYJHRwDz0X9EgQAPuwTts

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta2VpcWZpY3BzZml3aHFjaHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mjc1MDgsImV4cCI6MjA4MTIwMzUwOH0.yUsDxYw3c8vtSWew_ACiLYAYJHRwDz0X9EgQAPuwTts

Content-Type: application/json

Extra testing information:
Direct database access for menu items.
Test GET, POST, PATCH, DELETE operations.
Verify data persistence and validation.
```

**Repeat for:** Orders, Staff, Inventory, Customers, Attendance, Expenses

#### Success Criteria:
- ✅ All 7 Supabase APIs added to TestSprite
- ✅ API keys configured correctly
- ✅ Headers set properly
- ✅ Ready to test database operations

#### Files to Use:
- `testsprite-api-list.md` - Copy-paste from Section B
- `TESTSPRITE_QUICK_REFERENCE.md` - API key reference
- `testsprite-openapi-spec.yaml` - Alternative import method

---

### ⚡ Action 2.2: Test Supabase APIs

**Priority:** P1 - HIGH  
**Estimated Time:** 15 minutes  
**Impact:** Verify backend works  
**Risk:** Medium

#### Steps:

1. **Run API Tests**
   - In TestSprite, select all API tests
   - Click "Run Tests"
   - Wait for execution

2. **Expected Results:**
   - **If RLS disabled:** All should pass (GET returns data)
   - **If RLS enabled:** May need authenticated tokens

3. **If Tests Fail:**
   - Check error messages
   - Common issues:
     - RLS policies blocking access
     - Missing tables
     - Invalid API keys

#### Common Failures & Fixes:

**Error: "relation 'menu_items' does not exist"**
```sql
-- Run this in Supabase SQL Editor
-- from lib/supabase/schema.sql
CREATE TABLE IF NOT EXISTS public.menu_items ( ... );
```

**Error: "row level security policy violation"**
```sql
-- Option 1: Disable RLS for testing (NOT RECOMMENDED for production)
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;

-- Option 2: Add policy for anon access
CREATE POLICY "Public read access" ON menu_items
  FOR SELECT USING (true);
```

**Error: "invalid api key"**
- Verify key in Supabase Dashboard > Settings > API
- Check key hasn't expired
- Regenerate if needed

#### Success Criteria:
- ✅ At least GET requests work
- ✅ Can read data from tables
- ✅ Authentication works
- ✅ 70%+ API tests pass

---

## Phase 3: Enhanced Testing (Priority 1) - DO THIRD

### ⚡ Action 3.1: Configure Authentication Tests

**Priority:** P1 - HIGH  
**Estimated Time:** 20 minutes  
**Impact:** Verify login and security  
**Risk:** Low

#### Test Scenarios to Add:

**1. Admin Login Flow**
```javascript
Test: Admin can login successfully
Steps:
  1. Navigate to https://abangbob-dashboard.vercel.app/login
  2. Click "Login Admin" button
  3. Enter email: admin@abangbob.com
  4. Enter password: Admin123!
  5. Click Submit
  6. Wait for redirect
Expected Result: 
  - Redirected to dashboard (/)
  - User menu shows admin options
  - Session cookie set
```

**2. Staff PIN Login**
```javascript
Test: Staff can login with PIN
Steps:
  1. Navigate to /login
  2. Click "Login Staf"
  3. Select "Staff Ahmad"
  4. Enter PIN: 3456
  5. Submit
Expected Result:
  - Redirected to staff portal
  - Limited menu options visible
  - Staff-specific features accessible
```

**3. Protected Route Access**
```javascript
Test: Unauthenticated users redirected
Steps:
  1. Clear cookies/session
  2. Navigate to /hr (protected page)
Expected Result:
  - Redirected to /login
  - Original URL saved for post-login redirect
```

#### Success Criteria:
- ✅ All 3 login types working
- ✅ Redirects function correctly
- ✅ Role-based access enforced

---

## Phase 4: Issue-Specific Fixes (Priority 2) - IF NEEDED

**Note:** Only proceed with this phase AFTER Phase 1 re-testing shows actual production issues.

### IF Tests Still Fail After URL Fix

#### Potential Issue: Missing Environment Variables

**Symptoms:**
- Supabase connection errors
- "Client not configured" messages
- Data not loading

**Fix:**
```bash
# In Vercel Dashboard
# Settings > Environment Variables
# Add:
NEXT_PUBLIC_SUPABASE_URL=https://gmkeiqficpsfiwhqchup.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta2VpcWZpY3BzZml3aHFjaHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mjc1MDgsImV4cCI6MjA4MTIwMzUwOH0.yUsDxYw3c8vtSWew_ACiLYAYJHRwDz0X9EgQAPuwTts

# Redeploy after adding
```

**Time:** 5 minutes

---

#### Potential Issue: Database Not Seeded

**Symptoms:**
- Tests pass but return empty data
- Menu items missing
- No staff members found

**Fix:**
```sql
-- In Supabase SQL Editor
-- Run seed-test-users.sql
\i lib/supabase/seed-test-users.sql

-- Or manually add test data
INSERT INTO menu_items (name, category, price, available)
VALUES ('Nasi Katok', 'Main Course', 2.50, true);
```

**Time:** 10 minutes

---

#### Potential Issue: CORS Errors

**Symptoms:**
- API calls blocked in browser
- "CORS policy" errors in console

**Fix:**
```javascript
// In Supabase Dashboard > Authentication > URL Configuration
// Add Vercel URL to allowed origins:
https://abangbob-dashboard.vercel.app
```

**Time:** 5 minutes

---

## Phase 5: Validation & Re-testing

### ⚡ Action 5.1: Validate All Fixes

**Priority:** P1 - HIGH  
**Estimated Time:** 15 minutes  
**Impact:** Confirm fixes work  
**Risk:** Low

#### Validation Checklist:

**Environment:**
- [ ] Production URL tested: `https://abangbob-dashboard.vercel.app`
- [ ] Environment variables set in Vercel
- [ ] Deployment successful and live

**Frontend Tests:**
- [ ] All 7 frontend endpoints configured correctly
- [ ] Tests execute against production
- [ ] Pass rate > 50%

**Backend Tests:**
- [ ] All 7 Supabase APIs configured
- [ ] API keys working
- [ ] At least GET requests successful

**Authentication:**
- [ ] Admin login works
- [ ] Staff PIN login works
- [ ] Protected routes secured

---

### ⚡ Action 5.2: Final Test Execution

**Priority:** P1 - HIGH  
**Estimated Time:** 15 minutes  
**Impact:** Complete validation  
**Risk:** Low

#### Steps:

1. **Run Complete Test Suite**
   - Frontend E2E: 20 tests
   - Backend API: 7 tests
   - Total: 27 tests

2. **Monitor Execution**
   - Watch for failures
   - Note any error patterns
   - Check timing issues

3. **Analyze Results**
   - Calculate pass rate
   - Identify remaining issues
   - Prioritize fixes

4. **Document Results**
   - Update `TESTSPRITE_RESULTS_SUMMARY.md`
   - Add notes to `TESTSPRITE_FAILURES_ANALYSIS.md`
   - Create new report if needed

#### Success Criteria:
- ✅ Tests execute completely
- ✅ Pass rate ≥ 80%
- ✅ No blocking issues
- ✅ Minor issues documented

---

## Implementation Timeline

### Day 1 (Today) - Critical Fixes

| Time | Action | Duration | Owner |
|------|--------|----------|-------|
| Now | Fix test URL configuration | 5 min | You |
| Now | Re-run frontend tests | 10 min | TestSprite |
| Now | Review new results | 10 min | You |
| Today | Add Supabase API tests | 30 min | You |
| Today | Run API tests | 15 min | TestSprite |
| Today | **CHECKPOINT** | 5 min | You |
| **Total** | **Phase 1 Complete** | **~75 min** | |

### Day 2 - Enhanced Coverage

| Time | Action | Duration |
|------|--------|----------|
| Day 2 | Configure auth tests | 20 min |
| Day 2 | Run auth tests | 10 min |
| Day 2 | Fix any failing tests | 1-2 hours |
| Day 2 | **CHECKPOINT** | 5 min |
| **Total** | **Phase 2 Complete** | **~2-3 hours** |

### Day 3 - Polish & Automation

| Time | Action | Duration |
|------|--------|----------|
| Day 3 | Update documentation | 30 min |
| Day 3 | Create test checklist | 15 min |
| Day 3 | Setup monitoring | 30 min |
| **Total** | **Phase 3 Complete** | **~75 min** |

---

## Detailed Fix Instructions

### Fix #1: Update TestSprite Base URL

#### Method A: Via TestSprite Dashboard UI

1. Login to TestSprite
2. Navigate to test project
3. Click "Settings" or "Configuration"
4. Find "Base URL" or "Environment" field
5. Change from `http://localhost:3000` to `https://abangbob-dashboard.vercel.app`
6. Save changes
7. Re-run tests

#### Method B: Via Configuration File (if applicable)

```json
// testsprite.config.json or similar
{
  "baseURL": "https://abangbob-dashboard.vercel.app",
  "environment": "production",
  "timeout": 30000
}
```

#### Method C: Via TestSprite MCP

```bash
# If using MCP, update configuration
# Location might be in: /Users/aliffmarwan/.cursor/projects/.../mcps/user-TestSprite/
```

---

### Fix #2: Add All Backend API Tests

#### Quick Method: Bulk Import

**If TestSprite supports file import:**
```bash
# Upload one of these files:
1. testsprite-api-docs.json
2. testsprite-openapi-spec.yaml
3. testsprite-postman-collection.json
```

#### Manual Method: Add One by One

**Use this guide:** `testsprite-api-list.md` Section B

**For each of 7 APIs, copy-paste:**
- API name
- API endpoint URL
- Authentication type
- Headers
- Extra testing information

**Time per API:** ~4 minutes  
**Total:** ~28 minutes for all 7

---

### Fix #3: Configure Authentication in Tests

#### Option A: Session-Based Testing

**For Frontend tests:**
```javascript
// Configure TestSprite to:
1. Login first (POST to /login with credentials)
2. Store session cookie
3. Use cookie for subsequent requests
4. Test protected pages
```

#### Option B: Direct Token Testing

**For API tests:**
```bash
# Get JWT token via Supabase auth
curl -X POST https://gmkeiqficpsfiwhqchup.supabase.co/auth/v1/token \
  -H "apikey: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@abangbob.com","password":"Admin123!"}'

# Use returned JWT in subsequent tests
```

---

## Risk Mitigation

### Before Making Changes

1. **Backup Current Configuration**
   - Screenshot current TestSprite settings
   - Export test configurations if possible
   - Document current state

2. **Test in Stages**
   - Fix one issue at a time
   - Re-test after each fix
   - Don't bundle multiple changes

3. **Verify Production Safety**
   - Ensure tests are read-only (GET requests mainly)
   - Be careful with DELETE operations
   - Use test data, not production data

### If Something Goes Wrong

1. **TestSprite Configuration Breaks**
   - Revert to previous settings
   - Use backup screenshots
   - Re-do configuration carefully

2. **Production Deployment Issues**
   - Check Vercel deployment logs
   - Verify environment variables
   - Re-deploy from last known good commit

3. **API Tests Break Production**
   - Supabase APIs should be read-only for testing
   - If write operations needed, use test database
   - Or add RLS policies to protect data

---

## Success Criteria & Checkpoints

### Checkpoint 1: After Phase 1 (Today)

**Must Have:**
- ✅ Tests running against production URL
- ✅ At least 50% pass rate
- ✅ No critical blocking issues
- ✅ Valid results to analyze

**If Not Met:**
- 🔴 STOP and investigate
- Review production deployment
- Check Vercel logs
- Verify environment variables

---

### Checkpoint 2: After Phase 2 (Day 2)

**Must Have:**
- ✅ All 14 APIs tested (7 frontend + 7 backend)
- ✅ 70%+ pass rate overall
- ✅ Authentication working
- ✅ Core CRUD operations verified

**If Not Met:**
- ⚠️ Address failing tests individually
- Check for data seeding issues
- Verify RLS policies

---

### Checkpoint 3: Final (Day 3)

**Must Have:**
- ✅ 80%+ pass rate
- ✅ All critical functionality working
- ✅ Documentation updated
- ✅ Known issues documented

**If Not Met:**
- Review remaining failures
- Determine if test expectations are correct
- Mark known issues/limitations

---

## Resource Links

### Documentation
- `TESTSPRITE_RESULTS_SUMMARY.md` - Current status
- `TESTSPRITE_FAILURES_ANALYSIS.md` - Issue details
- `TESTSPRITE_CONFIG_REVIEW.md` - Config comparison
- `TESTSPRITE_SETUP_GUIDE.md` - Original setup guide

### Configuration Files
- `testsprite-api-list.md` - All API details
- `TESTSPRITE_QUICK_REFERENCE.md` - Quick lookup
- `testsprite-api-docs.json` - Upload to TestSprite
- `testsprite-openapi-spec.yaml` - Import to tools

### Test Reports
- `testsprite_tests/testsprite-mcp-test-report.md` - Previous test results
- `TestSprite.pdf` - Full test report (in Downloads)

---

## Quick Command Reference

```bash
# Verify production is live
curl -I https://abangbob-dashboard.vercel.app

# Test a specific page
curl https://abangbob-dashboard.vercel.app/login

# Test Supabase API (Menu Items)
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     https://gmkeiqficpsfiwhqchup.supabase.co/rest/v1/menu_items

# Clear local Next.js cache (if testing localhost)
rm -rf .next

# Restart dev server
npm run dev

# Check Vercel deployment logs
vercel logs https://abangbob-dashboard.vercel.app
```

---

## Estimated Total Time

| Phase | Time | Priority | Status |
|-------|------|----------|---------|
| **Phase 1: Immediate Fixes** | 25 min | P0 | Must Do Today |
| **Phase 2: Backend Testing** | 45 min | P1 | Must Do Today |
| **Phase 3: Auth Testing** | 30 min | P1 | Do Today/Tomorrow |
| **Phase 4: Issue Fixes** | 1-2 hours | P2 | As needed |
| **Phase 5: Validation** | 30 min | P1 | After fixes |
| | | | |
| **TOTAL** | **2.5-4 hours** | | **This Week** |

---

## Next Immediate Action

### 🎯 START HERE (Right Now!)

```bash
# 1. Open TestSprite Dashboard
open https://testsprite.com/dashboard

# 2. Find your test configuration

# 3. Change Base URL from:
http://localhost:3000

# 4. To:
https://abangbob-dashboard.vercel.app

# 5. Click "Save"

# 6. Click "Re-run All Tests"

# 7. Wait 10 minutes for results

# 8. Come back and review new results!
```

**This ONE change will transform your test results from 0% to potentially 80%+ pass rate!**

---

**Action Plan Created:** December 14, 2024  
**Status:** Ready for Implementation  
**Priority:** 🔴 CRITICAL - Start Immediately
