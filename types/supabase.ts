export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          full_name: string
          phone: string | null
          role: string | null
          avatar_url: string | null
          address: string | null
          city: string | null
          country: string | null
          kyc_status: string | null
          phone_verified: boolean | null
          email_verified: boolean | null
          is_active: boolean | null
          is_vip: boolean | null
          vip_expiry_date: string | null
          trust_score: number | null
          active_groups: number | null
          completed_cycles: number | null
          wallet_balance: number | null
          total_saved: number | null
          total_earned: number | null
          total_withdrawn: number | null
          created_at: string | null
          updated_at: string | null
          last_login: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name: string
          phone?: string | null
          role?: string | null
          avatar_url?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          kyc_status?: string | null
          phone_verified?: boolean | null
          email_verified?: boolean | null
          is_active?: boolean | null
          is_vip?: boolean | null
          vip_expiry_date?: string | null
          trust_score?: number | null
          active_groups?: number | null
          completed_cycles?: number | null
          wallet_balance?: number | null
          total_saved?: number | null
          total_earned?: number | null
          total_withdrawn?: number | null
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string
          phone?: string | null
          role?: string | null
          avatar_url?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          kyc_status?: string | null
          phone_verified?: boolean | null
          email_verified?: boolean | null
          is_active?: boolean | null
          is_vip?: boolean | null
          vip_expiry_date?: string | null
          trust_score?: number | null
          active_groups?: number | null
          completed_cycles?: number | null
          wallet_balance?: number | null
          total_saved?: number | null
          total_earned?: number | null
          total_withdrawn?: number | null
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}