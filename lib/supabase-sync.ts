// Supabase Sync Layer
// This module adds Supabase sync to critical store operations
// Enhanced with error propagation, retry logic, and sync logging

import { getSupabaseClient, getConnectionState } from './supabase/client';
import * as ops from './supabase/operations';
import * as attendanceOps from './supabase/attendance-sync';
import { addToSyncQueue } from './sync-queue';
import {
  logSyncSuccess,
  logSyncError,
  logSyncRetry,
  withRetry,
  SyncResult,
  syncSuccess,
  syncError,
  SyncEntity,
  SyncOperation
} from './utils/sync-logger';

// Flag to enable/disable Supabase sync
let supabaseSyncEnabled = true;

// Track pending sync operations for UI indicators
let pendingSyncCount = 0;
type PendingSyncListener = (count: number) => void;
const pendingSyncListeners: Set<PendingSyncListener> = new Set();

export function subscribeToPendingSyncCount(listener: PendingSyncListener): () => void {
  pendingSyncListeners.add(listener);
  listener(pendingSyncCount);
  return () => pendingSyncListeners.delete(listener);
}

function updatePendingSyncCount(delta: number) {
  pendingSyncCount = Math.max(0, pendingSyncCount + delta);
  pendingSyncListeners.forEach(l => l(pendingSyncCount));
}

export function setSupabaseSyncEnabled(enabled: boolean) {
  supabaseSyncEnabled = enabled;
}

export function isSupabaseSyncEnabled() {
  return supabaseSyncEnabled && !!getSupabaseClient();
}

// Check if we should attempt sync (connection is available)
export function canSync(): boolean {
  if (!isSupabaseSyncEnabled()) return false;
  const state = getConnectionState();
  return state.status === 'connected' || state.status === 'disconnected'; // Try even if disconnected
}

// Enhanced sync wrapper with retry and logging
async function syncWithRetry<T>(
  operation: () => Promise<T>,
  entity: SyncEntity,
  operationType: SyncOperation,
  entityId?: string,
  options: { maxRetries?: number; throwOnError?: boolean } = {}
): Promise<SyncResult<T>> {
  const { maxRetries = 2, throwOnError = false } = options;

  if (!isSupabaseSyncEnabled()) {
    return syncError('Supabase sync is disabled');
  }

  updatePendingSyncCount(1);
  const startTime = Date.now();

  try {
    const result = await withRetry(operation, {
      maxRetries,
      baseDelayMs: 1000,
      onRetry: (attempt, error) => {
        logSyncRetry(operationType, entity, attempt, entityId);
      },
    });

    const durationMs = Date.now() - startTime;
    logSyncSuccess(operationType, entity, entityId, durationMs);
    updatePendingSyncCount(-1);

    return syncSuccess(result);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logSyncError(operationType, entity, error instanceof Error ? error : errorMessage, entityId, maxRetries, durationMs);
    updatePendingSyncCount(-1);

    if (throwOnError) {
      throw error;
    }

    return syncError(errorMessage);
  }
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
    // Offline Queue
    addToSyncQueue({ id, table: 'inventory', action: 'UPDATE', payload: updates });
    console.log('Saved to offline queue (Inventory)');
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

// function moved to inventory section


export async function loadInventoryFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchInventory();
  } catch (error) {
    console.error('Failed to load inventory from Supabase:', error);
    return [];
  }
}

// ============ CASH REGISTER SYNC ============

