import { AppError } from '../utils';
import { INotification, INotificationCreation, IAuthUser } from '../interfaces';
import { NotificationType } from '../enums';
import { notificationRepository } from '../repositories';

/**
 * Notifications business logic (in-app inbox).
 *
 * The `createNotification` helper is the single entry point every other
 * service uses to notify a user. Marking read is scoped to the owner so a
 * user can never mark someone else's notification.
 */

/** Create a notification for a user. Used by other services. */
export const createNotification = async (
  input: Omit<INotificationCreation, 'is_read' | 'read_at'>,
): Promise<INotification> =>
  notificationRepository.create({ ...input, is_read: false, read_at: null });

/** Convenience: notify with an explicit type + optional payload. */
export const notify = async (
  userId: string,
  type: NotificationType,
  title: string,
  body?: string | null,
  data?: Record<string, unknown> | null,
): Promise<INotification> => createNotification({ user_id: userId, type, title, body, data });

/** The calling user's inbox, optionally unread-only. */
export const listNotifications = async (
  user: IAuthUser,
  unreadOnly = false,
): Promise<INotification[]> => notificationRepository.listByUser(user.id, unreadOnly);

/** Unread count for the badge. */
export const unreadCount = async (user: IAuthUser): Promise<number> =>
  notificationRepository.countUnread(user.id);

/** Mark one notification read (owner only). */
export const markRead = async (user: IAuthUser, id: string): Promise<void> => {
  const notification = await notificationRepository.findById(id);
  if (!notification) throw AppError.notFound('Notification not found');
  if (notification.user_id !== user.id) {
    throw AppError.forbidden('You can only mark your own notifications as read');
  }
  await notificationRepository.markRead(id, user.id);
};

/** Mark every unread notification for the user as read. */
export const markAllRead = async (user: IAuthUser): Promise<number> =>
  notificationRepository.markAllRead(user.id);

/** Delete a single notification (owner only). */
export const removeNotification = async (user: IAuthUser, id: string): Promise<void> => {
  const notification = await notificationRepository.findById(id);
  if (!notification) throw AppError.notFound('Notification not found');
  if (notification.user_id !== user.id) {
    throw AppError.forbidden('You can only delete your own notifications');
  }
  await notificationRepository.destroy(id);
};

export const notificationServices = {
  createNotification,
  notify,
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  removeNotification,
};

export default notificationServices;
