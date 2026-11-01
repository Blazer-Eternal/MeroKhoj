import { NotificationType } from '../enums';
import { ITimestamps } from './commonInterface';

/**
 * An in-app notification for a user.
 * `is_read` is a derived boolean kept in sync with `read_at` for the
 * (user_id, is_read, created_at) index; `data` carries an optional JSON payload.
 */
export interface INotification extends ITimestamps {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: Date | null;
}

export interface INotificationCreation {
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  is_read?: boolean;
  read_at?: Date | null;
}
