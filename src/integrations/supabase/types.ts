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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_pin: {
        Row: {
          created_at: string | null
          pin_hash: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          pin_hash: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          pin_hash?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_pin_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      device_sessions: {
        Row: {
          created_at: string | null
          device_id: string
          device_name: string | null
          expires_at: string
          failed_pin_attempts: number | null
          id: string
          last_seen: string | null
          lock_until: string | null
          trusted: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_name?: string | null
          expires_at: string
          failed_pin_attempts?: number | null
          id?: string
          last_seen?: string | null
          lock_until?: string | null
          trusted?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_name?: string | null
          expires_at?: string
          failed_pin_attempts?: number | null
          id?: string
          last_seen?: string | null
          lock_until?: string | null
          trusted?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_configurations: {
        Row: {
          auto_retry_enabled: boolean | null
          bounce_handling_enabled: boolean | null
          created_at: string
          id: string
          max_retry_attempts: number | null
          rate_limit_per_email: number | null
          rate_limit_window_minutes: number | null
          template_notification: string | null
          template_otp: string | null
          template_password_reset: string | null
          template_welcome: string | null
          updated_at: string
        }
        Insert: {
          auto_retry_enabled?: boolean | null
          bounce_handling_enabled?: boolean | null
          created_at?: string
          id?: string
          max_retry_attempts?: number | null
          rate_limit_per_email?: number | null
          rate_limit_window_minutes?: number | null
          template_notification?: string | null
          template_otp?: string | null
          template_password_reset?: string | null
          template_welcome?: string | null
          updated_at?: string
        }
        Update: {
          auto_retry_enabled?: boolean | null
          bounce_handling_enabled?: boolean | null
          created_at?: string
          id?: string
          max_retry_attempts?: number | null
          rate_limit_per_email?: number | null
          rate_limit_window_minutes?: number | null
          template_notification?: string | null
          template_otp?: string | null
          template_password_reset?: string | null
          template_welcome?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_configurations_template_notification_fkey"
            columns: ["template_notification"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_configurations_template_otp_fkey"
            columns: ["template_otp"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_configurations_template_password_reset_fkey"
            columns: ["template_password_reset"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_configurations_template_welcome_fkey"
            columns: ["template_welcome"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      group_cycles: {
        Row: {
          created_at: string
          cycle_number: number
          draw_date: string
          draw_method: string
          group_id: string
          id: string
          metadata: Json | null
          participants: Json | null
          prize_amount: number
          status: string
          updated_at: string
          winner_member_id: string
          winner_user_id: string
        }
        Insert: {
          created_at?: string
          cycle_number: number
          draw_date?: string
          draw_method?: string
          group_id: string
          id?: string
          metadata?: Json | null
          participants?: Json | null
          prize_amount?: number
          status?: string
          updated_at?: string
          winner_member_id: string
          winner_user_id: string
        }
        Update: {
          created_at?: string
          cycle_number?: number
          draw_date?: string
          draw_method?: string
          group_id?: string
          id?: string
          metadata?: Json | null
          participants?: Json | null
          prize_amount?: number
          status?: string
          updated_at?: string
          winner_member_id?: string
          winner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_cycles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_cycles_winner_member_id_fkey"
            columns: ["winner_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string | null
          expires_at: string
          group_id: string
          id: string
          invite_token: string
          invited_by: string
          message: string | null
          phone: string | null
          role: Database["public"]["Enums"]["member_role"]
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          group_id: string
          id?: string
          invite_token: string
          invited_by: string
          message?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          group_id?: string
          id?: string
          invite_token?: string
          invited_by?: string
          message?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          approved_at: string | null
          created_at: string
          current_balance: number
          group_id: string
          id: string
          invitation_token: string | null
          invited_by: string | null
          joined_at: string
          last_payout_date: string | null
          left_at: string | null
          payout_position: number | null
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          total_contributed: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          current_balance?: number
          group_id: string
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          joined_at?: string
          last_payout_date?: string | null
          left_at?: string | null
          payout_position?: number | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          total_contributed?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          current_balance?: number
          group_id?: string
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          joined_at?: string
          last_payout_date?: string | null
          left_at?: string | null
          payout_position?: number | null
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          total_contributed?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          auto_withdraw: boolean
          contribution_amount: number
          contribution_frequency: string
          created_at: string
          creator_id: string
          current_cycle: number | null
          current_members: number
          description: string | null
          end_date: string | null
          group_type: Database["public"]["Enums"]["group_type"]
          id: string
          is_private: boolean
          last_draw_date: string | null
          max_members: number
          name: string
          next_payout_date: string | null
          requires_approval: boolean
          rules: Json | null
          settings: Json | null
          start_date: string | null
          status: Database["public"]["Enums"]["group_status"]
          total_pool: number
          updated_at: string
        }
        Insert: {
          auto_withdraw?: boolean
          contribution_amount?: number
          contribution_frequency?: string
          created_at?: string
          creator_id: string
          current_cycle?: number | null
          current_members?: number
          description?: string | null
          end_date?: string | null
          group_type?: Database["public"]["Enums"]["group_type"]
          id?: string
          is_private?: boolean
          last_draw_date?: string | null
          max_members?: number
          name: string
          next_payout_date?: string | null
          requires_approval?: boolean
          rules?: Json | null
          settings?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["group_status"]
          total_pool?: number
          updated_at?: string
        }
        Update: {
          auto_withdraw?: boolean
          contribution_amount?: number
          contribution_frequency?: string
          created_at?: string
          creator_id?: string
          current_cycle?: number | null
          current_members?: number
          description?: string | null
          end_date?: string | null
          group_type?: Database["public"]["Enums"]["group_type"]
          id?: string
          is_private?: boolean
          last_draw_date?: string | null
          max_members?: number
          name?: string
          next_payout_date?: string | null
          requires_approval?: boolean
          rules?: Json | null
          settings?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["group_status"]
          total_pool?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_status: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string | null
          notes: string | null
          reviewed_at: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          language: string
          name: string
          subject: string | null
          type: string
          updated_at: string
          variables: Json | null
          version: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          language?: string
          name: string
          subject?: string | null
          type: string
          updated_at?: string
          variables?: Json | null
          version?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          language?: string
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string
          variables?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      notification_configurations: {
        Row: {
          apns_certificate: string | null
          created_at: string
          email_notifications_enabled: boolean | null
          fcm_server_key: string | null
          id: string
          max_notifications_per_day: number | null
          notification_frequency: string | null
          push_notifications_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_notifications_enabled: boolean | null
          updated_at: string
          weekend_notifications: boolean | null
        }
        Insert: {
          apns_certificate?: string | null
          created_at?: string
          email_notifications_enabled?: boolean | null
          fcm_server_key?: string | null
          id?: string
          max_notifications_per_day?: number | null
          notification_frequency?: string | null
          push_notifications_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string
          weekend_notifications?: boolean | null
        }
        Update: {
          apns_certificate?: string | null
          created_at?: string
          email_notifications_enabled?: boolean | null
          fcm_server_key?: string | null
          id?: string
          max_notifications_per_day?: number | null
          notification_frequency?: string | null
          push_notifications_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string
          weekend_notifications?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          expires_at: string
          id: string
          max_attempts: number | null
          status: string | null
          type: string
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          max_attempts?: number | null
          status?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          max_attempts?: number | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_configurations: {
        Row: {
          created_at: string
          id: string
          ip_blacklist: string[] | null
          ip_whitelist: string[] | null
          max_concurrent_sessions: number | null
          password_min_length: number | null
          password_require_lowercase: boolean | null
          password_require_numbers: boolean | null
          password_require_symbols: boolean | null
          password_require_uppercase: boolean | null
          rate_limit_api: number | null
          rate_limit_login: number | null
          rate_limit_window_minutes: number | null
          session_timeout_minutes: number | null
          suspicious_activity_threshold: number | null
          two_factor_required: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_blacklist?: string[] | null
          ip_whitelist?: string[] | null
          max_concurrent_sessions?: number | null
          password_min_length?: number | null
          password_require_lowercase?: boolean | null
          password_require_numbers?: boolean | null
          password_require_symbols?: boolean | null
          password_require_uppercase?: boolean | null
          rate_limit_api?: number | null
          rate_limit_login?: number | null
          rate_limit_window_minutes?: number | null
          session_timeout_minutes?: number | null
          suspicious_activity_threshold?: number | null
          two_factor_required?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_blacklist?: string[] | null
          ip_whitelist?: string[] | null
          max_concurrent_sessions?: number | null
          password_min_length?: number | null
          password_require_lowercase?: boolean | null
          password_require_numbers?: boolean | null
          password_require_symbols?: boolean | null
          password_require_uppercase?: boolean | null
          rate_limit_api?: number | null
          rate_limit_login?: number | null
          rate_limit_window_minutes?: number | null
          session_timeout_minutes?: number | null
          suspicious_activity_threshold?: number | null
          two_factor_required?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      service_status: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_check: string
          response_time_ms: number | null
          service_name: string
          status: string
          uptime_percentage: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check?: string
          response_time_ms?: number | null
          service_name: string
          status: string
          uptime_percentage?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check?: string
          response_time_ms?: number | null
          service_name?: string
          status?: string
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      sms_configurations: {
        Row: {
          allowed_countries: string[] | null
          blacklisted_numbers: string[] | null
          created_at: string
          default_template_notification: string | null
          default_template_otp: string | null
          id: string
          max_attempts: number | null
          rate_limit_per_number: number | null
          rate_limit_window_minutes: number | null
          sender_id: string | null
          timeout_seconds: number | null
          updated_at: string
        }
        Insert: {
          allowed_countries?: string[] | null
          blacklisted_numbers?: string[] | null
          created_at?: string
          default_template_notification?: string | null
          default_template_otp?: string | null
          id?: string
          max_attempts?: number | null
          rate_limit_per_number?: number | null
          rate_limit_window_minutes?: number | null
          sender_id?: string | null
          timeout_seconds?: number | null
          updated_at?: string
        }
        Update: {
          allowed_countries?: string[] | null
          blacklisted_numbers?: string[] | null
          created_at?: string
          default_template_notification?: string | null
          default_template_otp?: string | null
          id?: string
          max_attempts?: number | null
          rate_limit_per_number?: number | null
          rate_limit_window_minutes?: number | null
          sender_id?: string | null
          timeout_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_configurations_default_template_notification_fkey"
            columns: ["default_template_notification"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_configurations_default_template_otp_fkey"
            columns: ["default_template_otp"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configurations: {
        Row: {
          config_key: string
          config_type: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          is_sensitive: boolean | null
          updated_at: string
        }
        Insert: {
          config_key: string
          config_type?: string
          config_value: Json
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_type?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string
          failed_reason: string | null
          group_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference: string | null
          processed_at: string | null
          reference: string
          related_transaction_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description: string
          failed_reason?: string | null
          group_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          processed_at?: string | null
          reference?: string
          related_transaction_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string
          failed_reason?: string | null
          group_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          processed_at?: string | null
          reference?: string
          related_transaction_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_related_transaction_id_fkey"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active_groups: number | null
          address: string | null
          avatar_url: string | null
          city: string | null
          completed_cycles: number | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          email_verified: boolean | null
          first_login: boolean | null
          full_name: string
          id: string
          is_active: boolean | null
          is_vip: boolean | null
          kyc_status: string | null
          last_login: string | null
          phone: string | null
          phone_verified: boolean | null
          role: string | null
          total_earned: number | null
          total_saved: number | null
          total_withdrawn: number | null
          trust_score: number | null
          updated_at: string | null
          vip_expiry_date: string | null
          wallet_balance: number | null
        }
        Insert: {
          active_groups?: number | null
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          completed_cycles?: number | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_login?: boolean | null
          full_name: string
          id: string
          is_active?: boolean | null
          is_vip?: boolean | null
          kyc_status?: string | null
          last_login?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          role?: string | null
          total_earned?: number | null
          total_saved?: number | null
          total_withdrawn?: number | null
          trust_score?: number | null
          updated_at?: string | null
          vip_expiry_date?: string | null
          wallet_balance?: number | null
        }
        Update: {
          active_groups?: number | null
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          completed_cycles?: number | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_login?: boolean | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_vip?: boolean | null
          kyc_status?: string | null
          last_login?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          role?: string | null
          total_earned?: number | null
          total_saved?: number | null
          total_withdrawn?: number | null
          trust_score?: number | null
          updated_at?: string | null
          vip_expiry_date?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      webhook_configurations: {
        Row: {
          created_at: string
          created_by: string | null
          events: string[]
          headers: Json | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          retry_attempts: number | null
          secret_key: string | null
          timeout_seconds: number | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          events: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          retry_attempts?: number | null
          secret_key?: string | null
          timeout_seconds?: number | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          retry_attempts?: number | null
          secret_key?: string | null
          timeout_seconds?: number | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_group_invitation: {
        Args: { invitation_token: string }
        Returns: undefined
      }
      audit_critical_operation: {
        Args: {
          entity_id?: string
          entity_type?: string
          operation_data?: Json
          operation_type: string
        }
        Returns: undefined
      }
      automated_cleanup_production: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      classify_user_data_sensitivity: {
        Args: { column_name: string }
        Returns: string
      }
      cleanup_expired_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_otps: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      comprehensive_security_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_category: string
          check_name: string
          details: string
          severity: string
          status: string
        }[]
      }
      comprehensive_security_validation: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_required: boolean
          category: string
          check_name: string
          details: string
          status: string
        }[]
      }
      create_secure_temp_credentials: {
        Args: { credential_type?: string; user_phone: string }
        Returns: {
          credential_id: string
          expires_at: string
          masked_credential: string
        }[]
      }
      detect_security_anomalies: {
        Args: Record<PropertyKey, never>
        Returns: {
          affected_entities: string[]
          anomaly_type: string
          description: string
          detected_at: string
          recommendations: string[]
          severity: string
        }[]
      }
      detect_suspicious_activities: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_type: string
          count: number
          description: string
          latest_occurrence: string
          recommendations: string[]
          severity: string
        }[]
      }
      encrypt_sensitive_config: {
        Args: { config_value: Json; is_sensitive?: boolean }
        Returns: Json
      }
      encrypt_sensitive_config_value: {
        Args: { config_value: Json; is_sensitive?: boolean }
        Returns: Json
      }
      generate_invite_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_group_cycle_history: {
        Args: { target_group_id: string }
        Returns: {
          cycle_number: number
          draw_date: string
          draw_method: string
          prize_amount: number
          winner_name: string
        }[]
      }
      get_group_statistics: {
        Args: { target_group_id: string }
        Returns: {
          active_members: number
          avg_contribution: number
          current_pool: number
          total_contributed: number
          total_members: number
          total_withdrawn: number
        }[]
      }
      get_masked_config_value: {
        Args: { config_key: string; config_value: Json; is_sensitive: boolean }
        Returns: Json
      }
      get_secure_configuration: {
        Args: { config_keys?: string[]; table_name: string }
        Returns: {
          access_level: string
          config_data: Json
          id: string
          last_modified: string
        }[]
      }
      get_secure_user_data: {
        Args: {
          include_financial?: boolean
          include_pii?: boolean
          target_user_id?: string
        }
        Returns: {
          active_groups: number
          address: string
          avatar_url: string
          city: string
          completed_cycles: number
          country: string
          created_at: string
          date_of_birth: string
          email: string
          email_verified: boolean
          full_name: string
          id: string
          is_active: boolean
          is_vip: boolean
          kyc_status: string
          last_login: string
          phone: string
          phone_verified: boolean
          role: string
          total_earned: string
          total_saved: string
          total_withdrawn: string
          trust_score: number
          updated_at: string
          wallet_balance: string
        }[]
      }
      get_security_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_type: string
          count: number
          latest_occurrence: string
          message: string
          severity: string
        }[]
      }
      get_system_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_users: number
          pending_otps: number
          total_users: number
          unread_notifications: number
          vip_users: number
        }[]
      }
      get_user_groups: {
        Args: { target_user_id?: string }
        Returns: {
          current_balance: number
          group_id: string
          group_name: string
          group_status: Database["public"]["Enums"]["group_status"]
          group_type: Database["public"]["Enums"]["group_type"]
          member_role: Database["public"]["Enums"]["member_role"]
          member_status: Database["public"]["Enums"]["member_status"]
          next_payout_date: string
          total_contributed: number
        }[]
      }
      get_user_role: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_user_safe_data: {
        Args: { target_user_id?: string }
        Returns: {
          active_groups: number
          address: string
          avatar_url: string
          city: string
          completed_cycles: number
          country: string
          created_at: string
          date_of_birth: string
          email: string
          email_verified: boolean
          full_name: string
          id: string
          is_active: boolean
          is_vip: boolean
          kyc_status: string
          last_login: string
          phone: string
          phone_verified: boolean
          role: string
          total_earned: number
          total_saved: number
          total_withdrawn: number
          trust_score: number
          updated_at: string
          vip_expiry_date: string
          wallet_balance: number
        }[]
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_group_member: {
        Args: { group_id: string; user_id: string }
        Returns: boolean
      }
      is_group_ready_for_draw: {
        Args: { target_group_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_configuration_access: {
        Args: {
          config_keys?: string[]
          is_sensitive_access?: boolean
          operation: string
          table_name: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          auto_alert?: boolean
          event_data?: Json
          event_type: string
          severity?: string
        }
        Returns: undefined
      }
      log_security_violation: {
        Args: { details?: Json; severity?: string; violation_type: string }
        Returns: undefined
      }
      log_sensitive_access: {
        Args: { access_type?: string; entity_id: string; entity_type: string }
        Returns: undefined
      }
      log_suspicious_access: {
        Args: { access_pattern: string; entity_type: string; metadata?: Json }
        Returns: undefined
      }
      mask_financial_data: {
        Args: { requesting_user_id?: string; user_id: string; value: number }
        Returns: string
      }
      mask_personal_data: {
        Args: {
          data_type: string
          data_value: string
          owner_id: string
          requesting_user_id?: string
        }
        Returns: string
      }
      mask_sensitive_amount: {
        Args: { amount: number; owner_id: string; requesting_user_id?: string }
        Returns: string
      }
      production_health_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          component: string
          details: string
          last_check: string
          status: string
        }[]
      }
      security_audit_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          description: string
          issue_type: string
          recommendation: string
          severity: string
        }[]
      }
      security_health_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
      security_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          last_updated: string
          metric_name: string
          metric_value: number
          status: string
        }[]
      }
      update_otp_expiry_to_production: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_financial_data: {
        Args: {
          new_total_earned?: number
          new_total_saved?: number
          new_total_withdrawn?: number
          new_wallet_balance?: number
          target_user_id: string
        }
        Returns: undefined
      }
      update_user_profile_secure: {
        Args: { profile_data: Json }
        Returns: undefined
      }
      validate_admin_credentials: {
        Args: { email: string; password: string }
        Returns: Json
      }
      validate_configuration_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          audit_logging: boolean
          has_super_admin_only: boolean
          policies_count: number
          security_level: string
          table_name: string
        }[]
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: {
          is_valid: boolean
          issues: string[]
          recommendations: string[]
          score: number
        }[]
      }
      validate_rls_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_delete: boolean
          has_insert: boolean
          has_select: boolean
          has_update: boolean
          policy_count: number
          table_name: string
        }[]
      }
      validate_security_configuration: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          message: string
          status: string
        }[]
      }
      validate_security_posture: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_required: boolean
          category: string
          check_name: string
          details: string
          severity: string
          status: string
        }[]
      }
      validate_super_admin_domain: {
        Args: { email: string }
        Returns: boolean
      }
      validate_user_data_access: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      verify_function_security_compliance: {
        Args: Record<PropertyKey, never>
        Returns: {
          compliance_status: string
          function_name: string
          search_path_secure: boolean
          security_definer: boolean
        }[]
      }
      verify_user_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
    }
    Enums: {
      group_status: "draft" | "active" | "paused" | "completed" | "cancelled"
      group_type: "savings" | "investment" | "emergency" | "goal_based"
      member_role: "creator" | "admin" | "member" | "pending"
      member_status: "active" | "pending" | "suspended" | "left"
      payment_method: "stripe" | "bank_transfer" | "mobile_money" | "cash"
      transaction_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "contribution"
        | "reward"
        | "fee"
        | "transfer"
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
    Enums: {
      group_status: ["draft", "active", "paused", "completed", "cancelled"],
      group_type: ["savings", "investment", "emergency", "goal_based"],
      member_role: ["creator", "admin", "member", "pending"],
      member_status: ["active", "pending", "suspended", "left"],
      payment_method: ["stripe", "bank_transfer", "mobile_money", "cash"],
      transaction_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      transaction_type: [
        "deposit",
        "withdrawal",
        "contribution",
        "reward",
        "fee",
        "transfer",
      ],
    },
  },
} as const
