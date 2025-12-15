#!/usr/bin/env python3
"""
Supabase API Test Runner
Run all API tests against the production Supabase backend

Usage:
    python run_api_tests.py        # Run all tests
    python run_api_tests.py menu   # Run only menu tests
    DEBUG=true python run_api_tests.py  # Run with debug output
"""

import sys
import importlib
import traceback
from datetime import datetime

# List of API test modules
API_TESTS = [
    ('API_001_Menu_Items_CRUD', 'Menu Items'),
    ('API_002_Staff_Operations', 'Staff'),
    ('API_003_Inventory_Operations', 'Inventory'),
    ('API_004_Orders_Operations', 'Orders'),
    ('API_005_Customers_Operations', 'Customers'),
    ('API_006_Attendance_Operations', 'Attendance'),
    ('API_007_Expenses_Operations', 'Expenses'),
]

def run_all_tests(filter_keyword=None):
    print("=" * 60)
    print("🚀 AbangBob Dashboard - Supabase API Test Suite")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    passed = 0
    failed = 0
    skipped = 0
    results = []
    
    for module_name, display_name in API_TESTS:
        # Filter tests if keyword provided
        if filter_keyword and filter_keyword.lower() not in display_name.lower():
            skipped += 1
            continue
        
        print(f"\n{'─' * 60}")
        
        try:
            # Import and run the test module
            module = importlib.import_module(module_name)
            module.run_test()
            passed += 1
            results.append((display_name, 'PASS', None))
        except AssertionError as e:
            failed += 1
            results.append((display_name, 'FAIL', str(e)))
            print(f"❌ FAILED: {e}")
        except Exception as e:
            failed += 1
            results.append((display_name, 'ERROR', str(e)))
            print(f"💥 ERROR: {e}")
            traceback.print_exc()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    for name, status, error in results:
        icon = "✅" if status == "PASS" else "❌"
        print(f"   {icon} {name}: {status}")
        if error:
            print(f"      └─ {error[:50]}...")
    
    print(f"\n   Total: {passed + failed + skipped} tests")
    print(f"   ✅ Passed: {passed}")
    print(f"   ❌ Failed: {failed}")
    if skipped:
        print(f"   ⏭️  Skipped: {skipped}")
    
    print("=" * 60)
    
    # Exit with appropriate code
    if failed > 0:
        print("❌ Some tests failed!")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    filter_kw = sys.argv[1] if len(sys.argv) > 1 else None
    sys.exit(run_all_tests(filter_kw))
