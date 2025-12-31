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
    // New Columns
    date_of_birth: staff.dateOfBirth,
    gender: staff.gender,
    marital_status: staff.maritalStatus,
    address: staff.address,
    nationality: staff.nationality,
    religion: staff.religion,
    position: staff.position,
    department: staff.department,
    bank_details: staff.bankDetails,
    emergency_contact: staff.emergencyContact,
  };

  // Everything else goes to extended_data
  const extendedFields = {
    employeeNumber: staff.employeeNumber,
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
    statutoryContributions: staff.statutoryContributions,
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
    'icNumber', 'employmentType', 'joinDate', 'profilePhotoUrl', 'outletId',
    'dateOfBirth', 'gender', 'maritalStatus', 'address', 'nationality', 'religion',
    'position', 'department', 'bankDetails', 'emergencyContact'
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
  console.log('[insertOrder] Attempting to insert order:', { orderId: order.id, orderNumber: order.orderNumber });

  // @ts-ignore - Type conversion handled at runtime
  const { data, error } = await supabase
    .from('orders')
    .insert(snakeCasedOrder)
    .select()
    .single();

  if (error) {
    console.log('[insertOrder] Direct insert failed:', error.code, error.message);

    // Fallback to secure RPC for:
    // 42501: Permission denied (RLS)
    // PGRST116: JSON/Singular error?
    // 23503: Foreign Key Violation (e.g. invalid customer_id)
    // 23505: Unique Violation (e.g. order_number collision - RPC might handle or we retry?)
    // 42P01: Undefined table (unlikely)
    if (error.code === '42501' || error.code === 'PGRST116' || error.code === '23503' || error.code === '23505' ||
      error.message?.includes('permis') || error.message?.includes('0 rows') || error.message?.includes('foreign key') || error.message?.includes('violates unique constraint')) {

      console.log('[insertOrder] Trying public RPC create_public_order...');

      // Note: create_public_order returns SETOF, so don't use .single()
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('create_public_order', { data: snakeCasedOrder });

      console.log('[insertOrder] RPC response:', { rpcData, rpcError });

      if (rpcError) {
        console.error('[insertOrder] RPC failed:', rpcError);
        throw rpcError;
      }

      // Handle setof return - data is an array
      const resultOrder = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : rpcData;

      if (!resultOrder) {
        console.error('[insertOrder] RPC success but returned no data');
        throw new Error('Order creation failed - no data returned');
      }

      console.log('[insertOrder] RPC success, returning order:', resultOrder?.id);
      return toCamelCase(resultOrder);
    }
    throw error;
  }
  console.log('[insertOrder] Direct insert success:', data?.id);
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

  if (error) {
    // If permission denied (likely anon trying to select), fallback to secure RPC
    if (error.code === '42501' || error.code === 'PGRST116' || error.code === '23505' || error.message?.includes('permis') || error.message?.includes('0 rows') || error.message?.includes('duplicate')) {
      console.log('Permission denied for standard insert, trying public RPC...');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('create_public_customer', { data: snakeCasedCustomer })
        .single();

      if (rpcError) throw rpcError;
      return toCamelCase(rpcData);
    }
    throw error;
  }
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

// ============ PUBLIC HOLIDAYS OPERATIONS ============

export async function fetchPublicHolidays(year?: number) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('public_holidays')
    .select('*')
    .order('date', { ascending: true });

  if (year) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    query = query.gte('date', startDate).lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching public holidays:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertPublicHoliday(holiday: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedHoliday = toSnakeCase(holiday);

  // @ts-ignore
  const { data, error } = await supabase
    .from('public_holidays')
    .insert(snakeCasedHoliday)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updatePublicHoliday(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('public_holidays')
    .update({ ...toSnakeCase(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deletePublicHoliday(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('public_holidays')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ HOLIDAY POLICIES OPERATIONS ============

export async function fetchHolidayPolicies(year?: number) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('holiday_policies')
    .select(`
      *,
      public_holidays (name)
    `)
    .order('created_at', { ascending: false });

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching holiday policies:', error);
    return [];
  }

  // Transform to include holidayName from joined data
  return (data || []).map((item: any) => ({
    ...toCamelCase(item),
    holidayName: item.public_holidays?.name
  }));
}

export async function insertHolidayPolicy(policy: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedPolicy = toSnakeCase(policy);

  // @ts-ignore
  const { data, error } = await supabase
    .from('holiday_policies')
    .insert(snakeCasedPolicy)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateHolidayPolicy(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('holiday_policies')
    .update({ ...toSnakeCase(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteHolidayPolicy(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('holiday_policies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ HOLIDAY WORK LOGS OPERATIONS ============

export async function fetchHolidayWorkLogs(options?: { staffId?: string; holidayId?: string; processed?: boolean }) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('holiday_work_logs')
    .select(`
      *,
      public_holidays (name)
    `)
    .order('work_date', { ascending: false });

  if (options?.staffId) {
    query = query.eq('staff_id', options.staffId);
  }
  if (options?.holidayId) {
    query = query.eq('holiday_id', options.holidayId);
  }
  if (options?.processed !== undefined) {
    query = query.eq('compensation_processed', options.processed);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching holiday work logs:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    ...toCamelCase(item),
    holidayName: item.public_holidays?.name
  }));
}

export async function insertHolidayWorkLog(log: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedLog = toSnakeCase(log);

  // @ts-ignore
  const { data, error } = await supabase
    .from('holiday_work_logs')
    .insert(snakeCasedLog)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateHolidayWorkLog(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('holiday_work_logs')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteHolidayWorkLog(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('holiday_work_logs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ REPLACEMENT LEAVES OPERATIONS ============

export async function fetchReplacementLeaves(options?: { staffId?: string; status?: 'available' | 'used' | 'expired' }) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('replacement_leaves')
    .select('*')
    .order('earned_date', { ascending: false });

  if (options?.staffId) {
    query = query.eq('staff_id', options.staffId);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching replacement leaves:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function getReplacementLeaveBalance(staffId: string): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  const { data, error } = await supabase
    .from('replacement_leaves')
    .select('days')
    .eq('staff_id', staffId)
    .eq('status', 'available')
    .gte('expires_at', new Date().toISOString().split('T')[0]);

  if (error) {
    console.error('Error fetching replacement leave balance:', error);
    return 0;
  }

  return (data || []).reduce((sum: number, item: any) => sum + (item.days || 0), 0);
}

export async function getReplacementLeaveStats(staffId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return { available: 0, used: 0, expired: 0, pending: 0 };

  const { data, error } = await supabase
    .from('replacement_leaves')
    .select('days, status')
    .eq('staff_id', staffId);

  if (error) {
    console.error('Error fetching replacement leave stats:', error);
    return { available: 0, used: 0, expired: 0, pending: 0 };
  }

  const stats = (data || []).reduce((acc: any, item: any) => {
    acc[item.status] = (acc[item.status] || 0) + (item.days || 0);
    return acc;
  }, { available: 0, used: 0, expired: 0, pending: 0 }); // 'pending' status? maybe check checks

  return stats;
}

export async function deductReplacementLeaveBalance(staffId: string, daysToDeduct: number, leaveRequestId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  // 1. Fetch available leaves, sorted by expiration (earlier expiry first)
  const { data: availableLeaves, error } = await supabase
    .from('replacement_leaves')
    .select('*')
    .eq('staff_id', staffId)
    .eq('status', 'available')
    .gte('expires_at', new Date().toISOString().split('T')[0])
    .order('expires_at', { ascending: true });

  if (error || !availableLeaves) {
    console.error('Error fetching replacement leaves for deduction:', error);
    return false;
  }

  let remaining = daysToDeduct;
  const updates = [];

  for (const leave of availableLeaves) {
    if (remaining <= 0) break;

    const days = leave.days || 0;

    if (days <= remaining) {
      // Consume entire row
      updates.push({
        id: leave.id,
        status: 'used',
        used_leave_request_id: leaveRequestId,
        days: days // Keep days same, just mark used
      });
      remaining -= days;
    } else {
      // Partial consumption? 
      // Option A: Split the row. (Ideally insert new row for remaining? Or modify this row to 'used' and create new 'available' row for balance?)
      // Option B: Allow partial usage on the row? If schema allows?
      // "days" is the amount.
      // If I mark "used", it assumes ALL days are used.
      // Better to split:
      // 1. Update this row to Used (with amount = used amount?)
      //    No, schema probably has ID.
      //    I should UPDATE this row's days to 'days - remaining' (Available)? NO.
      //    I should UPDATE this row to be 'Used' with 'days = remaining' (amount consumed).
      //    And INSERT a NEW row for the balance?
      //    Or: Update this row's `days` to (original - used) -> remains Available.
      //    And INSERT a NEW row with `status='used'` and `days=used`.
      //    But tracking origin?
      // Let's assume simplest: Update `days` of existing row?
      // If I reduce `days`, I lose track of total earned history if I overwrite it.
      // But `replacement_leaves` seems to track "Credits".
      // If I split:
      // OLD ROW: changes to `days = days - remaining` (Available).
      // NEW ROW: `days = remaining`, `status = used`, `used_leave_request_id`.

      const usedAmount = remaining;
      const balanceAmount = days - remaining;

      // 1. Create new row for used portion
      await supabase.from('replacement_leaves').insert({
        staff_id: staffId,
        days: usedAmount,
        reason: leave.reason + ' (Used)',
        status: 'used',
        earned_date: leave.earned_date,
        expires_at: leave.expires_at,
        used_leave_request_id: leaveRequestId
      });

      // 2. Update current row with balance
      updates.push({
        id: leave.id,
        days: balanceAmount,
        status: 'available' // Still available
      });

      remaining = 0;
    }
  }

  // Execute updates
  for (const update of updates) {
    // If status is used
    if (update.status === 'used') {
      await supabase.from('replacement_leaves').update({ status: 'used', used_leave_request_id: update.used_leave_request_id }).eq('id', update.id);
    } else {
      // Update balance
      await supabase.from('replacement_leaves').update({ days: update.days }).eq('id', update.id);
    }
  }

  return true;
}

export async function insertReplacementLeave(leave: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedLeave = toSnakeCase(leave);

  // @ts-ignore
  const { data, error } = await supabase
    .from('replacement_leaves')
    .insert(snakeCasedLeave)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateReplacementLeave(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('replacement_leaves')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteReplacementLeave(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('replacement_leaves')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Helper: Check if a date is a public holiday
export async function isPublicHoliday(date: string): Promise<{ isHoliday: boolean; holiday?: any }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { isHoliday: false };

  const { data, error } = await supabase
    .from('public_holidays')
    .select('*')
    .eq('date', date)
    .maybeSingle();

  if (error || !data) {
    return { isHoliday: false };
  }

  return { isHoliday: true, holiday: toCamelCase(data) };
}

// Helper: Get holiday policy for a specific holiday and year
export async function getHolidayPolicyForDate(date: string): Promise<any | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const year = new Date(date).getFullYear();

  const { data, error } = await supabase
    .from('holiday_policies')
    .select(`
      *,
      public_holidays!inner (id, name, date)
    `)
    .eq('public_holidays.date', date)
    .eq('year', year)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    ...toCamelCase(data),
    holidayName: data.public_holidays?.name
  };
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

  return (data || []).map(hydrateLeaveBalance);
}

export async function upsertLeaveBalance(balance: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');


  console.log('[LeaveBalance] Input:', balance);
  // Flatten the nested structure for the DB
  const flatBalance: any = {
    // id: balance.id, // Remove ID to avoid PK conflict on upsert
    staff_id: balance.staffId,
    year: balance.year,

    // Annual
    annual_entitled: balance.annual?.entitled || 0,
    annual_taken: balance.annual?.taken || 0,
    annual_pending: balance.annual?.pending || 0,
    annual_balance: balance.annual?.balance || 0,

    // Medical
    medical_entitled: balance.medical?.entitled || 0,
    medical_taken: balance.medical?.taken || 0,
    medical_pending: balance.medical?.pending || 0,
    medical_balance: balance.medical?.balance || 0,

    // Emergency
    emergency_entitled: balance.emergency?.entitled || 0,
    emergency_taken: balance.emergency?.taken || 0,
    emergency_pending: balance.emergency?.pending || 0,
    emergency_balance: balance.emergency?.balance || 0,

    // Maternity
    maternity_entitled: balance.maternity?.entitled || 0,
    maternity_taken: balance.maternity?.taken || 0,
    maternity_pending: balance.maternity?.pending || 0,
    maternity_balance: balance.maternity?.balance || 0,

    // Paternity
    paternity_entitled: balance.paternity?.entitled || 0,
    paternity_taken: balance.paternity?.taken || 0,
    paternity_pending: balance.paternity?.pending || 0,
    paternity_balance: balance.paternity?.balance || 0,

    // Compassionate
    compassionate_entitled: balance.compassionate?.entitled || 0,
    compassionate_taken: balance.compassionate?.taken || 0,
    compassionate_pending: balance.compassionate?.pending || 0,
    compassionate_balance: balance.compassionate?.balance || 0,

    // Replacement
    replacement_entitled: balance.replacement?.entitled || 0,
    replacement_taken: balance.replacement?.taken || 0,
    replacement_pending: balance.replacement?.pending || 0,
    replacement_balance: balance.replacement?.balance || 0,

    // Unpaid (Only taken is stored in DB)
    unpaid_taken: balance.unpaid?.taken || 0,

    updated_at: new Date().toISOString()
  };

  console.log('[LeaveBalance] Flattened:', flatBalance);

  // @ts-ignore
  const { data, error } = await supabase
    .from('leave_balances')
    .upsert(flatBalance, { onConflict: 'staff_id,year' })
    .select()
    .single();

  if (error) {
    console.error('[LeaveBalance] Upsert Error:', error);
    throw error;
  }
  console.log('[LeaveBalance] Upsert Success:', data);
  return hydrateLeaveBalance(data);
}

// Helper: Hydrate flat DB row to nested LeaveBalance object
function hydrateLeaveBalance(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    staffId: String(row.staff_id),
    year: Number(row.year),
    annual: {
      entitled: row.annual_entitled || 0,
      taken: row.annual_taken || 0,
      pending: row.annual_pending || 0,
      balance: row.annual_balance || 0
    },
    medical: {
      entitled: row.medical_entitled || 0,
      taken: row.medical_taken || 0,
      pending: row.medical_pending || 0,
      balance: row.medical_balance || 0
    },
    emergency: {
      entitled: row.emergency_entitled || 0,
      taken: row.emergency_taken || 0,
      pending: row.emergency_pending || 0,
      balance: row.emergency_balance || 0
    },
    maternity: {
      entitled: row.maternity_entitled || 0,
      taken: row.maternity_taken || 0,
      pending: row.maternity_pending || 0,
      balance: row.maternity_balance || 0
    },
    paternity: {
      entitled: row.paternity_entitled || 0,
      taken: row.paternity_taken || 0,
      pending: row.paternity_pending || 0,
      balance: row.paternity_balance || 0
    },
    compassionate: {
      entitled: row.compassionate_entitled || 0,
      taken: row.compassionate_taken || 0,
      pending: row.compassionate_pending || 0,
      balance: row.compassionate_balance || 0
    },
    replacement: {
      entitled: row.replacement_entitled || 0,
      taken: row.replacement_taken || 0,
      pending: row.replacement_pending || 0,
      balance: row.replacement_balance || 0
    },
    unpaid: {
      entitled: 0,
      taken: row.unpaid_taken || 0,
      pending: 0,
      balance: 0
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
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

  // Custom mapping: Database uses different field names than frontend
  // Database: leave_type, days, attachment_url, approved_by_name
  // Frontend: type, duration, attachments, approverName
  return (data || []).map((row: any) => ({
    id: row.id,
    staffId: row.staff_id,
    staffName: row.staff_name,
    type: row.leave_type || row.type, // Support both column names
    startDate: row.start_date,
    endDate: row.end_date,
    duration: row.days || row.duration || 1, // Support both column names
    isHalfDay: row.is_half_day || false,
    halfDayType: row.half_day_type,
    reason: row.reason,
    attachments: row.attachment_url ? [row.attachment_url] : (row.attachments || []),
    status: row.status,
    approvedBy: row.approved_by,
    approverName: row.approved_by_name || row.approver_name,
    approvedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function insertLeaveRequest(request: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // Custom mapping: Frontend uses different field names than database
  // Frontend: type, duration, attachments, approverName, isHalfDay, halfDayType
  // Database: leave_type, days, attachment_url, approved_by_name, is_half_day, half_day_type
  const dbRecord: any = {
    id: request.id,
    staff_id: request.staffId,
    staff_name: request.staffName,
    leave_type: request.type, // Map 'type' to 'leave_type'
    start_date: request.startDate,
    end_date: request.endDate,
    days: request.duration, // Map 'duration' to 'days'
    reason: request.reason || '',
    attachment_url: request.attachments?.[0] || null, // Map 'attachments' array to single 'attachment_url'
    status: request.status || 'pending',
    approved_by: request.approvedBy || null,
    approver_name: request.approverName || null,
    approved_at: request.approvedAt || null,
    rejection_reason: request.rejectionReason || null,
    created_at: request.createdAt,
  };

  console.log('[insertLeaveRequest] Sending to Supabase:', dbRecord);

  // @ts-ignore
  const { data, error } = await supabase
    .from('leave_requests')
    .insert(dbRecord)
    .select()
    .single();

  if (error) {
    console.error('[insertLeaveRequest] Supabase error:', error);
    console.error('[insertLeaveRequest] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  // Map back to frontend format
  const frontendData = {
    id: data.id,
    staffId: data.staff_id,
    staffName: data.staff_name,
    type: data.leave_type,
    startDate: data.start_date,
    endDate: data.end_date,
    duration: data.days,
    reason: data.reason,
    attachments: data.attachment_url ? [data.attachment_url] : [],
    status: data.status,
    approvedBy: data.approved_by,
    approverName: data.approved_by_name,
    approvedAt: data.approved_at,
    rejectionReason: data.rejection_reason,
    createdAt: data.created_at,
  };

  console.log('[insertLeaveRequest] Success, data:', frontendData);
  return frontendData;
}

export async function updateLeaveRequest(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // Custom mapping for approval fields
  const dbUpdates: any = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.approvedBy !== undefined) dbUpdates.approved_by = updates.approvedBy;
  if (updates.approverName !== undefined) dbUpdates.approver_name = updates.approverName;
  if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt;
  if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason;

  console.log('[updateLeaveRequest] Updating id:', id, 'with:', dbUpdates);

  // @ts-ignore
  const { data, error } = await supabase
    .from('leave_requests')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateLeaveRequest] Error:', error);
    throw error;
  }

  console.log('[updateLeaveRequest] Success:', data);
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

  // if (staffId) {
  //   query = query.or(`staff_id.eq.${staffId},target_staff_id.eq.${staffId}`);
  // }
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

export async function deleteStaffRequest(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('staff_requests')
    .delete()
    .eq('id', id);

  if (error) throw error;
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
    .from('schedule_entries')
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
    .from('schedule_entries')
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
    .from('schedule_entries')
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
    .from('schedule_entries')
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

// ============ CASH PAYOUTS (MONEY OUT) OPERATIONS ============

export async function fetchCashPayouts(date?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('cash_payouts')
    .select('*')
    .order('created_at', { ascending: false });

  if (date) {
    // Filter by date (YYYY-MM-DD)
    query = query.gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cash payouts:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertCashPayout(payout: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCasedPayout = toSnakeCase(payout);

  // @ts-ignore
  const { data, error } = await supabase
    .from('cash_payouts')
    .insert(snakeCasedPayout)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function getTodayCashPayoutsTotal() {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('cash_payouts')
    .select('amount')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  if (error) {
    console.error('Error fetching today cash payouts total:', error);
    return 0;
  }

  return (data || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
}

// ============ SHIFT DEFINITIONS OPERATIONS ============

export async function fetchShiftDefinitions() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('shift_definitions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching shift definitions:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertShiftDefinition(shift: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCased = toSnakeCase(shift);

  // @ts-ignore
  const { data, error } = await supabase
    .from('shift_definitions')
    .insert(snakeCased)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateShiftDefinition(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('shift_definitions')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteShiftDefinition(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('shift_definitions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ STAFF SHIFTS OPERATIONS ============

export async function fetchStaffShifts(staffId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('staff_shifts')
    .select('*, shift:shift_id(*)');

  if (staffId) query = query.eq('staff_id', staffId);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching staff shifts:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function upsertStaffShift(staffShift: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCased = toSnakeCase(staffShift);

  // @ts-ignore
  const { data, error } = await supabase
    .from('staff_shifts')
    .upsert(snakeCased, { onConflict: 'staff_id,day_of_week' })
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteStaffShift(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('staff_shifts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ HOLIDAYS OPERATIONS ============

export async function fetchHolidays(year?: number) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('holidays')
    .select('*')
    .order('date', { ascending: true });

  if (year) {
    query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching holidays:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertHoliday(holiday: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCased = toSnakeCase(holiday);

  // @ts-ignore
  const { data, error } = await supabase
    .from('holidays')
    .insert(snakeCased)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteHoliday(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('holidays')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function isHoliday(date: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('holidays')
    .select('id')
    .eq('date', date)
    .limit(1);

  if (error) {
    console.error('Error checking holiday:', error);
    return false;
  }

  return (data || []).length > 0;
}

// ============ SYSTEM SETTINGS OPERATIONS ============

export async function fetchSystemSettings(category?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('system_settings')
    .select('*')
    .order('key', { ascending: true });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching system settings:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function getSystemSetting(key: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }

  return data?.value || null;
}

export async function updateSystemSetting(key: string, value: string, updatedBy?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('system_settings')
    .update({ value, updated_at: new Date().toISOString(), updated_by: updatedBy })
    .eq('key', key)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ LATE REASON CATEGORIES OPERATIONS ============

export async function fetchLateReasonCategories() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('late_reason_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching late reason categories:', error);
    return [];
  }

  return toCamelCase(data || []);
}

// ============ EQUIPMENT & MAINTENANCE OPERATIONS ============

export async function fetchEquipment() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching equipment:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertEquipment(item: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCased = toSnakeCase(item);

  // @ts-ignore
  const { data, error } = await supabase
    .from('equipment')
    .insert(snakeCased)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateEquipment(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('equipment')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteEquipment(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchMaintenanceSchedules() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('maintenance_schedule')
    .select('*')
    .order('next_date', { ascending: true });

  if (error) {
    console.error('Error fetching maintenance schedules:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertMaintenanceSchedule(schedule: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCased = toSnakeCase(schedule);

  // @ts-ignore
  const { data, error } = await supabase
    .from('maintenance_schedule')
    .insert(snakeCased)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateMaintenanceSchedule(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('maintenance_schedule')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function fetchMaintenanceLogs() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('maintenance_logs')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance logs:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertMaintenanceLog(log: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCased = toSnakeCase(log);

  // @ts-ignore
  const { data, error } = await supabase
    .from('maintenance_logs')
    .insert(snakeCased)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateMaintenanceLog(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('maintenance_logs')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ WASTE LOGS OPERATIONS ============

export async function fetchWasteLogs() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('waste_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching waste logs:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function insertWasteLog(log: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  const snakeCased = toSnakeCase(log);

  // @ts-ignore
  const { data, error } = await supabase
    .from('waste_logs')
    .insert(snakeCased)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// ============ MORE HR OPERATIONS ============

export async function fetchOTClaims() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('ot_claims')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching OT claims:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function fetchSalaryAdvances() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('staff_advances')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching salary advances:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function updateSalaryAdvance(id: string, updates: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('staff_advances')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function insertSalaryAdvance(advance: any) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not connected');

  // @ts-ignore
  const { data, error } = await supabase
    .from('staff_advances')
    .insert(toSnakeCase(advance))
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function fetchDisciplinaryActions() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('disciplinary_actions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching disciplinary actions:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function fetchStaffTraining() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('staff_training')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching staff training:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function fetchStaffDocuments() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('staff_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching staff documents:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function fetchPerformanceReviews() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('performance_reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching performance reviews:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function fetchOnboardingChecklists() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('onboarding_checklists')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching onboarding checklists:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function fetchExitInterviews() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('exit_interviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching exit interviews:', error);
    return [];
  }

  return toCamelCase(data || []);
}

export async function fetchStaffComplaints() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('staff_complaints')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching staff complaints:', error);
    return [];
  }

  return toCamelCase(data || []);
}