export async function loadCashRegistersFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchCashRegisters();
  } catch (error) {
    console.error('Failed to load cash registers from Supabase:', error);
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

export async function syncAddMenuItem(item: any): Promise<SyncResult<any>> {
  return syncWithRetry(
    () => ops.insertMenuItem(item),
    'menu_items',
    'insert',
    item.id
  );
}

export async function syncUpdateMenuItem(id: string, updates: any): Promise<SyncResult<any>> {
  return syncWithRetry(
    () => ops.updateMenuItem(id, updates),
    'menu_items',
    'update',
    id
  );
}

export async function syncDeleteMenuItem(id: string): Promise<SyncResult<void>> {
  return syncWithRetry(
    () => ops.deleteMenuItem(id),
    'menu_items',
    'delete',
    id
  );
}

export async function loadMenuItemsFromSupabase(): Promise<{ data: any[]; error: string | null }> {
  const result = await syncWithRetry(
    () => ops.fetchMenuItems(),
    'menu_items',
    'fetch'
  );

  return {
    data: result.success ? result.data : [],
    error: result.error,
  };
}

// Legacy wrapper for backward compatibility - returns null on error
export async function syncAddMenuItemLegacy(item: any) {
  const result = await syncAddMenuItem(item);
  return result.success ? result.data : null;
}

export async function syncUpdateMenuItemLegacy(id: string, updates: any) {
  const result = await syncUpdateMenuItem(id, updates);
  return result.success ? result.data : null;
}

export async function syncDeleteMenuItemLegacy(id: string) {
  await syncDeleteMenuItem(id);
}

export async function loadMenuItemsFromSupabaseLegacy() {
  const result = await loadMenuItemsFromSupabase();
  return result.data;
}

// ============ MODIFIER GROUPS SYNC ============

export async function syncAddModifierGroup(group: any): Promise<SyncResult<any>> {
  return syncWithRetry(
    () => ops.insertModifierGroup(group),
    'modifier_groups',
    'insert',
    group.id
  );
}

export async function syncUpdateModifierGroup(id: string, updates: any): Promise<SyncResult<any>> {
  return syncWithRetry(
    () => ops.updateModifierGroup(id, updates),
    'modifier_groups',
    'update',
    id
  );
}

export async function syncDeleteModifierGroup(id: string): Promise<SyncResult<void>> {
  return syncWithRetry(
    () => ops.deleteModifierGroup(id),
    'modifier_groups',
    'delete',
    id
  );
}

export async function loadModifierGroupsFromSupabase(): Promise<{ data: any[]; error: string | null }> {
  const result = await syncWithRetry(
    () => ops.fetchModifierGroups(),
    'modifier_groups',
    'fetch'
  );

  return {
    data: result.success ? result.data : [],
    error: result.error,
  };
}

// Legacy wrappers for backward compatibility
export async function syncAddModifierGroupLegacy(group: any) {
  const result = await syncAddModifierGroup(group);
  return result.success ? result.data : null;
}

export async function syncUpdateModifierGroupLegacy(id: string, updates: any) {
  const result = await syncUpdateModifierGroup(id, updates);
  return result.success ? result.data : null;
}

export async function syncDeleteModifierGroupLegacy(id: string) {
  await syncDeleteModifierGroup(id);
}

export async function loadModifierGroupsFromSupabaseLegacy() {
  const result = await loadModifierGroupsFromSupabase();
  return result.data;
}

// ============ MODIFIER OPTIONS SYNC ============

export async function syncAddModifierOption(option: any): Promise<SyncResult<any>> {
  return syncWithRetry(
    () => ops.insertModifierOption(option),
    'modifier_options',
    'insert',
    option.id
  );
}

export async function syncUpdateModifierOption(id: string, updates: any): Promise<SyncResult<any>> {
  return syncWithRetry(
    () => ops.updateModifierOption(id, updates),
    'modifier_options',
    'update',
    id
  );
}

export async function syncDeleteModifierOption(id: string): Promise<SyncResult<void>> {
  return syncWithRetry(
    () => ops.deleteModifierOption(id),
    'modifier_options',
    'delete',
    id
  );
}

export async function loadModifierOptionsFromSupabase(): Promise<{ data: any[]; error: string | null }> {
  const result = await syncWithRetry(
    () => ops.fetchModifierOptions(),
    'modifier_options',
    'fetch'
  );

  return {
    data: result.success ? result.data : [],
    error: result.error,
  };
}

// Legacy wrappers for backward compatibility
export async function syncAddModifierOptionLegacy(option: any) {
  const result = await syncAddModifierOption(option);
  return result.success ? result.data : null;
}

export async function syncUpdateModifierOptionLegacy(id: string, updates: any) {
  const result = await syncUpdateModifierOption(id, updates);
  return result.success ? result.data : null;
}

export async function syncDeleteModifierOptionLegacy(id: string) {
  await syncDeleteModifierOption(id);
}

export async function loadModifierOptionsFromSupabaseLegacy() {
  const result = await loadModifierOptionsFromSupabase();
  return result.data;
}

// ============ ORDERS SYNC ============

export async function syncAddOrder(order: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertOrder(order);
  } catch (error) {
    console.error('Failed to sync order to Supabase:', error);
    // Offline Queue
    addToSyncQueue({ id: order.id, table: 'orders', action: 'CREATE', payload: order });
    console.log('Saved to offline queue (Order)');
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
    // Offline Queue - Generate ID if missing or use existing? 
    // Usually customer object here has ID from generic UUID generator in Store
    if (customer.id) {
      addToSyncQueue({ id: customer.id, table: 'customers', action: 'CREATE', payload: customer });
      console.log('Saved to offline queue (Customer)');
    }
    return null;
  }
}

