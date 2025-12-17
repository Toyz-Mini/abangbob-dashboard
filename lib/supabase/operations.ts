/**
 * Supabase Data Operations
 * Helper functions for CRUD operations with Supabase
 * 
 * TECHNICAL NOTE: @ts-nocheck is used because:
 * 1. The app uses camelCase for frontend data (e.g., menuItems, staffId)
 * 2. Supabase database uses snake_case (e.g., menu_items, staff_id)
 * 3. toSnakeCase/toCamelCase functions handle runtime conversion
 * 4. TypeScript cannot verify this transformation at compile time
 * 
 * Future improvement: Generate typed wrappers for each table operation
 * that use proper type assertions with Tables types defined below.
 * 
 * All @ts-ignore comments mark specific type conversion points.
 */
// @ts-nocheck

import { getSupabaseClient } from './client';
import type { Database } from './types';

// Table types from Supabase schema - can be used for future typed operations
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

  // Merge extended_data into each staff record
  return (data || []).map(staff => {
    const camelCased = toCamelCase(staff);
    if (camelCased.extendedData) {
      return {
        ...camelCased,
        ...camelCased.extendedData,
        extendedData: undefined,
      };
    }
    return camelCased;
  });
}

export async function insertStaff(staff: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // Separate base fields from extended fields
  const baseFields = {
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    role: staff.role,
    status: staff.status,
    pin: staff.pin,
    hourly_rate: staff.hourlyRate,
    ic_number: staff.icNumber,
    employment_type: staff.employmentType,
    join_date: staff.joinDate,
    profile_photo_url: staff.profilePhotoUrl,
    outlet_id: staff.outletId,
  };

  // Everything else goes to extended_data
  const extendedFields = {
    employeeNumber: staff.employeeNumber,
    dateOfBirth: staff.dateOfBirth,
    gender: staff.gender,
    maritalStatus: staff.maritalStatus,
    nationality: staff.nationality,
    religion: staff.religion,
    address: staff.address,
    position: staff.position,
    department: staff.department,
    contractEndDate: staff.contractEndDate,
    probationEndDate: staff.probationEndDate,
    reportingTo: staff.reportingTo,
    workLocation: staff.workLocation,
    salaryType: staff.salaryType,
    baseSalary: staff.baseSalary,
    dailyRate: staff.dailyRate,
    overtimeRate: staff.overtimeRate,
    allowances: staff.allowances,
    fixedDeductions: staff.fixedDeductions,
    paymentFrequency: staff.paymentFrequency,
    bankDetails: staff.bankDetails,
    statutoryContributions: staff.statutoryContributions,
    emergencyContact: staff.emergencyContact,
    leaveEntitlement: staff.leaveEntitlement,
    accessLevel: staff.accessLevel,
    permissions: staff.permissions,
    schedulePreferences: staff.schedulePreferences,
    documents: staff.documents,
    skills: staff.skills,
    certifications: staff.certifications,
    uniformSize: staff.uniformSize,
    shoeSize: staff.shoeSize,
    dietaryRestrictions: staff.dietaryRestrictions,
    medicalConditions: staff.medicalConditions,
    bloodType: staff.bloodType,
    notes: staff.notes,
    performanceBadges: staff.performanceBadges,
    terminationDate: staff.terminationDate,
    terminationReason: staff.terminationReason,
  };

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('staff')
    .insert({
      ...baseFields,
      extended_data: extendedFields,
    })
    .select()
    .single();

  if (error) throw error;

  // Merge extended_data back into returned object
  const result = toCamelCase(data);
  if (result.extendedData) {
    return {
      ...result,
      ...result.extendedData,
      extendedData: undefined, // Remove the extendedData property
    };
  }
  return result;
}

