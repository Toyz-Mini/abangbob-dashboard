// Supabase Sync Layer
// This module adds Supabase sync to critical store operations
// Enhanced with error propagation, retry logic, and sync logging

import { getSupabaseClient, getConnectionState } from './supabase/client';
import * as ops from './supabase/operations';
import * as attendanceOps from './supabase/attendance-sync';
import * as PaymentTaxSync from './supabase/payment-tax-sync';
import { addToSyncQueue } from './sync-queue';
import * as inventoryActions from './actions/inventory-actions';
import * as menuActions from './actions/menu-actions';
import * as staffActions from './actions/staff-actions';
import * as financeActions from './actions/finance-actions';
import * as orderActions from './actions/order-actions';
import * as attendanceActions from './actions/attendance-actions';
import * as supplierActions from './actions/supplier-actions';
import * as cashActions from './actions/cash-actions';
import * as recipeActions from './actions/recipe-actions';
import * as inventoryLogActions from './actions/inventory-log-actions';
import * as customerActions from './actions/customer-actions';
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
    return await inventoryActions.addInventoryItemAction(item);
  } catch (error) {
    console.error('Failed to sync inventory item to Supabase:', error);
    addToSyncQueue({ id: item.id, table: 'inventory', action: 'CREATE', payload: item });
    return null;
  }
}

export async function syncUpdateStockItem(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await inventoryActions.updateInventoryItemAction(id, updates);
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
    await inventoryActions.deleteInventoryItemAction(id);
  } catch (error) {
    console.error('Failed to delete inventory item from Supabase:', error);
    addToSyncQueue({ id, table: 'inventory', action: 'DELETE', payload: {} });
  }
}

// function moved to inventory section


export async function loadInventoryFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await inventoryActions.fetchInventoryAction();
  } catch (error) {
    console.error('Failed to load inventory from Supabase:', error);
    return [];
  }
}

// ============ CASH REGISTER SYNC ============

export async function loadCashRegistersFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await cashActions.fetchCashRegistersAction();
  } catch (error) {
    console.error('Failed to load cash registers from Supabase:', error);
    return [];
  }
}

// ============ STAFF SYNC ============

export async function syncAddStaff(staff: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await staffActions.insertStaffAction(staff);
  } catch (error) {
    console.error('Failed to sync staff to Supabase:', error);
    addToSyncQueue({ id: staff.id, table: 'staff', action: 'CREATE', payload: staff });
    return null;
  }
}

export async function syncUpdateStaff(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await staffActions.updateStaffAction(id, updates);
  } catch (error) {
    console.error('Failed to update staff in Supabase:', error);
    addToSyncQueue({ id, table: 'staff', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteStaff(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await staffActions.deleteStaffAction(id);
  } catch (error) {
    console.error('Failed to delete staff from Supabase:', error);
    addToSyncQueue({ id, table: 'staff', action: 'DELETE', payload: {} });
  }
}

export async function loadStaffFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await staffActions.fetchStaffAction();
  } catch (error) {
    console.error('Failed to load staff from Supabase:', error);
    return [];
  }
}

// ============ MENU ITEMS SYNC ============

export async function syncAddMenuItem(item: any): Promise<SyncResult<any>> {
  return syncWithRetry(
    () => menuActions.insertMenuItemAction(item),
    'menu_items',
    'insert',
    item.id
  );
}

export async function syncUpdateMenuItem(id: string, updates: any): Promise<SyncResult<any>> {
  return syncWithRetry(
    () => menuActions.updateMenuItemAction(id, updates),
    'menu_items',
    'update',
    id
  );
}

export async function syncDeleteMenuItem(id: string): Promise<SyncResult<void>> {
  return syncWithRetry(
    () => menuActions.deleteMenuItemAction(id),
    'menu_items',
    'delete',
    id
  );
}

export async function loadMenuItemsFromSupabase(): Promise<{ data: any[]; error: string | null }> {
  const result = await syncWithRetry(
    () => menuActions.fetchMenuItemsAction(),
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
    () => menuActions.insertModifierGroupAction(group),
    'modifier_groups',
    'insert',
    group.id
  );
}

export async function syncUpdateModifierGroup(id: string, updates: any): Promise<SyncResult<any>> {
  return syncWithRetry(
    () => menuActions.updateModifierGroupAction(id, updates),
    'modifier_groups',
    'update',
    id
  );
}

export async function syncDeleteModifierGroup(id: string): Promise<SyncResult<void>> {
  return syncWithRetry(
    () => menuActions.deleteModifierGroupAction(id),
    'modifier_groups',
    'delete',
    id
  );
}

export async function loadModifierGroupsFromSupabase(): Promise<{ data: any[]; error: string | null }> {
  const result = await syncWithRetry(
    () => menuActions.fetchModifierGroupsAction(),
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
    () => menuActions.insertModifierOptionAction(option),
    'modifier_options',
    'insert',
    option.id
  );
}