export async function syncUpdateCustomer(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateCustomer(id, updates);
  } catch (error) {
    console.error('Failed to update customer in Supabase:', error);
    addToSyncQueue({ id, table: 'customers', action: 'UPDATE', payload: updates });
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

// ============ SUPPLIERS SYNC ============

export async function syncAddSupplier(supplier: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertSupplier(supplier);
  } catch (error) {
    console.error('Failed to sync supplier to Supabase:', error);
    return null;
  }
}

export async function syncUpdateSupplier(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateSupplier(id, updates);
  } catch (error) {
    console.error('Failed to update supplier in Supabase:', error);
    return null;
  }
}

export async function syncDeleteSupplier(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteSupplier(id);
  } catch (error) {
    console.error('Failed to delete supplier from Supabase:', error);
  }
}

export async function loadSuppliersFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchSuppliers();
  } catch (error) {
    console.error('Failed to load suppliers from Supabase:', error);
    return [];
  }
}

// ============ PURCHASE ORDERS SYNC ============

export async function syncAddPurchaseOrder(po: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertPurchaseOrder(po);
  } catch (error) {
    console.error('Failed to sync purchase order to Supabase:', error);
    return null;
  }
}

export async function syncUpdatePurchaseOrder(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updatePurchaseOrder(id, updates);
  } catch (error) {
    console.error('Failed to update purchase order in Supabase:', error);
    return null;
  }
}

export async function syncMarkPurchaseOrderAsPaid(id: string, amount?: number) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.markPurchaseOrderAsPaid(id, amount);
  } catch (error) {
    console.error('Failed to mark purchase order as paid in Supabase:', error);
    return null;
  }
}

export async function loadPurchaseOrdersFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchPurchaseOrders();
  } catch (error) {
    console.error('Failed to load purchase orders from Supabase:', error);
    return [];
  }
}

// ============ INVENTORY LOGS SYNC ============

export async function syncAddInventoryLog(log: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertInventoryLog(log);
  } catch (error) {
    console.error('Failed to sync inventory log to Supabase:', error);
    // Offline Queue
    addToSyncQueue({ id: log.id, table: 'inventory_logs', action: 'CREATE', payload: log });
    console.log('Saved to offline queue (Inventory Log)');
    return null;
  }
}

export async function loadInventoryLogsFromSupabase(stockItemId?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchInventoryLogs(stockItemId);
  } catch (error) {
    console.error('Failed to load inventory logs from Supabase:', error);
    return [];
  }
}

// ============ RECIPES SYNC ============

export async function syncAddRecipe(recipe: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    console.log('[syncAddRecipe] Syncing recipe:', recipe);
    const result = await ops.insertRecipe(recipe);
    console.log('[syncAddRecipe] Success:', result);
    return result;
  } catch (error: any) {
    console.error('[syncAddRecipe] Failed to sync recipe to Supabase:', error);
    console.error('[syncAddRecipe] Error details:', error?.message, error?.code, error?.details);
    throw error; // Rethrow to notify UI
  }
}

