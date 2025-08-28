import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { notificationValidation } from '../validations/notificationValidation';
import { notificationController } from '../controllers/notificationController';

const router = Router();

// Get user notifications
router.get('/', 
  authMiddleware, 
  validateRequest(notificationValidation.getNotifications),
  notificationController.getNotifications
);

// Get unread notifications count
router.get('/unread-count', 
  authMiddleware, 
  notificationController.getUnreadCount
);

// Get notification preferences
router.get('/preferences', 
  authMiddleware, 
  notificationController.getPreferences
);

// Update notification preferences
router.put('/preferences', 
  authMiddleware, 
  validateRequest(notificationValidation.updatePreferences),
  notificationController.updatePreferences
);

// Send test notification
router.post('/test', 
  authMiddleware, 
  validateRequest(notificationValidation.sendTestNotification),
  notificationController.sendTestNotification
);

// Mark notification as read
router.patch('/:id/read', 
  authMiddleware, 
  validateRequest(notificationValidation.markAsRead),
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch('/read-all', 
  authMiddleware, 
  notificationController.markAllAsRead
);

// Delete notification
router.delete('/:id', 
  authMiddleware, 
  validateRequest(notificationValidation.deleteNotification),
  notificationController.deleteNotification
);

export default router;