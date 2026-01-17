import { Order } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const OFFLINE_QUEUE_KEY = 'abangbob_offline_queue';

export type QueueItemType = 'order' | 'clock_in' | 'clock_out';

export interface ClockInPayload {
    staffId: string;
    pin: string;
    photoBase64: string;
    latitude: number;
    longitude: number;
    timestamp: string;
}

export interface ClockOutPayload {
    attendanceId: string;
    staffId: string;
    pin: string;
    photoBase64: string;
    latitude: number;
    longitude: number;
    timestamp: string;
}

export interface QueuedItem {
    id: string; // Queue ID
    type: QueueItemType;
    payload: Order | ClockInPayload;
    timestamp: number;
    retryCount: number;
}

export const offlineQueue = {
    // Add item to offline queue
    enqueue: (payload: Order | ClockInPayload, type: QueueItemType = 'order'): void => {
        try {
            const queue = offlineQueue.getQueue();
            const queuedItem: QueuedItem = {
                id: uuidv4(),
                type,
                payload,
                timestamp: Date.now(),
                retryCount: 0
            };

            queue.push(queuedItem);
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
            console.log(`[OfflineQueue] Item (${type}) added to offline queue.`);
        } catch (error) {
            console.error('[OfflineQueue] Failed to enqueue item:', error);
        }
    },

    // Get all queued items
    getQueue: (): QueuedItem[] => {
        if (typeof window === 'undefined') return [];
        try {
            // Check legacy key first (migration support)
            const legacyStored = localStorage.getItem('abangbob_offline_order_queue');
            if (legacyStored) {
                const legacyQueue = JSON.parse(legacyStored);
                // Migrate to new format if needed, or just process and clear
                // Ideally we should migrate them. Let's assume we treat them as 'order' type
                const migrated = legacyQueue.map((item: any) => ({
                    ...item,
                    type: 'order',
                    payload: item.order // Legacy had 'order' property
                }));
                // Save to new key
                localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(migrated));
                localStorage.removeItem('abangbob_offline_order_queue');
                return migrated;
            }

            const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[OfflineQueue] Failed to load queue:', error);
            return [];
        }
    },

    // Remove item from queue
    remove: (queueId: string): void => {
        try {
            const queue = offlineQueue.getQueue();
            const updated = queue.filter(item => item.id !== queueId);
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('[OfflineQueue] Failed to remove item:', error);
        }
    },

    // Update retry count
    incrementRetry: (queueId: string): void => {
        try {
            const queue = offlineQueue.getQueue();
            const item = queue.find(q => q.id === queueId);
            if (item) {
                item.retryCount++;
                localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
            }
        } catch (error) {
            console.error('[OfflineQueue] Failed to update retry count:', error);
        }
    },

    // Clear entire queue
    clear: (): void => {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
    },

    // Get count
    count: (): number => {
        return offlineQueue.getQueue().length;
    }
};