export async function syncUpdateRecipe(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateRecipe(id, updates);
  } catch (error) {
    console.error('Failed to update recipe in Supabase:', error);
    return null;
  }
}

export async function syncDeleteRecipe(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteRecipe(id);
  } catch (error) {
    console.error('Failed to delete recipe from Supabase:', error);
  }
}

export async function loadRecipesFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchRecipes();
  } catch (error) {
    console.error('Failed to load recipes from Supabase:', error);
    return [];
  }
}

// ============ SHIFTS SYNC ============

export async function syncAddShift(shift: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertShift(shift);
  } catch (error) {
    console.error('Failed to sync shift to Supabase:', error);
    return null;
  }
}

export async function syncUpdateShift(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateShift(id, updates);
  } catch (error) {
    console.error('Failed to update shift in Supabase:', error);
    return null;
  }
}

export async function syncDeleteShift(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteShift(id);
  } catch (error) {
    console.error('Failed to delete shift from Supabase:', error);
  }
}

export async function loadShiftsFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchShifts();
  } catch (error) {
    console.error('Failed to load shifts from Supabase:', error);
    return [];
  }
}

// ============ SCHEDULES SYNC ============

export async function syncAddScheduleEntry(entry: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertScheduleEntry(entry);
  } catch (error) {
    console.error('Failed to sync schedule entry to Supabase:', error);
    return null;
  }
}

export async function syncUpdateScheduleEntry(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateScheduleEntry(id, updates);
  } catch (error) {
    console.error('Failed to update schedule entry in Supabase:', error);
    return null;
  }
}

export async function syncDeleteScheduleEntry(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteScheduleEntry(id);
  } catch (error) {
    console.error('Failed to delete schedule entry from Supabase:', error);
  }
}

export async function loadSchedulesFromSupabase(startDate?: string, endDate?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchScheduleEntries(startDate, endDate);
  } catch (error) {
    console.error('Failed to load schedules from Supabase:', error);
    return [];
  }
}

// ============ PROMOTIONS SYNC ============

export async function syncAddPromotion(promotion: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertPromotion(promotion);
  } catch (error) {
    console.error('Failed to sync promotion to Supabase:', error);
    return null;
  }
}

export async function syncUpdatePromotion(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updatePromotion(id, updates);
  } catch (error) {
    console.error('Failed to update promotion in Supabase:', error);
    return null;
  }
}

export async function syncDeletePromotion(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deletePromotion(id);
  } catch (error) {
    console.error('Failed to delete promotion from Supabase:', error);
  }
}

export async function loadPromotionsFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchPromotions();
  } catch (error) {
    console.error('Failed to load promotions from Supabase:', error);
    return [];
  }
}

// ============ NOTIFICATIONS SYNC ============

export async function syncAddNotification(notification: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertNotification(notification);
  } catch (error) {
    console.error('Failed to sync notification to Supabase:', error);
    return null;
  }
}

export async function syncUpdateNotification(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateNotification(id, updates);
  } catch (error) {
    console.error('Failed to update notification in Supabase:', error);
    return null;
  }
}

export async function syncDeleteNotification(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteNotification(id);
  } catch (error) {
    console.error('Failed to delete notification from Supabase:', error);
  }
}

export async function loadNotificationsFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchNotifications();
  } catch (error) {
    console.error('Failed to load notifications from Supabase:', error);
    return [];
  }
}

// ============ PRODUCTION LOGS SYNC ============

export async function syncAddProductionLog(log: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertProductionLog(log);
  } catch (error) {
    console.error('Failed to sync production log to Supabase:', error);
    return null;
  }
}

export async function loadProductionLogsFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchProductionLogs();
  } catch (error) {
    console.error('Failed to load production logs from Supabase:', error);
    return [];
  }
}

// ============ DELIVERY ORDERS SYNC ============

export async function syncAddDeliveryOrder(order: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertDeliveryOrder(order);
  } catch (error) {
    console.error('Failed to sync delivery order to Supabase:', error);
    return null;
  }
}

