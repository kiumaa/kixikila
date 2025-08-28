import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  vipUsers: number;
  pendingOtps: number;
  unreadNotifications: number;
};

export type AdminUser = Database['public']['Tables']['users']['Row'] & {
  status: 'active' | 'banned' | 'inactive';
};

export type AdminActivity = Database['public']['Tables']['audit_logs']['Row'];

export class AdminService {
  // Get real-time admin statistics
  static async getStats(): Promise<AdminStats> {
    const { data, error } = await supabase.rpc('get_system_stats');
    
    if (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }

    // Convert snake_case to camelCase
    const rawStats = data[0];
    if (rawStats) {
      return {
        totalUsers: rawStats.total_users || 0,
        activeUsers: rawStats.active_users || 0,
        vipUsers: rawStats.vip_users || 0,
        pendingOtps: rawStats.pending_otps || 0,
        unreadNotifications: rawStats.unread_notifications || 0
      };
    }

    return {
      totalUsers: 0,
      activeUsers: 0,
      vipUsers: 0,
      pendingOtps: 0,
      unreadNotifications: 0
    };
  }

  // Get all users with pagination and filters
  static async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isVip?: boolean;
    isActive?: boolean;
  } = {}) {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (options.search) {
      query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%,phone.ilike.%${options.search}%`);
    }

    if (options.role) {
      query = query.eq('role', options.role);
    }

    if (options.isVip !== undefined) {
      query = query.eq('is_vip', options.isVip);
    }

    if (options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    // Apply pagination
    if (options.page && options.limit) {
      const start = (options.page - 1) * options.limit;
      const end = start + options.limit - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return { users: data || [], totalCount: count || 0 };
  }

  // Update user status (ban/unban/activate)
  static async updateUserStatus(userId: string, updates: {
    is_active?: boolean;
    role?: string;
    is_vip?: boolean;
  }) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user status:', error);
      throw error;
    }

    // Log the admin action
    await this.logAdminAction('user_update', 'user', userId, `Updated user status: ${JSON.stringify(updates)}`);

    return data;
  }

  // Get recent activity logs
  static async getActivityLogs(limit: number = 10) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }

    return data || [];
  }

  // Log admin actions
  static async logAdminAction(
    action: string,
    entityType: string,
    entityId: string,
    details: string
  ) {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        entity_type: entityType,
        entity_id: entityId,
        new_values: { details },
      });

    if (error) {
      console.error('Error logging admin action:', error);
    }
  }

  // Get notifications for admin
  static async getNotifications(limit: number = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  }

  // Create a notification
  static async createNotification(notification: {
    title: string;
    message: string;
    type: string;
    user_id?: string;
    action_url?: string;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    return data;
  }

  // Real-time subscription for admin stats
  static subscribeToStats(callback: (stats: AdminStats) => void) {
    const channel = supabase
      .channel('admin-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        async () => {
          try {
            const stats = await this.getStats();
            callback(stats);
          } catch (error) {
            console.error('Error fetching stats on change:', error);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  // Real-time subscription for activity logs
  static subscribeToActivityLogs(callback: (logs: AdminActivity[]) => void) {
    const channel = supabase
      .channel('admin-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        async () => {
          try {
            const logs = await this.getActivityLogs();
            callback(logs);
          } catch (error) {
            console.error('Error fetching activity logs on change:', error);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }
}