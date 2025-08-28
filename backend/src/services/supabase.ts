import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Database types based on the frontend structure
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string;
          role: 'user' | 'admin';
          is_vip: boolean;
          is_active: boolean;
          email_verified: boolean;
          phone_verified: boolean;
          avatar_url?: string;
          date_of_birth?: string;
          address?: string;
          city?: string;
          country?: string;
          created_at: string;
          updated_at: string;
          last_login?: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          phone: string;
          role?: 'user' | 'admin';
          is_vip?: boolean;
          is_active?: boolean;
          email_verified?: boolean;
          phone_verified?: boolean;
          avatar_url?: string;
          date_of_birth?: string;
          address?: string;
          city?: string;
          country?: string;
          created_at?: string;
          updated_at?: string;
          last_login?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string;
          role?: 'user' | 'admin';
          is_vip?: boolean;
          is_active?: boolean;
          email_verified?: boolean;
          phone_verified?: boolean;
          avatar_url?: string;
          date_of_birth?: string;
          address?: string;
          city?: string;
          country?: string;
          created_at?: string;
          updated_at?: string;
          last_login?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description?: string;
          target_amount: number;
          contribution_amount: number;
          frequency: 'weekly' | 'monthly';
          max_members: number;
          current_members: number;
          status: 'active' | 'completed' | 'cancelled';
          created_by: string;
          start_date: string;
          end_date?: string;
          next_draw_date?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          target_amount: number;
          contribution_amount: number;
          frequency: 'weekly' | 'monthly';
          max_members: number;
          current_members?: number;
          status?: 'active' | 'completed' | 'cancelled';
          created_by: string;
          start_date: string;
          end_date?: string;
          next_draw_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          target_amount?: number;
          contribution_amount?: number;
          frequency?: 'weekly' | 'monthly';
          max_members?: number;
          current_members?: number;
          status?: 'active' | 'completed' | 'cancelled';
          created_by?: string;
          start_date?: string;
          end_date?: string;
          next_draw_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          status: 'active' | 'inactive' | 'pending';
          joined_at: string;
          position?: number;
          has_received_payout: boolean;
          payout_date?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          status?: 'active' | 'inactive' | 'pending';
          joined_at?: string;
          position?: number;
          has_received_payout?: boolean;
          payout_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          status?: 'active' | 'inactive' | 'pending';
          joined_at?: string;
          position?: number;
          has_received_payout?: boolean;
          payout_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          amount: number;
          type: 'contribution' | 'payout' | 'fee' | 'refund';
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          description?: string;
          payment_method?: string;
          stripe_payment_intent_id?: string;
          due_date?: string;
          completed_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          amount: number;
          type: 'contribution' | 'payout' | 'fee' | 'refund';
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          description?: string;
          payment_method?: string;
          stripe_payment_intent_id?: string;
          due_date?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          amount?: number;
          type?: 'contribution' | 'payout' | 'fee' | 'refund';
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          description?: string;
          payment_method?: string;
          stripe_payment_intent_id?: string;
          due_date?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'success' | 'warning' | 'error';
          category: 'payment' | 'group' | 'system' | 'promotion';
          is_read: boolean;
          action_url?: string;
          metadata?: any;
          created_at: string;
          read_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'success' | 'warning' | 'error';
          category: 'payment' | 'group' | 'system' | 'promotion';
          is_read?: boolean;
          action_url?: string;
          metadata?: any;
          created_at?: string;
          read_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'info' | 'success' | 'warning' | 'error';
          category?: 'payment' | 'group' | 'system' | 'promotion';
          is_read?: boolean;
          action_url?: string;
          metadata?: any;
          created_at?: string;
          read_at?: string;
        };
      };
      system_config: {
        Row: {
          id: string;
          key: string;
          value: string;
          description?: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          description?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          description?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Create Supabase client
export const supabase: SupabaseClient<Database> = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'kixikila-backend',
      },
    },
  }
);

// Create admin client with service role key
export const supabaseAdmin: SupabaseClient<Database> = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey || config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'kixikila-backend-admin',
      },
    },
  }
);

// Test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    // Use a simple query that doesn't depend on specific tables
    const { data, error } = await supabase
      .rpc('version');
    
    if (error) {
      // If RPC fails, try a basic auth check
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError && authError.message.includes('Invalid API key')) {
        logger.error('Supabase connection test failed: Invalid API key');
        return false;
      }
      // If it's just a session error, connection is still valid
      logger.info('✅ Supabase connection successful (auth check)');
      return true;
    }
    
    logger.info('✅ Supabase connection successful (version check)');
    return true;
  } catch (error) {
    logger.error('Supabase connection test error:', error);
    return false;
  }
};

// Initialize connection test
testConnection();

export default supabase;