export async function syncUpdateDeliveryOrder(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateDeliveryOrder(id, updates);
  } catch (error) {
    console.error('Failed to update delivery order in Supabase:', error);
    return null;
  }
}

export async function loadDeliveryOrdersFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchDeliveryOrders();
  } catch (error) {
    console.error('Failed to load delivery orders from Supabase:', error);
    return [];
  }
}

// ============ CASH FLOWS SYNC ============

export async function syncAddCashFlow(cashFlow: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertCashFlow(cashFlow);
  } catch (error) {
    console.error('Failed to sync cash flow to Supabase:', error);
    return null;
  }
}

export async function syncUpdateCashFlow(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateCashFlow(id, updates);
  } catch (error) {
    console.error('Failed to update cash flow in Supabase:', error);
    return null;
  }
}

export async function loadCashFlowsFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchCashFlows();
  } catch (error) {
    console.error('Failed to load cash flows from Supabase:', error);
    return [];
  }
}

// ============ STAFF KPI SYNC ============

export async function syncUpsertStaffKPI(kpi: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.upsertStaffKPI(kpi);
  } catch (error) {
    console.error('Failed to sync staff KPI to Supabase:', error);
    return null;
  }
}

export async function loadStaffKPIFromSupabase(staffId?: string, period?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchStaffKPI(staffId, period);
  } catch (error) {
    console.error('Failed to load staff KPI from Supabase:', error);
    return [];
  }
}

// ============ LEAVE RECORDS SYNC ============

export async function syncAddLeaveRecord(record: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertLeaveRecord(record);
  } catch (error) {
    console.error('Failed to sync leave record to Supabase:', error);
    return null;
  }
}

export async function syncUpdateLeaveRecord(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateLeaveRecord(id, updates);
  } catch (error) {
    console.error('Failed to update leave record in Supabase:', error);
    return null;
  }
}

export async function loadLeaveRecordsFromSupabase(staffId?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchLeaveRecords(staffId);
  } catch (error) {
    console.error('Failed to load leave records from Supabase:', error);
    return [];
  }
}

// ============ TRAINING RECORDS SYNC ============

export async function syncAddTrainingRecord(record: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertTrainingRecord(record);
  } catch (error) {
    console.error('Failed to sync training record to Supabase:', error);
    return null;
  }
}

export async function syncUpdateTrainingRecord(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateTrainingRecord(id, updates);
  } catch (error) {
    console.error('Failed to update training record in Supabase:', error);
    return null;
  }
}

export async function loadTrainingRecordsFromSupabase(staffId?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchTrainingRecords(staffId);
  } catch (error) {
    console.error('Failed to load training records from Supabase:', error);
    return [];
  }
}

// ============ OT RECORDS SYNC ============

export async function syncAddOTRecord(record: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertOTRecord(record);
  } catch (error) {
    console.error('Failed to sync OT record to Supabase:', error);
    return null;
  }
}

export async function syncUpdateOTRecord(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateOTRecord(id, updates);
  } catch (error) {
    console.error('Failed to update OT record in Supabase:', error);
    return null;
  }
}

export async function loadOTRecordsFromSupabase(staffId?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchOTRecords(staffId);
  } catch (error) {
    console.error('Failed to load OT records from Supabase:', error);
    return [];
  }
}

// ============ CUSTOMER REVIEWS SYNC ============

export async function syncAddCustomerReview(review: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertCustomerReview(review);
  } catch (error) {
    console.error('Failed to sync customer review to Supabase:', error);
    return null;
  }
}

export async function loadCustomerReviewsFromSupabase(staffId?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchCustomerReviews(staffId);
  } catch (error) {
    console.error('Failed to load customer reviews from Supabase:', error);
    return [];
  }
}

// ============ CHECKLIST TEMPLATES SYNC ============

export async function syncAddChecklistTemplate(template: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertChecklistTemplate(template);
  } catch (error) {
    console.error('Failed to sync checklist template to Supabase:', error);
    return null;
  }
}

