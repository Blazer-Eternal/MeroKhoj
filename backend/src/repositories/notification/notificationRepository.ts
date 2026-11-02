import { Op } from 'sequelize';
import Notification from '../../models/notification/notificationModel';
import { INotification, INotificationCreation } from '../../interfaces';
import { plain } from '../../utils';

/** Data-access layer for the `notifications` table. */
class NotificationRepository {
  async findById(id: string): Promise<INotification | null> {
    const row = await Notification.findByPk(id);
    return row ? (plain(row) as INotification) : null;
  }

  async create(payload: INotificationCreation): Promise<INotification> {
    const row = await Notification.create(payload);
    return plain(row) as INotification;
  }

  /** A user's inbox, newest first, optionally filtered to unread only. */
  async listByUser(userId: string, unreadOnly = false): Promise<INotification[]> {
    const where: Record<string, unknown> = { user_id: userId };
    if (unreadOnly) where.is_read = false;
    const rows = await Notification.findAll({ where, order: [['created_at', 'DESC']] });
    return plain<INotification[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Unread count for the badge. */
  async countUnread(userId: string): Promise<number> {
    return Notification.count({ where: { user_id: userId, is_read: false } });
  }

  /** Mark a single notification as read. Returns false if not found/owned. */
  async markRead(id: string, userId: string): Promise<boolean> {
    const [affected] = await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { id, user_id: userId, is_read: false } },
    );
    return affected > 0;
  }

  /** Mark every unread notification for a user as read. Returns count. */
  async markAllRead(userId: string): Promise<number> {
    const [affected] = await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } },
    );
    return affected;
  }

  async destroy(id: string): Promise<number> {
    return Notification.destroy({ where: { id } });
  }

  /** Housekeeping: remove read notifications older than the cutoff. */
  async pruneReadBefore(cutoff: Date): Promise<number> {
    return Notification.destroy({
      where: { is_read: true, created_at: { [Op.lt]: cutoff } },
    });
  }
}

export default new NotificationRepository();
