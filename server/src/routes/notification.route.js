import { Router } from 'express';
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes - more specific routes first
router.get('/my-notifications', requireAuth, getMyNotifications);
router.get('/unread-count', requireAuth, getUnreadCount);
router.put('/mark-all-as-read', requireAuth, markAllNotificationsAsRead);
router.put('/:notificationId/read', requireAuth, markNotificationAsRead);
router.delete('/:notificationId', requireAuth, deleteNotification);

export default router;
