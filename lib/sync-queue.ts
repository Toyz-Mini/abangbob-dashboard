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
    | 'suppliers';

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
export async function processSyncQueue(ops: any): Promise<{ successCount: number; failCount: number }> {
    if (typeof window === 'undefined') return { successCount: 0, failCount: 0 };
    if (!navigator.onLine) return { successCount: 0, failCount: 0 };

    const queue = getSyncQueue();
    if (queue.length === 0) return { successCount: 0, failCount: 0 };

    console.log(`[SyncQueue] Processing ${queue.length} items...`);

    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
        try {
            console.log(`[SyncQueue] Processing item:`, item);

            switch (item.table) {
                case 'orders':
                    if (item.action === 'CREATE') await ops.insertOrder(item.payload);
                    break;

                case 'inventory':
                    if (item.action === 'UPDATE') await ops.updateInventoryItem(item.id, item.payload);
                    break;

                case 'customers':
                    if (item.action === 'CREATE') await ops.insertCustomer(item.payload);
                    if (item.action === 'UPDATE') await ops.updateCustomer(item.id, item.payload);
                    break;

                default:
                    console.warn(`[SyncQueue] Unknown table or action: ${item.table} ${item.action}`);
            }

            // If successful, remove from queue
            removeFromSyncQueue(item.timestamp);
            successCount++;

        } catch (err) {
            console.error(`[SyncQueue] Failed to process item ${item.id}:`, err);
            failCount++;
        }
    }

    return { successCount, failCount };
}