export async function syncUpdateModifierOption(id: string, updates: any): Promise<SyncResult<any>> {
  return syncWithRetry(
    () => menuActions.updateModifierOptionAction(id, updates),
    'modifier_options',
    'update',
    id
  );
}

export async function syncDeleteModifierOption(id: string): Promise<SyncResult<void>> {
  return syncWithRetry(
    () => menuActions.deleteModifierOptionAction(id),
    'modifier_options',
    'delete',
    id
  );
}

export async function loadModifierOptionsFromSupabase(): Promise<{ data: any[]; error: string | null }> {
  const result = await syncWithRetry(
    () => menuActions.fetchModifierOptionsAction(),
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
    let savedOrder = null;
    try {
      // 1. Try Server Action (Authenticated)
      savedOrder = await orderActions.insertOrderAction(order);
    } catch (err: any) {
      // 2. If Unauthorized, fallback to client-side Public RPC (Legacy)
      if (err.message && (err.message.includes('Unauthorized') || err.message.includes('No active session'))) {
        // This is likely a public/unauthenticated order
        savedOrder = await ops.insertOrder(order);
      } else {
        throw err;
      }
    }

    // If order saved successfully, handle side effects (Loyalty & Promo)
    if (savedOrder && savedOrder.id) {
      // Wrap side effects in independent try-catch blocks to ensure order return is not blocked
      try {
        // 1. Loyalty Points Earned
        if (order.loyaltyPointsEarned > 0 && order.customerId) {
          await ops.insertLoyaltyTransaction({
            customerId: order.customerId,
            orderId: savedOrder.id,
            transactionType: 'earn',
            points: order.loyaltyPointsEarned,
            description: `Points from Order #${order.orderNumber}`
          });
        }

        // 2. Loyalty Points Redeemed
        if (order.loyaltyPointsRedeemed > 0 && order.customerId) {
          await ops.insertLoyaltyTransaction({
            customerId: order.customerId,
            orderId: savedOrder.id,
            transactionType: 'redeem',
            points: order.loyaltyPointsRedeemed, // Use positive value, transactionType defines direction
            description: `Redeemed for Order #${order.orderNumber}`
          });
        }

        // 3. Promo Code / Promotion Usage
        // Check for either promoCodeId (legacy) or promotionId (new)
        const promoId = order.promoCodeId || order.promotionId;

        if (promoId) {
          // If we have a helper for inserting usage, use it. 
          // Assuming insertPromoUsage expects a flexible ID or we need to update it.
          // For now, let's assume we just want to track it if possible, 
          // but mainly we rely on the order column 'promotion_id' which should have been saved in the insertOrderAction above
          // because we passed the whole order object.

          // However, we still want to increment usage count on the promotion table
          if (order.promotionId) {
            // Update usage count for the promotion
            await ops.incrementPromoUsageCount(order.promotionId);
          } else if (order.promoCodeId) {
            await ops.incrementPromoUsageCount(order.promoCodeId);
          }

          // Legacy support: insert into promo_usages if needed
          // await ops.insertPromoUsage({ ... });
        }
      } catch (sideEffectError) {
        console.error('Failed to process order side effects (Loyalty/Promo):', sideEffectError);
        // We do NOT re-throw here, as the order itself was successful.
        // Future improvement: retry queue for side effects.
      }
    }

    return savedOrder;
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
    return await orderActions.updateOrderAction(id, updates);
  } catch (error) {
    console.error('Failed to update order in Supabase:', error);
    return null;
  }
}

export async function loadOrdersFromSupabase(limit?: number) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await orderActions.fetchOrdersAction(limit);
  } catch (error) {
    console.error('Failed to load orders from Supabase:', error);
    return [];
  }
}

// ============ CUSTOMERS SYNC ============

export async function syncAddCustomer(customer: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await customerActions.insertCustomerAction(customer);
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
    return await customerActions.updateCustomerAction(id, updates);
  } catch (error) {
    console.error('Failed to update customer in Supabase:', error);
    addToSyncQueue({ id, table: 'customers', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function loadCustomersFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await customerActions.fetchCustomersAction();
  } catch (error) {
    console.error('Failed to load customers from Supabase:', error);
    return [];
  }
}

// ============ EXPENSES SYNC ============

export async function syncAddExpense(expense: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await financeActions.insertExpenseAction(expense);
  } catch (error) {
    console.error('Failed to sync expense to Supabase:', error);
    addToSyncQueue({ id: expense.id, table: 'expenses', action: 'CREATE', payload: expense });
    return null;
  }
}

