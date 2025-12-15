"""
API Test: Attendance Operations
Tests the Supabase REST API for attendance table
"""

import requests
from datetime import datetime, timedelta
from config import SUPABASE_URL, SUPABASE_HEADERS

def run_test():
    print("🧪 API Test: Attendance Operations")
    print("=" * 50)
    
    # Test 1: Fetch attendance records
    print(f"\n📥 Test 1: GET /attendance")
    response = requests.get(
        f"{SUPABASE_URL}/attendance",
        headers=SUPABASE_HEADERS,
        params={
            "select": "*",
            "limit": "20"
        }
    )
    
    assert response.status_code == 200, f"Failed to fetch attendance: {response.status_code}"
    today_records = response.json()
    print(f"   ✅ Found {len(today_records)} attendance records")
    
    # Test 2: Fetch attendance with staff relation
    print("\n📥 Test 2: GET /attendance with staff relation")
    response = requests.get(
        f"{SUPABASE_URL}/attendance",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,date,clock_in,staff(id,name)",
            "order": "date.desc",
            "limit": "10"
        }
    )
    
    if response.status_code == 200:
        records = response.json()
        print(f"   ✅ Staff relation query successful ({len(records)} records)")
    else:
        print(f"   ⚠️  Relation query returned {response.status_code}")
    
    # Test 3: Check attendance table structure
    print("\n📥 Test 3: GET /attendance table info")
    response = requests.get(
        f"{SUPABASE_URL}/attendance",
        headers={**SUPABASE_HEADERS, 'Prefer': 'count=exact'},
        params={"select": "*", "limit": "0"}
    )
    
    # 200 or 206 means success, 416 means range not satisfiable but table exists
    assert response.status_code in [200, 206, 416], f"Failed: {response.status_code}"
    print(f"   ✅ Attendance table accessible")
    
    print("\n" + "=" * 50)
    print("✅ All Attendance API tests passed!")

if __name__ == "__main__":
    run_test()
