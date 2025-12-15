'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/lib/contexts/ToastContext';
import { setOnSyncError, SyncLogEntry } from '@/lib/utils/sync-logger';
import { subscribeToConnectionState, ConnectionStatus } from '@/lib/supabase/client';

/**
 * SyncErrorNotifier Component
 * 
 * This component bridges the sync logger (which runs outside React) 
 * with the Toast context (which requires React).
 * 
 * Mount this component within ToastProvider to enable 
 * automatic toast notifications for sync errors.
 */
export default function SyncErrorNotifier() {
  const { showToast } = useToast();
  const lastConnectionStatus = useRef<ConnectionStatus>('disconnected');
  const errorCount = useRef(0);
  const lastErrorTime = useRef<number>(0);

  useEffect(() => {
    // Rate limiting: Don't show more than 3 errors in 10 seconds
    const shouldShowError = (): boolean => {
      const now = Date.now();
      if (now - lastErrorTime.current > 10000) {
        errorCount.current = 0;
      }
      if (errorCount.current >= 3) {
        return false;
      }
      errorCount.current++;
      lastErrorTime.current = now;
      return true;
    };

    // Set up sync error callback
    setOnSyncError((entry: SyncLogEntry) => {
      if (!shouldShowError()) {
        console.log('[SyncErrorNotifier] Rate limited, not showing toast');
        return;
      }

      // Format user-friendly error message
      const entityName = formatEntityName(entry.entity);
      const operationName = formatOperationName(entry.operation);
      
      let message = `Failed to ${operationName} ${entityName}`;
      
      // Add more context for specific errors
      if (entry.error) {
        if (entry.error.includes('network') || entry.error.includes('fetch')) {
          message = `Network error while saving ${entityName}. Changes saved locally.`;
        } else if (entry.error.includes('permission') || entry.error.includes('RLS')) {
          message = `Permission denied for ${entityName}. Contact admin.`;
        } else if (entry.error.includes('duplicate')) {
          message = `Duplicate entry for ${entityName}.`;
        }
      }

      showToast(message, 'error', 5000);
    });

    // Subscribe to connection state changes
    const unsubscribe = subscribeToConnectionState((state) => {
      // Notify on connection status changes
      if (lastConnectionStatus.current !== state.status) {
        if (lastConnectionStatus.current === 'connected' && state.status === 'disconnected') {
          showToast('Lost connection to database. Changes will be saved locally.', 'warning', 4000);
        } else if (lastConnectionStatus.current === 'disconnected' && state.status === 'connected') {
          showToast('Reconnected to database.', 'success', 3000);
        } else if (state.status === 'offline') {
          showToast('Network offline. Working in offline mode.', 'warning', 4000);
        }
        lastConnectionStatus.current = state.status;
      }
    });

    // Cleanup
    return () => {
      setOnSyncError(null);
      unsubscribe();
    };
  }, [showToast]);

  // This component doesn't render anything
  return null;
}

// Helper functions to format entity and operation names
function formatEntityName(entity: string): string {
  const names: Record<string, string> = {
    menu_items: 'menu item',
    modifier_groups: 'modifier group',
    modifier_options: 'modifier option',
    inventory: 'inventory item',
    staff: 'staff member',
    orders: 'order',
    customers: 'customer',
    expenses: 'expense',
    attendance: 'attendance record',
    suppliers: 'supplier',
    purchase_orders: 'purchase order',
    recipes: 'recipe',
    shifts: 'shift',
    schedules: 'schedule',
    promotions: 'promotion',
    notifications: 'notification',
    unknown: 'data',
  };
  return names[entity] || entity.replace(/_/g, ' ');
}

function formatOperationName(operation: string): string {
  const names: Record<string, string> = {
    insert: 'save',
    update: 'update',
    delete: 'delete',
    fetch: 'load',
    upsert: 'save',
    initial_load: 'load',
    connection_check: 'connect to',
  };
  return names[operation] || operation;
}
