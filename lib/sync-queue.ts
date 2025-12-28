export type SyncActionType = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncTable =
    | 'orders'
    | 'customers'
    | 'inventory'
    | 'inventory_logs'
    | 'modifiers'
    | 'modifier_options'
    | 'recipes'
    | 'purchase_orders'
    | 'suppliers'
    | 'promotions'
    | 'loyalty_transactions'
    | 'promo_usages'
    | 'performance_reviews'
    | 'ot_claims'
    | 'disciplinary_actions'
    | 'staff_training'
    | 'staff_documents'
    | 'staff_positions'
    | 'staff'
    | 'attendance'
    | 'menu_items'
    | 'shifts'
    | 'schedule_entries'
    | 'expenses'
    | 'cash_flows'
    | 'leave_requests'
    | 'claim_requests'
    | 'staff_requests'
    | 'announcements'
    | 'void_refund_requests'
    | 'oil_trackers'
    | 'oil_change_requests'
    | 'oil_action_history'
    | 'production_logs'
    | 'public_holidays'
    | 'holiday_policies'
    | 'holiday_work_logs'
    | 'replacement_leaves'
    | 'cash_payouts'
    | 'shift_definitions'
    | 'staff_shifts'
    | 'system_settings'
    | 'equipment'
    | 'maintenance_schedule'
    | 'maintenance_logs'
    | 'waste_logs'
    | 'menu_categories'
    | 'payment_methods'
    | 'tax_rates'
    | 'cash_registers'
    | 'salary_advances'
    | 'onboarding_checklists'
    | 'exit_interviews'
    | 'staff_complaints'
    | 'checklist_templates'
    | 'checklist_completions'
    | 'leave_balances'
    | 'staff_kpi'
    | 'training_records'
    | 'ot_records'
    | 'customer_reviews'
    | 'delivery_orders'
    | 'leave_records';


export interface SyncItem {
    id: string; // UUID of the item being acted on
    table: SyncTable;
    action: SyncActionType;
    payload: any; // The data to sync
    timestamp: number;
    retryCount: number;
}

const STORAGE_KEY = 'abangbob_sync_queue';

/**
 * Get the current sync queue from localStorage
 */
export function getSyncQueue(): SyncItem[] {
    if (typeof window === 'undefined') return [];

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (err) {
        console.error('Failed to parse sync queue:', err);
        return [];
    }
}

/**
 * Add an item to the offline sync queue
 */
export function addToSyncQueue(item: Omit<SyncItem, 'timestamp' | 'retryCount'>) {
    try {
        const queue = getSyncQueue();

        // Check for duplicates strategies could go here
        const newItem: SyncItem = {
            ...item,
            timestamp: Date.now(),
            retryCount: 0
        };

        queue.push(newItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        console.log(`[SyncQueue] Added to queue: ${item.table} (${item.action})`);
    } catch (err) {
        console.error('Failed to add to sync queue:', err);
    }
}

/**
 * Remove an item from the queue (after successful sync)
 */
export function removeFromSyncQueue(timestamp: number) {
    try {
        const queue = getSyncQueue();
        const newQueue = queue.filter(item => item.timestamp !== timestamp);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newQueue));
    } catch (err) {
        console.error('Failed to remove from sync queue:', err);
    }
}

/**
 * Clear the entire queue (dangerous)
 */
