import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { notificationServices } from '../../services';
import { notificationQuerySchema } from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/notifications?unread_only=true */
export const listNotifications = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = notificationQuerySchema.parse(req.query);
  const notifications = await notificationServices.listNotifications(
    req.user!,
    query.unread_only ?? false,
  );
  return ok(res, { notifications });
});

/** GET /api/notifications/unread-count */
export const unreadCount = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const count = await notificationServices.unreadCount(req.user!);
  return ok(res, { unread_count: count });
});

/** PATCH /api/notifications/:id/read */
export const markRead = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await notificationServices.markRead(req.user!, id);
  return ok(res, { message: 'Notification marked as read' });
});

/** PATCH /api/notifications/read-all */
export const markAllRead = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const updated = await notificationServices.markAllRead(req.user!);
  return ok(res, { updated });
});

/** DELETE /api/notifications/:id */
export const removeNotification = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await notificationServices.removeNotification(req.user!, id);
  return ok(res, { message: 'Notification deleted' });
});

export default {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  removeNotification,
};
