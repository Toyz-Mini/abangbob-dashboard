export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      allowed_locations: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          radius_meters: number
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_pinned: boolean | null
          outlet_id: string | null
          start_date: string | null
          target_role: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          outlet_id?: string | null
          start_date?: string | null
          target_role?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          outlet_id?: string | null
          start_date?: string | null
          target_role?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          break_duration: number | null
          clock_in_method: string | null
          clock_in_photo_url: string | null
          clock_in_time: string | null
          clock_out_photo_url: string | null
          clock_out_time: string | null
          created_at: string | null
          date: string
          device_id: string | null
          expected_clock_in: string | null
          expected_clock_out: string | null
          id: string
          is_early_leave: boolean | null
          is_holiday: boolean | null
          is_late: boolean | null
          late_minutes: number | null
          late_reason_code: string | null
          late_reason_note: string | null
          notes: string | null
          outlet_id: string | null
          overtime_approved: boolean | null
          overtime_approved_at: string | null
          overtime_approved_by: string | null
          overtime_minutes: number | null
          shift_id: string | null
          staff_id: string
        }
        Insert: {
          break_duration?: number | null
          clock_in_method?: string | null
          clock_in_photo_url?: string | null
          clock_in_time?: string | null
          clock_out_photo_url?: string | null
          clock_out_time?: string | null
          created_at?: string | null
          date: string
          device_id?: string | null
          expected_clock_in?: string | null
          expected_clock_out?: string | null
          id?: string
          is_early_leave?: boolean | null
          is_holiday?: boolean | null
          is_late?: boolean | null
          late_minutes?: number | null
          late_reason_code?: string | null
          late_reason_note?: string | null
          notes?: string | null
          outlet_id?: string | null
          overtime_approved?: boolean | null
          overtime_approved_at?: string | null
          overtime_approved_by?: string | null
          overtime_minutes?: number | null
          shift_id?: string | null
          staff_id: string
        }
        Update: {
          break_duration?: number | null
          clock_in_method?: string | null
          clock_in_photo_url?: string | null
          clock_in_time?: string | null
          clock_out_photo_url?: string | null
          clock_out_time?: string | null
          created_at?: string | null
          date?: string
          device_id?: string | null
          expected_clock_in?: string | null
          expected_clock_out?: string | null
          id?: string
          is_early_leave?: boolean | null
          is_holiday?: boolean | null
          is_late?: boolean | null
          late_minutes?: number | null
          late_reason_code?: string | null
          late_reason_note?: string | null
          notes?: string | null
          outlet_id?: string | null
          overtime_approved?: boolean | null
          overtime_approved_at?: string | null
          overtime_approved_by?: string | null
          overtime_minutes?: number | null
          shift_id?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource: string | null
          resource_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cash_flows: {
        Row: {
          card_sales: number | null
          cash_sales: number | null
          closed_by: string | null
          closing_cash: number | null
          created_at: string | null
          date: string
          ewallet_sales: number | null
          id: string
          notes: string | null
          opening_cash: number | null
          outlet_id: string | null
          qr_sales: number | null
          total_expenses: number | null
          total_refunds: number | null
          total_sales: number | null
          updated_at: string | null
          variance: number | null
        }
        Insert: {
          card_sales?: number | null
          cash_sales?: number | null
          closed_by?: string | null
          closing_cash?: number | null
          created_at?: string | null
          date: string
          ewallet_sales?: number | null
          id?: string
          notes?: string | null
          opening_cash?: number | null
          outlet_id?: string | null
          qr_sales?: number | null
          total_expenses?: number | null
          total_refunds?: number | null
          total_sales?: number | null
          updated_at?: string | null
          variance?: number | null
        }
        Update: {
          card_sales?: number | null
          cash_sales?: number | null
          closed_by?: string | null
          closing_cash?: number | null
          created_at?: string | null
          date?: string
          ewallet_sales?: number | null
          id?: string
          notes?: string | null
          opening_cash?: number | null
          outlet_id?: string | null
          qr_sales?: number | null
          total_expenses?: number | null
          total_refunds?: number | null
          total_sales?: number | null
          updated_at?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flows_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_payouts: {
        Row: {
          amount: number
          approved_by: string | null
          approved_by_name: string | null
          category: string | null
          created_at: string | null
          id: string
          notes: string | null
          outlet_id: string | null
          performed_by: string
          performed_by_name: string
          reason: string
          register_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          approved_by_name?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          outlet_id?: string | null
          performed_by: string
          performed_by_name: string
          reason: string
          register_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          approved_by_name?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          outlet_id?: string | null
          performed_by?: string
          performed_by_name?: string
          reason?: string
          register_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cash_registers: {
        Row: {
          actual_cash: number | null
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          end_cash: number | null
          expected_cash: number | null
          id: string
          notes: string | null
          opened_at: string | null
          opened_by: string
          outlet_id: string | null
          start_cash: number
          status: string | null
          updated_at: string | null
          variance: number | null
        }
        Insert: {
          actual_cash?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          end_cash?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          opened_by: string
          outlet_id?: string | null
          start_cash?: number
          status?: string | null
          updated_at?: string | null
          variance?: number | null
        }
        Update: {
          actual_cash?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          end_cash?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          opened_by?: string
          outlet_id?: string | null
          start_cash?: number
          status?: string | null
          updated_at?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          sender_type: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          sender_type: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          status: string
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          status?: string
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          status?: string
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      checklist_completions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          items: Json
          notes: string | null
          outlet_id: string | null
          shift_id: string | null
          staff_id: string
          staff_name: string
          status: string | null
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          items?: Json
          notes?: string | null
          outlet_id?: string | null
          shift_id?: string | null
          staff_id: string
          staff_name: string
          status?: string | null
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          items?: Json
          notes?: string | null
          outlet_id?: string | null
          shift_id?: string | null
          staff_id?: string
          staff_name?: string
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_completions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          outlet_id: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          outlet_id?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          outlet_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_requests: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          claim_type: string
          created_at: string | null
          date: string
          description: string
          id: string
          paid_at: string | null
          receipt_url: string | null
          rejection_reason: string | null
          staff_id: string
          staff_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          claim_type: string
          created_at?: string | null
          date: string
          description: string
          id?: string
          paid_at?: string | null
          receipt_url?: string | null
          rejection_reason?: string | null
          staff_id: string
          staff_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          claim_type?: string
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          paid_at?: string | null
          receipt_url?: string | null
          rejection_reason?: string | null
          staff_id?: string
          staff_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          order_id: string | null
          rating: number
          staff_id: string | null
          tags: Json | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          order_id?: string | null
          rating: number
          staff_id?: string | null
          tags?: Json | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          order_id?: string | null
          rating?: number
          staff_id?: string | null
          tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          birthday: string | null
          created_at: string | null
          email: string | null
          id: string
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string | null
          segment: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          loyalty_points?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          segment?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          segment?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_cash_flows: {
        Row: {
          closing_cash: number | null
          created_at: string | null
          date: string
          id: string
          opening_cash: number | null
          outlet_id: string | null
          status: string | null
        }
        Insert: {
          closing_cash?: number | null
          created_at?: string | null
          date: string
          id?: string
          opening_cash?: number | null
          outlet_id?: string | null
          status?: string | null
        }
        Update: {
          closing_cash?: number | null
          created_at?: string | null
          date?: string
          id?: string
          opening_cash?: number | null
          outlet_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      delivery_orders: {
        Row: {
          actual_delivery_time: string | null
          created_at: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_fee: number | null
          delivery_instructions: string | null
          distance_km: number | null
          driver_id: string | null
          driver_name: string | null
          estimated_delivery_time: string | null
          id: string
          notes: string | null
          order_id: string | null
          order_number: string
          outlet_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_delivery_time?: string | null
          created_at?: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_fee?: number | null
          delivery_instructions?: string | null
          distance_km?: number | null
          driver_id?: string | null
          driver_name?: string | null
          estimated_delivery_time?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          order_number: string
          outlet_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          actual_delivery_time?: string | null
          created_at?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          delivery_fee?: number | null
          delivery_instructions?: string | null
          distance_km?: number | null
          driver_id?: string | null
          driver_name?: string | null
          estimated_delivery_time?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          order_number?: string
          outlet_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_actions: {
        Row: {
          acknowledged_at: string | null
          created_at: string | null
          details: string | null
          id: string
          issued_at: string
          issued_by: string
          issued_by_name: string
          reason: string
          staff_id: string
          staff_name: string
          type: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string | null
          details?: string | null
          id: string
          issued_at: string
          issued_by: string
          issued_by_name: string
          reason: string
          staff_id: string
          staff_name: string
          type: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          issued_at?: string
          issued_by?: string
          issued_by_name?: string
          reason?: string
          staff_id?: string
          staff_name?: string
          type?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          model_number: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          serial_number: string | null
          status: string | null
          type: string
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          model_number?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          model_number?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      event_checklists: {
        Row: {
          booth_number: string | null
          checked_by: string | null
          checked_by_name: string | null
          created_at: string | null
          event_date: string | null
          event_end_date: string | null
          event_name: string
          id: string
          items: Json | null
          location: string | null
          notes: string | null
          outlet_id: string | null
          packed_items: number | null
          prepared_by: string | null
          prepared_by_name: string | null
          status: string | null
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          booth_number?: string | null
          checked_by?: string | null
          checked_by_name?: string | null
          created_at?: string | null
          event_date?: string | null
          event_end_date?: string | null
          event_name: string
          id?: string
          items?: Json | null
          location?: string | null
          notes?: string | null
          outlet_id?: string | null
          packed_items?: number | null
          prepared_by?: string | null
          prepared_by_name?: string | null
          status?: string | null
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          booth_number?: string | null
          checked_by?: string | null
          checked_by_name?: string | null
          created_at?: string | null
          event_date?: string | null
          event_end_date?: string | null
          event_name?: string
          id?: string
          items?: Json | null
          location?: string | null
          notes?: string | null
          outlet_id?: string | null
          packed_items?: number | null
          prepared_by?: string | null
          prepared_by_name?: string | null
          status?: string | null
          total_items?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_checklists_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      exit_interviews: {
        Row: {
          career_growth: number
          created_at: string | null
          exit_date: string
          id: string
          interviewed_by: string | null
          interviewed_by_name: string | null
          management_rating: number
          overall_experience: number
          reason: string
          reason_details: string | null
          staff_id: string
          staff_name: string
          suggestions: string | null
          what_disliked: string | null
          what_liked: string | null
          work_environment: number
          would_recommend: boolean
        }
        Insert: {
          career_growth: number
          created_at?: string | null
          exit_date: string
          id: string
          interviewed_by?: string | null
          interviewed_by_name?: string | null
          management_rating: number
          overall_experience: number
          reason: string
          reason_details?: string | null
          staff_id: string
          staff_name: string
          suggestions?: string | null
          what_disliked?: string | null
          what_liked?: string | null
          work_environment: number
          would_recommend?: boolean
        }
        Update: {
          career_growth?: number
          created_at?: string | null
          exit_date?: string
          id?: string
          interviewed_by?: string | null
          interviewed_by_name?: string | null
          management_rating?: number
          overall_experience?: number
          reason?: string
          reason_details?: string | null
          staff_id?: string
          staff_name?: string
          suggestions?: string | null
          what_disliked?: string | null
          what_liked?: string | null
          work_environment?: number
          would_recommend?: boolean
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: string
          created_at: string | null
          date: string
          description: string
          id: string
          outlet_id: string | null
          payment_method: string | null
          receipt_url: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category: string
          created_at?: string | null
          date: string
          description: string
          id?: string
          outlet_id?: string | null
          payment_method?: string | null
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          outlet_id?: string | null
          payment_method?: string | null
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_login_attempts: {
        Row: {
          attemptedAt: string | null
          email: string
          id: string
          ipAddress: string | null
          reason: string | null
        }
        Insert: {
          attemptedAt?: string | null
          email: string
          id?: string
          ipAddress?: string | null
          reason?: string | null
        }
        Update: {
          attemptedAt?: string | null
          email?: string
          id?: string
          ipAddress?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      holiday_policies: {
        Row: {
          allow_staff_choice: boolean | null
          compensation_type: string
          created_at: string | null
          created_by: string | null
          holiday_id: string
          id: string
          is_operating: boolean | null
          notes: string | null
          pay_multiplier: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          allow_staff_choice?: boolean | null
          compensation_type?: string
          created_at?: string | null
          created_by?: string | null
          holiday_id: string
          id: string
          is_operating?: boolean | null
          notes?: string | null
          pay_multiplier?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          allow_staff_choice?: boolean | null
          compensation_type?: string
          created_at?: string | null
          created_by?: string | null
          holiday_id?: string
          id?: string
          is_operating?: boolean | null
          notes?: string | null
          pay_multiplier?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "holiday_policies_holiday_id_fkey"
            columns: ["holiday_id"]
            isOneToOne: false
            referencedRelation: "public_holidays"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_work_logs: {
        Row: {
          compensation_choice: string
          compensation_processed: boolean | null
          created_at: string | null
          holiday_id: string
          hours_worked: number | null
          id: string
          payroll_entry_id: string | null
          replacement_leave_id: string | null
          shift_id: string | null
          staff_id: string
          staff_name: string
          work_date: string
        }
        Insert: {
          compensation_choice: string
          compensation_processed?: boolean | null
          created_at?: string | null
          holiday_id: string
          hours_worked?: number | null
          id: string
          payroll_entry_id?: string | null
          replacement_leave_id?: string | null
          shift_id?: string | null
          staff_id: string
          staff_name: string
          work_date: string
        }
        Update: {
          compensation_choice?: string
          compensation_processed?: boolean | null
          created_at?: string | null
          holiday_id?: string
          hours_worked?: number | null
          id?: string
          payroll_entry_id?: string | null
          replacement_leave_id?: string | null
          shift_id?: string | null
          staff_id?: string
          staff_name?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "holiday_work_logs_holiday_id_fkey"
            columns: ["holiday_id"]
            isOneToOne: false
            referencedRelation: "public_holidays"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_national: boolean | null
          name: string
          name_ms: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_national?: boolean | null
          name: string
          name_ms?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_national?: boolean | null
          name?: string
          name_ms?: string | null
        }
        Relationships: []
      }
      interview_candidates: {
        Row: {
          available_start_date: string | null
          created_at: string | null
          email: string | null
          expected_salary: number | null
          experience_years: number | null
          ic_number: string | null
          id: string
          interview_date: string | null
          interview_time: string | null
          interviewer_id: string | null
          interviewer_name: string | null
          name: string
          notes: string | null
          phone: string | null
          position_applied: string
          rating: number | null
          resume_url: string | null
          source: string | null
          status: string | null
          strengths: string | null
          updated_at: string | null
          weaknesses: string | null
        }
        Insert: {
          available_start_date?: string | null
          created_at?: string | null
          email?: string | null
          expected_salary?: number | null
          experience_years?: number | null
          ic_number?: string | null
          id?: string
          interview_date?: string | null
          interview_time?: string | null
          interviewer_id?: string | null
          interviewer_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position_applied: string
          rating?: number | null
          resume_url?: string | null
          source?: string | null
          status?: string | null
          strengths?: string | null
          updated_at?: string | null
          weaknesses?: string | null
        }
        Update: {
          available_start_date?: string | null
          created_at?: string | null
          email?: string | null
          expected_salary?: number | null
          experience_years?: number | null
          ic_number?: string | null
          id?: string
          interview_date?: string | null
          interview_time?: string | null
          interviewer_id?: string | null
          interviewer_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position_applied?: string
          rating?: number | null
          resume_url?: string | null
          source?: string | null
          status?: string | null
          strengths?: string | null
          updated_at?: string | null
          weaknesses?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string
          cost: number | null
          count_daily: boolean | null
          created_at: string | null
          current_quantity: number | null
          id: string
          item_type: string | null
          last_restock_date: string | null
          location: string | null
          max_quantity: number | null
          min_quantity: number | null
          name: string
          outlet_id: string | null
          production_recipe_id: string | null
          sku: string | null
          supplier_id: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          category: string
          cost?: number | null
          count_daily?: boolean | null
          created_at?: string | null
          current_quantity?: number | null
          id?: string
          item_type?: string | null
          last_restock_date?: string | null
          location?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          name: string
          outlet_id?: string | null
          production_recipe_id?: string | null
          sku?: string | null
          supplier_id?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          cost?: number | null
          count_daily?: boolean | null
          created_at?: string | null
          current_quantity?: number | null
          id?: string
          item_type?: string | null
          last_restock_date?: string | null
          location?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string
          outlet_id?: string | null
          production_recipe_id?: string | null
          sku?: string | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_production_recipe_id_fkey"
            columns: ["production_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          new_quantity: number
          order_id: string | null
          order_number: string | null
          outlet_id: string | null
          previous_quantity: number
          production_log_id: string | null
          quantity: number
          reason: string | null
          source: string | null
          stock_item_id: string | null
          stock_item_name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_quantity: number
          order_id?: string | null
          order_number?: string | null
          outlet_id?: string | null
          previous_quantity: number
          production_log_id?: string | null
          quantity: number
          reason?: string | null
          source?: string | null
          stock_item_id?: string | null
          stock_item_name: string
          type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_quantity?: number
          order_id?: string | null
          order_number?: string | null
          outlet_id?: string | null
          previous_quantity?: number
          production_log_id?: string | null
          quantity?: number
          reason?: string | null
          source?: string | null
          stock_item_id?: string | null
          stock_item_name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_production_log_id_fkey"
            columns: ["production_log_id"]
            isOneToOne: false
            referencedRelation: "production_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      late_reason_categories: {
        Row: {
          code: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ms: string
          requires_note: boolean | null
          sort_order: number | null
        }
        Insert: {
          code: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ms: string
          requires_note?: boolean | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ms?: string
          requires_note?: boolean | null
          sort_order?: number | null
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          annual_balance: number | null
          annual_entitled: number | null
          annual_leave: number | null
          annual_leave_used: number | null
          annual_pending: number | null
          annual_taken: number | null
          compassionate_balance: number | null
          compassionate_entitled: number | null
          compassionate_pending: number | null
          compassionate_taken: number | null
          created_at: string | null
          emergency_balance: number | null
          emergency_entitled: number | null
          emergency_leave: number | null
          emergency_leave_used: number | null
          emergency_pending: number | null
          emergency_taken: number | null
          id: string
          maternity_balance: number | null
          maternity_entitled: number | null
          maternity_pending: number | null
          maternity_taken: number | null
          medical_balance: number | null
          medical_entitled: number | null
          medical_pending: number | null
          medical_taken: number | null
          paternity_balance: number | null
          paternity_entitled: number | null
          paternity_pending: number | null
          paternity_taken: number | null
          replacement_balance: number | null
          replacement_entitled: number | null
          replacement_pending: number | null
          replacement_taken: number | null
          sick_leave: number | null
          sick_leave_used: number | null
          staff_id: string
          unpaid_leave_used: number | null
          unpaid_taken: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          annual_balance?: number | null
          annual_entitled?: number | null
          annual_leave?: number | null
          annual_leave_used?: number | null
          annual_pending?: number | null
          annual_taken?: number | null
          compassionate_balance?: number | null
          compassionate_entitled?: number | null
          compassionate_pending?: number | null
          compassionate_taken?: number | null
          created_at?: string | null
          emergency_balance?: number | null
          emergency_entitled?: number | null
          emergency_leave?: number | null
          emergency_leave_used?: number | null
          emergency_pending?: number | null
          emergency_taken?: number | null
          id?: string
          maternity_balance?: number | null
          maternity_entitled?: number | null
          maternity_pending?: number | null
          maternity_taken?: number | null
          medical_balance?: number | null
          medical_entitled?: number | null
          medical_pending?: number | null
          medical_taken?: number | null
          paternity_balance?: number | null
          paternity_entitled?: number | null
          paternity_pending?: number | null
          paternity_taken?: number | null
          replacement_balance?: number | null
          replacement_entitled?: number | null
          replacement_pending?: number | null
          replacement_taken?: number | null
          sick_leave?: number | null
          sick_leave_used?: number | null
          staff_id: string
          unpaid_leave_used?: number | null
          unpaid_taken?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          annual_balance?: number | null
          annual_entitled?: number | null
          annual_leave?: number | null
          annual_leave_used?: number | null
          annual_pending?: number | null
          annual_taken?: number | null
          compassionate_balance?: number | null
          compassionate_entitled?: number | null
          compassionate_pending?: number | null
          compassionate_taken?: number | null
          created_at?: string | null
          emergency_balance?: number | null
          emergency_entitled?: number | null
          emergency_leave?: number | null
          emergency_leave_used?: number | null
          emergency_pending?: number | null
          emergency_taken?: number | null
          id?: string
          maternity_balance?: number | null
          maternity_entitled?: number | null
          maternity_pending?: number | null
          maternity_taken?: number | null
          medical_balance?: number | null
          medical_entitled?: number | null
          medical_pending?: number | null
          medical_taken?: number | null
          paternity_balance?: number | null
          paternity_entitled?: number | null
          paternity_pending?: number | null
          paternity_taken?: number | null
          replacement_balance?: number | null
          replacement_entitled?: number | null
          replacement_pending?: number | null
          replacement_taken?: number | null
          sick_leave?: number | null
          sick_leave_used?: number | null
          staff_id?: string
          unpaid_leave_used?: number | null
          unpaid_taken?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      leave_records: {
        Row: {
          approved_by: string | null
          created_at: string | null
          days: number
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          staff_id: string
          start_date: string
          status: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          days: number
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          staff_id: string
          start_date: string
          status?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          days?: number
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          staff_id?: string
          start_date?: string
          status?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          approver_name: string | null
          attachment_url: string | null
          attachments: string[] | null
          created_at: string | null
          days: number
          duration: number | null
          end_date: string
          half_day_type: string | null
          id: string
          is_half_day: boolean | null
          leave_type: string | null
          reason: string | null
          rejection_reason: string | null
          staff_id: string
          staff_name: string
          start_date: string
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          approver_name?: string | null
          attachment_url?: string | null
          attachments?: string[] | null
          created_at?: string | null
          days: number
          duration?: number | null
          end_date: string
          half_day_type?: string | null
          id?: string
          is_half_day?: boolean | null
          leave_type?: string | null
          reason?: string | null
          rejection_reason?: string | null
          staff_id: string
          staff_name: string
          start_date: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          approver_name?: string | null
          attachment_url?: string | null
          attachments?: string[] | null
          created_at?: string | null
          days?: number
          duration?: number | null
          end_date?: string
          half_day_type?: string | null
          id?: string
          is_half_day?: boolean | null
          leave_type?: string | null
          reason?: string | null
          rejection_reason?: string | null
          staff_id?: string
          staff_name?: string
          start_date?: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          order_id: string | null
          points: number
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          cost: number | null
          created_at: string | null
          equipment_id: string | null
          id: string
          notes: string | null
          performed_at: string | null
          performed_by: string | null
          performed_by_name: string | null
          photo_url: string | null
          scheduled_task_id: string | null
          status: string | null
          type: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          photo_url?: string | null
          scheduled_task_id?: string | null
          status?: string | null
          type: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          photo_url?: string | null
          scheduled_task_id?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_scheduled_task_id_fkey"
            columns: ["scheduled_task_id"]
            isOneToOne: false
            referencedRelation: "maintenance_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedule: {
        Row: {
          assigned_role: string | null
          created_at: string | null
          equipment_id: string | null
          frequency_days: number | null
          id: string
          is_active: boolean | null
          last_performed: string | null
          next_due: string | null
          task_name: string
        }
        Insert: {
          assigned_role?: string | null
          created_at?: string | null
          equipment_id?: string | null
          frequency_days?: number | null
          id?: string
          is_active?: boolean | null
          last_performed?: string | null
          next_due?: string | null
          task_name: string
        }
        Update: {
          assigned_role?: string | null
          created_at?: string | null
          equipment_id?: string | null
          frequency_days?: number | null
          id?: string
          is_active?: boolean | null
          last_performed?: string | null
          next_due?: string | null
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedule_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          is_available: boolean | null
          modifier_group_ids: string[] | null
          name: string
          outlet_id: string | null
          preparation_time: number | null
          price: number
          updated_at: string | null
        }
        Insert: {
          category: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean | null
          modifier_group_ids?: string[] | null
          name: string
          outlet_id?: string | null
          preparation_time?: number | null
          price: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean | null
          modifier_group_ids?: string[] | null
          name?: string
          outlet_id?: string | null
          preparation_time?: number | null
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_groups: {
        Row: {
          allow_multiple: boolean | null
          created_at: string | null
          id: string
          is_required: boolean | null
          max_selection: number | null
          min_selection: number | null
          name: string
          outlet_id: string | null
          updated_at: string | null
        }
        Insert: {
          allow_multiple?: boolean | null
          created_at?: string | null
          id: string
          is_required?: boolean | null
          max_selection?: number | null
          min_selection?: number | null
          name: string
          outlet_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_multiple?: boolean | null
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_selection?: number | null
          min_selection?: number | null
          name?: string
          outlet_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifier_groups_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_options: {
        Row: {
          created_at: string | null
          extra_price: number | null
          group_id: string
          id: string
          ingredients: Json | null
          is_available: boolean | null
          name: string
          outlet_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          extra_price?: number | null
          group_id: string
          id: string
          ingredients?: Json | null
          is_available?: boolean | null
          name: string
          outlet_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          extra_price?: number | null
          group_id?: string
          id?: string
          ingredients?: Json | null
          is_available?: boolean | null
          name?: string
          outlet_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifier_options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modifier_options_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          outlet_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          outlet_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          outlet_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      oil_action_history: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          fryer_id: string
          id: string
          notes: string | null
          performed_by: string | null
          performed_by_name: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          fryer_id: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          fryer_id?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_action_history_fryer_id_fkey"
            columns: ["fryer_id"]
            isOneToOne: false
            referencedRelation: "oil_trackers"
            referencedColumns: ["fryer_id"]
          },
        ]
      }
      oil_change_requests: {
        Row: {
          action_type: string
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          created_at: string | null
          fryer_id: string
          id: string
          notes: string | null
          photo_url: string | null
          previous_cycles: number | null
          proposed_cycles: number | null
          rejection_reason: string | null
          requested_at: string | null
          requested_by: string
          requested_by_id: string | null
          requested_by_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_id: string | null
          status: string | null
          topup_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string | null
          fryer_id: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          previous_cycles?: number | null
          proposed_cycles?: number | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by: string
          requested_by_id?: string | null
          requested_by_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_id?: string | null
          status?: string | null
          topup_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string | null
          fryer_id?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          previous_cycles?: number | null
          proposed_cycles?: number | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string
          requested_by_id?: string | null
          requested_by_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_id?: string | null
          status?: string | null
          topup_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_change_requests_fryer_id_fkey"
            columns: ["fryer_id"]
            isOneToOne: false
            referencedRelation: "oil_trackers"
            referencedColumns: ["fryer_id"]
          },
        ]
      }
      oil_trackers: {
        Row: {
          capacity_liters: number | null
          created_at: string | null
          current_oil_level: number | null
          fryer_id: string
          fryer_name: string
          has_pending_request: boolean | null
          hours_since_change: number | null
          id: string
          last_full_change: string | null
          last_topup: string | null
          last_topup_date: string | null
          location: string | null
          notes: string | null
          oil_type: string | null
          outlet_id: string | null
          status: string | null
          total_frying_hours: number | null
          updated_at: string | null
        }
        Insert: {
          capacity_liters?: number | null
          created_at?: string | null
          current_oil_level?: number | null
          fryer_id: string
          fryer_name: string
          has_pending_request?: boolean | null
          hours_since_change?: number | null
          id?: string
          last_full_change?: string | null
          last_topup?: string | null
          last_topup_date?: string | null
          location?: string | null
          notes?: string | null
          oil_type?: string | null
          outlet_id?: string | null
          status?: string | null
          total_frying_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          capacity_liters?: number | null
          created_at?: string | null
          current_oil_level?: number | null
          fryer_id?: string
          fryer_name?: string
          has_pending_request?: boolean | null
          hours_since_change?: number | null
          id?: string
          last_full_change?: string | null
          last_topup?: string | null
          last_topup_date?: string | null
          location?: string | null
          notes?: string | null
          oil_type?: string | null
          outlet_id?: string | null
          status?: string | null
          total_frying_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_trackers_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklists: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string | null
          due_date: string | null
          id: string
          items: Json
          notes: string | null
          staff_id: string
          staff_name: string
          start_date: string
          status: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string | null
          due_date?: string | null
          id: string
          items?: Json
          notes?: string | null
          staff_id: string
          staff_name: string
          start_date: string
          status: string
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          items?: Json
          notes?: string | null
          staff_id?: string
          staff_name?: string
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cashier_id: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_details: Json | null
          discount: number | null
          discount_amount: number | null
          id: string
          is_synced_offline: boolean | null
          items: Json
          loyalty_points_earned: number | null
          loyalty_points_redeemed: number | null
          notes: string | null
          order_number: string
          order_type: string
          original_offline_id: string | null
          outlet_id: string | null
          payment_method: string | null
          prepared_by_staff_id: string | null
          preparing_started_at: string | null
          promo_code_id: string | null
          proof_of_payment_url: string | null
          ready_at: string | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          refunded_by: string | null
          staff_id: string | null
          staff_name: string | null
          status: string
          stripe_payment_intent_id: string | null
          subtotal: number | null
          table_number: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
          void_refund_status: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_details?: Json | null
          discount?: number | null
          discount_amount?: number | null
          id?: string
          is_synced_offline?: boolean | null
          items?: Json
          loyalty_points_earned?: number | null
          loyalty_points_redeemed?: number | null
          notes?: string | null
          order_number: string
          order_type?: string
          original_offline_id?: string | null
          outlet_id?: string | null
          payment_method?: string | null
          prepared_by_staff_id?: string | null
          preparing_started_at?: string | null
          promo_code_id?: string | null
          proof_of_payment_url?: string | null
          ready_at?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          table_number?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          void_refund_status?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_details?: Json | null
          discount?: number | null
          discount_amount?: number | null
          id?: string
          is_synced_offline?: boolean | null
          items?: Json
          loyalty_points_earned?: number | null
          loyalty_points_redeemed?: number | null
          notes?: string | null
          order_number?: string
          order_type?: string
          original_offline_id?: string | null
          outlet_id?: string | null
          payment_method?: string | null
          prepared_by_staff_id?: string | null
          preparing_started_at?: string | null
          promo_code_id?: string | null
          proof_of_payment_url?: string | null
          ready_at?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          table_number?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          void_refund_status?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_claims: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approver_name: string | null
          created_at: string | null
          date: string
          end_time: string
          hourly_rate: number
          hours_worked: number
          id: string
          multiplier: number
          paid_at: string | null
          reason: string
          rejection_reason: string | null
          staff_id: string
          staff_name: string
          start_time: string
          status: string
          total_amount: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approver_name?: string | null
          created_at?: string | null
          date: string
          end_time: string
          hourly_rate: number
          hours_worked: number
          id: string
          multiplier?: number
          paid_at?: string | null
          reason: string
          rejection_reason?: string | null
          staff_id: string
          staff_name: string
          start_time: string
          status?: string
          total_amount: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approver_name?: string | null
          created_at?: string | null
          date?: string
          end_time?: string
          hourly_rate?: number
          hours_worked?: number
          id?: string
          multiplier?: number
          paid_at?: string | null
          reason?: string
          rejection_reason?: string | null
          staff_id?: string
          staff_name?: string
          start_time?: string
          status?: string
          total_amount?: number
        }
        Relationships: []
      }
      ot_records: {
        Row: {
          amount: number | null
          approved_by: string | null
          created_at: string | null
          date: string
          hours: number
          id: string
          notes: string | null
          rate_multiplier: number | null
          staff_id: string
          status: string | null
        }
        Insert: {
          amount?: number | null
          approved_by?: string | null
          created_at?: string | null
          date: string
          hours: number
          id?: string
          notes?: string | null
          rate_multiplier?: number | null
          staff_id: string
          status?: string | null
        }
        Update: {
          amount?: number | null
          approved_by?: string | null
          created_at?: string | null
          date?: string
          hours?: number
          id?: string
          notes?: string | null
          rate_multiplier?: number | null
          staff_id?: string
          status?: string | null
        }
        Relationships: []
      }
      outlet_settings: {
        Row: {
          appearance: Json | null
          created_at: string | null
          currency: string | null
          delivery_enabled: boolean | null
          delivery_fee: number | null
          id: string
          mileage_rate: number | null
          min_order_amount: number | null
          notification_settings: Json | null
          operating_hours: Json | null
          order_number_prefix: string | null
          outlet_address: string | null
          outlet_email: string | null
          outlet_id: string | null
          outlet_logo_url: string | null
          outlet_name: string | null
          outlet_phone: string | null
          payment_methods: Json | null
          pin_min_length: number | null
          receipt_settings: Json | null
          require_clock_in_photo: boolean | null
          security: Json | null
          social_media: Json | null
          tax_rate: number | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          whatsapp_config: Json | null
        }
        Insert: {
          appearance?: Json | null
          created_at?: string | null
          currency?: string | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          id?: string
          mileage_rate?: number | null
          min_order_amount?: number | null
          notification_settings?: Json | null
          operating_hours?: Json | null
          order_number_prefix?: string | null
          outlet_address?: string | null
          outlet_email?: string | null
          outlet_id?: string | null
          outlet_logo_url?: string | null
          outlet_name?: string | null
          outlet_phone?: string | null
          payment_methods?: Json | null
          pin_min_length?: number | null
          receipt_settings?: Json | null
          require_clock_in_photo?: boolean | null
          security?: Json | null
          social_media?: Json | null
          tax_rate?: number | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_config?: Json | null
        }
        Update: {
          appearance?: Json | null
          created_at?: string | null
          currency?: string | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          id?: string
          mileage_rate?: number | null
          min_order_amount?: number | null
          notification_settings?: Json | null
          operating_hours?: Json | null
          order_number_prefix?: string | null
          outlet_address?: string | null
          outlet_email?: string | null
          outlet_id?: string | null
          outlet_logo_url?: string | null
          outlet_name?: string | null
          outlet_phone?: string | null
          payment_methods?: Json | null
          pin_min_length?: number | null
          receipt_settings?: Json | null
          require_clock_in_photo?: boolean | null
          security?: Json | null
          social_media?: Json | null
          tax_rate?: number | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_config?: Json | null
        }
        Relationships: []
      }
      outlets: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          id: string
          is_enabled?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      performance_reviews: {
        Row: {
          acknowledged_at: string | null
          comments: string | null
          communication: number
          created_at: string | null
          goals: string | null
          id: string
          improvements: string | null
          initiative: number
          overall_rating: number
          period: string
          period_end: string
          period_start: string
          productivity: number
          punctuality: number
          reviewer_id: string
          reviewer_name: string
          staff_id: string
          staff_name: string
          status: string
          strengths: string | null
          teamwork: number
        }
        Insert: {
          acknowledged_at?: string | null
          comments?: string | null
          communication: number
          created_at?: string | null
          goals?: string | null
          id: string
          improvements?: string | null
          initiative: number
          overall_rating: number
          period: string
          period_end: string
          period_start: string
          productivity: number
          punctuality: number
          reviewer_id: string
          reviewer_name: string
          staff_id: string
          staff_name: string
          status: string
          strengths?: string | null
          teamwork: number
        }
        Update: {
          acknowledged_at?: string | null
          comments?: string | null
          communication?: number
          created_at?: string | null
          goals?: string | null
          id?: string
          improvements?: string | null
          initiative?: number
          overall_rating?: number
          period?: string
          period_end?: string
          period_start?: string
          productivity?: number
          punctuality?: number
          reviewer_id?: string
          reviewer_name?: string
          staff_id?: string
          staff_name?: string
          status?: string
          strengths?: string | null
          teamwork?: number
        }
        Relationships: []
      }
      production_logs: {
        Row: {
          batch_cost: number | null
          batch_number: string | null
          created_at: string | null
          id: string
          ingredients_deducted: Json | null
          ingredients_used: Json | null
          menu_item_id: string | null
          menu_item_name: string
          notes: string | null
          outlet_id: string | null
          output_inventory_id: string | null
          output_quantity: number | null
          produced_by: string | null
          produced_by_name: string | null
          quantity_produced: number
          recipe_id: string | null
          recipe_name: string | null
          staff_id: string | null
          staff_name: string | null
          status: string | null
        }
        Insert: {
          batch_cost?: number | null
          batch_number?: string | null
          created_at?: string | null
          id?: string
          ingredients_deducted?: Json | null
          ingredients_used?: Json | null
          menu_item_id?: string | null
          menu_item_name: string
          notes?: string | null
          outlet_id?: string | null
          output_inventory_id?: string | null
          output_quantity?: number | null
          produced_by?: string | null
          produced_by_name?: string | null
          quantity_produced: number
          recipe_id?: string | null
          recipe_name?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string | null
        }
        Update: {
          batch_cost?: number | null
          batch_number?: string | null
          created_at?: string | null
          id?: string
          ingredients_deducted?: Json | null
          ingredients_used?: Json | null
          menu_item_id?: string | null
          menu_item_name?: string
          notes?: string | null
          outlet_id?: string | null
          output_inventory_id?: string | null
          output_quantity?: number | null
          produced_by?: string | null
          produced_by_name?: string | null
          quantity_produced?: number
          recipe_id?: string | null
          recipe_name?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_logs_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_output_inventory_id_fkey"
            columns: ["output_inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          add_ons: Json | null
          base_price: number
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          add_ons?: Json | null
          base_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          add_ons?: Json | null
          base_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_spend: number | null
          outlet_id: string | null
          start_date: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_spend?: number | null
          outlet_id?: string | null
          start_date?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_spend?: number | null
          outlet_id?: string | null
          start_date?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_usages: {
        Row: {
          created_at: string | null
          customer_id: string | null
          discount_amount: number
          id: string
          order_id: string
          promo_code_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount: number
          id?: string
          order_id: string
          promo_code_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number
          id?: string
          order_id?: string
          promo_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_usages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_usages_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          applicable_categories: Json | null
          applicable_items: Json | null
          code: string | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order_amount: number | null
          name: string
          outlet_id: string | null
          start_date: string
          type: string
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          value: number
        }
        Insert: {
          applicable_categories?: Json | null
          applicable_items?: Json | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_amount?: number | null
          name: string
          outlet_id?: string | null
          start_date: string
          type: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          value: number
        }
        Update: {
          applicable_categories?: Json | null
          applicable_items?: Json | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_amount?: number | null
          name?: string
          outlet_id?: string | null
          start_date?: string
          type?: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      public_holidays: {
        Row: {
          country: string | null
          created_at: string | null
          date: string
          id: string
          is_national: boolean | null
          is_recurring: boolean | null
          name: string
          notes: string | null
          recurring_day: number | null
          recurring_month: number | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          date: string
          id: string
          is_national?: boolean | null
          is_recurring?: boolean | null
          name: string
          notes?: string | null
          recurring_day?: number | null
          recurring_month?: number | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_national?: boolean | null
          is_recurring?: boolean | null
          name?: string
          notes?: string | null
          recurring_day?: number | null
          recurring_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          actual_delivery: string | null
          created_at: string | null
          expected_delivery: string | null
          id: string
          items: Json
          notes: string | null
          outlet_id: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_status: string | null
          po_number: string
          status: string
          subtotal: number | null
          supplier_id: string
          supplier_name: string
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery?: string | null
          created_at?: string | null
          expected_delivery?: string | null
          id?: string
          items?: Json
          notes?: string | null
          outlet_id?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_status?: string | null
          po_number: string
          status?: string
          subtotal?: number | null
          supplier_id: string
          supplier_name: string
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery?: string | null
          created_at?: string | null
          expected_delivery?: string | null
          id?: string
          items?: Json
          notes?: string | null
          outlet_id?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_status?: string | null
          po_number?: string
          status?: string
          subtotal?: number | null
          supplier_id?: string
          supplier_name?: string
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cooking_time: number | null
          created_at: string | null
          description: string | null
          id: string
          ingredients: Json | null
          instructions: Json | null
          is_active: boolean | null
          menu_item_id: string | null
          name: string
          outlet_id: string | null
          output_inventory_id: string | null
          output_quantity: number | null
          output_unit: string | null
          prep_time: number | null
          preparation_time: number | null
          profit_margin: number | null
          recipe_type: string | null
          selling_price: number | null
          total_cost: number | null
          updated_at: string | null
          yield_quantity: number | null
          yield_unit: string | null
        }
        Insert: {
          cooking_time?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          ingredients?: Json | null
          instructions?: Json | null
          is_active?: boolean | null
          menu_item_id?: string | null
          name: string
          outlet_id?: string | null
          output_inventory_id?: string | null
          output_quantity?: number | null
          output_unit?: string | null
          prep_time?: number | null
          preparation_time?: number | null
          profit_margin?: number | null
          recipe_type?: string | null
          selling_price?: number | null
          total_cost?: number | null
          updated_at?: string | null
          yield_quantity?: number | null
          yield_unit?: string | null
        }
        Update: {
          cooking_time?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          ingredients?: Json | null
          instructions?: Json | null
          is_active?: boolean | null
          menu_item_id?: string | null
          name?: string
          outlet_id?: string | null
          output_inventory_id?: string | null
          output_quantity?: number | null
          output_unit?: string | null
          prep_time?: number | null
          preparation_time?: number | null
          profit_margin?: number | null
          recipe_type?: string | null
          selling_price?: number | null
          total_cost?: number | null
          updated_at?: string | null
          yield_quantity?: number | null
          yield_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_output_inventory_id_fkey"
            columns: ["output_inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      replacement_leaves: {
        Row: {
          created_at: string | null
          days: number | null
          earned_date: string
          expires_at: string
          holiday_name: string | null
          holiday_work_log_id: string | null
          id: string
          notes: string | null
          staff_id: string
          staff_name: string
          status: string
          used_leave_request_id: string | null
        }
        Insert: {
          created_at?: string | null
          days?: number | null
          earned_date: string
          expires_at: string
          holiday_name?: string | null
          holiday_work_log_id?: string | null
          id: string
          notes?: string | null
          staff_id: string
          staff_name: string
          status?: string
          used_leave_request_id?: string | null
        }
        Update: {
          created_at?: string | null
          days?: number | null
          earned_date?: string
          expires_at?: string
          holiday_name?: string | null
          holiday_work_log_id?: string | null
          id?: string
          notes?: string | null
          staff_id?: string
          staff_name?: string
          status?: string
          used_leave_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replacement_leaves_holiday_work_log_id_fkey"
            columns: ["holiday_work_log_id"]
            isOneToOne: false
            referencedRelation: "holiday_work_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_entries: {
        Row: {
          created_at: string | null
          date: string
          end_time: string
          id: string
          notes: string | null
          outlet_id: string | null
          shift_id: string
          shift_name: string
          staff_id: string
          staff_name: string
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          notes?: string | null
          outlet_id?: string | null
          shift_id: string
          shift_name: string
          staff_id: string
          staff_name: string
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          outlet_id?: string | null
          shift_id?: string
          shift_name?: string
          staff_id?: string
          staff_name?: string
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_entries_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          notes: string | null
          outlet_id: string | null
          shift_id: string | null
          staff_id: string
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          notes?: string | null
          outlet_id?: string | null
          shift_id?: string | null
          staff_id: string
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          outlet_id?: string | null
          shift_id?: string | null
          staff_id?: string
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      settings_audit_log: {
        Row: {
          changed_at: string | null
          changed_by: string
          id: string
          new_value: string | null
          old_value: string | null
          setting_key: string
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          setting_key: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          setting_key?: string
        }
        Relationships: []
      }
      shift_definitions: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          end_time: string
          id: string
          is_active: boolean | null
          name: string
          name_ms: string
          sort_order: number | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          name: string
          name_ms: string
          sort_order?: number | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_ms?: string
          sort_order?: number | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shifts: {
        Row: {
          break_duration: number | null
          color: string | null
          created_at: string | null
          end_time: string
          id: string
          is_active: boolean | null
          name: string
          outlet_id: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          break_duration?: number | null
          color?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          name: string
          outlet_id?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          break_duration?: number | null
          color?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          name?: string
          outlet_id?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_log_items: {
        Row: {
          completed_at: string | null
          id: string
          input_value: string | null
          is_checked: boolean | null
          log_id: string
          notes: string | null
          photo_url: string | null
          step_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          input_value?: string | null
          is_checked?: boolean | null
          log_id: string
          notes?: string | null
          photo_url?: string | null
          step_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          input_value?: string | null
          is_checked?: boolean | null
          log_id?: string
          notes?: string | null
          photo_url?: string | null
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_log_items_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "sop_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_log_items_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "sop_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_logs: {
        Row: {
          completed_at: string | null
          completed_steps: number | null
          id: string
          notes: string | null
          outlet_id: string | null
          shift_id: string | null
          staff_id: string | null
          started_at: string | null
          status: string | null
          template_id: string
          total_steps: number | null
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: number | null
          id?: string
          notes?: string | null
          outlet_id?: string | null
          shift_id?: string | null
          staff_id?: string | null
          started_at?: string | null
          status?: string | null
          template_id: string
          total_steps?: number | null
        }
        Update: {
          completed_at?: string | null
          completed_steps?: number | null
          id?: string
          notes?: string | null
          outlet_id?: string | null
          shift_id?: string | null
          staff_id?: string | null
          started_at?: string | null
          status?: string | null
          template_id?: string
          total_steps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sop_logs_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sop_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_steps: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_required: boolean | null
          max_value: number | null
          min_value: number | null
          requires_photo: boolean | null
          requires_value: boolean | null
          step_order: number
          template_id: string
          title: string
          updated_at: string | null
          value_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          max_value?: number | null
          min_value?: number | null
          requires_photo?: boolean | null
          requires_value?: boolean | null
          step_order?: number
          template_id: string
          title: string
          updated_at?: string | null
          value_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          max_value?: number | null
          min_value?: number | null
          requires_photo?: boolean | null
          requires_value?: boolean | null
          step_order?: number
          template_id?: string
          title?: string
          updated_at?: string | null
          value_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sop_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sop_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          shift_type: string
          target_role: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          shift_type: string
          target_role?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          shift_type?: string
          target_role?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          address: string | null
          bank_details: Json | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          email: string | null
          emergency_contact: Json | null
          employment_type: string | null
          extended_data: Json | null
          gender: string | null
          hourly_rate: number | null
          ic_number: string | null
          id: string
          join_date: string | null
          marital_status: string | null
          name: string
          nationality: string | null
          outlet_id: string | null
          phone: string | null
          pin: string | null
          position: string | null
          profile_photo_url: string | null
          religion: string | null
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          bank_details?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employment_type?: string | null
          extended_data?: Json | null
          gender?: string | null
          hourly_rate?: number | null
          ic_number?: string | null
          id?: string
          join_date?: string | null
          marital_status?: string | null
          name: string
          nationality?: string | null
          outlet_id?: string | null
          phone?: string | null
          pin?: string | null
          position?: string | null
          profile_photo_url?: string | null
          religion?: string | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          bank_details?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employment_type?: string | null
          extended_data?: Json | null
          gender?: string | null
          hourly_rate?: number | null
          ic_number?: string | null
          id?: string
          join_date?: string | null
          marital_status?: string | null
          name?: string
          nationality?: string | null
          outlet_id?: string | null
          phone?: string | null
          pin?: string | null
          position?: string | null
          profile_photo_url?: string | null
          religion?: string | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_advances: {
        Row: {
          advance_date: string
          amount: number
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          approver_name: string | null
          created_at: string | null
          deduction_amount: number | null
          deduction_month: string | null
          id: string
          notes: string | null
          reason: string | null
          remaining_balance: number | null
          staff_id: string
          staff_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          advance_date: string
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          approver_name?: string | null
          created_at?: string | null
          deduction_amount?: number | null
          deduction_month?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          remaining_balance?: number | null
          staff_id: string
          staff_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          advance_date?: string
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          approver_name?: string | null
          created_at?: string | null
          deduction_amount?: number | null
          deduction_month?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          remaining_balance?: number | null
          staff_id?: string
          staff_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_complaints: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string | null
          date: string
          description: string
          id: string
          is_anonymous: boolean
          resolved_at: string | null
          resolved_by: string | null
          staff_id: string | null
          staff_name: string
          status: string
          subject: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string | null
          date: string
          description: string
          id: string
          is_anonymous?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          staff_id?: string | null
          staff_name: string
          status?: string
          subject: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          is_anonymous?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          staff_id?: string | null
          staff_name?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      staff_documents: {
        Row: {
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          name: string
          staff_id: string | null
          staff_name: string | null
          type: string
          uploaded_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id: string
          name: string
          staff_id?: string | null
          staff_name?: string | null
          type: string
          uploaded_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          name?: string
          staff_id?: string | null
          staff_name?: string | null
          type?: string
          uploaded_at?: string | null
          url?: string
        }
        Relationships: []
      }
      staff_kpi: {
        Row: {
          bonus_amount: number | null
          created_at: string | null
          id: string
          metrics: Json
          notes: string | null
          overall_score: number | null
          period: string
          rank: number | null
          staff_id: string
          updated_at: string | null
        }
        Insert: {
          bonus_amount?: number | null
          created_at?: string | null
          id?: string
          metrics?: Json
          notes?: string | null
          overall_score?: number | null
          period: string
          rank?: number | null
          staff_id: string
          updated_at?: string | null
        }
        Update: {
          bonus_amount?: number | null
          created_at?: string | null
          id?: string
          metrics?: Json
          notes?: string | null
          overall_score?: number | null
          period?: string
          rank?: number | null
          staff_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_positions: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          permissions: Json | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_requests: {
        Row: {
          approved_by: string | null
          approver_name: string | null
          assigned_to: string | null
          assignee_name: string | null
          attachments: Json | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string
          id: string
          outlet_id: string | null
          priority: string | null
          request_type: string | null
          response_note: string | null
          staff_id: string
          staff_name: string
          status: string | null
          subject: string | null
          target_staff_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          approver_name?: string | null
          assigned_to?: string | null
          assignee_name?: string | null
          attachments?: Json | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description: string
          id?: string
          outlet_id?: string | null
          priority?: string | null
          request_type?: string | null
          response_note?: string | null
          staff_id: string
          staff_name: string
          status?: string | null
          subject?: string | null
          target_staff_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          approver_name?: string | null
          assigned_to?: string | null
          assignee_name?: string | null
          attachments?: Json | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string
          id?: string
          outlet_id?: string | null
          priority?: string | null
          request_type?: string | null
          response_note?: string | null
          staff_id?: string
          staff_name?: string
          status?: string | null
          subject?: string | null
          target_staff_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_shifts: {
        Row: {
          created_at: string | null
          day_of_week: number
          id: string
          is_off_day: boolean | null
          outlet_id: string | null
          shift_id: string | null
          staff_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          id?: string
          is_off_day?: boolean | null
          outlet_id?: string | null
          shift_id?: string | null
          staff_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_off_day?: boolean | null
          outlet_id?: string | null
          shift_id?: string | null
          staff_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shift_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_training: {
        Row: {
          category: string
          certificate_number: string | null
          completed_at: string | null
          course_name: string
          created_at: string | null
          expires_at: string | null
          id: string
          notes: string | null
          provider: string
          scheduled_date: string | null
          staff_id: string
          staff_name: string
          status: string
        }
        Insert: {
          category: string
          certificate_number?: string | null
          completed_at?: string | null
          course_name: string
          created_at?: string | null
          expires_at?: string | null
          id: string
          notes?: string | null
          provider: string
          scheduled_date?: string | null
          staff_id: string
          staff_name: string
          status: string
        }
        Update: {
          category?: string
          certificate_number?: string | null
          completed_at?: string | null
          course_name?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          provider?: string
          scheduled_date?: string | null
          staff_id?: string
          staff_name?: string
          status?: string
        }
        Relationships: []
      }
      staff_xp: {
        Row: {
          current_level: number | null
          current_xp: number | null
          staff_id: string
          total_points_earned: number | null
          updated_at: string | null
        }
        Insert: {
          current_level?: number | null
          current_xp?: number | null
          staff_id: string
          total_points_earned?: number | null
          updated_at?: string | null
        }
        Update: {
          current_level?: number | null
          current_xp?: number | null
          staff_id?: string
          total_points_earned?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_xp_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string | null
          current_quantity: number | null
          id: string
          inventory_id: string
          inventory_name: string
          is_acknowledged: boolean | null
          notes: string | null
          outlet_id: string | null
          threshold_quantity: number | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string | null
          current_quantity?: number | null
          id?: string
          inventory_id: string
          inventory_name: string
          is_acknowledged?: boolean | null
          notes?: string | null
          outlet_id?: string | null
          threshold_quantity?: number | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string | null
          current_quantity?: number | null
          id?: string
          inventory_id?: string
          inventory_name?: string
          is_acknowledged?: boolean | null
          notes?: string | null
          outlet_id?: string | null
          threshold_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          account_numbers: Json | null
          address: string | null
          category: string[] | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          lead_time_days: number | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string
          rating: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_numbers?: Json | null
          address?: string | null
          category?: string[] | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          lead_time_days?: number | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone: string
          rating?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_numbers?: Json | null
          address?: string | null
          category?: string[] | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          lead_time_days?: number | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string
          rating?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          rate: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          rate: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          rate?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      training_records: {
        Row: {
          certificate_url: string | null
          completion_date: string | null
          created_at: string | null
          id: string
          notes: string | null
          score: number | null
          staff_id: string
          training_name: string
          training_type: string | null
        }
        Insert: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          staff_id: string
          training_name: string
          training_type?: string | null
        }
        Update: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          staff_id?: string
          training_name?: string
          training_type?: string | null
        }
        Relationships: []
      }
      user: {
        Row: {
          address: string | null
          approvedAt: string | null
          approvedBy: string | null
          createdAt: string
          dateOfBirth: string | null
          email: string
          emailVerified: boolean
          emergencyContact: Json | null
          extendedData: Json | null
          failedLoginAttempts: number | null
          icNumber: string | null
          id: string
          image: string | null
          lastFailedLogin: string | null
          lockedUntil: string | null
          name: string
          outletId: string | null
          phone: string | null
          rejectionReason: string | null
          role: string | null
          status: string | null
          updatedAt: string
        }
        Insert: {
          address?: string | null
          approvedAt?: string | null
          approvedBy?: string | null
          createdAt?: string
          dateOfBirth?: string | null
          email: string
          emailVerified?: boolean
          emergencyContact?: Json | null
          extendedData?: Json | null
          failedLoginAttempts?: number | null
          icNumber?: string | null
          id: string
          image?: string | null
          lastFailedLogin?: string | null
          lockedUntil?: string | null
          name: string
          outletId?: string | null
          phone?: string | null
          rejectionReason?: string | null
          role?: string | null
          status?: string | null
          updatedAt?: string
        }
        Update: {
          address?: string | null
          approvedAt?: string | null
          approvedBy?: string | null
          createdAt?: string
          dateOfBirth?: string | null
          email?: string
          emailVerified?: boolean
          emergencyContact?: Json | null
          extendedData?: Json | null
          failedLoginAttempts?: number | null
          icNumber?: string | null
          id?: string
          image?: string | null
          lastFailedLogin?: string | null
          lockedUntil?: string | null
          name?: string
          outletId?: string | null
          phone?: string | null
          rejectionReason?: string | null
          role?: string | null
          status?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      verification: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          identifier: string
          updatedAt: string
          value: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          identifier: string
          updatedAt?: string
          value: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          identifier?: string
          updatedAt?: string
          value?: string
        }
        Relationships: []
      }
      void_refund_requests: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          created_at: string | null
          id: string
          inventory_reversed: boolean | null
          items_to_refund: Json | null
          order_id: string | null
          order_number: string
          reason: string
          rejection_reason: string | null
          requested_at: string | null
          requested_by: string | null
          requested_by_name: string | null
          reversal_details: Json | null
          sales_reversed: boolean | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string | null
          id?: string
          inventory_reversed?: boolean | null
          items_to_refund?: Json | null
          order_id?: string | null
          order_number: string
          reason: string
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          requested_by_name?: string | null
          reversal_details?: Json | null
          sales_reversed?: boolean | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string | null
          id?: string
          inventory_reversed?: boolean | null
          items_to_refund?: Json | null
          order_id?: string | null
          order_number?: string
          reason?: string
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          requested_by_name?: string | null
          reversal_details?: Json | null
          sales_reversed?: boolean | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "void_refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_logs: {
        Row: {
          cost_per_unit: number
          created_at: string | null
          id: string
          notes: string | null
          photo_url: string | null
          quantity: number
          reason: string
          reported_by: string | null
          reported_by_name: string | null
          stock_id: string | null
          total_loss: number | null
          unit: string
        }
        Insert: {
          cost_per_unit: number
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          quantity: number
          reason: string
          reported_by?: string | null
          reported_by_name?: string | null
          stock_id?: string | null
          total_loss?: number | null
          unit: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          quantity?: number
          reason?: string
          reported_by?: string | null
          reported_by_name?: string | null
          stock_id?: string | null
          total_loss?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_logs_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_logs_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_logs: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          points: number
          reason: string
          staff_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points: number
          reason: string
          staff_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points?: number
          reason?: string
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xp_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_public_customer: {
        Args: { data: Json }
        Returns: {
          birthday: string | null
          created_at: string | null
          email: string | null
          id: string
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string | null
          segment: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "customers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_public_order: {
        Args: { data: Json }
        Returns: {
          cashier_id: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_details: Json | null
          discount: number | null
          discount_amount: number | null
          id: string
          is_synced_offline: boolean | null
          items: Json
          loyalty_points_earned: number | null
          loyalty_points_redeemed: number | null
          notes: string | null
          order_number: string
          order_type: string
          original_offline_id: string | null
          outlet_id: string | null
          payment_method: string | null
          prepared_by_staff_id: string | null
          preparing_started_at: string | null
          promo_code_id: string | null
          proof_of_payment_url: string | null
          ready_at: string | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          refunded_by: string | null
          staff_id: string | null
          staff_name: string | null
          status: string
          stripe_payment_intent_id: string | null
          subtotal: number | null
          table_number: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
          void_refund_status: string | null
          voided_at: string | null
          voided_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      debug_access_status: { Args: never; Returns: Json }
      get_public_order: {
        Args: { order_id: string }
        Returns: {
          cashier_id: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_details: Json | null
          discount: number | null
          discount_amount: number | null
          id: string
          is_synced_offline: boolean | null
          items: Json
          loyalty_points_earned: number | null
          loyalty_points_redeemed: number | null
          notes: string | null
          order_number: string
          order_type: string
          original_offline_id: string | null
          outlet_id: string | null
          payment_method: string | null
          prepared_by_staff_id: string | null
          preparing_started_at: string | null
          promo_code_id: string | null
          proof_of_payment_url: string | null
          ready_at: string | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          refunded_by: string | null
          staff_id: string | null
          staff_name: string | null
          status: string
          stripe_payment_intent_id: string | null
          subtotal: number | null
          table_number: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
          void_refund_status: string | null
          voided_at: string | null
          voided_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