export async function syncUpdateExpense(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await financeActions.updateExpenseAction(id, updates);
  } catch (error) {
    console.error('Failed to update expense in Supabase:', error);
    addToSyncQueue({ id, table: 'expenses', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteExpense(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await financeActions.deleteExpenseAction(id);
  } catch (error) {
    console.error('Failed to delete expense from Supabase:', error);
    addToSyncQueue({ id, table: 'expenses', action: 'DELETE', payload: {} });
  }
}

export async function loadExpensesFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await financeActions.fetchExpensesAction();
  } catch (error) {
    console.error('Failed to load expenses from Supabase:', error);
    return [];
  }
}

// ============ ATTENDANCE SYNC ============

export async function syncAddAttendance(attendance: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await attendanceActions.insertAttendanceAction(attendance);
  } catch (error) {
    console.error('Failed to sync attendance to Supabase:', error);
    return null;
  }
}

export async function syncUpdateAttendance(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await attendanceActions.updateAttendanceAction(id, updates);
  } catch (error) {
    console.error('Failed to update attendance in Supabase:', error);
    return null;
  }
}

export async function loadAttendanceFromSupabase(startDate?: string, endDate?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await attendanceActions.fetchAttendanceAction(startDate, endDate);
  } catch (error) {
    console.error('Failed to load attendance from Supabase:', error);
    return [];
  }
}

// ============ SUPPLIERS SYNC ============

export async function syncAddSupplier(supplier: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await supplierActions.insertSupplierAction(supplier);
  } catch (error) {
    console.error('Failed to sync supplier to Supabase:', error);
    addToSyncQueue({ id: supplier.id, table: 'suppliers', action: 'CREATE', payload: supplier });
    return null;
  }
}

export async function syncUpdateSupplier(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await supplierActions.updateSupplierAction(id, updates);
  } catch (error) {
    console.error('Failed to update supplier in Supabase:', error);
    addToSyncQueue({ id, table: 'suppliers', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteSupplier(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await supplierActions.deleteSupplierAction(id);
  } catch (error) {
    console.error('Failed to delete supplier from Supabase:', error);
    addToSyncQueue({ id, table: 'suppliers', action: 'DELETE', payload: {} });
  }
}

export async function loadSuppliersFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await supplierActions.fetchSuppliersAction();
  } catch (error) {
    console.error('Failed to load suppliers from Supabase:', error);
    return [];
  }
}

// ============ PURCHASE ORDERS SYNC ============

export async function syncAddPurchaseOrder(po: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await supplierActions.insertPurchaseOrderAction(po);
  } catch (error) {
    console.error('Failed to sync purchase order to Supabase:', error);
    addToSyncQueue({ id: po.id, table: 'purchase_orders', action: 'CREATE', payload: po });
    return null;
  }
}

export async function syncUpdatePurchaseOrder(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await supplierActions.updatePurchaseOrderAction(id, updates);
  } catch (error) {
    console.error('Failed to update purchase order in Supabase:', error);
    addToSyncQueue({ id, table: 'purchase_orders', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncMarkPurchaseOrderAsPaid(id: string, amount?: number) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    // Construct updates object manually to mirror legacy logic
    const updates: any = {
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    };
    if (amount !== undefined) {
      updates.paid_amount = amount;
    }
    return await supplierActions.updatePurchaseOrderAction(id, updates);
  } catch (error) {
    console.error('Failed to mark purchase order as paid in Supabase:', error);
    return null;
  }
}

export async function loadPurchaseOrdersFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await supplierActions.fetchPurchaseOrdersAction();
  } catch (error) {
    console.error('Failed to load purchase orders from Supabase:', error);
    return [];
  }
}

// ============ CASH FLOWS SYNC ============

export async function syncUpsertCashFlow(cashFlow: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await cashActions.upsertCashFlowAction(cashFlow);
  } catch (error) {
    console.error('Failed to sync cash flow to Supabase:', error);
    addToSyncQueue({ id: cashFlow.id, table: 'cash_flows', action: 'CREATE', payload: cashFlow });
    return null;
  }
}

export async function loadCashFlowsFromSupabase(startDate?: string, endDate?: string) {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await cashActions.fetchCashFlowsAction(startDate, endDate);
  } catch (error) {
    console.error('Failed to load cash flows from Supabase:', error);
    return [];
  }
}

// ============ INVENTORY LOGS SYNC ============

export async function syncAddInventoryLog(log: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await inventoryLogActions.insertInventoryLogAction(log);
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
    return await inventoryLogActions.fetchInventoryLogsAction(stockItemId);
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
    const result = await recipeActions.insertRecipeAction(recipe);
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
    return await recipeActions.updateRecipeAction(id, updates);
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
  if (!isSupabaseSyncEnabled()) {
    console.log('[Sync] Supabase sync disabled, skipping shift save');
    return null;
  }

  try {
    console.log('[Sync] Inserting shift:', { id: shift.id, name: shift.name });
    const result = await ops.insertShift(shift);
    console.log('[Sync] Shift inserted successfully:', result?.id || shift.id);
    return result;
  } catch (error: any) {
    console.error('[Sync] Failed to insert shift:', {
      shiftId: shift.id,
      shiftName: shift.name,
      error: error?.message || error,
      code: error?.code,
      details: error?.details,
    });
    addToSyncQueue({ id: shift.id, table: 'shifts', action: 'CREATE', payload: shift });
    return null;
  }
}

