// Supabase Module Exports
// Central export file for all Supabase-related functionality

// Client exports
export { getSupabaseClient, createClient } from './client';
export { createServerSupabaseClient } from './server';

// Type exports
export type { 
  Database, 
  Tables, 
  InsertTables, 
  UpdateTables,
  Staff,
  Attendance,
  Inventory,
  Order,
  MenuItem,
  Customer,
  Expense,
  Outlet,
  AuditLog,
  Json,
} from './types';

// Auth exports
export {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getCurrentUser,
  getCurrentSession,
  authenticateStaffPin,
  resetPassword,
  updatePassword,
  onAuthStateChange,
} from './auth';
export type { AuthState, StaffAuthResult } from './auth';

// Hook exports
export {
  useAuth,
  useRealtimeTable,
  useRealtimeRecord,
  useRealtimeOrders,
  useInventoryWithAlerts,
  useSupabaseStatus,
} from './hooks';

// Migration exports
export {
  migrateAllData,
  checkLocalDataExists,
  clearLocalData,
  exportLocalData,
} from './migration';
export type { MigrationResult, MigrationProgress } from './migration';

