import { supabase } from './supabase.ts';
import { emailService } from './emailService.ts';
import { smsService } from './smsService.ts';
import { logger } from '../utils/logger.ts';
import { Database } from './supabase.ts';

type NotificationType = Database['public']['Enums']['notification_type'];
type NotificationStatus = Database['public']['Enums']['notification_status'];
type NotificationChannel = Database['public']['Enums']['notification_channel'];

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: Date;
  groupId?: string;
  transactionId?: string;
}

interface UserNotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  groupInvitations: boolean;
  contributions: boolean;
  payments: boolean;
  security: boolean;
  marketing: boolean;
}

class NotificationService {
  /**
   * Send notification to user
   */
  async sendNotification(notificationData: NotificationData): Promise<boolean> {
    try {
      // Get user data and preferences
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, phone_number, notification_preferences')
        .eq('id', notificationData.userId)
        .single();

      if (userError || !user) {
        logger.error('Failed to get user for notification:', userError);
        return false;
      }

      // Parse notification preferences
      const preferences = this.parseNotificationPreferences(user.notification_preferences);
      
      // Determine channels to use
      const channels = notificationData.channels || this.getDefaultChannels(notificationData.type, preferences);
      
      // Create notification record
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || {},
          channels,
          priority: notificationData.priority || 'medium',
          status: 'pending' as NotificationStatus,
          scheduled_for: notificationData.scheduledFor?.toISOString(),
          group_id: notificationData.groupId,
          transaction_id: notificationData.transactionId
        })
        .select()
        .single();

      if (notificationError) {
        logger.error('Failed to create notification record:', notificationError);
        return false;
      }

      // Send notification through selected channels
      const results = await Promise.allSettled([
        this.sendEmailNotification(user, notificationData, channels),
        this.sendSMSNotification(user, notificationData, channels),
        this.sendPushNotification(user, notificationData, channels)
      ]);

      // Update notification status
      const hasSuccess = results.some(result => result.status === 'fulfilled' && result.value);
      const status: NotificationStatus = hasSuccess ? 'sent' : 'failed';

      await supabase
        .from('notifications')
        .update({ 
          status,
          sent_at: new Date().toISOString(),
          delivery_attempts: 1
        })
        .eq('id', notification.id);

      logger.info('Notification processed', {
        notificationId: notification.id,
        userId: notificationData.userId,
        type: notificationData.type,
        status,
        channels
      });