export async function syncUpdateShift(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateShift(id, updates);
  } catch (error) {
    console.error('Failed to update shift in Supabase:', error);
    addToSyncQueue({ id, table: 'shifts', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteShift(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteShift(id);
  } catch (error) {
    console.error('Failed to delete shift from Supabase:', error);
    addToSyncQueue({ id, table: 'shifts', action: 'DELETE', payload: {} });
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
  if (!isSupabaseSyncEnabled()) {
    console.log('[Sync] Supabase sync disabled, skipping schedule entry save');
    return null;
  }

  try {
    console.log('[Sync] Inserting schedule entry:', {
      id: entry.id,
      date: entry.date,
      staffId: entry.staffId,
      staffName: entry.staffName,
      shiftId: entry.shiftId,
    });
    const result = await ops.insertScheduleEntry(entry);
    console.log('[Sync] Schedule entry inserted successfully:', result?.id || entry.id);
    return result;
  } catch (error: any) {
    console.error('[Sync] Failed to insert schedule entry:', {
      entryId: entry.id,
      staffId: entry.staffId,
      shiftId: entry.shiftId,
      date: entry.date,
      error: error?.message || error,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    addToSyncQueue({ id: entry.id, table: 'schedule_entries', action: 'CREATE', payload: entry });
    return null;
  }
}

export async function syncUpdateScheduleEntry(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateScheduleEntry(id, updates);
  } catch (error) {
    console.error('Failed to update schedule entry in Supabase:', error);
    addToSyncQueue({ id, table: 'schedule_entries', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteScheduleEntry(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteScheduleEntry(id);
  } catch (error) {
    console.error('Failed to delete schedule entry from Supabase:', error);
    addToSyncQueue({ id, table: 'schedule_entries', action: 'DELETE', payload: {} });
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
    addToSyncQueue({ id: order.id, table: 'delivery_orders', action: 'CREATE', payload: order });
    return null;
  }
}

export async function syncUpdateDeliveryOrder(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateDeliveryOrder(id, updates);
  } catch (error) {
    console.error('Failed to update delivery order in Supabase:', error);
    addToSyncQueue({ id, table: 'delivery_orders', action: 'UPDATE', payload: updates });
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


// ============ STAFF KPI SYNC ============

export async function syncUpsertStaffKPI(kpi: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.upsertStaffKPI(kpi);
  } catch (error) {
    console.error('Failed to sync staff KPI to Supabase:', error);
    addToSyncQueue({ id: kpi.id, table: 'staff_kpi', action: 'CREATE', payload: kpi });
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
    addToSyncQueue({ id: record.id, table: 'leave_records', action: 'CREATE', payload: record });
    return null;
  }
}

export async function syncUpdateLeaveRecord(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateLeaveRecord(id, updates);
  } catch (error) {
    console.error('Failed to update leave record in Supabase:', error);
    addToSyncQueue({ id, table: 'leave_records', action: 'UPDATE', payload: updates });
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
    addToSyncQueue({ id: record.id, table: 'training_records', action: 'CREATE', payload: record });
    return null;
  }
}

export async function syncUpdateTrainingRecord(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateTrainingRecord(id, updates);
  } catch (error) {
    console.error('Failed to update training record in Supabase:', error);
    addToSyncQueue({ id, table: 'training_records', action: 'UPDATE', payload: updates });
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
    addToSyncQueue({ id: record.id, table: 'ot_records', action: 'CREATE', payload: record });
    return null;
  }
}

export async function syncUpdateOTRecord(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateOTRecord(id, updates);
  } catch (error) {
    console.error('Failed to update OT record in Supabase:', error);
    addToSyncQueue({ id, table: 'ot_records', action: 'UPDATE', payload: updates });
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
    addToSyncQueue({ id: review.id, table: 'customer_reviews', action: 'CREATE', payload: review });
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
    addToSyncQueue({ id: template.id, table: 'checklist_templates', action: 'CREATE', payload: template });
    return null;
  }
}

export async function syncUpdateChecklistTemplate(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateChecklistTemplate(id, updates);
  } catch (error) {
    console.error('Failed to update checklist template in Supabase:', error);
    addToSyncQueue({ id, table: 'checklist_templates', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteChecklistTemplate(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteChecklistTemplate(id);
  } catch (error) {
    console.error('Failed to delete checklist template from Supabase:', error);
    addToSyncQueue({ id, table: 'checklist_templates', action: 'DELETE', payload: {} });
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
    addToSyncQueue({ id: completion.id, table: 'checklist_completions', action: 'CREATE', payload: completion });
    return null;
  }
}

export async function syncUpdateChecklistCompletion(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateChecklistCompletion(id, updates);
  } catch (error) {
    console.error('Failed to update checklist completion in Supabase:', error);
    addToSyncQueue({ id, table: 'checklist_completions', action: 'UPDATE', payload: updates });
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
    addToSyncQueue({ id: balance.id || balance.staffId, table: 'leave_balances', action: 'CREATE', payload: balance });
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
    addToSyncQueue({ id: request.id, table: 'leave_requests', action: 'CREATE', payload: request });
    return null;
  }
}

export async function syncUpdateLeaveRequest(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateLeaveRequest(id, updates);
  } catch (error) {
    console.error('Failed to update leave request in Supabase:', error);
    addToSyncQueue({ id, table: 'leave_requests', action: 'UPDATE', payload: updates });
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
    addToSyncQueue({ id: request.id, table: 'claim_requests', action: 'CREATE', payload: request });
    return null;
  }
}

export async function syncUpdateClaimRequest(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateClaimRequest(id, updates);
  } catch (error) {
    console.error('Failed to update claim request in Supabase:', error);
    addToSyncQueue({ id, table: 'claim_requests', action: 'UPDATE', payload: updates });
    return null;
  }
}
export async function syncAddPerformanceReview(review: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    const savedReview = await ops.insertPerformanceReview(review);
    return savedReview;
  } catch (error) {
    console.error('Failed to sync performance review to Supabase:', error);
    // Offline Queue
    addToSyncQueue({ id: review.id, table: 'performance_reviews', action: 'CREATE', payload: review });
    console.log('Saved to offline queue (Performance Review)');
    return null;
  }
}

// ============ OT CLAIMS SYNC ============

export async function syncAddOTClaim(claim: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    const savedClaim = await ops.insertOTClaim(claim);
    return savedClaim;
  } catch (error) {
    console.error('Failed to sync OT claim to Supabase:', error);
    // Offline Queue
    addToSyncQueue({ id: claim.id, table: 'ot_claims', action: 'CREATE', payload: claim });
    console.log('Saved to offline queue (OT Claim)');
    return null;
  }
}

export async function syncUpdateOTClaim(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    const updatedClaim = await ops.updateOTClaim(id, updates);
    return updatedClaim;
  } catch (error) {
    console.error('Failed to sync OT claim update to Supabase:', error);
    // Offline Queue
    addToSyncQueue({ id: id, table: 'ot_claims', action: 'UPDATE', payload: updates });
    console.log('Saved to offline queue (OT Claim Update)');
    return null;
  }
}

