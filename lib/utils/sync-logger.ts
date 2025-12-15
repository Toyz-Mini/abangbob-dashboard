// Centralized Sync Error Logging Utility
// Tracks sync operations, errors, and provides debugging information

export type SyncOperation = 
  | 'insert' | 'update' | 'delete' | 'fetch' | 'upsert'
  | 'connection_check' | 'initial_load';

export type SyncEntity = 
  | 'menu_items' | 'modifier_groups' | 'modifier_options'
  | 'inventory' | 'staff' | 'orders' | 'customers'
  | 'expenses' | 'attendance' | 'suppliers' | 'purchase_orders'
  | 'recipes' | 'shifts' | 'schedules' | 'promotions'
  | 'notifications' | 'production_logs' | 'delivery_orders'
  | 'cash_flows' | 'staff_kpi' | 'leave_records' | 'training_records'
  | 'ot_records' | 'customer_reviews' | 'checklist_templates'
  | 'checklist_completions' | 'leave_balances' | 'leave_requests'
  | 'claim_requests' | 'staff_requests' | 'announcements'
  | 'oil_trackers' | 'oil_change_requests' | 'oil_action_history'
  | 'unknown';

export type SyncStatus = 'success' | 'error' | 'pending' | 'retrying';

export interface SyncLogEntry {
  id: string;
  timestamp: Date;
  operation: SyncOperation;
  entity: SyncEntity;
  entityId?: string;
  status: SyncStatus;
  error?: string;
  errorCode?: string;
  retryCount: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

// Maximum number of log entries to keep in memory
const MAX_LOG_ENTRIES = 100;

// In-memory log storage
let syncLogs: SyncLogEntry[] = [];

// Listeners for sync log updates
type SyncLogListener = (logs: SyncLogEntry[]) => void;
const syncLogListeners: Set<SyncLogListener> = new Set();

// Error callback for toast notifications
type SyncErrorCallback = (entry: SyncLogEntry) => void;
let onSyncError: SyncErrorCallback | null = null;

export function setOnSyncError(callback: SyncErrorCallback | null) {
  onSyncError = callback;
}

// Subscribe to sync log updates
export function subscribeToSyncLogs(listener: SyncLogListener): () => void {
  syncLogListeners.add(listener);
  listener(syncLogs);
  return () => syncLogListeners.delete(listener);
}

function notifySyncLogChange() {
  syncLogListeners.forEach(listener => listener([...syncLogs]));
}

// Generate unique ID for log entries
function generateLogId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Add a new log entry
export function logSync(entry: Omit<SyncLogEntry, 'id' | 'timestamp'>): SyncLogEntry {
  const fullEntry: SyncLogEntry = {
    ...entry,
    id: generateLogId(),
    timestamp: new Date(),
  };

  syncLogs.unshift(fullEntry);
  
  // Trim to max entries
  if (syncLogs.length > MAX_LOG_ENTRIES) {
    syncLogs = syncLogs.slice(0, MAX_LOG_ENTRIES);
  }

  notifySyncLogChange();

  // Notify error callback if this is an error
  if (fullEntry.status === 'error' && onSyncError) {
    onSyncError(fullEntry);
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development' || fullEntry.status === 'error') {
    const logFn = fullEntry.status === 'error' ? console.error : console.log;
    logFn(
      `[Sync ${fullEntry.status.toUpperCase()}]`,
      fullEntry.operation,
      fullEntry.entity,
      fullEntry.entityId || '',
      fullEntry.error || '',
      fullEntry.durationMs ? `(${fullEntry.durationMs}ms)` : ''
    );
  }

  return fullEntry;
}

// Log a successful sync operation
export function logSyncSuccess(
  operation: SyncOperation,
  entity: SyncEntity,
  entityId?: string,
  durationMs?: number,
  metadata?: Record<string, unknown>
): SyncLogEntry {
  return logSync({
    operation,
    entity,
    entityId,
    status: 'success',
    retryCount: 0,
    durationMs,
    metadata,
  });
}

// Log a failed sync operation
export function logSyncError(
  operation: SyncOperation,
  entity: SyncEntity,
  error: Error | string,
  entityId?: string,
  retryCount = 0,
  durationMs?: number,
  metadata?: Record<string, unknown>
): SyncLogEntry {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorCode = error instanceof Error && 'code' in error 
    ? String((error as { code?: string }).code) 
    : undefined;

  return logSync({
    operation,
    entity,
    entityId,
    status: 'error',
    error: errorMessage,
    errorCode,
    retryCount,
    durationMs,
    metadata,
  });
}

// Log a retry attempt
export function logSyncRetry(
  operation: SyncOperation,
  entity: SyncEntity,
  retryCount: number,
  entityId?: string
): SyncLogEntry {
  return logSync({
    operation,
    entity,
    entityId,
    status: 'retrying',
    retryCount,
  });
}

// Get all sync logs
export function getSyncLogs(): SyncLogEntry[] {
  return [...syncLogs];
}

// Get only error logs
export function getSyncErrors(): SyncLogEntry[] {
  return syncLogs.filter(log => log.status === 'error');
}

// Get recent logs (last n entries)
export function getRecentSyncLogs(count: number): SyncLogEntry[] {
  return syncLogs.slice(0, count);
}

// Get logs for a specific entity
export function getSyncLogsForEntity(entity: SyncEntity): SyncLogEntry[] {
  return syncLogs.filter(log => log.entity === entity);
}

// Clear all sync logs
export function clearSyncLogs(): void {
  syncLogs = [];
  notifySyncLogChange();
}

// Get sync statistics
export function getSyncStats(): {
  total: number;
  success: number;
  errors: number;
  pending: number;
  lastError: SyncLogEntry | null;
  lastSuccess: SyncLogEntry | null;
} {
  const success = syncLogs.filter(log => log.status === 'success').length;
  const errors = syncLogs.filter(log => log.status === 'error').length;
  const pending = syncLogs.filter(log => log.status === 'pending' || log.status === 'retrying').length;
  
  const lastError = syncLogs.find(log => log.status === 'error') || null;
  const lastSuccess = syncLogs.find(log => log.status === 'success') || null;

  return {
    total: syncLogs.length,
    success,
    errors,
    pending,
    lastError,
    lastSuccess,
  };
}

// Retry helper with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 10000, onRetry } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Sync result type for better error handling
export type SyncResult<T> = 
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

export function syncSuccess<T>(data: T): SyncResult<T> {
  return { success: true, data, error: null };
}

export function syncError<T>(error: string): SyncResult<T> {
  return { success: false, data: null, error };
}
