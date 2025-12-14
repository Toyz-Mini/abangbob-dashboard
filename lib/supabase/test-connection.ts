// Supabase Connection Test Utility
// Can be imported and used in browser or server context

import { getSupabaseClient } from './client';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  tables?: { name: string; exists: boolean; count?: number; error?: string }[];
}

export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase client not configured. Check .env.local file.',
    };
  }

  try {
    // Test basic connection
    const { error: pingError } = await supabase.from('staff').select('count', { count: 'exact', head: true });
    
    if (pingError) {
      return {
        success: false,
        message: `Connection failed: ${pingError.message}`,
      };
    }

    // Check all required tables
    const tables = ['staff', 'inventory', 'menu_items', 'orders', 'customers', 'expenses', 'attendance', 'outlets'];
    const tableResults = [];

    for (const tableName of tables) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      tableResults.push({
        name: tableName,
        exists: !error,
        count: count || 0,
        error: error?.message,
      });
    }

    const allTablesExist = tableResults.every(t => t.exists);

    return {
      success: true,
      message: allTablesExist 
        ? 'All tables exist and are accessible!' 
        : 'Some tables are missing. Please run schema.sql in Supabase.',
      tables: tableResults,
    };
  } catch (err) {
    return {
      success: false,
      message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}
