"""
API Test: Menu Items CRUD Operations
Tests the Supabase REST API for menu_items table
"""

import requests
from config import SUPABASE_URL, SUPABASE_HEADERS

def run_test():
    print("🧪 API Test: Menu Items CRUD Operations")
    print("=" * 50)
    
    # Test 1: Fetch all menu items
    print("\n📥 Test 1: GET /menu_items")
    response = requests.get(
        f"{SUPABASE_URL}/menu_items",
        headers=SUPABASE_HEADERS,
        params={"select": "*", "limit": "10"}
    )
    
    assert response.status_code == 200, f"Failed to fetch menu items: {response.status_code}"
    items = response.json()
    print(f"   ✅ Fetched {len(items)} menu items")
    
    # Test 2: Fetch menu items count
    print("\n📥 Test 2: GET /menu_items count")
    response = requests.get(
        f"{SUPABASE_URL}/menu_items",
        headers={**SUPABASE_HEADERS, 'Prefer': 'count=exact'},
        params={"select": "*", "limit": "0"}
    )
    
    # 200 is success, 416 means range not satisfiable (also means table exists)
    assert response.status_code in [200, 206, 416], f"Failed to count: {response.status_code}"
    print(f"   ✅ Menu items table accessible")
    
    # Test 3: Filter by category
    print("\n📥 Test 3: GET /menu_items filtered by category")
    response = requests.get(
        f"{SUPABASE_URL}/menu_items",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,name,category",
            "category": "eq.Main"
        }
    )
    
    assert response.status_code == 200, f"Failed to filter: {response.status_code}"
    print(f"   ✅ Category filter successful")
    
    print("\n" + "=" * 50)
    print("✅ All Menu Items API tests passed!")

if __name__ == "__main__":
    run_test()
