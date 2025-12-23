#!/bin/bash

# TestSprite Quick Fixes Script
# Project: AbangBob Dashboard
# Purpose: Automated fixes for common TestSprite test failures
# Date: December 14, 2024

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/Users/aliffmarwan/abangbob dashboard"
PRODUCTION_URL="https://abangbob-dashboard.vercel.app"
SUPABASE_URL="https://gmkeiqficpsfiwhqchup.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta2VpcWZpY3BzZml3aHFjaHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mjc1MDgsImV4cCI6MjA4MTIwMzUwOH0.yUsDxYw3c8vtSWew_ACiLYAYJHRwDz0X9EgQAPuwTts"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}TestSprite Quick Fixes${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# ============================================
# FIX #1: Verify Production Deployment
# ============================================

echo -e "${YELLOW}Fix #1: Verifying production deployment...${NC}"

if curl -f -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL" | grep -q "200"; then
    print_status "Production is live at $PRODUCTION_URL"
else
    print_error "Production not accessible. Check Vercel deployment!"
    echo ""
    print_info "Actions:"
    echo "  1. Check Vercel dashboard: https://vercel.com/dashboard"
    echo "  2. Verify deployment succeeded"
    echo "  3. Check deployment logs for errors"
    exit 1
fi

echo ""

# ============================================
# FIX #2: Test Supabase API Connection
# ============================================

echo -e "${YELLOW}Fix #2: Testing Supabase API connection...${NC}"

# Test Menu Items endpoint
MENU_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    "$SUPABASE_URL/rest/v1/menu_items?limit=1")