// ============ SALARY ADVANCES SYNC ============

export async function syncAddSalaryAdvance(advance: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    const newAdvance = await ops.insertSalaryAdvance(advance);
    return newAdvance;
  } catch (error) {
    console.error('Failed to sync salary advance addition to Supabase:', error);
    // Offline Queue
    addToSyncQueue({ id: advance.id, table: 'staff_advances', action: 'CREATE', payload: advance });
    console.log('Saved to offline queue (Salary Advance Create)');
    return null;
  }
}

export async function syncUpdateSalaryAdvance(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    const updatedAdvance = await ops.updateSalaryAdvance(id, updates);
    return updatedAdvance;
  } catch (error) {
    console.error('Failed to sync salary advance update to Supabase:', error);
    // Offline Queue
    addToSyncQueue({ id: id, table: 'staff_advances', action: 'UPDATE', payload: updates });
    console.log('Saved to offline queue (Salary Advance Update)');
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
    addToSyncQueue({ id: request.id, table: 'staff_requests', action: 'CREATE', payload: request });
    return null;
  }
}

export async function syncUpdateStaffRequest(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateStaffRequest(id, updates);
  } catch (error) {
    console.error('Failed to update staff request in Supabase:', error);
    addToSyncQueue({ id, table: 'staff_requests', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteStaffRequest(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteStaffRequest(id);
  } catch (error) {
    console.error('Failed to delete staff request from Supabase:', error);
    addToSyncQueue({ id, table: 'staff_requests', action: 'DELETE', payload: {} });
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
    addToSyncQueue({ id: announcement.id, table: 'announcements', action: 'CREATE', payload: announcement });
    return null;
  }
}

export async function syncUpdateAnnouncement(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateAnnouncement(id, updates);
  } catch (error) {
    console.error('Failed to update announcement in Supabase:', error);
    addToSyncQueue({ id, table: 'announcements', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteAnnouncement(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteAnnouncement(id);
  } catch (error) {
    console.error('Failed to delete announcement from Supabase:', error);
    addToSyncQueue({ id, table: 'announcements', action: 'DELETE', payload: {} });
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
    addToSyncQueue({ id: tracker.id || tracker.fryerId, table: 'oil_trackers', action: 'CREATE', payload: tracker });
    return null;
  }
}

export async function syncUpdateOilTracker(fryerId: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateOilTracker(fryerId, updates);
  } catch (error) {
    console.error('Failed to update oil tracker in Supabase:', error);
    addToSyncQueue({ id: fryerId, table: 'oil_trackers', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteOilTracker(fryerId: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await ops.deleteOilTracker(fryerId);
  } catch (error) {
    console.error('Failed to delete oil tracker from Supabase:', error);
    addToSyncQueue({ id: fryerId, table: 'oil_trackers', action: 'DELETE', payload: {} });
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
    addToSyncQueue({ id: request.id, table: 'oil_change_requests', action: 'CREATE', payload: request });
    return null;
  }
}

export async function syncUpdateOilChangeRequest(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateOilChangeRequest(id, updates);
  } catch (error) {
    console.error('Failed to update oil change request in Supabase:', error);
    addToSyncQueue({ id, table: 'oil_change_requests', action: 'UPDATE', payload: updates });
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
    addToSyncQueue({ id: history.id, table: 'oil_action_history', action: 'CREATE', payload: history });
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

// ============ INITIAL LOAD ALL DATA ============

export async function loadCriticalDataFromSupabase() {
  if (!isSupabaseSyncEnabled()) {
    return {
      staff: [],
      menuItems: [],
      modifierGroups: [],
      modifierOptions: [],
      menuCategories: [],
      paymentMethods: [],
      taxRates: [],
      positions: [],
      announcements: [],
      cashRegisters: [],
      notifications: [],
    };
  }

  try {
    const results = await Promise.allSettled([
      ops.fetchStaff(),               // 0
      ops.fetchMenuItems(),           // 1
      ops.fetchModifierGroups(),      // 2
      ops.fetchModifierOptions(),     // 3
      PaymentTaxSync.getAllMenuCategories(), // 4
      PaymentTaxSync.getAllPaymentMethods(), // 5
      PaymentTaxSync.getAllTaxRates(),       // 6
      loadPositionsFromSupabase(),           // 7
      ops.fetchAnnouncements(),              // 8
      ops.fetchCashRegisters(),              // 9
      ops.fetchNotifications(),              // 10
    ]);

    const getResult = <T,>(index: number, defaultValue: T): T => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        return result.value as T;
      } else {
        console.error(`Failed to load critical data at index ${index}: `, result.reason);
        return defaultValue;
      }
    };

    return {
      staff: getResult(0, []),
      menuItems: getResult(1, []),
      modifierGroups: getResult(2, []),
      modifierOptions: getResult(3, []),
      menuCategories: getResult<any>(4, { data: [] }).data || [],
      paymentMethods: getResult<any>(5, { data: [] }).data || [],
      taxRates: getResult<any>(6, { data: [] }).data || [],
      positions: getResult(7, []),
      announcements: getResult(8, []),
      cashRegisters: getResult(9, []),
      notifications: getResult(10, []),
    };
  } catch (error) {
    console.error('Critical failure in loadCriticalDataFromSupabase:', error);
    return {
      staff: [], menuItems: [], modifierGroups: [], modifierOptions: [],
      menuCategories: [], paymentMethods: [], taxRates: [], positions: [],
      announcements: [], cashRegisters: [], notifications: []
    };
  }
}

export async function loadSecondaryDataFromSupabase(menuItems: any[] = []) {
  if (!isSupabaseSyncEnabled()) {
    return {
      inventory: [],
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
      oilTrackers: [],
      oilChangeRequests: [],
      oilActionHistory: [],
      equipment: [],
      maintenanceSchedules: [],
      maintenanceLogs: [],
      otClaims: [],
      salaryAdvances: [],
      disciplinaryActions: [],
      staffTraining: [],
      staffDocuments: [],
      performanceReviews: [],
      onboardingChecklists: [],
      exitInterviews: [],
      staffComplaints: [],
      voidRefundRequests: [],
      inventoryLogs: [],
    };
  }

  try {
    const results = await Promise.allSettled([
      ops.fetchInventory(),           // 0
      ops.fetchOrders(100),           // 1
      ops.fetchCustomers(),           // 2
      ops.fetchExpenses(),            // 3
      ops.fetchAttendance(),          // 4
      ops.fetchSuppliers(),           // 5
      ops.fetchPurchaseOrders(),      // 6
      ops.fetchRecipes(),             // 7
      ops.fetchShifts(),              // 8
      ops.fetchScheduleEntries(),     // 9
      ops.fetchPromotions(),          // 10
      ops.fetchProductionLogs(),      // 11
      ops.fetchDeliveryOrders(),      // 12
      ops.fetchCashFlows(),           // 13
      ops.fetchStaffKPI(),            // 14
      ops.fetchLeaveRecords(),        // 15
      ops.fetchTrainingRecords(),     // 16
      ops.fetchOTRecords(),           // 17
      ops.fetchCustomerReviews(),     // 18
      ops.fetchChecklistTemplates(),  // 19
      ops.fetchChecklistCompletions(),// 20
      ops.fetchLeaveBalances(),       // 21
      ops.fetchLeaveRequests(),       // 22
      ops.fetchClaimRequests(),       // 23
      ops.fetchStaffRequests(),       // 24
      ops.fetchOilTrackers(),         // 25
      ops.fetchOilChangeRequests(),   // 26
      ops.fetchOilActionHistory(),    // 27
      ops.fetchEquipment(),           // 28
      ops.fetchMaintenanceSchedules(),// 29
      ops.fetchMaintenanceLogs(),     // 30
      ops.fetchOTClaims(),            // 31
      ops.fetchSalaryAdvances(),      // 32
      ops.fetchDisciplinaryActions(), // 33
      ops.fetchStaffTraining(),       // 34
      ops.fetchStaffDocuments(),      // 35
      ops.fetchPerformanceReviews(),  // 36
      ops.fetchOnboardingChecklists(),// 37
      ops.fetchExitInterviews(),      // 38
      ops.fetchStaffComplaints(),     // 39
      ops.fetchVoidRefundRequests(),  // 40
    ]);

    const getResult = <T,>(index: number, defaultValue: T): T => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        return result.value as T;
      } else {
        console.error(`Failed to load secondary data at index ${index}: `, result.reason);
        return defaultValue;
      }
    };

    return {
      inventory: getResult(0, []),
      orders: getResult(1, []),
      customers: getResult(2, []),
      expenses: getResult(3, []),
      attendance: getResult(4, []),
      suppliers: getResult(5, []),
      purchaseOrders: getResult(6, []),
      recipes: getResult<any[]>(7, []).map(r => ({
        ...r,
        menuItemName: menuItems.find(m => m.id === r.menuItemId)?.name || 'Unknown'
      })),
      shifts: getResult(8, []),
      schedules: getResult(9, []),
      promotions: getResult(10, []),
      productionLogs: getResult(11, []),
      deliveryOrders: getResult(12, []),
      cashFlows: getResult(13, []),
      staffKPI: getResult(14, []),
      leaveRecords: getResult(15, []),
      trainingRecords: getResult(16, []),
      otRecords: getResult(17, []),
      customerReviews: getResult(18, []),
      checklistTemplates: getResult(19, []),
      checklistCompletions: getResult(20, []),
      leaveBalances: getResult(21, []),
      leaveRequests: getResult(22, []),
      claimRequests: getResult(23, []),
      staffRequests: getResult(24, []),
      oilTrackers: getResult(25, []),
      oilChangeRequests: getResult(26, []),
      oilActionHistory: getResult(27, []),
      equipment: getResult(28, []),
      maintenanceSchedules: getResult(29, []),
      maintenanceLogs: getResult(30, []),
      otClaims: getResult(31, []),
      salaryAdvances: getResult(32, []),
      disciplinaryActions: getResult(33, []),
      staffTraining: getResult(34, []),
      staffDocuments: getResult(35, []),
      performanceReviews: getResult(36, []),
      onboardingChecklists: getResult(37, []),
      exitInterviews: getResult(38, []),
      staffComplaints: getResult(39, []),
      voidRefundRequests: getResult(40, []),
      inventoryLogs: [], // Explicitly empty as per original behavior
    };
  } catch (error) {
    console.error('Failure in loadSecondaryDataFromSupabase:', error);
    return {
      inventory: [], orders: [], customers: [], expenses: [], attendance: [],
      suppliers: [], purchaseOrders: [], recipes: [], shifts: [], schedules: [],
      promotions: [], productionLogs: [], deliveryOrders: [], cashFlows: [],
      staffKPI: [], leaveRecords: [], trainingRecords: [], otRecords: [],
      customerReviews: [], checklistTemplates: [], checklistCompletions: [],
      leaveBalances: [], leaveRequests: [], claimRequests: [], staffRequests: [],
      oilTrackers: [], oilChangeRequests: [], oilActionHistory: [], equipment: [],
      maintenanceSchedules: [], maintenanceLogs: [], otClaims: [], salaryAdvances: [],
      disciplinaryActions: [], staffTraining: [], staffDocuments: [],
      performanceReviews: [], onboardingChecklists: [], exitInterviews: [],
      staffComplaints: [], voidRefundRequests: [], inventoryLogs: [],
    };
  }
}

export async function loadAllDataFromSupabase() {
  const critical = await loadCriticalDataFromSupabase();
  const secondary = await loadSecondaryDataFromSupabase(critical.menuItems);

  return {
    ...critical,
    ...secondary,
  };
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

// ============ DISCIPLINARY ACTIONS SYNC ============

export async function syncAddDisciplinaryAction(action: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertDisciplinaryAction(action);
  } catch (error) {
    console.error('Failed to sync disciplinary action to Supabase:', error);
    addToSyncQueue({ id: action.id, table: 'disciplinary_actions', action: 'CREATE', payload: action });
    return null;
  }
}

export async function syncUpdateDisciplinaryAction(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateDisciplinaryAction(id, updates);
  } catch (error) {
    console.error('Failed to sync disciplinary action update:', error);
    addToSyncQueue({ id, table: 'disciplinary_actions', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteDisciplinaryAction(id: string) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    await ops.deleteDisciplinaryAction(id);
  } catch (error) {
    console.error('Failed to sync delete disciplinary action:', error);
    addToSyncQueue({ id, table: 'disciplinary_actions', action: 'DELETE', payload: {} });
  }
}

// ============ STAFF TRAINING SYNC ============

export async function syncAddStaffTraining(training: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertStaffTraining(training);
  } catch (error) {
    console.error('Failed to sync staff training to Supabase:', error);
    addToSyncQueue({ id: training.id, table: 'staff_training', action: 'CREATE', payload: training });
    return null;
  }
}

export async function syncUpdateStaffTraining(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateStaffTraining(id, updates);
  } catch (error) {
    console.error('Failed to sync staff training update:', error);
    addToSyncQueue({ id, table: 'staff_training', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteStaffTraining(id: string) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    await ops.deleteStaffTraining(id);
  } catch (error) {
    console.error('Failed to sync delete staff training:', error);
    addToSyncQueue({ id, table: 'staff_training', action: 'DELETE', payload: {} });
  }
}

// ============ STAFF DOCUMENTS SYNC ============

export async function syncAddStaffDocument(doc: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.insertStaffDocument(doc);
  } catch (error) {
    console.error('Failed to sync staff document to Supabase:', error);
    addToSyncQueue({ id: doc.id, table: 'staff_documents', action: 'CREATE', payload: doc });
    return null;
  }
}

export async function syncUpdateStaffDocument(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await ops.updateStaffDocument(id, updates);
  } catch (error) {
    console.error('Failed to sync staff document update:', error);
    addToSyncQueue({ id, table: 'staff_documents', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeleteStaffDocument(id: string) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    await ops.deleteStaffDocument(id);
  } catch (error) {
    console.error('Failed to sync delete staff document:', error);
    addToSyncQueue({ id, table: 'staff_documents', action: 'DELETE', payload: {} });
  }
}

// ============ LOYALTY SYNC ============

export async function syncAddLoyaltyTransaction(transaction: any, options?: { fromQueue?: boolean }) {
  if (!isSupabaseSyncEnabled()) return null;

  if (options?.fromQueue) {
    return await ops.insertLoyaltyTransaction(transaction);
  }

  try {
    return await ops.insertLoyaltyTransaction(transaction);
  } catch (error) {
    console.error('Failed to sync loyalty transaction to Supabase:', error);
    if (typeof error === 'object' && error !== null) {
      const err = error as any;
      console.error('Error info:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
    }
    addToSyncQueue({ id: transaction.id, table: 'loyalty_transactions', action: 'CREATE', payload: transaction });
    return null;
  }
}

// ============ STAFF POSITIONS SYNC ============

export async function syncAddPosition(position: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await staffActions.insertStaffPositionAction(position);
  } catch (error) {
    console.error('Failed to sync position to Supabase:', error);
    addToSyncQueue({ id: position.id, table: 'staff_positions', action: 'CREATE', payload: position });
    return null;
  }
}

export async function syncUpdatePosition(id: string, updates: any) {
  if (!isSupabaseSyncEnabled()) return null;

  try {
    return await staffActions.updateStaffPositionAction(id, updates);
  } catch (error) {
    console.error('Failed to update position in Supabase:', error);
    addToSyncQueue({ id, table: 'staff_positions', action: 'UPDATE', payload: updates });
    return null;
  }
}

export async function syncDeletePosition(id: string) {
  if (!isSupabaseSyncEnabled()) return;

  try {
    await staffActions.deleteStaffPositionAction(id);
  } catch (error) {
    console.error('Failed to delete position from Supabase:', error);
    addToSyncQueue({ id, table: 'staff_positions', action: 'DELETE', payload: {} });
  }
}

export async function loadPositionsFromSupabase() {
  if (!isSupabaseSyncEnabled()) return [];

  try {
    return await staffActions.fetchStaffPositionsAction();
  } catch (error) {
    console.error('Failed to load positions from Supabase:', error);
    return [];
  }
}

