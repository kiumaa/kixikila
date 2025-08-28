import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { smsService } from '../services/smsService';
import { emailService } from '../services/emailService';
import { logger } from '../utils/logger';
import { 
  ValidationError, 
  NotFoundError, 
  InternalServerError 
} from '../middleware/errorHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
  };
}

interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'system' | 'group' | 'payment' | 'security' | 'reminder';
  metadata?: Record<string, any>;
  sendSMS?: boolean;
  sendEmail?: boolean;
}

class NotificationController {
  /**
   * Get user notifications with pagination
   */
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      const { page = 1, limit = 20, category, unreadOnly } = req.query;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Filter by category if provided
      if (category) {
        query = query.eq('category', category);
      }

      // Filter unread only if requested
      if (unreadOnly === 'true') {
        query = query.eq('read', false);
      }

      // Apply pagination
      const offset = (Number(page) - 1) * Number(limit);
      query = query.range(offset, offset + Number(limit) - 1);

      const { data: notifications, error, count } = await query;

      if (error) {
        logger.error('Error fetching notifications:', error);
        throw new InternalServerError('Failed to fetch notifications');
      }

      // Get total count for pagination
      const { count: totalCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      res.status(200).json({
        success: true,
        data: {
          notifications: notifications || [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalCount || 0,
            pages: Math.ceil((totalCount || 0) / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      const { id } = req.params;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Verify notification belongs to user
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !notification) {
        throw new NotFoundError('Notification not found');
      }

      // Update notification as read
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (updateError) {
        logger.error('Error marking notification as read:', updateError);
        throw new InternalServerError('Failed to mark notification as read');
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        logger.error('Error marking all notifications as read:', error);
        throw new InternalServerError('Failed to mark all notifications as read');
      }

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      const { id } = req.params;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Verify notification belongs to user
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !notification) {
        throw new NotFoundError('Notification not found');
      }

      // Delete notification
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (deleteError) {
        logger.error('Error deleting notification:', deleteError);
        throw new InternalServerError('Failed to delete notification');
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        logger.error('Error getting unread count:', error);
        throw new InternalServerError('Failed to get unread count');
      }

      res.status(200).json({
        success: true,
        data: {
          unreadCount: count || 0
        }
      });
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Send notification (internal method for other services)
   */
  async sendNotification(data: NotificationData): Promise<boolean> {
    try {
      // Create notification in database
      const { error: dbError } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          category: data.category,
          metadata: data.metadata || {},
          read: false,
          created_at: new Date().toISOString()
        });

      if (dbError) {
        logger.error('Error creating notification in database:', dbError);
        return false;
      }

      // Get user details for SMS/Email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('full_name, email, phone_number')
        .eq('id', data.userId)
        .single();

      if (userError || !user) {
        logger.error('Error fetching user for notification:', userError);
        return true; // Notification created in DB, but couldn't send SMS/Email
      }

      // Send SMS if requested and user has phone number
      if (data.sendSMS && user.phone_number) {
        try {
          await smsService.sendNotificationSMS(
            user.phone_number,
            user.full_name,
            data.title,
            data.message
          );
        } catch (smsError) {
          logger.error('Error sending notification SMS:', smsError);
        }
      }

      // Send email if requested
      if (data.sendEmail && user.email) {
        try {
          await emailService.sendNotificationEmail(
            user.email,
            user.full_name,
            data.title,
            data.message
          );
        } catch (emailError) {
          logger.error('Error sending notification email:', emailError);
        }
      }

      return true;
    } catch (error) {
      logger.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send test notification (for testing purposes)
   */
  async sendTestNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      const { title, message, type = 'info', sendSMS = false, sendEmail = false } = req.body;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      const success = await this.sendNotification({
        userId: user.id,
        title: title || 'Test Notification',
        message: message || 'This is a test notification from KIXIKILA.',
        type,
        category: 'system',
        sendSMS,
        sendEmail
      });

      if (!success) {
        throw new InternalServerError('Failed to send test notification');
      }

      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully'
      });
    } catch (error) {
      logger.error('Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('Error fetching notification preferences:', error);
        throw new InternalServerError('Failed to fetch notification preferences');
      }

      // Default preferences if none exist
      const defaultPreferences = {
        email_notifications: true,
        sms_notifications: true,
        push_notifications: true,
        group_notifications: true,
        payment_notifications: true,
        security_notifications: true,
        marketing_notifications: false
      };

      res.status(200).json({
        success: true,
        data: {
          preferences: preferences || defaultPreferences
        }
      });
    } catch (error) {
      logger.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user } = req;
      const preferences = req.body;

      if (!user) {
        throw new ValidationError('User information not found');
      }

      // Upsert preferences
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Error updating notification preferences:', error);
        throw new InternalServerError('Failed to update notification preferences');
      }

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully'
      });
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;