export function clearSyncQueue() {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Process the queue - this will be called when online
 * Returns stats for UI to display notifications
 */
export async function processSyncQueue(ops: any): Promise<{ successCount: number; failCount: number; droppedCount: number }> {
    if (typeof window === 'undefined') return { successCount: 0, failCount: 0, droppedCount: 0 };
    if (!navigator.onLine) return { successCount: 0, failCount: 0, droppedCount: 0 };

    const queue = getSyncQueue();
    if (queue.length === 0) return { successCount: 0, failCount: 0, droppedCount: 0 };

    console.log(`[SyncQueue] Processing ${queue.length} items...`);

    let successCount = 0;
    let failCount = 0;
    let droppedCount = 0;
    const MAX_RETRIES = 3;
    let queueModified = false;

    // We process items sequentially
    // We must re-read queue completely if we want to modify it safely, 
    // but since we are the only processor, we can iterate and build a new queue state.
    // Note: getSyncQueue() returns a fresh array. 
    // We will mutate 'currentQueue' logic conceptually or just map/filter.

    for (const item of queue) { // iterate original snapshot
        try {
            console.log(`[SyncQueue] Processing item:`, item);

            switch (item.table) {
                case 'orders':
                    if (item.action === 'CREATE') await ops.syncAddOrder(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateOrder(item.id, item.payload);
                    break;

                case 'inventory':
                    if (item.action === 'UPDATE') await ops.syncUpdateStockItem(item.id, item.payload);
                    if (item.action === 'CREATE') await ops.syncAddStockItem(item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteStockItem(item.id);
                    break;

                case 'inventory_logs':
                    if (item.action === 'CREATE') await ops.syncAddInventoryLog(item.payload);
                    break;

                case 'customers':
                    if (item.action === 'CREATE') await ops.syncAddCustomer(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateCustomer(item.id, item.payload);
                    break;

                case 'staff':
                    if (item.action === 'CREATE') await ops.syncAddStaff(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateStaff(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteStaff(item.id);
                    break;

                case 'attendance':
                    if (item.action === 'CREATE') await ops.syncAddAttendance(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateAttendance(item.id, item.payload);
                    break;

                case 'shifts':
                    if (item.action === 'CREATE') await ops.syncAddShift(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateShift(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteShift(item.id);
                    break;

                case 'schedule_entries':
                    if (item.action === 'CREATE') await ops.syncAddScheduleEntry(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateScheduleEntry(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteScheduleEntry(item.id);
                    break;

                case 'expenses':
                    if (item.action === 'CREATE') await ops.syncAddExpense(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateExpense(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteExpense(item.id);
                    break;

                case 'cash_flows':
                    if (item.action === 'CREATE') await ops.syncAddCashFlow(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateCashFlow(item.id, item.payload);
                    break;

                case 'leave_requests':
                    if (item.action === 'CREATE') await ops.syncAddLeaveRequest(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateLeaveRequest(item.id, item.payload);
                    break;

                case 'claim_requests':
                    if (item.action === 'CREATE') await ops.syncAddClaimRequest(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateClaimRequest(item.id, item.payload);
                    break;

                case 'staff_requests':
                    if (item.action === 'CREATE') await ops.syncAddStaffRequest(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateStaffRequest(item.id, item.payload);
                    break;

                case 'announcements':
                    if (item.action === 'CREATE') await ops.syncAddAnnouncement(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateAnnouncement(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteAnnouncement(item.id);
                    break;

                case 'oil_trackers':
                    if (item.action === 'CREATE') await ops.syncAddOilTracker(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateOilTracker(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteOilTracker(item.id);
                    break;

                case 'oil_change_requests':
                    if (item.action === 'CREATE') await ops.syncAddOilChangeRequest(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateOilChangeRequest(item.id, item.payload);
                    break;

                case 'oil_action_history':
                    if (item.action === 'CREATE') await ops.syncAddOilActionHistory(item.payload);
                    break;

                case 'production_logs':
                    if (item.action === 'CREATE') await ops.syncAddProductionLog(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateProductionLog(item.id, item.payload);
                    break;

                case 'delivery_orders':
                    if (item.action === 'CREATE') await ops.syncAddDeliveryOrder(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateDeliveryOrder(item.id, item.payload);
                    break;

                case 'public_holidays':
                    if (item.action === 'CREATE') await ops.syncAddPublicHoliday(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdatePublicHoliday(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeletePublicHoliday(item.id);
                    break;

                case 'holiday_policies':
                    if (item.action === 'CREATE') await ops.syncAddHolidayPolicy(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateHolidayPolicy(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteHolidayPolicy(item.id);
                    break;

                case 'holiday_work_logs':
                    if (item.action === 'CREATE') await ops.syncAddHolidayWorkLog(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateHolidayWorkLog(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteHolidayWorkLog(item.id);
                    break;

                case 'replacement_leaves':
                    if (item.action === 'CREATE') await ops.syncAddReplacementLeave(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateReplacementLeave(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteReplacementLeave(item.id);
                    break;

                case 'cash_payouts':
                    if (item.action === 'CREATE') await ops.syncAddCashPayout(item.payload);
                    break;

                case 'staff_positions':
                    if (item.action === 'CREATE') await ops.syncAddPosition(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdatePosition(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeletePosition(item.id);
                    break;

                case 'promotions':
                    if (item.action === 'CREATE') await ops.syncAddPromotion(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdatePromotion(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeletePromotion(item.id);
                    break;

                case 'loyalty_transactions':
                    if (item.action === 'CREATE') await ops.syncAddLoyaltyTransaction(item.payload);
                    break;

                case 'performance_reviews':
                    if (item.action === 'CREATE') await ops.syncAddPerformanceReview(item.payload);
                    break;

                case 'ot_claims':
                    if (item.action === 'CREATE') await ops.syncAddOTClaim(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateOTClaim(item.id, item.payload);
                    break;

                case 'disciplinary_actions':
                    if (item.action === 'CREATE') await ops.syncAddDisciplinaryAction(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateDisciplinaryAction(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteDisciplinaryAction(item.id);
                    break;

                case 'staff_training':
                    if (item.action === 'CREATE') await ops.syncAddStaffTraining(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateStaffTraining(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteStaffTraining(item.id);
                    break;

                case 'staff_documents':
                    if (item.action === 'CREATE') await ops.syncAddStaffDocument(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateStaffDocument(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteStaffDocument(item.id);
                    break;

                case 'shift_definitions':
                    if (item.action === 'CREATE') await ops.syncAddShiftDefinition(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateShiftDefinition(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteShiftDefinition(item.id);
                    break;

                case 'staff_shifts':
                    if (item.action === 'UPDATE') await ops.syncUpsertStaffShift(item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteStaffShift(item.id);
                    break;

                case 'system_settings':
                    if (item.action === 'UPDATE') await ops.syncUpdateSystemSetting(item.payload.key, item.payload.value);
                    break;

                case 'equipment':
                    if (item.action === 'CREATE') await ops.syncAddEquipment(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateEquipment(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteEquipment(item.id);
                    break;

                case 'maintenance_schedule':
                    if (item.action === 'CREATE') await ops.syncAddMaintenanceSchedule(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateMaintenanceSchedule(item.id, item.payload);
                    break;

                case 'maintenance_logs':
                    if (item.action === 'CREATE') await ops.syncAddMaintenanceLog(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateMaintenanceLog(item.id, item.payload);
                    break;

                case 'waste_logs':
                    if (item.action === 'CREATE') await ops.syncAddWasteLog(item.payload);
                    break;

                case 'menu_categories':
                    if (item.action === 'CREATE') await ops.syncAddMenuCategory(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateMenuCategory(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteMenuCategory(item.id);
                    break;

                case 'payment_methods':
                    if (item.action === 'CREATE') await ops.syncAddPaymentMethod(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdatePaymentMethod(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeletePaymentMethod(item.id);
                    break;

                case 'tax_rates':
                    if (item.action === 'CREATE') await ops.syncAddTaxRate(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateTaxRate(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteTaxRate(item.id);
                    break;

                case 'cash_registers':
                    if (item.action === 'CREATE') await ops.syncAddCashRegister(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateCashRegister(item.id, item.payload);
                    break;

                case 'salary_advances':
                    if (item.action === 'CREATE') await ops.syncAddSalaryAdvance(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateSalaryAdvance(item.id, item.payload);
                    break;

                case 'onboarding_checklists':
                    if (item.action === 'CREATE') await ops.syncAddOnboardingChecklist(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateOnboardingChecklist(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteOnboardingChecklist(item.id);
                    break;

                case 'exit_interviews':
                    if (item.action === 'CREATE') await ops.syncAddExitInterview(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateExitInterview(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteExitInterview(item.id);
                    break;

                case 'staff_complaints':
                    if (item.action === 'CREATE') await ops.syncAddStaffComplaint(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateStaffComplaint(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteStaffComplaint(item.id);
                    break;

                case 'checklist_templates':
                    if (item.action === 'CREATE') await ops.syncAddChecklistTemplate(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateChecklistTemplate(item.id, item.payload);
                    if (item.action === 'DELETE') await ops.syncDeleteChecklistTemplate(item.id);
                    break;

                case 'checklist_completions':
                    if (item.action === 'CREATE') await ops.syncAddChecklistCompletion(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateChecklistCompletion(item.id, item.payload);
                    break;

                case 'leave_balances':
                    if (item.action === 'UPDATE') await ops.syncUpsertLeaveBalance(item.payload);
                    break;

                case 'staff_kpi':
                    if (item.action === 'UPDATE') await ops.syncUpsertStaffKPI(item.payload);
                    break;

                case 'training_records':
                    if (item.action === 'CREATE') await ops.syncAddTrainingRecord(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateTrainingRecord(item.id, item.payload);
                    break;

                case 'ot_records':
                    if (item.action === 'CREATE') await ops.syncAddOTRecord(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateOTRecord(item.id, item.payload);
                    break;

                case 'customer_reviews':
                    if (item.action === 'CREATE') await ops.syncAddCustomerReview(item.payload);
                    break;

                case 'leave_records':
                    if (item.action === 'CREATE') await ops.syncAddLeaveRecord(item.payload);
                    if (item.action === 'UPDATE') await ops.syncUpdateLeaveRecord(item.id, item.payload);
                    break;

                default:
                    console.warn(`[SyncQueue] Unknown table or action: ${item.table} ${item.action}`);
                    // If unknown, it will never succeed. Treat as success to remove it? 
                    // Or treat as fail and max retries will kill it.
                    throw new Error(`Unknown table/action: ${item.table}/${item.action}`);
            }

            // If successful, remove from queue
            removeFromSyncQueue(item.timestamp);
            successCount++;
            queueModified = true;

        } catch (err) {
            console.error(`[SyncQueue] Failed to process item ${item.id}:`, err);

            // Handle Retry Logic
            // We need to update the item in the storage
            const freshQueue = getSyncQueue();
            const itemIndex = freshQueue.findIndex(i => i.timestamp === item.timestamp);

            if (itemIndex !== -1) {
                const currentItem = freshQueue[itemIndex];
                currentItem.retryCount = (currentItem.retryCount || 0) + 1;

                if (currentItem.retryCount >= MAX_RETRIES) {
                    console.error(`[SyncQueue] Item ${item.id} exceeded max retries (${MAX_RETRIES}). Removing from queue.`);
                    freshQueue.splice(itemIndex, 1); // Remove
                    droppedCount++; // Count as dropped, NOT failed (to avoid retry toast)
                } else {
                    freshQueue[itemIndex] = currentItem; // Update
                    failCount++; // Still trying, so count as fail
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(freshQueue));
                queueModified = true;
            } else {
                // Item disappeared? Count as fail just in case
                failCount++;
            }
        }
    }

    return { successCount, failCount, droppedCount };
}
