// Data Migration Utility
// Migrate data from localStorage to Supabase

import { getSupabaseClient } from './client';

export interface MigrationResult {
  success: boolean;
  table: string;
  count: number;
  error?: string;
}

export interface MigrationProgress {
  total: number;
  completed: number;
  current: string;
  results: MigrationResult[];
}

// Storage keys mapping
const STORAGE_KEYS = {
  staff: 'abangbob_staff',
  inventory: 'abangbob_inventory',
  orders: 'abangbob_orders',
  customers: 'abangbob_customers',
  expenses: 'abangbob_expenses',
  menu_items: 'abangbob_menu_items',
  attendance: 'abangbob_attendance',
};

// Helper to check if string is valid UUID
function isValidUUID(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Transform localStorage data to Supabase format
function transformStaff(data: any[]) {
  return data.map(s => ({
    // Only include id if it's a valid UUID, otherwise let Supabase generate new UUID
    ...(isValidUUID(s.id) ? { id: s.id } : {}),
    name: s.name,
    email: s.email || null,
    phone: s.phone || null,
    role: s.role || 'Staff',
    status: s.status || 'active',
    pin: s.pin || '0000',
    hourly_rate: s.hourlyRate || 5.00,
    ic_number: s.icNumber || null,
    employment_type: s.employmentType || 'full-time',
    join_date: s.joinDate || null,
    profile_photo_url: s.profilePhotoUrl || null,
  }));
}

function transformInventory(data: any[]) {
  return data.map(i => ({
    name: i.name,
    category: i.category || 'Lain-lain',
    unit: i.unit || 'unit',
    current_quantity: i.currentQuantity || 0,
    min_quantity: i.minQuantity || 0,
    cost: i.cost || 0,
  }));
}

function transformOrders(data: any[]) {
  return data.map(o => ({
    order_number: o.orderNumber,
    order_type: o.orderType || 'takeaway',
    status: o.status || 'pending',
    items: o.items || [],
    subtotal: o.subtotal || 0,
    discount: o.discount || 0,
    tax: o.tax || 0,
    total: o.total || 0,
    payment_method: o.paymentMethod || null,
    customer_name: o.customerName || null,
    customer_phone: o.customerPhone || null,
    table_number: o.tableNumber || null,
    notes: o.notes || null,
    created_at: o.createdAt || new Date().toISOString(),
  }));
}

function transformCustomers(data: any[]) {
  return data.map(c => ({
    name: c.name,
    phone: c.phone || null,
    email: c.email || null,
    birthday: c.birthday || null,
    loyalty_points: c.loyaltyPoints || 0,
    total_spent: c.totalSpent || 0,
    total_orders: c.totalOrders || 0,
    segment: c.segment || 'new',
    notes: c.notes || null,
  }));
}

function transformExpenses(data: any[]) {
  return data.map(e => ({
    date: e.date,
    category: e.category,
    amount: e.amount,
    description: e.description || '',
    receipt_url: e.receiptUrl || null,
    payment_method: e.paymentMethod || 'cash',
  }));
}

function transformMenuItems(data: any[]) {
  return data.map(m => ({
    name: m.name,
    category: m.category || 'Lain-lain',
    description: m.description || null,
    price: m.price || 0,
    cost: m.cost || 0,
    image_url: m.image || null,
    is_available: m.isAvailable !== false,
    preparation_time: m.preparationTime || 15,
    modifier_group_ids: m.modifierGroupIds || [],
  }));
}

// Get data from localStorage
function getLocalData(key: string): any[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Migrate a single table
async function migrateTable(
  tableName: string, 
  storageKey: string,
  transformer: (data: any[]) => any[],
  useInsert: boolean = false // Use insert instead of upsert for tables without valid UUIDs
): Promise<MigrationResult> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return { success: false, table: tableName, count: 0, error: 'Supabase not connected' };
  }

  try {
    const localData = getLocalData(storageKey);
    
    if (localData.length === 0) {
      return { success: true, table: tableName, count: 0 };
    }

    const transformedData = transformer(localData);
    
    let data, error;
    
    if (useInsert) {
      // Use insert for tables where we're generating new UUIDs
      const result = await supabase
        .from(tableName)
        .insert(transformedData as never)
        .select();
      data = result.data;
      error = result.error;
    } else {
      // Use upsert for tables with existing UUIDs
      const result = await supabase
        .from(tableName)
        .upsert(transformedData as never, { onConflict: 'id' })
        .select();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error(`Error migrating ${tableName}:`, error);
      return { success: false, table: tableName, count: 0, error: error.message };
    }

    return { success: true, table: tableName, count: data?.length || transformedData.length };
  } catch (err) {
    console.error(`Error migrating ${tableName}:`, err);
    return { 
      success: false, 
      table: tableName, 
      count: 0, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

// Full migration
export async function migrateAllData(
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  const tables = [
    { name: 'staff', key: STORAGE_KEYS.staff, transform: transformStaff, useInsert: true },
    { name: 'inventory', key: STORAGE_KEYS.inventory, transform: transformInventory, useInsert: true },
    { name: 'menu_items', key: STORAGE_KEYS.menu_items, transform: transformMenuItems, useInsert: true },
    { name: 'customers', key: STORAGE_KEYS.customers, transform: transformCustomers, useInsert: true },
    { name: 'orders', key: STORAGE_KEYS.orders, transform: transformOrders, useInsert: true },
    { name: 'expenses', key: STORAGE_KEYS.expenses, transform: transformExpenses, useInsert: true },
  ];

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    
    onProgress?.({
      total: tables.length,
      completed: i,
      current: table.name,
      results,
    });

    const result = await migrateTable(table.name, table.key, table.transform, table.useInsert);
    results.push(result);
  }

  onProgress?.({
    total: tables.length,
    completed: tables.length,
    current: 'Selesai',
    results,
  });

  return results;
}

// Check if there's data to migrate
export function checkLocalDataExists(): { table: string; count: number }[] {
  const tables = [
    { name: 'Staff', key: STORAGE_KEYS.staff },
    { name: 'Inventory', key: STORAGE_KEYS.inventory },
    { name: 'Menu Items', key: STORAGE_KEYS.menu_items },
    { name: 'Customers', key: STORAGE_KEYS.customers },
    { name: 'Orders', key: STORAGE_KEYS.orders },
    { name: 'Expenses', key: STORAGE_KEYS.expenses },
  ];

  return tables.map(t => ({
    table: t.name,
    count: getLocalData(t.key).length,
  })).filter(t => t.count > 0);
}

// Clear localStorage after successful migration
export function clearLocalData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Export localStorage data as JSON
export function exportLocalData(): string {
  const data: Record<string, any[]> = {};
  
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    data[name] = getLocalData(key);
  });

  return JSON.stringify(data, null, 2);
}

