// Supabase Client Configuration
// This file sets up the Supabase client for browser usage

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Create a single supabase client for interacting with your database
const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for development without Supabase
    console.warn('Supabase environment variables not set. Using offline mode.');
    return null;
  }

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

export { createClient };