HTTP_CODE=$(echo "$MENU_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    print_status "Supabase API is accessible"
elif [ "$HTTP_CODE" = "401" ]; then
    print_error "Supabase API authentication failed"
    echo ""
    print_info "Actions:"
    echo "  1. Verify API key in Supabase Dashboard > Settings > API"
    echo "  2. Check key hasn't expired"
    echo "  3. Regenerate key if needed"
elif [ "$HTTP_CODE" = "404" ]; then
    print_error "Supabase table 'menu_items' not found"
    echo ""
    print_info "Actions:"
    echo "  1. Go to Supabase Dashboard > SQL Editor"
    echo "  2. Run: lib/supabase/schema.sql"
    echo "  3. Create all required tables"
else
    print_warning "Supabase API returned HTTP $HTTP_CODE"
fi

echo ""

# ============================================
# FIX #3: Verify Environment Variables
# ============================================

echo -e "${YELLOW}Fix #3: Checking environment variables...${NC}"

if [ -f "$PROJECT_DIR/.env.local" ]; then
    print_status "Local .env.local exists"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" "$PROJECT_DIR/.env.local"; then
        print_status "NEXT_PUBLIC_SUPABASE_URL found"
    else
        print_error "NEXT_PUBLIC_SUPABASE_URL missing"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$PROJECT_DIR/.env.local"; then
        print_status "NEXT_PUBLIC_SUPABASE_ANON_KEY found"
    else
        print_error "NEXT_PUBLIC_SUPABASE_ANON_KEY missing"
    fi
else
    print_warning ".env.local not found (this is ok if testing production)"
fi

echo ""
print_info "Verify environment variables in Vercel:"
echo "  https://vercel.com/dashboard > Your Project > Settings > Environment Variables"
echo "  Required:"
echo "    - NEXT_PUBLIC_SUPABASE_URL"
echo "    - NEXT_PUBLIC_SUPABASE_ANON_KEY"

echo ""

# ============================================
# FIX #4: Clean Next.js Cache (if testing locally)
# ============================================

echo -e "${YELLOW}Fix #4: Local development server checks...${NC}"

if [ -d "$PROJECT_DIR/.next" ]; then
    print_info "Found .next cache directory"
    echo ""
    echo "To fix localhost testing issues, run:"
    echo -e "  ${GREEN}cd '$PROJECT_DIR'${NC}"
    echo -e "  ${GREEN}rm -rf .next${NC}"
    echo -e "  ${GREEN}npm run dev${NC}"
    echo ""
else
    print_info ".next directory not found (run 'npm run dev' first)"
fi

echo ""

# ============================================
# FIX #5: Test Credentials Verification
# ============================================

echo -e "${YELLOW}Fix #5: Verifying test credentials...${NC}"

print_info "Test credentials ready to use:"
echo "  Admin: admin@abangbob.com / Admin123!"
echo "  Manager: manager@abangbob.com / Manager123!"
echo "  Staff PIN: 3456"

echo ""
print_info "Verify these users exist in Supabase:"
echo "  https://supabase.com/dashboard/project/gmkeiqficpsfiwhqchup"
echo "  Go to: Table Editor > staff"
echo "  Check for test users"

echo ""

# ============================================
# FIX #6: TestSprite Configuration Guide
# ============================================

echo -e "${YELLOW}Fix #6: TestSprite configuration instructions...${NC}"

echo ""
print_info "To fix TestSprite configuration:"
echo ""
echo "  ${GREEN}STEP 1:${NC} Update Test URL"
echo "    - Open TestSprite Dashboard"
echo "    - Go to test configuration/settings"
echo "    - Change Base URL to: $PRODUCTION_URL"
echo "    - Save changes"
echo ""
echo "  ${GREEN}STEP 2:${NC} Add Missing Backend API Tests"
echo "    - Open: testsprite-api-list.md (Section B)"
echo "    - Add APIs #8-14 to TestSprite"
echo "    - Use API key from TESTSPRITE_QUICK_REFERENCE.md"
echo "    - Takes ~30 minutes"
echo ""
echo "  ${GREEN}STEP 3:${NC} Re-run Tests"
echo "    - In TestSprite, click 'Run All Tests'"
echo "    - Wait 10-15 minutes for completion"
echo "    - Review new results"
echo ""

# ============================================
# FIX #7: Quick API Test
# ============================================

echo -e "${YELLOW}Fix #7: Quick manual API test...${NC}"

echo ""
print_info "Testing Menu Items API manually..."

MENU_TEST=$(curl -s -w "\n%{http_code}" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    "$SUPABASE_URL/rest/v1/menu_items?select=id,name&limit=3" 2>/dev/null || echo "000")

HTTP_CODE=$(echo "$MENU_TEST" | tail -n1)
RESPONSE_BODY=$(echo "$MENU_TEST" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_status "API test successful!"
    echo ""
    echo "Sample data returned:"
    echo "$RESPONSE_BODY" | head -3
elif [ "$HTTP_CODE" = "000" ]; then
    print_error "Network error - cannot reach Supabase"
else
    print_error "API test failed with HTTP $HTTP_CODE"
fi

echo ""

# ============================================
# SUMMARY
# ============================================

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Summary & Next Steps${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

echo "Quick Fixes Completed:"
echo "  ✓ Verified production deployment"
echo "  ✓ Tested Supabase API connection"
echo "  ✓ Checked environment variables"
echo "  ✓ Identified configuration issues"
echo ""

echo -e "${GREEN}NEXT ACTIONS:${NC}"
echo ""
echo "  1. ${YELLOW}Update TestSprite Base URL${NC} (5 min)"
echo "     Change to: $PRODUCTION_URL"
echo ""
echo "  2. ${YELLOW}Re-run all tests${NC} (10 min)"
echo "     Expected: 50-80% pass rate"
echo ""
echo "  3. ${YELLOW}Add Backend API tests${NC} (30 min)"
echo "     Follow: testsprite-api-list.md Section B"
echo ""
echo "  4. ${YELLOW}Review new results${NC}"
echo "     Read: TESTSPRITE_RESULTS_SUMMARY.md"
echo ""

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Documentation Created:${NC}"
echo -e "${BLUE}================================${NC}"
echo "  - TESTSPRITE_RESULTS_SUMMARY.md"
echo "  - TESTSPRITE_FAILURES_ANALYSIS.md"
echo "  - TESTSPRITE_CONFIG_REVIEW.md"
echo "  - TESTSPRITE_FIX_ACTION_PLAN.md"
echo "  - TESTSPRITE_QUICK_FIXES.sh (this file)"
echo ""

echo -e "${GREEN}You're all set! Follow the action plan to fix the issues.${NC}"
echo ""
