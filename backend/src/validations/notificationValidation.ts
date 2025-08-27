import Joi from 'joi';
import { commonValidations } from '../middleware/validation.ts';

const notificationValidation = {
  /**
   * Validation for getting notifications
   */
  getNotifications: {
    query: Joi.object({
      page: commonValidations.page,
      limit: commonValidations.limit,
      category: Joi.string().valid('system', 'group', 'payment', 'security', 'reminder').optional(),
      unreadOnly: Joi.string().valid('true', 'false').optional()
    })
  },

  /**
   * Validation for marking notification as read
   */
  markAsRead: {
    params: Joi.object({
      id: commonValidations.uuid.required()
    })
  },

  /**
   * Validation for deleting notification
   */
  deleteNotification: {
    params: Joi.object({
      id: commonValidations.uuid.required()
    })
  },

  /**
   * Validation for sending test notification
   */
  sendTestNotification: {
    body: Joi.object({
      title: Joi.string().min(1).max(100).optional(),
      message: Joi.string().min(1).max(500).optional(),
      type: Joi.string().valid('info', 'warning', 'success', 'error').default('info'),
      sendSMS: Joi.boolean().default(false),
      sendEmail: Joi.boolean().default(false)
    })
  },

  /**
   * Validation for updating notification preferences
   */
  updatePreferences: {
    body: Joi.object({
      email_notifications: Joi.boolean().optional(),
      sms_notifications: Joi.boolean().optional(),
      push_notifications: Joi.boolean().optional(),
      group_notifications: Joi.boolean().optional(),
      payment_notifications: Joi.boolean().optional(),
      security_notifications: Joi.boolean().optional(),
      marketing_notifications: Joi.boolean().optional()
    }).min(1) // At least one preference must be provided
  },

  /**
   * Validation for creating notification (internal use)
   */
  createNotification: {
    body: Joi.object({
      userId: commonValidations.uuid.required(),
      title: Joi.string().min(1).max(100).required(),
      message: Joi.string().min(1).max(500).required(),
      type: Joi.string().valid('info', 'warning', 'success', 'error').required(),
      category: Joi.string().valid('system', 'group', 'payment', 'security', 'reminder').required(),
      metadata: Joi.object().optional(),
      sendSMS: Joi.boolean().default(false),
      sendEmail: Joi.boolean().default(false)
    })
  },

  /**
   * Validation for bulk notification operations
   */
  bulkMarkAsRead: {
    body: Joi.object({
      notificationIds: Joi.array().items(commonValidations.uuid).min(1).max(50).required()
    })
  },

  /**
   * Validation for notification filters
   */
  getNotificationsByCategory: {
    params: Joi.object({
      category: Joi.string().valid('system', 'group', 'payment', 'security', 'reminder').required()
    }),
    query: Joi.object({
      page: commonValidations.page,
      limit: commonValidations.limit,
      unreadOnly: Joi.string().valid('true', 'false').optional()
    })
  },

  /**
   * Validation for notification statistics
   */
  getNotificationStats: {
    query: Joi.object({
      period: Joi.string().valid('day', 'week', 'month', 'year').default('week'),
      category: Joi.string().valid('system', 'group', 'payment', 'security', 'reminder').optional()
    })
  }
};

export { notificationValidation };
export default notificationValidation;