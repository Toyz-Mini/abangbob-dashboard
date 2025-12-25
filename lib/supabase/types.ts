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
          // New Columns
          date_of_birth: string | null;
          gender: string | null;
          marital_status: string | null;
          address: string | null;
          nationality: string | null;
          religion: string | null;
          position: string | null;
          department: string | null;
          bank_details: Json;
          emergency_contact: Json;
          extended_data: Json;
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
          // New Columns
          date_of_birth?: string | null;
          gender?: string | null;
          marital_status?: string | null;
          address?: string | null;
          nationality?: string | null;
          religion?: string | null;
          position?: string | null;
          department?: string | null;
          bank_details?: Json;
          emergency_contact?: Json;
          extended_data?: Json;
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
          // New Columns
          date_of_birth?: string | null;
          gender?: string | null;
          marital_status?: string | null;
          address?: string | null;
          nationality?: string | null;
          religion?: string | null;
          position?: string | null;
          department?: string | null;
          bank_details?: Json;
          emergency_contact?: Json;
          extended_data?: Json;
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
          promo_code_id: string | null;
          discount_amount: number;
          loyalty_points_earned: number;
          loyalty_points_redeemed: number;
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
          promo_code_id?: string | null;
          discount_amount?: number;
          loyalty_points_earned?: number;
          loyalty_points_redeemed?: number;
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
          promo_code_id?: string | null;
          discount_amount?: number;
          loyalty_points_earned?: number;
          loyalty_points_redeemed?: number;
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
      // Modifier groups
      modifier_groups: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          is_required: boolean;
          allow_multiple: boolean;
          min_selection: number;
          max_selection: number;
          outlet_id: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          is_required?: boolean;
          allow_multiple?: boolean;
          min_selection?: number;
          max_selection?: number;
          outlet_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          is_required?: boolean;
          allow_multiple?: boolean;
          min_selection?: number;
          max_selection?: number;
          outlet_id?: string | null;
        };
      };
      // Modifier options
      modifier_options: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          group_id: string;
          name: string;
          extra_price: number;
          is_available: boolean;
          outlet_id: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          group_id: string;
          name: string;
          extra_price?: number;
          is_available?: boolean;
          outlet_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          group_id?: string;
          name?: string;
          extra_price?: number;
          is_available?: boolean;
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
      // Chat Sessions
      chat_sessions: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          status: 'open' | 'closed' | 'archived';
          unread_count: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          status?: 'open' | 'closed' | 'archived';
          unread_count?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          status?: 'open' | 'closed' | 'archived';
          unread_count?: number;
        };
      };
      // Chat Messages
      chat_messages: {
        Row: {
          id: string;
          created_at: string;
          session_id: string;
          sender_type: 'customer' | 'admin';
          message: string;
          is_read: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          session_id: string;
          sender_type: 'customer' | 'admin';
          message: string;
          is_read?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          session_id?: string;
          sender_type?: 'customer' | 'admin';
          message?: string;
          is_read?: boolean;
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
      // Loyalty Transactions
      loyalty_transactions: {
        Row: {
          id: string;
          created_at: string;
          customer_id: string;
          order_id: string | null;
          transaction_type: 'earn' | 'redeem' | 'adjust' | 'expire';
          points: number;
          description: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          customer_id: string;
          order_id?: string | null;
          transaction_type: 'earn' | 'redeem' | 'adjust' | 'expire';
          points: number;
          description?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          customer_id?: string;
          order_id?: string | null;
          transaction_type?: 'earn' | 'redeem' | 'adjust' | 'expire';
          points?: number;
          description?: string | null;
        };
      };
      // Promo Codes
      promo_codes: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          code: string;
          description: string | null;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          min_spend: number;
          max_discount_amount: number | null;
          start_date: string;
          end_date: string | null;
          usage_limit: number | null;
          usage_count: number;
          is_active: boolean;
          outlet_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          code: string;
          description?: string | null;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          min_spend?: number;
          max_discount_amount?: number | null;
          start_date?: string;
          end_date?: string | null;
          usage_limit?: number | null;
          usage_count?: number;
          is_active?: boolean;
          outlet_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          code?: string;
          description?: string | null;
          discount_type?: 'percentage' | 'fixed';
          discount_value?: number;
          min_spend?: number;
          max_discount_amount?: number | null;
          start_date?: string;
          end_date?: string | null;
          usage_limit?: number | null;
          usage_count?: number;
          is_active?: boolean;
          outlet_id?: string | null;
        };
      };
      // Promo Usages
      promo_usages: {
        Row: {
          id: string;
          created_at: string;
          promo_code_id: string;
          customer_id: string | null;
          order_id: string;
          discount_amount: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          promo_code_id: string;
          customer_id?: string | null;
          order_id: string;
          discount_amount: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          promo_code_id?: string;
          customer_id?: string | null;
          order_id?: string;
          discount_amount?: number;
        };
      };

      // HR: Disciplinary Actions
      disciplinary_actions: {
        Row: {
          id: string;
          staff_id: string;
          staff_name: string;
          type: 'verbal_warning' | 'written_warning' | 'final_warning' | 'suspension' | 'termination';
          reason: string;
          details: string | null;
          issued_by: string;
          issued_by_name: string;
          issued_at: string;
          acknowledged_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          staff_name: string;
          type: 'verbal_warning' | 'written_warning' | 'final_warning' | 'suspension' | 'termination';
          reason: string;
          details?: string | null;
          issued_by: string;
          issued_by_name: string;
          issued_at: string;
          acknowledged_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          staff_name?: string;
          type?: 'verbal_warning' | 'written_warning' | 'final_warning' | 'suspension' | 'termination';
          reason?: string;
          details?: string | null;
          issued_by?: string;
          issued_by_name?: string;
          issued_at?: string;
          acknowledged_at?: string | null;
          created_at?: string;
        };
      };

      // HR: Staff Training
      staff_training: {
        Row: {
          id: string;
          staff_id: string;
          staff_name: string;
          course_name: string;
          provider: string;
          category: 'food_safety' | 'health_safety' | 'customer_service' | 'technical' | 'compliance' | 'other';
          scheduled_date: string | null;
          completed_at: string | null;
          expires_at: string | null;
          certificate_number: string | null;
          notes: string | null;
          status: 'scheduled' | 'in_progress' | 'completed' | 'expired';
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          staff_name: string;
          course_name: string;
          provider: string;
          category: 'food_safety' | 'health_safety' | 'customer_service' | 'technical' | 'compliance' | 'other';
          scheduled_date?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          certificate_number?: string | null;
          notes?: string | null;
          status: 'scheduled' | 'in_progress' | 'completed' | 'expired';
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          staff_name?: string;
          course_name?: string;
          provider?: string;
          category?: 'food_safety' | 'health_safety' | 'customer_service' | 'technical' | 'compliance' | 'other';
          scheduled_date?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          certificate_number?: string | null;
          notes?: string | null;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'expired';
          created_at?: string;
        };
      };

      // HR: Staff Documents
      staff_documents: {
        Row: {
          id: string;
          staff_id: string | null;
          staff_name: string | null;
          type: 'ic_front' | 'ic_back' | 'contract' | 'resume' | 'offer_letter' | 'medical_report' | 'work_permit' | 'certificate' | 'other';
          name: string;
          description: string | null;
          url: string;
          expiry_date: string | null;
          uploaded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id?: string | null;
          staff_name?: string | null;
          type: 'ic_front' | 'ic_back' | 'contract' | 'resume' | 'offer_letter' | 'medical_report' | 'work_permit' | 'certificate' | 'other';
          name: string;
          description?: string | null;
          url: string;
          expiry_date?: string | null;
          uploaded_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string | null;
          staff_name?: string | null;
          type?: 'ic_front' | 'ic_back' | 'contract' | 'resume' | 'offer_letter' | 'medical_report' | 'work_permit' | 'certificate' | 'other';
          name?: string;
          description?: string | null;
          url?: string;
          expiry_date?: string | null;
          uploaded_at?: string;
          created_at?: string;
        };
      };

      // HR: Performance Reviews
      performance_reviews: {
        Row: {
          id: string;
          staff_id: string;
          staff_name: string;
          reviewer_id: string;
          reviewer_name: string;
          period: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
          period_start: string;
          period_end: string;
          overall_rating: number;
          punctuality: number;
          teamwork: number;
          productivity: number;
          communication: number;
          initiative: number;
          strengths: string | null;
          improvements: string | null;
          goals: string | null;
          comments: string | null;
          status: 'draft' | 'pending_acknowledgement' | 'completed';
          acknowledged_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          staff_name: string;
          reviewer_id: string;
          reviewer_name: string;
          period: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
          period_start: string;
          period_end: string;
          overall_rating: number;
          punctuality: number;
          teamwork: number;
          productivity: number;
          communication: number;
          initiative: number;
          strengths?: string | null;
          improvements?: string | null;
          goals?: string | null;
          comments?: string | null;
          status: 'draft' | 'pending_acknowledgement' | 'completed';
          acknowledged_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          staff_name?: string;
          reviewer_id?: string;
          reviewer_name?: string;
          period?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
          period_start?: string;
          period_end?: string;
          overall_rating?: number;
          punctuality?: number;
          teamwork?: number;
          productivity?: number;
          communication?: number;
          initiative?: number;
          strengths?: string | null;
          improvements?: string | null;
          goals?: string | null;
          comments?: string | null;
          status?: 'draft' | 'pending_acknowledgement' | 'completed';
          acknowledged_at?: string | null;
          created_at?: string;
        };
      };

      // HR: Onboarding Checklists
      onboarding_checklists: {
        Row: {
          id: string;
          staff_id: string;
          staff_name: string;
          start_date: string;
          due_date: string | null;
          items: Json;
          status: 'pending' | 'in_progress' | 'completed';
          notes: string | null;
          assigned_to: string | null;
          assigned_to_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          staff_name: string;
          start_date: string;
          due_date?: string | null;
          items?: Json;
          status: 'pending' | 'in_progress' | 'completed';
          notes?: string | null;
          assigned_to?: string | null;
          assigned_to_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          staff_name?: string;
          start_date?: string;
          due_date?: string | null;
          items?: Json;
          status?: 'pending' | 'in_progress' | 'completed';
          notes?: string | null;
          assigned_to?: string | null;
          assigned_to_name?: string | null;
          created_at?: string;
        };
      };

      // HR: Exit Interviews
      exit_interviews: {
        Row: {
          id: string;
          staff_id: string;
          staff_name: string;
          exit_date: string;
          reason: 'resignation' | 'termination' | 'contract_end' | 'retirement' | 'other';
          reason_details: string | null;
          overall_experience: number;
          management_rating: number;
          work_environment: number;
          career_growth: number;
          what_liked: string | null;
          what_disliked: string | null;
          suggestions: string | null;
          would_recommend: boolean;
          interviewed_by: string | null;
          interviewed_by_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          staff_name: string;
          exit_date: string;
          reason: 'resignation' | 'termination' | 'contract_end' | 'retirement' | 'other';
          reason_details?: string | null;
          overall_experience: number;
          management_rating: number;
          work_environment: number;
          career_growth: number;
          what_liked?: string | null;
          what_disliked?: string | null;
          suggestions?: string | null;
          would_recommend?: boolean;
          interviewed_by?: string | null;
          interviewed_by_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          staff_name?: string;
          exit_date?: string;
          reason?: 'resignation' | 'termination' | 'contract_end' | 'retirement' | 'other';
          reason_details?: string | null;
          overall_experience?: number;
          management_rating?: number;
          work_environment?: number;
          career_growth?: number;
          what_liked?: string | null;
          what_disliked?: string | null;
          suggestions?: string | null;
          would_recommend?: boolean;
          interviewed_by?: string | null;
          interviewed_by_name?: string | null;
          created_at?: string;
        };
      };

      // HR: Staff Complaints
      staff_complaints: {
        Row: {
          id: string;
          is_anonymous: boolean;
          staff_id: string | null;
          staff_name: string;
          date: string;
          category: 'harassment' | 'misconduct' | 'safety' | 'management' | 'other';
          subject: string;
          description: string;
          status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
          admin_notes: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          is_anonymous?: boolean;
          staff_id?: string | null;
          staff_name: string;
          date: string;
          category: 'harassment' | 'misconduct' | 'safety' | 'management' | 'other';
          subject: string;
          description: string;
          status?: 'pending' | 'investigating' | 'resolved' | 'dismissed';
          admin_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          is_anonymous?: boolean;
          staff_id?: string | null;
          staff_name?: string;
          date?: string;
          category?: 'harassment' | 'misconduct' | 'safety' | 'management' | 'other';
          subject?: string;
          description?: string;
          status?: 'pending' | 'investigating' | 'resolved' | 'dismissed';
          admin_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
        };
      };

      // HR: OT Claims
      ot_claims: {
        Row: {
          id: string;
          staff_id: string;
          staff_name: string;
          date: string;
          start_time: string;
          end_time: string;
          hours_worked: number;
          hourly_rate: number;
          multiplier: number;
          total_amount: number;
          reason: string;
          status: 'pending' | 'approved' | 'rejected' | 'paid';
          approved_by: string | null;
          approver_name: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          staff_name: string;
          date: string;
          start_time: string;
          end_time: string;
          hours_worked: number;
          hourly_rate: number;
          multiplier?: number;
          total_amount: number;
          reason: string;
          status?: 'pending' | 'approved' | 'rejected' | 'paid';
          approved_by?: string | null;
          approver_name?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          staff_name?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          hours_worked?: number;
          hourly_rate?: number;
          multiplier?: number;
          total_amount?: number;
          reason?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'paid';
          approved_by?: string | null;
          approver_name?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          paid_at?: string | null;
          created_at?: string;
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
export type ModifierGroup = Tables<'modifier_groups'>;
export type ModifierOption = Tables<'modifier_options'>;
export type Customer = Tables<'customers'>;
export type Expense = Tables<'expenses'>;
export type Outlet = Tables<'outlets'>;
export type AuditLog = Tables<'audit_logs'>;
export type LoyaltyTransaction = Tables<'loyalty_transactions'>;
export type PromoCode = Tables<'promo_codes'>;
export type PromoUsage = Tables<'promo_usages'>;




