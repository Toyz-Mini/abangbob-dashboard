// Supabase Database Types
// This file defines TypeScript types for the Supabase database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Staff/Users table
      staff: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          email: string | null;
          phone: string | null;
          role: 'Manager' | 'Staff' | 'Admin';
          status: 'active' | 'inactive' | 'terminated';
          pin: string;
          hourly_rate: number;
          ic_number: string | null;
          employment_type: 'full-time' | 'part-time' | 'contract';
          join_date: string | null;
          profile_photo_url: string | null;
          outlet_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          role?: 'Manager' | 'Staff' | 'Admin';
          status?: 'active' | 'inactive' | 'terminated';
          pin: string;
          hourly_rate?: number;
          ic_number?: string | null;
          employment_type?: 'full-time' | 'part-time' | 'contract';
          join_date?: string | null;
          profile_photo_url?: string | null;
          outlet_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          role?: 'Manager' | 'Staff' | 'Admin';
          status?: 'active' | 'inactive' | 'terminated';
          pin?: string;
          hourly_rate?: number;
          ic_number?: string | null;
          employment_type?: 'full-time' | 'part-time' | 'contract';
          join_date?: string | null;
          profile_photo_url?: string | null;
          outlet_id?: string | null;
        };
      };
      // Attendance records
      attendance: {
        Row: {
          id: string;
          created_at: string;
          staff_id: string;
          date: string;
          clock_in_time: string | null;
          clock_out_time: string | null;
          clock_in_photo_url: string | null;
          clock_out_photo_url: string | null;
          break_duration: number;
          notes: string | null;
          outlet_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          staff_id: string;
          date: string;
          clock_in_time?: string | null;
          clock_out_time?: string | null;
          clock_in_photo_url?: string | null;
          clock_out_photo_url?: string | null;
          break_duration?: number;
          notes?: string | null;
          outlet_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          staff_id?: string;
          date?: string;
          clock_in_time?: string | null;
          clock_out_time?: string | null;
          clock_in_photo_url?: string | null;
          clock_out_photo_url?: string | null;
          break_duration?: number;
          notes?: string | null;
          outlet_id?: string | null;
        };
      };
      // Inventory/Stock items
      inventory: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          category: string;
          unit: string;
          current_quantity: number;
          min_quantity: number;
          cost: number;
          supplier_id: string | null;
          outlet_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          category: string;
          unit: string;
          current_quantity?: number;
          min_quantity?: number;
          cost?: number;
          supplier_id?: string | null;
          outlet_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          category?: string;
          unit?: string;
          current_quantity?: number;
          min_quantity?: number;
          cost?: number;
          supplier_id?: string | null;
          outlet_id?: string | null;
        };
      };
      // Orders
      orders: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          order_number: string;
          order_type: 'dine-in' | 'takeaway' | 'delivery' | 'gomamam';
          status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
          items: Json;
          subtotal: number;
          discount: number;
          tax: number;
          total: number;
          payment_method: string | null;
          customer_id: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          table_number: number | null;
          notes: string | null;
          prepared_by_staff_id: string | null;
          preparing_started_at: string | null;
          ready_at: string | null;
          outlet_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          order_number: string;
          order_type?: 'dine-in' | 'takeaway' | 'delivery' | 'gomamam';
          status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
          items?: Json;
          subtotal?: number;
          discount?: number;
          tax?: number;
          total?: number;
          payment_method?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          table_number?: number | null;
          notes?: string | null;
          prepared_by_staff_id?: string | null;
          preparing_started_at?: string | null;
          ready_at?: string | null;
          outlet_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          order_number?: string;
          order_type?: 'dine-in' | 'takeaway' | 'delivery' | 'gomamam';
          status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
          items?: Json;
          subtotal?: number;
          discount?: number;
          tax?: number;
          total?: number;
          payment_method?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          table_number?: number | null;
          notes?: string | null;
          prepared_by_staff_id?: string | null;
          preparing_started_at?: string | null;
          ready_at?: string | null;
          outlet_id?: string | null;
        };
      };
      // Menu items
      menu_items: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          category: string;
          description: string | null;
          price: number;
          cost: number;
          image_url: string | null;
          is_available: boolean;
          preparation_time: number;
          modifier_group_ids: string[];
          outlet_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          category: string;
          description?: string | null;
          price: number;
          cost?: number;
          image_url?: string | null;
          is_available?: boolean;
          preparation_time?: number;
          modifier_group_ids?: string[];
          outlet_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          category?: string;
          description?: string | null;
          price?: number;
          cost?: number;
          image_url?: string | null;
          is_available?: boolean;
          preparation_time?: number;
          modifier_group_ids?: string[];
          outlet_id?: string | null;
        };
      };
      // Customers
      customers: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          phone: string | null;
          email: string | null;
          birthday: string | null;
          loyalty_points: number;
          total_spent: number;
          total_orders: number;
          segment: 'new' | 'regular' | 'vip';
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          birthday?: string | null;
          loyalty_points?: number;
          total_spent?: number;
          total_orders?: number;
          segment?: 'new' | 'regular' | 'vip';
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          birthday?: string | null;
          loyalty_points?: number;
          total_spent?: number;
          total_orders?: number;
          segment?: 'new' | 'regular' | 'vip';
          notes?: string | null;
        };
      };
      // Expenses
      expenses: {
        Row: {
          id: string;
          created_at: string;
          date: string;
          category: string;
          amount: number;
          description: string;
          receipt_url: string | null;
          payment_method: string;
          approved_by: string | null;
          outlet_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          date: string;
          category: string;
          amount: number;
          description: string;
          receipt_url?: string | null;
          payment_method?: string;
          approved_by?: string | null;
          outlet_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          date?: string;
          category?: string;
          amount?: number;
          description?: string;
          receipt_url?: string | null;
          payment_method?: string;
          approved_by?: string | null;
          outlet_id?: string | null;
        };
      };
      // Outlets (for multi-outlet support)
      outlets: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          is_active: boolean;
          settings: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          settings?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          settings?: Json;
        };
      };
      // Audit logs
      audit_logs: {
        Row: {
          id: string;
          created_at: string;
          action: string;
          entity_type: string;
          entity_id: string;
          user_id: string | null;
          user_name: string | null;
          details: Json;
          outlet_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          action: string;
          entity_type: string;
          entity_id: string;
          user_id?: string | null;
          user_name?: string | null;
          details?: Json;
          outlet_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          user_id?: string | null;
          user_name?: string | null;
          details?: Json;
          outlet_id?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type Staff = Tables<'staff'>;
export type Attendance = Tables<'attendance'>;
export type Inventory = Tables<'inventory'>;
export type Order = Tables<'orders'>;
export type MenuItem = Tables<'menu_items'>;
export type Customer = Tables<'customers'>;
export type Expense = Tables<'expenses'>;
export type Outlet = Tables<'outlets'>;
export type AuditLog = Tables<'audit_logs'>;