export async function updateStaff(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // Separate base fields from extended fields
  const baseFields: any = {};
  const extendedFields: any = {};

  const baseFieldsList = [
    'name', 'email', 'phone', 'role', 'status', 'pin', 'hourlyRate',
    'icNumber', 'employmentType', 'joinDate', 'profilePhotoUrl', 'outletId'
  ];

  // Sort updates into base and extended
  for (const [key, value] of Object.entries(updates)) {
    if (baseFieldsList.includes(key)) {
      baseFields[key] = value;
    } else {
      extendedFields[key] = value;
    }
  }

  // If there are extended fields, fetch current extended_data and merge
  let finalUpdate: any = toSnakeCase(baseFields);

  if (Object.keys(extendedFields).length > 0) {
    // Fetch current extended_data
    const { data: currentData } = await supabase
      .from('staff')
      .select('extended_data')
      .eq('id', id)
      .single();

    const currentExtendedData = currentData?.extended_data || {};

    // Merge with new extended fields
    finalUpdate.extended_data = {
      ...currentExtendedData,
      ...extendedFields,
    };
  }

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('staff')
    .update(finalUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Merge extended_data back into returned object
  const result = toCamelCase(data);
  if (result.extendedData) {
    return {
      ...result,
      ...result.extendedData,
      extendedData: undefined,
    };
  }
  return result;
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

// ============ MODIFIER GROUPS OPERATIONS ============

export async function fetchModifierGroups() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('modifier_groups')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching modifier groups:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertModifierGroup(group: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedGroup = toSnakeCase(group);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('modifier_groups')
    .insert(snakeCasedGroup)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateModifierGroup(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('modifier_groups')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteModifierGroup(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('modifier_groups')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ MODIFIER OPTIONS OPERATIONS ============

export async function fetchModifierOptions() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('modifier_options')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching modifier options:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertModifierOption(option: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedOption = toSnakeCase(option);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('modifier_options')
    .insert(snakeCasedOption)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateModifierOption(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('modifier_options')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteModifierOption(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('modifier_options')
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

// ============ SUPPLIERS OPERATIONS ============

export async function fetchSuppliers() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase not connected');
    return [];
  }

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertSupplier(supplier: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedSupplier = toSnakeCase(supplier);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('suppliers')
    .insert(snakeCasedSupplier)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateSupplier(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('suppliers')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteSupplier(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ PURCHASE ORDERS OPERATIONS ============

export async function fetchPurchaseOrders() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase not connected');
    return [];
  }

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching purchase orders:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertPurchaseOrder(po: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedPO = toSnakeCase(po);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('purchase_orders')
    .insert(snakeCasedPO)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updatePurchaseOrder(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('purchase_orders')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ INVENTORY LOGS OPERATIONS ============

export async function fetchInventoryLogs(stockItemId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('inventory_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (stockItemId) {
    query = query.eq('stock_item_id', stockItemId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching inventory logs:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertInventoryLog(log: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedLog = toSnakeCase(log);

  // @ts-ignore
  const { data, error } = await supabase
    .from('inventory_logs')
    .insert(snakeCasedLog)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ PRODUCTION LOGS OPERATIONS ============

export async function fetchProductionLogs(startDate?: string, endDate?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('production_logs')
    .select('*')
    // .order('date', { ascending: false }); // date column doesn't exist
    .order('created_at', { ascending: false });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching production logs:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertProductionLog(log: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedLog = toSnakeCase(log);

  // @ts-ignore
  const { data, error } = await supabase
    .from('production_logs')
    .insert(snakeCasedLog)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateProductionLog(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('production_logs')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ DELIVERY ORDERS OPERATIONS ============

export async function fetchDeliveryOrders(status?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('delivery_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching delivery orders:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertDeliveryOrder(order: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedOrder = toSnakeCase(order);

  // @ts-ignore
  const { data, error } = await supabase
    .from('delivery_orders')
    .insert(snakeCasedOrder)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateDeliveryOrder(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('delivery_orders')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ DAILY CASH FLOWS OPERATIONS ============

export async function fetchCashFlows(startDate?: string, endDate?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('cash_flows')
    .select('*')
    .order('created_at', { ascending: false });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cash flows:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertCashFlow(cashFlow: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedCashFlow = toSnakeCase(cashFlow);

  // @ts-ignore
  const { data, error } = await supabase
    .from('cash_flows')
    .insert(snakeCasedCashFlow)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateCashFlow(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('cash_flows')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function upsertCashFlowByDate(date: string, cashFlow: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedCashFlow = toSnakeCase({ ...cashFlow, date });

  // @ts-ignore
  const { data, error } = await supabase
    .from('cash_flows')
    .upsert(snakeCasedCashFlow, { onConflict: 'date,outlet_id' })
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ RECIPES OPERATIONS ============

export async function fetchRecipes() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertRecipe(recipe: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedRecipe = toSnakeCase(recipe);

  // @ts-ignore
  const { data, error } = await supabase
    .from('recipes')
    .insert(snakeCasedRecipe)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateRecipe(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('recipes')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteRecipe(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ VOID REFUND REQUESTS OPERATIONS ============

export async function fetchVoidRefundRequests(status?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('void_refund_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching void refund requests:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertVoidRefundRequest(request: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedRequest = toSnakeCase(request);

  // @ts-ignore
  const { data, error } = await supabase
    .from('void_refund_requests')
    .insert(snakeCasedRequest)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateVoidRefundRequest(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('void_refund_requests')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ CHECKLIST OPERATIONS ============

export async function fetchChecklistTemplates(type?: 'opening' | 'closing') {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('checklist_templates')
    .select('*')
    .eq('is_active', true)
    .order('order_num', { ascending: true });

  if (type) query = query.eq('type', type);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching checklist templates:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertChecklistTemplate(template: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedTemplate = toSnakeCase(template);

  // @ts-ignore
  const { data, error } = await supabase
    .from('checklist_templates')
    .insert(snakeCasedTemplate)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateChecklistTemplate(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('checklist_templates')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteChecklistTemplate(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('checklist_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchChecklistCompletions(startDate?: string, endDate?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('checklist_completions')
    .select('*')
    .order('created_at', { ascending: false });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching checklist completions:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertChecklistCompletion(completion: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedCompletion = toSnakeCase(completion);

  // @ts-ignore
  const { data, error } = await supabase
    .from('checklist_completions')
    .insert(snakeCasedCompletion)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateChecklistCompletion(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('checklist_completions')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ LEAVE MANAGEMENT OPERATIONS ============

export async function fetchLeaveBalances(staffId?: string, year?: number) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('leave_balances')
    .select('*');

  if (staffId) query = query.eq('staff_id', staffId);
  if (year) query = query.eq('year', year);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leave balances:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function upsertLeaveBalance(balance: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedBalance = toSnakeCase(balance);

  // @ts-ignore
  const { data, error } = await supabase
    .from('leave_balances')
    .upsert(snakeCasedBalance, { onConflict: 'staff_id,year' })
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function fetchLeaveRequests(staffId?: string, status?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leave requests:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertLeaveRequest(request: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedRequest = toSnakeCase(request);

  // @ts-ignore
  const { data, error } = await supabase
    .from('leave_requests')
    .insert(snakeCasedRequest)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateLeaveRequest(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('leave_requests')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ CLAIM REQUESTS OPERATIONS ============

export async function fetchClaimRequests(staffId?: string, status?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('claim_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching claim requests:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertClaimRequest(request: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedRequest = toSnakeCase(request);

  // @ts-ignore
  const { data, error } = await supabase
    .from('claim_requests')
    .insert(snakeCasedRequest)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateClaimRequest(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('claim_requests')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ STAFF REQUESTS OPERATIONS ============

export async function fetchStaffRequests(staffId?: string, status?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('staff_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching staff requests:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertStaffRequest(request: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedRequest = toSnakeCase(request);

  // @ts-ignore
  const { data, error } = await supabase
    .from('staff_requests')
    .insert(snakeCasedRequest)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateStaffRequest(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('staff_requests')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ ANNOUNCEMENTS OPERATIONS ============

export async function fetchAnnouncements(isActive?: boolean) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (isActive !== undefined) query = query.eq('is_active', isActive);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertAnnouncement(announcement: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedAnnouncement = toSnakeCase(announcement);

  // @ts-ignore
  const { data, error } = await supabase
    .from('announcements')
    .insert(snakeCasedAnnouncement)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateAnnouncement(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('announcements')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteAnnouncement(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ OIL TRACKER OPERATIONS ============

export async function fetchOilTrackers() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('oil_trackers')
    .select('*')
    // .order('name', { ascending: true }); // name column doesn't exist, likely fryer_name or just skip order
    .order('fryer_id', { ascending: true });

  if (error) {
    console.error('Error fetching oil trackers:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertOilTracker(tracker: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedTracker = toSnakeCase(tracker);

  // @ts-ignore
  const { data, error } = await supabase
    .from('oil_trackers')
    .insert(snakeCasedTracker)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateOilTracker(fryerId: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('oil_trackers')
    .update(toSnakeCase(updates))
    .eq('fryer_id', fryerId)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteOilTracker(fryerId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('oil_trackers')
    .delete()
    .eq('fryer_id', fryerId);

  if (error) throw error;
}

export async function fetchOilChangeRequests(status?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('oil_change_requests')
    .select('*')
    .order('requested_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching oil change requests:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertOilChangeRequest(request: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedRequest = toSnakeCase(request);

  // @ts-ignore
  const { data, error } = await supabase
    .from('oil_change_requests')
    .insert(snakeCasedRequest)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateOilChangeRequest(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('oil_change_requests')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function fetchOilActionHistory(fryerId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('oil_action_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (fryerId) query = query.eq('fryer_id', fryerId);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching oil action history:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertOilActionHistory(history: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedHistory = toSnakeCase(history);

  // @ts-ignore
  const { data, error } = await supabase
    .from('oil_action_history')
    .insert(snakeCasedHistory)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ KPI OPERATIONS ============

export async function fetchStaffKPI(staffId?: string, period?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('staff_kpi')
    .select('*')
    .order('overall_score', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);
  if (period) query = query.eq('period', period);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching staff KPI:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function upsertStaffKPI(kpi: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedKPI = toSnakeCase(kpi);

  // @ts-ignore
  const { data, error } = await supabase
    .from('staff_kpi')
    .upsert(snakeCasedKPI, { onConflict: 'staff_id,period' })
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function fetchTrainingRecords(staffId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('training_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching training records:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertTrainingRecord(record: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedRecord = toSnakeCase(record);

  // @ts-ignore
  const { data, error } = await supabase
    .from('training_records')
    .insert(snakeCasedRecord)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateTrainingRecord(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('training_records')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function fetchOTRecords(staffId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('ot_records')
    .select('*')
    .order('date', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching OT records:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertOTRecord(record: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedRecord = toSnakeCase(record);

  // @ts-ignore
  const { data, error } = await supabase
    .from('ot_records')
    .insert(snakeCasedRecord)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateOTRecord(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('ot_records')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function fetchCustomerReviews(staffId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('customer_reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching customer reviews:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertCustomerReview(review: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedReview = toSnakeCase(review);

  // @ts-ignore
  const { data, error } = await supabase
    .from('customer_reviews')
    .insert(snakeCasedReview)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function fetchLeaveRecords(staffId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('leave_records')
    .select('*')
    .order('start_date', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leave records:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertLeaveRecord(record: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedRecord = toSnakeCase(record);

  // @ts-ignore
  const { data, error } = await supabase
    .from('leave_records')
    .insert(snakeCasedRecord)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateLeaveRecord(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('leave_records')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ SCHEDULING OPERATIONS ============

export async function fetchShifts() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('is_active', true)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching shifts:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertShift(shift: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedShift = toSnakeCase(shift);

  // @ts-ignore
  const { data, error } = await supabase
    .from('shifts')
    .insert(snakeCasedShift)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateShift(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('shifts')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteShift(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchScheduleEntries(startDate?: string, endDate?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('schedules')
    .select('*')
    .order('date', { ascending: true });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching schedule entries:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertScheduleEntry(entry: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedEntry = toSnakeCase(entry);

  // @ts-ignore
  const { data, error } = await supabase
    .from('schedules')
    .insert(snakeCasedEntry)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateScheduleEntry(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('schedules')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteScheduleEntry(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ PROMOTIONS OPERATIONS ============

export async function fetchPromotions(status?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertPromotion(promotion: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedPromotion = toSnakeCase(promotion);

  // @ts-ignore
  const { data, error } = await supabase
    .from('promotions')
    .insert(snakeCasedPromotion)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updatePromotion(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('promotions')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deletePromotion(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ NOTIFICATIONS OPERATIONS ============

export async function fetchNotifications(isRead?: boolean, targetUserId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (isRead !== undefined) query = query.eq('is_read', isRead);
  if (targetUserId) query = query.or(`target_user_id.eq.${targetUserId},target_user_id.is.null`);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertNotification(notification: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedNotification = toSnakeCase(notification);

  // @ts-ignore
  const { data, error } = await supabase
    .from('notifications')
    .insert(snakeCasedNotification)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateNotification(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('notifications')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteNotification(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function markNotificationAsRead(id: string) {
  return updateNotification(id, { isRead: true });
}

export async function markAllNotificationsAsRead(targetUserId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false);

  if (targetUserId) {
    query = query.or(`target_user_id.eq.${targetUserId},target_user_id.is.null`);
  }

  const { error } = await query;

  if (error) throw error;
}