export async function syncUpdateChecklistTemplate(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateChecklistTemplate(id, updates);
  } catch (error) {
    console.error('Failed to update checklist template in Supabase:', error);
    return null;
  }
}

export async function syncDeleteChecklistTemplate(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteChecklistTemplate(id);
  } catch (error) {
    console.error('Failed to delete checklist template from Supabase:', error);
  }
}

export async function loadChecklistTemplatesFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchChecklistTemplates();
  } catch (error) {
    console.error('Failed to load checklist templates from Supabase:', error);
    return [];
  }
}

// ============ CHECKLIST COMPLETIONS SYNC ============

export async function syncAddChecklistCompletion(completion: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertChecklistCompletion(completion);
  } catch (error) {
    console.error('Failed to sync checklist completion to Supabase:', error);
    return null;
  }
}

export async function syncUpdateChecklistCompletion(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateChecklistCompletion(id, updates);
  } catch (error) {
    console.error('Failed to update checklist completion in Supabase:', error);
    return null;
  }
}

export async function loadChecklistCompletionsFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchChecklistCompletions();
  } catch (error) {
    console.error('Failed to load checklist completions from Supabase:', error);
    return [];
  }
}

// ============ LEAVE BALANCES SYNC ============

export async function syncUpsertLeaveBalance(balance: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.upsertLeaveBalance(balance);
  } catch (error) {
    console.error('Failed to sync leave balance to Supabase:', error);
    return null;
  }
}

export async function loadLeaveBalancesFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchLeaveBalances();
  } catch (error) {
    console.error('Failed to load leave balances from Supabase:', error);
    return [];
  }
}

// ============ LEAVE REQUESTS SYNC ============

export async function syncAddLeaveRequest(request: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertLeaveRequest(request);
  } catch (error) {
    console.error('Failed to sync leave request to Supabase:', error);
    return null;
  }
}

export async function syncUpdateLeaveRequest(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateLeaveRequest(id, updates);
  } catch (error) {
    console.error('Failed to update leave request in Supabase:', error);
    return null;
  }
}

export async function loadLeaveRequestsFromSupabase(staffId?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchLeaveRequests(staffId);
  } catch (error) {
    console.error('Failed to load leave requests from Supabase:', error);
    return [];
  }
}

// ============ CLAIM REQUESTS SYNC ============

export async function syncAddClaimRequest(request: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertClaimRequest(request);
  } catch (error) {
    console.error('Failed to sync claim request to Supabase:', error);
    return null;
  }
}

export async function syncUpdateClaimRequest(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateClaimRequest(id, updates);
  } catch (error) {
    console.error('Failed to update claim request in Supabase:', error);
    return null;
  }
}

export async function loadClaimRequestsFromSupabase(staffId?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchClaimRequests(staffId);
  } catch (error) {
    console.error('Failed to load claim requests from Supabase:', error);
    return [];
  }
}

// ============ STAFF REQUESTS SYNC ============

export async function syncAddStaffRequest(request: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertStaffRequest(request);
  } catch (error) {
    console.error('Failed to sync staff request to Supabase:', error);
    return null;
  }
}

export async function syncUpdateStaffRequest(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateStaffRequest(id, updates);
  } catch (error) {
    console.error('Failed to update staff request in Supabase:', error);
    return null;
  }
}

export async function loadStaffRequestsFromSupabase(staffId?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchStaffRequests(staffId);
  } catch (error) {
    console.error('Failed to load staff requests from Supabase:', error);
    return [];
  }
}

// ============ ANNOUNCEMENTS SYNC ============

export async function syncAddAnnouncement(announcement: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertAnnouncement(announcement);
  } catch (error) {
    console.error('Failed to sync announcement to Supabase:', error);
    return null;
  }
}

export async function syncUpdateAnnouncement(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateAnnouncement(id, updates);
  } catch (error) {
    console.error('Failed to update announcement in Supabase:', error);
    return null;
  }
}

