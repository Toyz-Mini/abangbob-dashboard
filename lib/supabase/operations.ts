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

export async function markPurchaseOrderAsPaid(id: string, amount?: number) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const updates: any = {
    payment_status: 'paid',
    paid_at: new Date().toISOString(),
  };

  if (amount !== undefined) {
    updates.paid_amount = amount;
  }

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('purchase_orders')
    .update(updates)
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

export async function upsertCashFlow(cashFlow: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCased = toSnakeCase(cashFlow);

  // @ts-ignore
  const { data, error } = await supabase
    .from('cash_flows')
    .upsert(snakeCased, { onConflict: 'date' })
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

  // Remove fields that are not in the database table
  const { menuItemName, isProcessing, isActive, ...rest } = recipe;

  // Map menuItemName to 'name' as required by the live database schema (which uses 'name' column)
  const dbRecipe = {
    ...rest,
    name: menuItemName // SATISFY NOT NULL CONSTRAINT
  };

  const snakeCasedRecipe = toSnakeCase(dbRecipe);

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
    .order('created_at', { ascending: true });

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
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    if (status === 'active') query = query.eq('is_active', true);
    if (status === 'inactive') query = query.eq('is_active', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching promotions (promo_codes):', error);
    return [];
  }

  // Map promo_codes logic back to Promotion interface
  return (data || []).map((pc: any) => ({
    id: pc.id,
    name: pc.description || pc.code, // Map description to Name
    description: pc.description,
    type: (pc.discount_type === 'fixed' ? 'fixed_amount' : 'percentage') as any,
    value: pc.discount_value,
    minPurchase: pc.min_spend,
    maxDiscount: pc.max_discount_amount,
    promoCode: pc.code,
    applicableItems: [], // Not supported in simple promo_codes
    startDate: pc.start_date,
    endDate: pc.end_date,
    daysOfWeek: [], // Not supported
    startTime: undefined, // Not supported
    endTime: undefined, // Not supported
    usageLimit: pc.usage_limit,
    usageCount: pc.usage_count,
    status: (pc.is_active ? 'active' : 'inactive') as any,
    createdAt: pc.created_at,
  }));
}

export async function insertPromotion(promotion: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // Map Promotion to promo_codes columns
  const dbData = {
    id: promotion.id,
    code: promotion.promoCode || promotion.name.replace(/\s+/g, '').toUpperCase().slice(0, 10),
    description: promotion.name + (promotion.description ? ` - ${promotion.description}` : ''),
    discount_type: promotion.type === 'fixed_amount' ? 'fixed' : 'percentage',
    discount_value: promotion.value,
    min_spend: promotion.minPurchase || 0,
    max_discount_amount: promotion.maxDiscount || null,
    start_date: promotion.startDate,
    end_date: promotion.endDate,
    usage_limit: promotion.usageLimit || null,
    usage_count: 0,
    is_active: promotion.status === 'active',
  };

  // @ts-ignore
  const { data, error } = await supabase
    .from('promo_codes')
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;

  // Return mapped back
  const pc = data;
  return {
    id: pc.id,
    name: promotion.name,
    description: promotion.description,
    type: promotion.type,
    value: promotion.value,
    minPurchase: promotion.minPurchase,
    maxDiscount: promotion.maxDiscount,
    promoCode: pc.code,
    applicableItems: promotion.applicableItems,
    startDate: pc.start_date,
    endDate: pc.end_date,
    daysOfWeek: promotion.daysOfWeek,
    startTime: promotion.startTime,
    endTime: promotion.endTime,
    usageLimit: pc.usage_limit,
    usageCount: pc.usage_count,
    status: pc.is_active ? 'active' : 'inactive',
    createdAt: pc.created_at,
  };
}

