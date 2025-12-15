"""
API Test: Expenses Operations
Tests the Supabase REST API for expenses table
"""

import requests
from config import SUPABASE_URL, SUPABASE_HEADERS

def run_test():
    print("🧪 API Test: Expenses Operations")
    print("=" * 50)
    
    # Test 1: Fetch all expenses
    print("\n📥 Test 1: GET /expenses")
    response = requests.get(
        f"{SUPABASE_URL}/expenses",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,description,amount,category,date",
            "order": "date.desc",
            "limit": "20"
        }
    )
    
    assert response.status_code == 200, f"Failed to fetch expenses: {response.status_code}"
    expenses = response.json()
    print(f"   ✅ Fetched {len(expenses)} expenses")
    
    # Test 2: Filter by category
    print("\n📥 Test 2: GET /expenses by category")
    response = requests.get(
        f"{SUPABASE_URL}/expenses",
        headers=SUPABASE_HEADERS,
        params={
            "select": "id,description,amount,category",
            "category": "eq.supplies"
        }
    )
    
    assert response.status_code == 200, f"Failed to filter: {response.status_code}"
    supplies = response.json()
    print(f"   ✅ Found {len(supplies)} supply expenses")
    
    # Test 3: Calculate total expenses
    print("\n📥 Test 3: Aggregate expenses total")
    response = requests.get(
        f"{SUPABASE_URL}/expenses",
        headers=SUPABASE_HEADERS,
        params={
            "select": "amount"
        }
    )
    
    assert response.status_code == 200, f"Failed: {response.status_code}"
    all_expenses = response.json()
    total = sum(float(e.get('amount', 0)) for e in all_expenses)
    print(f"   ✅ Total expenses: ${total:.2f}")
    
    print("\n" + "=" * 50)
    print("✅ All Expenses API tests passed!")

if __name__ == "__main__":
    run_test()
