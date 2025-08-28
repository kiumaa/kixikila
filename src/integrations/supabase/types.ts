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
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          email: string
          email_verified: boolean | null
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
          email: string
          email_verified?: boolean | null
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
          email?: string
          email_verified?: boolean | null
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
      cleanup_expired_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_otps: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_all_users_safe_data: {
        Args: { limit_count?: number; offset_count?: number }
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
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      get_users_safe_list: {
        Args: { limit_count?: number; offset_count?: number }
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
      security_health_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: string
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