export async function updatePromotion(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // Map updates
  const dbUpdates: any = {};
  if (updates.promoCode !== undefined) dbUpdates.code = updates.promoCode;
  if (updates.name !== undefined) dbUpdates.description = updates.name; // Simple mapping
  if (updates.type !== undefined) dbUpdates.discount_type = updates.type === 'fixed_amount' ? 'fixed' : 'percentage';
  if (updates.value !== undefined) dbUpdates.discount_value = updates.value;
  if (updates.minPurchase !== undefined) dbUpdates.min_spend = updates.minPurchase;
  if (updates.maxDiscount !== undefined) dbUpdates.max_discount_amount = updates.maxDiscount;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
  if (updates.usageLimit !== undefined) dbUpdates.usage_limit = updates.usageLimit;
  if (updates.status !== undefined) dbUpdates.is_active = updates.status === 'active';

  // @ts-ignore
  const { data, error } = await supabase
    .from('promo_codes')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  const pc = data;

  // Return mapped back (merging with updates for full object effect if needed, but here sufficient to identify)
  return {
    ...updates, // Optimistic return of what we sent + DB confirmed fields
    id: pc.id,
    promoCode: pc.code,
    status: pc.is_active ? 'active' : 'inactive',
    // We don't fetch full fields to reconstruction unless necessary, but store handles it.
  };
}

export async function deletePromotion(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('promo_codes')
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

// ============ CASH REGISTER OPERATIONS ============

export async function fetchCashRegisters() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('cash_registers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cash registers:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertCashRegister(register: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCased = toSnakeCase(register);

  // @ts-ignore
  const { data, error } = await supabase
    .from('cash_registers')
    .insert(snakeCased)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateCashRegister(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('cash_registers')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}


export async function insertLoyaltyTransaction(transaction: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedTransaction = toSnakeCase(transaction);

  // @ts-ignore
  const { data, error } = await supabase
    .from('loyalty_transactions')
    .insert(snakeCasedTransaction)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function insertPromoUsage(usage: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedUsage = toSnakeCase(usage);

  // @ts-ignore
  const { data, error } = await supabase
    .from('promo_usages')
    .insert(snakeCasedUsage)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function incrementPromoUsageCount(promoCodeId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // get current count first
  const { data: promo, error: fetchError } = await supabase
    .from('promo_codes')
    .select('usage_count')
    .eq('id', promoCodeId)
    .single();

  if (fetchError || !promo) return;

  const newCount = (promo.usage_count || 0) + 1;

  await supabase
    .from('promo_codes')
    .update({ usage_count: newCount })
    .eq('id', promoCodeId);
}

// ============ PERFORMANCE REVIEWS OPERATIONS ============

export async function insertPerformanceReview(review: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedReview = toSnakeCase(review);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('performance_reviews')
    .insert(snakeCasedReview)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ OT CLAIMS OPERATIONS ============

export async function insertOTClaim(claim: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedClaim = toSnakeCase(claim);

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('ot_claims')
    .insert(snakeCasedClaim)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateOTClaim(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('ot_claims')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ DISCIPLINARY ACTIONS OPERATIONS ============

export async function insertDisciplinaryAction(action: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedAction = toSnakeCase(action);

  // @ts-ignore
  const { data, error } = await supabase
    .from('disciplinary_actions')
    .insert(snakeCasedAction)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateDisciplinaryAction(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('disciplinary_actions')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteDisciplinaryAction(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('disciplinary_actions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ STAFF TRAINING OPERATIONS ============

export async function insertStaffTraining(training: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedTraining = toSnakeCase(training);

  // @ts-ignore
  const { data, error } = await supabase
    .from('staff_training')
    .insert(snakeCasedTraining)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateStaffTraining(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('staff_training')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteStaffTraining(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('staff_training')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ STAFF DOCUMENTS OPERATIONS ============

export async function insertStaffDocument(doc: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedDoc = toSnakeCase(doc);

  // @ts-ignore
  const { data, error } = await supabase
    .from('staff_documents')
    .insert(snakeCasedDoc)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateStaffDocument(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('staff_documents')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteStaffDocument(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('staff_documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
