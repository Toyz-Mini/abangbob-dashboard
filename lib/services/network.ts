/**
 * Network Utility Service
 * Handles network operations with error handling, retries, and offline support
 */

// Check if browser is online
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

// Network error types
export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly isOffline: boolean = false,
    public readonly isTimeout: boolean = false,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

// Default retry config
const DEFAULT_RETRY_CONFIG: Required<Omit<RetryConfig, 'onRetry'>> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// Calculate exponential backoff delay
function getBackoffDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with automatic retry on failure
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay } = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if offline before attempting
      if (!isOnline()) {
        throw new NetworkError('No internet connection', true);
      }
      
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if offline
      if (error instanceof NetworkError && error.isOffline) {
        throw error;
      }
      
      // Don't retry on final attempt
      if (attempt >= maxRetries) {
        throw lastError;
      }
      
      // Call retry callback if provided
      config.onRetry?.(attempt + 1, lastError);
      
      // Wait before retrying
      const delay = getBackoffDelay(attempt, baseDelay, maxDelay);
      await sleep(delay);
    }
  }
  
  throw lastError || new Error('Retry failed');
}

/**
 * Fetch with timeout and error handling
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new NetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        false,
        false,
        response.status
      );
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof NetworkError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new NetworkError('Request timed out', false, true);
      }
      throw new NetworkError(error.message);
    }
    
    throw new NetworkError('Network request failed');
  }
}

/**
 * Save data to localStorage as a draft (for form preservation)
 */
export function saveDraft<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`draft_${key}`, JSON.stringify({
      data,
      savedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
}

/**
 * Load draft data from localStorage
 */
export function loadDraft<T>(key: string): { data: T; savedAt: string } | null {
  try {
    const saved = localStorage.getItem(`draft_${key}`);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
}

/**
 * Clear draft data from localStorage
 */
export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(`draft_${key}`);
  } catch (error) {
    console.error('Failed to clear draft:', error);
  }
}

/**
 * Get network error message for user display
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    if (error.isOffline) {
      return 'Tiada sambungan internet. Sila semak rangkaian anda.';
    }
    if (error.isTimeout) {
      return 'Permintaan tamat masa. Sila cuba lagi.';
    }
    if (error.statusCode === 401) {
      return 'Sesi anda telah tamat. Sila log masuk semula.';
    }
    if (error.statusCode === 403) {
      return 'Anda tidak mempunyai kebenaran untuk tindakan ini.';
    }
    if (error.statusCode === 404) {
      return 'Sumber tidak dijumpai.';
    }
    if (error.statusCode && error.statusCode >= 500) {
      return 'Ralat pelayan. Sila cuba lagi kemudian.';
    }
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Ralat tidak diketahui. Sila cuba lagi.';
}

/**
 * API Error result type
 */
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  isRetryable?: boolean;
}

/**
 * Execute an API call with graceful error handling
 * Returns a result object instead of throwing
 */
export async function safeApiCall<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    onError?: (error: Error) => void;
  } = {}
): Promise<ApiResult<T>> {
  const { retries = 0, onError } = options;
  
  try {
    // Check if offline first
    if (!isOnline()) {
      return {
        success: false,
        error: 'Tiada sambungan internet. Sila semak rangkaian anda.',
        errorCode: 'OFFLINE',
        isRetryable: true,
      };
    }
    
    let data: T;
    
    if (retries > 0) {
      data = await withRetry(fn, { maxRetries: retries });
    } else {
      data = await fn();
    }
    
    return { success: true, data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    
    const isRetryable = error instanceof NetworkError 
      ? (error.isTimeout || (error.statusCode !== undefined && error.statusCode >= 500))
      : true;
    
    return {
      success: false,
      error: getNetworkErrorMessage(error),
      errorCode: error instanceof NetworkError ? `HTTP_${error.statusCode}` : 'UNKNOWN',
      isRetryable,
    };
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    // Retry on timeout, offline (when back online), or server errors
    if (error.isTimeout) return true;
    if (error.statusCode && error.statusCode >= 500) return true;
    // Don't retry on client errors (400, 401, 403, 404)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) return false;
    return true;
  }
  return true;
}

/**
 * Create a debounced function to prevent rapid API calls
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<any> | null = null;
  
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

/**
 * Queue for managing multiple API requests
 */
class RequestQueue {
  private queue: Array<{
    id: string;
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private processedIds = new Set<string>();
  
  async add<T>(id: string, fn: () => Promise<T>): Promise<T> {
    // Check if already processed (prevents duplicates)
    if (this.processedIds.has(id)) {
      throw new Error('Request already processed');
    }
    
    return new Promise((resolve, reject) => {
      this.queue.push({ id, fn, resolve, reject });
      this.processedIds.add(id);
      this.processNext();
      
      // Clear processed IDs after 5 minutes to prevent memory buildup
      setTimeout(() => {
        this.processedIds.delete(id);
      }, 5 * 60 * 1000);
    });
  }
  
  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const { id, fn, resolve, reject } = this.queue.shift()!;
    
    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.processing = false;
      this.processNext();
    }
  }
  
  clear(): void {
    this.queue = [];
    this.processedIds.clear();
  }
}

// Singleton request queue for preventing duplicate submissions
export const requestQueue = new RequestQueue();

/**
 * Prevent duplicate submissions using transaction ID
 */
const submittedTransactions = new Map<string, number>();
const TRANSACTION_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isTransactionSubmitted(transactionId: string): boolean {
  const submittedAt = submittedTransactions.get(transactionId);
  if (!submittedAt) return false;
  
  // Check if transaction has expired
  if (Date.now() - submittedAt > TRANSACTION_EXPIRY) {
    submittedTransactions.delete(transactionId);
    return false;
  }
  
  return true;
}

export function markTransactionSubmitted(transactionId: string): void {
  submittedTransactions.set(transactionId, Date.now());
  
  // Clean up old transactions
  for (const [id, time] of submittedTransactions.entries()) {
    if (Date.now() - time > TRANSACTION_EXPIRY) {
      submittedTransactions.delete(id);
    }
  }
}

export function clearTransaction(transactionId: string): void {
  submittedTransactions.delete(transactionId);
}


