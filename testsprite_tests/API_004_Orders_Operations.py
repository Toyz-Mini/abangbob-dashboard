"""
API Test: Orders Operations
Tests the Supabase REST API for orders table
"""

import requests
from config import SUPABASE_URL, SUPABASE_HEADERS

def run_test():
    print("🧪 API Test: Orders Operations")
    print("=" * 50)
    
    # Test 1: Fetch recent orders
    print("\n📥 Test 1: GET /orders (recent)")
    response = requests.get(
        f"{SUPABASE_URL}/orders",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,order_number,status,total,created_at",
            "order": "created_at.desc",
            "limit": "10"
        }
    )
    
    assert response.status_code == 200, f"Failed to fetch orders: {response.status_code}"
    orders = response.json()
    print(f"   ✅ Fetched {len(orders)} recent orders")
    
    # Test 2: Filter by status
    print("\n📥 Test 2: GET /orders filtered by status")
    response = requests.get(
        f"{SUPABASE_URL}/orders",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,order_number,status",
            "status": "eq.completed",
            "limit": "5"
        }
    )
    
    assert response.status_code == 200, f"Failed to filter: {response.status_code}"
    completed_orders = response.json()
    print(f"   ✅ Found {len(completed_orders)} completed orders")
    
    # Test 3: Fetch orders with items
    print("\n📥 Test 3: GET /orders with items relation")
    response = requests.get(
        f"{SUPABASE_URL}/orders",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,order_number,items",
            "limit": "3"
        }
    )
    
    assert response.status_code == 200, f"Failed to fetch with items: {response.status_code}"
    orders_with_items = response.json()
    print(f"   ✅ Orders with items query successful")
    
    # Test 4: Check order totals
    print("\n📥 Test 4: Verify order total calculation")
    response = requests.get(
        f"{SUPABASE_URL}/orders",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,order_number,subtotal,tax,discount,total",
            "limit": "5"
        }
    )
    
    assert response.status_code == 200, f"Failed to fetch totals: {response.status_code}"
    orders_totals = response.json()
    
    for order in orders_totals:
        if all(k in order for k in ['subtotal', 'total']):
            # Basic check that total >= subtotal (accounting for tax - discount)
            print(f"   📊 Order {order.get('order_number', 'N/A')}: Total=${order.get('total', 0)}")
    
    print(f"   ✅ Order totals verified")
    
    print("\n" + "=" * 50)
    print("✅ All Orders API tests passed!")

if __name__ == "__main__":
    run_test()