export async function syncDeleteAnnouncement(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteAnnouncement(id);
  } catch (error) {
    console.error('Failed to delete announcement from Supabase:', error);
  }
}

export async function loadAnnouncementsFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchAnnouncements();
  } catch (error) {
    console.error('Failed to load announcements from Supabase:', error);
    return [];
  }
}

// ============ OIL TRACKERS SYNC ============

export async function syncAddOilTracker(tracker: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertOilTracker(tracker);
  } catch (error) {
    console.error('Failed to sync oil tracker to Supabase:', error);
    return null;
  }
}

export async function syncUpdateOilTracker(fryerId: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateOilTracker(fryerId, updates);
  } catch (error) {
    console.error('Failed to update oil tracker in Supabase:', error);
    return null;
  }
}

export async function syncDeleteOilTracker(fryerId: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteOilTracker(fryerId);
  } catch (error) {
    console.error('Failed to delete oil tracker from Supabase:', error);
  }
}

export async function loadOilTrackersFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchOilTrackers();
  } catch (error) {
    console.error('Failed to load oil trackers from Supabase:', error);
    return [];
  }
}

// ============ OIL CHANGE REQUESTS SYNC ============

export async function syncAddOilChangeRequest(request: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertOilChangeRequest(request);
  } catch (error) {
    console.error('Failed to sync oil change request to Supabase:', error);
    return null;
  }
}

export async function syncUpdateOilChangeRequest(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateOilChangeRequest(id, updates);
  } catch (error) {
    console.error('Failed to update oil change request in Supabase:', error);
    return null;
  }
}

export async function loadOilChangeRequestsFromSupabase(status?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchOilChangeRequests(status);
  } catch (error) {
    console.error('Failed to load oil change requests from Supabase:', error);
    return [];
  }
}

// ============ OIL ACTION HISTORY SYNC ============

export async function syncAddOilActionHistory(history: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertOilActionHistory(history);
  } catch (error) {
    console.error('Failed to sync oil action history to Supabase:', error);
    return null;
  }
}

export async function loadOilActionHistoryFromSupabase(fryerId?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await ops.fetchOilActionHistory(fryerId);
  } catch (error) {
    console.error('Failed to load oil action history from Supabase:', error);
    return [];
  }
}

// ============ INITIAL LOAD ALL DATA ============

