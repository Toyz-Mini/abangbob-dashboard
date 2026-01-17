export type { Database, Json } from './database.types';
import type { Database } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Aliases
export type Staff = Tables<'staff'>;
export type Inventory = Tables<'inventory'>;
export type Order = Tables<'orders'>;
export type MenuItem = Tables<'menu_items'>;
export type Customer = Tables<'customers'>;
export type Expense = Tables<'expenses'>;
export type Outlet = Tables<'outlets'>;
export type AuditLog = Tables<'audit_logs'>;
export type PromoCode = Tables<'promo_codes'>;
export type Attendance = Tables<'attendance'>;
