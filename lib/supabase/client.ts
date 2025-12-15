// Supabase Client Configuration
// This file sets up the Supabase client for browser usage

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Connection status tracking
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'offline' | 'unconfigured';

interface SupabaseConnectionState {
  status: ConnectionStatus;
  lastChecked: Date | null;
  lastError: string | null;
  isConfigured: boolean;
}

// Global connection state
let connectionState: SupabaseConnectionState = {
  status: 'disconnected',
  lastChecked: null,
  lastError: null,
  isConfigured: false,
};

// Listeners for connection state changes
type ConnectionStateListener = (state: SupabaseConnectionState) => void;
const connectionStateListeners: Set<ConnectionStateListener> = new Set();

export function subscribeToConnectionState(listener: ConnectionStateListener): () => void {
  connectionStateListeners.add(listener);
  // Immediately notify with current state
  listener(connectionState);
  return () => connectionStateListeners.delete(listener);
}

function notifyConnectionStateChange() {
  connectionStateListeners.forEach(listener => listener(connectionState));
}

function updateConnectionState(updates: Partial<SupabaseConnectionState>) {
  connectionState = { ...connectionState, ...updates };
  notifyConnectionStateChange();
}

// Check if Supabase environment variables are configured
export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(supabaseUrl && supabaseAnonKey);
}

// Get current connection state
export function getConnectionState(): SupabaseConnectionState {
  return { ...connectionState };
}

// Create a single supabase client for interacting with your database
const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Log detailed warning for debugging deployment issues
    console.warn('[Supabase] Environment variables not configured:');
    console.warn('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.warn('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
    console.warn('[Supabase] Running in OFFLINE mode. Data will only be saved to localStorage.');
    
    updateConnectionState({
      status: 'unconfigured',
      isConfigured: false,
      lastError: 'Environment variables not configured',
    });
    
    return null;
  }

  updateConnectionState({ isConfigured: true });
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
};

// Singleton pattern to avoid multiple client instances
let supabase: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side: always create new client
    return createClient();
  }
  
  // Browser: use singleton
  if (!supabase) {
    supabase = createClient();
  }
  return supabase;
}

// Health check function to verify Supabase connection
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  error: string | null;
  latencyMs: number | null;
}> {
  const client = getSupabaseClient();
  
  if (!client) {
    updateConnectionState({
      status: 'unconfigured',
      lastChecked: new Date(),
      lastError: 'Supabase client not configured',
    });
    return { connected: false, error: 'Supabase client not configured', latencyMs: null };
  }

  updateConnectionState({ status: 'connecting' });
  
  const startTime = Date.now();
  
  try {
    // Simple query to check connection - select from a system table
    const { error } = await client
      .from('menu_items')
      .select('id')
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      // Check if it's a "table doesn't exist" error (which means connection works but table missing)
      if (error.code === '42P01') {
        updateConnectionState({
          status: 'connected',
          lastChecked: new Date(),
          lastError: 'Warning: menu_items table does not exist',
        });
        return { connected: true, error: 'Table does not exist - run migrations', latencyMs };
      }
      
      updateConnectionState({
        status: 'disconnected',
        lastChecked: new Date(),
        lastError: error.message,
      });
      return { connected: false, error: error.message, latencyMs };
    }

    updateConnectionState({
      status: 'connected',
      lastChecked: new Date(),
      lastError: null,
    });
    
    console.log(`[Supabase] Connection healthy (${latencyMs}ms)`);
    return { connected: true, error: null, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'Unknown connection error';
    
    updateConnectionState({
      status: 'disconnected',
      lastChecked: new Date(),
      lastError: errorMessage,
    });
    
    console.error('[Supabase] Connection check failed:', errorMessage);
    return { connected: false, error: errorMessage, latencyMs };
  }
}

// Initialize connection check on module load (browser only)
if (typeof window !== 'undefined') {
  // Check connection status after a short delay to avoid blocking initial render
  setTimeout(() => {
    checkSupabaseConnection().then(result => {
      if (!result.connected && result.error) {
        console.warn('[Supabase] Initial connection check failed:', result.error);
      }
    });
  }, 1000);
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('[Supabase] Network online - checking connection...');
    checkSupabaseConnection();
  });
  
  window.addEventListener('offline', () => {
    console.log('[Supabase] Network offline');
    updateConnectionState({
      status: 'offline',
      lastError: 'Network offline',
    });
  });
}

export { createClient };




