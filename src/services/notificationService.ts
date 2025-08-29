import { supabase } from '@/integrations/supabase/client';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '@/config/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string; // Changed from union type to string to match Supabase
  category?: string; // Optional category field
  read: boolean;
  created_at: string;
  updated_at: string;
  metadata?: any; // Changed from Record<string, any> to any
  action_url?: string;
  user_id?: string; // Added user_id field
}

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  group_notifications: boolean;
  payment_notifications: boolean;
  security_notifications: boolean;
  marketing_notifications: boolean;
}

export interface NotificationFilters {
  category?: string;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class NotificationService {
  /**
   * Get user notifications with pagination and filters
   */
  async getNotifications(filters: NotificationFilters = {}): Promise<NotificationResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.category) {
        query = query.eq('type', filters.category);
      }

      if (filters.unreadOnly) {
        query = query.eq('read', false);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: notifications, error, count } = await query.range(from, to);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Failed to fetch notifications');
      }

      return {
        notifications: notifications || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('NotificationService.getNotifications error:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('NotificationService.getUnreadCount error:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('NotificationService.markAsRead error:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('NotificationService.markAllAsRead error:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('NotificationService.deleteNotification error:', error);
      return false;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Try to get from users metadata or create simple default structure
      let userPrefs: any = {};
      
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && userData) {
          // For now, we'll store preferences in a simple way
          // This could be moved to a separate preferences table later
          userPrefs = {};
        }
      } catch (err) {
        console.warn('Could not fetch user data, using defaults');
      }
      // Merge with defaults
      return {
        email_notifications: userPrefs.email_notifications ?? true,
        sms_notifications: userPrefs.sms_notifications ?? false,
        push_notifications: userPrefs.push_notifications ?? true,
        group_notifications: userPrefs.group_notifications ?? true,
        payment_notifications: userPrefs.payment_notifications ?? true,
        security_notifications: userPrefs.security_notifications ?? true,
        marketing_notifications: userPrefs.marketing_notifications ?? false
      };
    } catch (error) {
      console.error('NotificationService.getPreferences error:', error);
      // Return default preferences on error
      return {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        group_notifications: true,
        payment_notifications: true,
        security_notifications: true,
        marketing_notifications: false
      };
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current preferences and merge with updates
      const currentPrefs = await this.getPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences };

      // For now, we'll just return success
      // In a real implementation, this would store in a preferences table
      // or in user metadata if that field exists
      console.log('Updated preferences:', updatedPrefs);
      
      return true;
    } catch (error) {
      console.error('NotificationService.updatePreferences error:', error);
      return false;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(
    title: string = 'Notificação de Teste',
    message: string = 'Esta é uma notificação de teste do KIXIKILA.',
    type: 'info' | 'warning' | 'success' | 'error' = 'info'
  ): Promise<boolean> {
    try {
      const response = await supabase.functions.invoke('send-message', {
        body: {
          type: 'notification',
          title,
          message,
          notificationType: type,
          sendPush: true
        }
      });

      if (response.error) {
        console.error('Error sending test notification:', response.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('NotificationService.sendTestNotification error:', error);
      return false;
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  subscribeToNotifications(
    onNotification: (notification: Notification) => void,
    onUpdate: (notification: Notification) => void,
    onDelete: (id: string) => void
  ) {
    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          onNotification(payload.new as Notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          onUpdate(payload.new as Notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          onDelete(payload.old.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Request notification permission for push notifications
   */
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      if (window.Notification.permission === 'granted') {
        return true;
      }

      if (window.Notification.permission === 'denied') {
        return false;
      }

      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(title: string, message: string, icon?: string) {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(title, {
          body: message,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;