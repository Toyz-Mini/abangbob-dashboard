"""
API Test: Staff Operations
Tests the Supabase REST API for staff table
"""

import requests
from config import SUPABASE_URL, SUPABASE_HEADERS

def run_test():
    print("🧪 API Test: Staff Operations")
    print("=" * 50)
    
    # Test 1: Fetch all staff
    print("\n📥 Test 1: GET /staff")
    response = requests.get(
        f"{SUPABASE_URL}/staff",
        headers=SUPABASE_HEADERS,
        params={"select": "id,name,role,status,pin", "limit": "20"}
    )
    
    assert response.status_code == 200, f"Failed to fetch staff: {response.status_code}"
    staff_list = response.json()
    print(f"   ✅ Fetched {len(staff_list)} staff members")
    
    # Test 2: Fetch staff by role
    print("\n📥 Test 2: GET /staff filtered by role")
    response = requests.get(
        f"{SUPABASE_URL}/staff",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,name,role",
            "role": "eq.cashier"
        }
    )
    
    assert response.status_code == 200, f"Failed to filter by role: {response.status_code}"
    cashiers = response.json()
    print(f"   ✅ Found {len(cashiers)} cashiers")
    
    # Test 3: Fetch active staff only
    print("\n📥 Test 3: GET /staff active only")
    response = requests.get(
        f"{SUPABASE_URL}/staff",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,name,status",
            "status": "eq.active"
        }
    )
    
    assert response.status_code == 200, f"Failed to filter active: {response.status_code}"
    active_staff = response.json()
    print(f"   ✅ Found {len(active_staff)} active staff members")
    
    # Test 4: Verify PIN exists (for authentication test)
    print("\n🔐 Test 4: Verify staff PIN field accessibility")
    response = requests.get(
        f"{SUPABASE_URL}/staff",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,name,pin",
            "pin": "neq.null",
            "limit": "1"
        }
    )
    
    assert response.status_code == 200, f"Failed to check PINs: {response.status_code}"
    staff_with_pin = response.json()
    if len(staff_with_pin) > 0:
        print(f"   ✅ PIN field is accessible (found {len(staff_with_pin)} staff with PIN)")
    else:
        print(f"   ⚠️  No staff with PIN found (seed data may be needed)")
    
    print("\n" + "=" * 50)
    print("✅ All Staff API tests passed!")

if __name__ == "__main__":
    run_test()