      return hasSuccess;
    } catch (error) {
      logger.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    user: any,
    notificationData: NotificationData,
    channels: NotificationChannel[]
  ): Promise<boolean> {
    if (!channels.includes('email') || !user.email) {
      return false;
    }

    try {
      return await emailService.sendNotificationEmail(
        user.email,
        user.full_name,
        notificationData.title,
        notificationData.message
      );
    } catch (error) {
      logger.error('Failed to send email notification:', error);
      return false;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    user: any,
    notificationData: NotificationData,
    channels: NotificationChannel[]
  ): Promise<boolean> {
    if (!channels.includes('sms') || !user.phone_number) {
      return false;
    }

    try {
      return await smsService.sendNotificationSMS(
        user.phone_number,
        user.full_name,
        notificationData.title,
        notificationData.message
      );
    } catch (error) {
      logger.error('Failed to send SMS notification:', error);
      return false;
    }
  }

  /**
   * Send push notification (placeholder for future implementation)
   */
  private async sendPushNotification(
    user: any,
    notificationData: NotificationData,
    channels: NotificationChannel[]
  ): Promise<boolean> {
    if (!channels.includes('push')) {
      return false;
    }

    // TODO: Implement push notification service (Firebase, OneSignal, etc.)
    logger.info('Push notification would be sent here', {
      userId: user.id,
      title: notificationData.title
    });
    
    return true;
  }

  /**
   * Parse notification preferences from JSON
   */
  private parseNotificationPreferences(preferences: any): UserNotificationPreferences {
    const defaultPreferences: UserNotificationPreferences = {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      groupInvitations: true,
      contributions: true,
      payments: true,
      security: true,
      marketing: false
    };

    if (!preferences || typeof preferences !== 'object') {
      return defaultPreferences;
    }

    return { ...defaultPreferences, ...preferences };
  }

  /**
   * Get default channels based on notification type and user preferences
   */
  private getDefaultChannels(
    type: NotificationType,
    preferences: UserNotificationPreferences
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    // Always include push notifications if enabled
    if (preferences.pushEnabled) {
      channels.push('push');
    }

    // Determine email and SMS based on type and preferences
    switch (type) {
      case 'group_invitation':
        if (preferences.groupInvitations) {
          if (preferences.emailEnabled) channels.push('email');
          if (preferences.smsEnabled) channels.push('sms');
        }
        break;

      case 'contribution_reminder':
      case 'contribution_received':
      case 'goal_achieved':
        if (preferences.contributions) {
          if (preferences.emailEnabled) channels.push('email');
          if (preferences.smsEnabled) channels.push('sms');
        }
        break;

      case 'payment_due':
      case 'payment_received':
      case 'subscription_expired':
        if (preferences.payments) {
          if (preferences.emailEnabled) channels.push('email');
          if (preferences.smsEnabled) channels.push('sms');
        }
        break;

      case 'security_alert':
      case 'login_attempt':
        if (preferences.security) {
          if (preferences.emailEnabled) channels.push('email');
          if (preferences.smsEnabled) channels.push('sms');
        }
        break;

      case 'promotional':
        if (preferences.marketing) {
          if (preferences.emailEnabled) channels.push('email');
        }
        break;

      default:
        // For other types, use email if enabled
        if (preferences.emailEnabled) channels.push('email');
        break;
    }

    return channels;
  }

  /**
   * Send group invitation notification
   */
  async sendGroupInvitation(
    inviteeId: string,
    inviterName: string,
    groupName: string,
    groupId: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId: inviteeId,
      type: 'group_invitation',
      title: 'Convite para Grupo',
      message: `${inviterName} convidou você para participar do grupo "${groupName}".`,
      data: {
        inviterName,
        groupName,
        groupId
      },
      priority: 'medium',
      groupId
    });
  }

  /**
   * Send contribution reminder
   */
  async sendContributionReminder(
    userId: string,
    groupName: string,
    amount: number,
    dueDate: Date,
    groupId: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'contribution_reminder',
      title: 'Lembrete de Contribuição',
      message: `Sua contribuição de ${amount} AOA para o grupo "${groupName}" vence em ${dueDate.toLocaleDateString()}.`,
      data: {
        groupName,
        amount,
        dueDate: dueDate.toISOString(),
        groupId
      },
      priority: 'high',
      groupId
    });
  }

  /**
   * Send contribution received notification
   */
  async sendContributionReceived(
    userId: string,
    contributorName: string,
    groupName: string,
    amount: number,
    groupId: string,
    transactionId: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'contribution_received',
      title: 'Contribuição Recebida',
      message: `${contributorName} fez uma contribuição de ${amount} AOA no grupo "${groupName}".`,
      data: {
        contributorName,
        groupName,
        amount,
        groupId,
        transactionId
      },
      priority: 'medium',
      groupId,
      transactionId
    });
  }

  /**
   * Send goal achieved notification
   */
  async sendGoalAchieved(
    userIds: string[],
    groupName: string,
    goalAmount: number,
    groupId: string
  ): Promise<boolean> {
    const promises = userIds.map(userId =>
      this.sendNotification({
        userId,
        type: 'goal_achieved',
        title: 'Meta Alcançada! 🎉',
        message: `Parabéns! O grupo "${groupName}" atingiu a meta de ${goalAmount} AOA.`,
        data: {
          groupName,
          goalAmount,
          groupId
        },
        priority: 'high',
        groupId
      })
    );

    const results = await Promise.allSettled(promises);
    return results.some(result => result.status === 'fulfilled' && result.value);
  }

  /**
   * Send payment due notification
   */
  async sendPaymentDue(
    userId: string,
    amount: number,
    description: string,
    dueDate: Date
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'payment_due',
      title: 'Pagamento Pendente',
      message: `Você tem um pagamento pendente de ${amount} AOA para "${description}".`,
      data: {
        amount,
        description,
        dueDate: dueDate.toISOString()
      },
      priority: 'high'
    });
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(
    userId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'security_alert',
      title: 'Alerta de Segurança',
      message: `Atividade suspeita detectada: ${action}. Se não foi você, altere sua senha imediatamente.`,
      data: {
        action,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString()
      },
      priority: 'urgent',
      channels: ['email', 'sms'] // Force both channels for security alerts
    });
  }

  /**
   * Send VIP subscription notification
   */
  async sendVIPSubscription(
    userId: string,
    planName: string,
    expiryDate: Date
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      type: 'subscription_activated',
      title: 'Assinatura VIP Ativada',
      message: `Sua assinatura VIP "${planName}" foi ativada com sucesso! Válida até ${expiryDate.toLocaleDateString()}.`,
      data: {
        planName,
        expiryDate: expiryDate.toISOString()
      },
      priority: 'medium'
    });
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (unreadOnly) {
        query = query.eq('read_at', null);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to get user notifications:', error);
        return { notifications: [], total: 0 };
      }

      // Get total count
      let countQuery = supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (unreadOnly) {
        countQuery = countQuery.eq('read_at', null);
      }

      const { count } = await countQuery;

      return {
        notifications: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to mark notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) {
        logger.error('Failed to mark all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to delete notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to delete notification:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;