export async function loadAllDataFromSupabase() {
  if (!isSupabaseSyncEnabled()) {
    return {
      inventory: [],
      inventoryLogs: [],
      staff: [],
      menuItems: [],
      modifierGroups: [],
      modifierOptions: [],
      orders: [],
      customers: [],
      expenses: [],
      attendance: [],
      suppliers: [],
      purchaseOrders: [],
      recipes: [],
      shifts: [],
      schedules: [],
      promotions: [],
      notifications: [],
      productionLogs: [],
      deliveryOrders: [],
      cashFlows: [],
      staffKPI: [],
      leaveRecords: [],
      trainingRecords: [],
      otRecords: [],
      customerReviews: [],
      checklistTemplates: [],
      checklistCompletions: [],
      leaveBalances: [],
      leaveRequests: [],
      claimRequests: [],
      staffRequests: [],
      announcements: [],
      oilTrackers: [],
      oilChangeRequests: [],
      oilActionHistory: [],
    };
  }

  try {
    const results = await Promise.allSettled([
      ops.fetchInventory(),
      ops.fetchStaff(),
      ops.fetchMenuItems(),
      ops.fetchModifierGroups(),
      ops.fetchModifierOptions(),
      ops.fetchOrders(100),
      ops.fetchCustomers(),
      ops.fetchExpenses(),
      ops.fetchAttendance(),
      ops.fetchSuppliers(),
      ops.fetchPurchaseOrders(),
      ops.fetchRecipes(),
      ops.fetchShifts(),
      ops.fetchScheduleEntries(),
      ops.fetchPromotions(),
      ops.fetchNotifications(),
      ops.fetchProductionLogs(),
      ops.fetchDeliveryOrders(),
      ops.fetchCashFlows(),
      ops.fetchStaffKPI(),
      ops.fetchLeaveRecords(),
      ops.fetchTrainingRecords(),
      ops.fetchOTRecords(),
      ops.fetchCustomerReviews(),
      ops.fetchChecklistTemplates(),
      ops.fetchChecklistCompletions(),
      ops.fetchLeaveBalances(),
      ops.fetchLeaveRequests(),
      ops.fetchClaimRequests(),
      ops.fetchStaffRequests(),
      ops.fetchAnnouncements(),
      ops.fetchOilTrackers(),
      ops.fetchOilChangeRequests(),
      ops.fetchOilChangeRequests(),
      ops.fetchOilActionHistory(),
      ops.fetchCashRegisters(), // Index 34
    ]);

    // Helper to get value or default
    const getResult = <T>(index: number, defaultValue: T): T => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        return result.value as T;
      } else {
        console.error(`Failed to load data at index ${index}: `, result.reason);
        return defaultValue;
      }
    };

    return {
      inventory: getResult(0, []),
      staff: getResult(1, []),
      menuItems: getResult(2, []),
      modifierGroups: getResult(3, []),
      modifierOptions: getResult(4, []),
      orders: getResult(5, []),
      customers: getResult(6, []),
      expenses: getResult(7, []),
      attendance: getResult(8, []),
      suppliers: getResult(9, []),
      purchaseOrders: getResult(10, []),
      recipes: getResult<any[]>(11, []).map(r => ({
        ...r,
        menuItemName: getResult<any[]>(2, []).find(m => m.id === r.menuItemId)?.name || 'Unknown'
      })),
      shifts: getResult(12, []),
      schedules: getResult(13, []),
      promotions: getResult(14, []),
      notifications: getResult(15, []),
      productionLogs: getResult(16, []),
      deliveryOrders: getResult(17, []),
      cashFlows: getResult(18, []),
      staffKPI: getResult(19, []),
      leaveRecords: getResult(20, []),
      trainingRecords: getResult(21, []),
      otRecords: getResult(22, []),
      customerReviews: getResult(23, []),
      checklistTemplates: getResult(24, []),
      checklistCompletions: getResult(25, []),
      leaveBalances: getResult(26, []),
      leaveRequests: getResult(27, []),
      claimRequests: getResult(28, []),
      staffRequests: getResult(29, []),
      announcements: getResult(30, []),
      oilTrackers: getResult(31, []),
      oilChangeRequests: getResult(32, []),
      oilActionHistory: getResult(33, []),
      cashRegisters: getResult(34, []),
    };
  } catch (error) {
    console.error('Critical failure in loadAllDataFromSupabase:', error);
    return {
      inventory: [],
      staff: [],
      menuItems: [],
      modifierGroups: [],
      modifierOptions: [],
      orders: [],
      customers: [],
      expenses: [],
      attendance: [],
      suppliers: [],
      purchaseOrders: [],
      recipes: [],
      shifts: [],
      schedules: [],
      promotions: [],
      notifications: [],
      productionLogs: [],
      deliveryOrders: [],
      cashFlows: [],
      staffKPI: [],
      leaveRecords: [],
      trainingRecords: [],
      otRecords: [],
      customerReviews: [],
      checklistTemplates: [],
      checklistCompletions: [],
      leaveBalances: [],
      leaveRequests: [],
      claimRequests: [],
      staffRequests: [],
      announcements: [],
      oilTrackers: [],
      oilChangeRequests: [],
      oilActionHistory: [],
      // missing inventoryLogs in original catch return, adding it
      inventoryLogs: [],
    };
  }
}

// ============ ATTENDANCE OPERATIONS WRAPPER ============

export async function clockIn(data: any) {
  if (!isSupabaseSyncEnabled()) return { success: false, error: 'Supabase disabled', data: null };
  return await attendanceOps.clockIn(data);
}

export async function clockOut(data: any) {
  if (!isSupabaseSyncEnabled()) return { success: false, error: 'Supabase disabled', data: null };
  return await attendanceOps.clockOut(data);
}


