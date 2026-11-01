import { Router } from 'express';
import { notificationControllers } from '../controllers';
import { requireAuth } from '../../middleware';

const router = Router();

/**
 * /api/notifications
 * Any authenticated user's in-app inbox. Ownership is enforced per-route in
 * the service layer.
 */
router.use(requireAuth);

router.get('/', notificationControllers.listNotifications);
router.get('/unread-count', notificationControllers.unreadCount);
router.patch('/read-all', notificationControllers.markAllRead);
router.patch('/:id/read', notificationControllers.markRead);
router.delete('/:id', notificationControllers.removeNotification);

export default router;
