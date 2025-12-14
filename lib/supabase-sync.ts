// Supabase Sync Layer
// This module adds Supabase sync to critical store operations

import { getSupabaseClient } from './supabase/client';
import * as ops from './supabase/operations';

// Flag to enable/disable Supabase sync
let supabaseSyncEnabled = true;

export function setSupabaseSyncEnabled(enabled: boolean) {
  supabaseSyncEnabled = enabled;
}

export function isSupabaseSyncEnabled() {
  return supabaseSyncEnabled && !!getSupabaseClient();
}

// ============ INVENTORY SYNC ============

export async function syncAddStockItem(item: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.insertInventoryItem(item);
  } catch (error) {
    console.error('Failed to sync inventory item to Supabase:', error);
    return null;
  }
}

export async function syncUpdateStockItem(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.updateInventoryItem(id, updates);
  } catch (error) {
    console.error('Failed to update inventory item in Supabase:', error);
    return null;
  }
}

export async function syncDeleteStockItem(id: string) {
  if (!isSupabaseSyncEnabled()) return;
  
  try {
    await ops.deleteInventoryItem(id);
  } catch (error) {
    console.error('Failed to delete inventory item from Supabase:', error);
  }
}

export async function loadInventoryFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];
  
  try {
    return await ops.fetchInventory();
  } catch (error) {
    console.error('Failed to load inventory from Supabase:', error);
    return [];
  }
}

// ============ STAFF SYNC ============

export async function syncAddStaff(staff: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.insertStaff(staff);
  } catch (error) {
    console.error('Failed to sync staff to Supabase:', error);
    return null;
  }
}

export async function syncUpdateStaff(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.updateStaff(id, updates);
  } catch (error) {
    console.error('Failed to update staff in Supabase:', error);
    return null;
  }
}

export async function syncDeleteStaff(id: string) {
  if (!isSupabaseSyncEnabled()) return;
  
  try {
    await ops.deleteStaff(id);
  } catch (error) {
    console.error('Failed to delete staff from Supabase:', error);
  }
}

export async function loadStaffFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];
  
  try {
    return await ops.fetchStaff();
  } catch (error) {
    console.error('Failed to load staff from Supabase:', error);
    return [];
  }
}

// ============ MENU ITEMS SYNC ============

export async function syncAddMenuItem(item: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.insertMenuItem(item);
  } catch (error) {
    console.error('Failed to sync menu item to Supabase:', error);
    return null;
  }
}

export async function syncUpdateMenuItem(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.updateMenuItem(id, updates);
  } catch (error) {
    console.error('Failed to update menu item in Supabase:', error);
    return null;
  }
}

export async function syncDeleteMenuItem(id: string) {
  if (!isSupabaseSyncEnabled()) return;
  
  try {
    await ops.deleteMenuItem(id);
  } catch (error) {
    console.error('Failed to delete menu item from Supabase:', error);
  }
}

export async function loadMenuItemsFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];
  
  try {
    return await ops.fetchMenuItems();
  } catch (error) {
    console.error('Failed to load menu items from Supabase:', error);
    return [];
  }
}

// ============ ORDERS SYNC ============

export async function syncAddOrder(order: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.insertOrder(order);
  } catch (error) {
    console.error('Failed to sync order to Supabase:', error);
    return null;
  }
}

export async function syncUpdateOrder(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.updateOrder(id, updates);
  } catch (error) {
    console.error('Failed to update order in Supabase:', error);
    return null;
  }
}

export async function loadOrdersFromSupabase(limit?: number) {
  if (!isSupabaseSyncEnabled()) return [];
  
  try {
    return await ops.fetchOrders(limit);
  } catch (error) {
    console.error('Failed to load orders from Supabase:', error);
    return [];
  }
}

// ============ CUSTOMERS SYNC ============

export async function syncAddCustomer(customer: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.insertCustomer(customer);
  } catch (error) {
    console.error('Failed to sync customer to Supabase:', error);
    return null;
  }
}

export async function syncUpdateCustomer(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.updateCustomer(id, updates);
  } catch (error) {
    console.error('Failed to update customer in Supabase:', error);
    return null;
  }
}

export async function loadCustomersFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];
  
  try {
    return await ops.fetchCustomers();
  } catch (error) {
    console.error('Failed to load customers from Supabase:', error);
    return [];
  }
}

// ============ EXPENSES SYNC ============

export async function syncAddExpense(expense: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.insertExpense(expense);
  } catch (error) {
    console.error('Failed to sync expense to Supabase:', error);
    return null;
  }
}

export async function syncUpdateExpense(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.updateExpense(id, updates);
  } catch (error) {
    console.error('Failed to update expense in Supabase:', error);
    return null;
  }
}

export async function syncDeleteExpense(id: string) {
  if (!isSupabaseSyncEnabled()) return;
  
  try {
    await ops.deleteExpense(id);
  } catch (error) {
    console.error('Failed to delete expense from Supabase:', error);
  }
}

export async function loadExpensesFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];
  
  try {
    return await ops.fetchExpenses();
  } catch (error) {
    console.error('Failed to load expenses from Supabase:', error);
    return [];
  }
}

// ============ ATTENDANCE SYNC ============

export async function syncAddAttendance(attendance: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.insertAttendance(attendance);
  } catch (error) {
    console.error('Failed to sync attendance to Supabase:', error);
    return null;
  }
}

export async function syncUpdateAttendance(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;
  
  try {
    return await ops.updateAttendance(id, updates);
  } catch (error) {
    console.error('Failed to update attendance in Supabase:', error);
    return null;
  }
}

export async function loadAttendanceFromSupabase(startDate?: string, endDate?: string) {
  if (!isSupabaseSyncEnabled()) return [];
  
  try {
    return await ops.fetchAttendance(startDate, endDate);
  } catch (error) {
    console.error('Failed to load attendance from Supabase:', error);
    return [];
  }
}

// ============ INITIAL LOAD ALL DATA ============

export async function loadAllDataFromSupabase() {
  if (!isSupabaseSyncEnabled()) {
    return {
      inventory: [],
      staff: [],
      menuItems: [],
      orders: [],
      customers: [],
      expenses: [],
      attendance: [],
    };
  }

  try {
    const [inventory, staff, menuItems, orders, customers, expenses, attendance] = await Promise.all([
      ops.fetchInventory(),
      ops.fetchStaff(),
      ops.fetchMenuItems(),
      ops.fetchOrders(100), // Last 100 orders
      ops.fetchCustomers(),
      ops.fetchExpenses(),
      ops.fetchAttendance(),
    ]);

    return {
      inventory,
      staff,
      menuItems,
      orders,
      customers,
      expenses,
      attendance,
    };
  } catch (error) {
    console.error('Failed to load data from Supabase:', error);
    return {
      inventory: [],
      staff: [],
      menuItems: [],
      orders: [],
      customers: [],
      expenses: [],
      attendance: [],
    };
  }
}
