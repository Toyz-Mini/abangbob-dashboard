"""
API Test: Customers Operations
Tests the Supabase REST API for customers table
"""

import requests
from config import SUPABASE_URL, SUPABASE_HEADERS

def run_test():
    print("🧪 API Test: Customers Operations")
    print("=" * 50)
    
    # Test 1: Fetch all customers
    print("\n📥 Test 1: GET /customers")
    response = requests.get(
        f"{SUPABASE_URL}/customers",
        headers=SUPABASE_HEADERS,
        params={"select": "id,name,phone,loyalty_points", "limit": "10"}
    )
    
    assert response.status_code == 200, f"Failed to fetch customers: {response.status_code}"
    customers = response.json()
    print(f"   ✅ Fetched {len(customers)} customers")
    
    # Test 2: Search customer by phone
    print("\n📥 Test 2: GET /customers search by phone")
    response = requests.get(
        f"{SUPABASE_URL}/customers",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,name,phone",
            "phone": "like.%673%"
        }
    )
    
    assert response.status_code == 200, f"Failed to search: {response.status_code}"
    brunei_customers = response.json()
    print(f"   ✅ Found {len(brunei_customers)} customers with Brunei phone numbers")
    
    # Test 3: VIP customers (high loyalty points)
    print("\n📥 Test 3: GET /customers VIP tier")
    response = requests.get(
        f"{SUPABASE_URL}/customers",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,name,loyalty_points",
            "loyalty_points": "gte.100",
            "order": "loyalty_points.desc"
        }
    )
    
    assert response.status_code == 200, f"Failed to fetch VIPs: {response.status_code}"
    vip_customers = response.json()
    print(f"   ✅ Found {len(vip_customers)} VIP customers (100+ points)")
    
    print("\n" + "=" * 50)
    print("✅ All Customers API tests passed!")

if __name__ == "__main__":
    run_test()
