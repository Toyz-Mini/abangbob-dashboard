// Supabase Data Operations
// Helper functions for CRUD operations with Supabase
// @ts-nocheck

import { getSupabaseClient } from './client';
import type { Database } from './types';

type Tables = Database['public']['Tables'];

// Transform camelCase to snake_case for Supabase
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  const snakeCased: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snakeCased[snakeKey] = typeof value === 'object' ? toSnakeCase(value) : value;
  }
  return snakeCased;
}

// Transform snake_case to camelCase from Supabase
export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  const camelCased: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelCased[camelKey] = typeof value === 'object' ? toCamelCase(value) : value;
  }
  return camelCased;
}

// ============ INVENTORY OPERATIONS ============

export async function fetchInventory() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertInventoryItem(item: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedItem = toSnakeCase(item);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('inventory')
    .insert(snakeCasedItem)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateInventoryItem(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('inventory')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteInventoryItem(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ STAFF OPERATIONS ============

export async function fetchStaff() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching staff:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertStaff(staff: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedStaff = toSnakeCase(staff);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('staff')
    .insert(snakeCasedStaff)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateStaff(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('staff')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteStaff(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ MENU ITEMS OPERATIONS ============

export async function fetchMenuItems() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertMenuItem(item: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedItem = toSnakeCase(item);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('menu_items')
    .insert(snakeCasedItem)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateMenuItem(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('menu_items')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteMenuItem(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ ORDERS OPERATIONS ============

export async function fetchOrders(limit?: number) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertOrder(order: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedOrder = toSnakeCase(order);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('orders')
    .insert(snakeCasedOrder)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateOrder(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('orders')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ CUSTOMERS OPERATIONS ============

export async function fetchCustomers() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertCustomer(customer: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedCustomer = toSnakeCase(customer);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('customers')
    .insert(snakeCasedCustomer)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateCustomer(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('customers')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ EXPENSES OPERATIONS ============

export async function fetchExpenses() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertExpense(expense: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedExpense = toSnakeCase(expense);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('expenses')
    .insert(snakeCasedExpense)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateExpense(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('expenses')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteExpense(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ ATTENDANCE OPERATIONS ============

export async function fetchAttendance(startDate?: string, endDate?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('attendance')
    .select('*')
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertAttendance(attendance: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedAttendance = toSnakeCase(attendance);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('attendance')
    .insert(snakeCasedAttendance)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateAttendance(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('attendance')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}
