import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { INotification, INotificationCreation } from '../interfaces';
import { NotificationType } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * An in-app notification. `is_read` is kept in sync with `read_at` on write so
 * the (user_id, is_read, created_at) index can serve unread-count queries.
 */
class Notification
  extends Model<INotification, INotificationCreation>
  implements INotification
{
  public id!: string;
  public user_id!: string;
  public type!: NotificationType;
  public title!: string;
  public body!: string | null;
  public data!: Record<string, unknown> | null;
  public is_read!: boolean;
  public read_at!: Date | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly user?: unknown;
}

export type NotificationCreationAttributes = Optional<
  INotificationCreation,
  'body' | 'data' | 'is_read' | 'read_at'
>;

export const initNotificationModel = (sequelize: Sequelize): typeof Notification => {
  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM(...Object.values(NotificationType)),
        allowNull: false,
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: true },
      data: { type: DataTypes.JSONB, allowNull: true },
      is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      read_at: { type: DataTypes.DATE, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'notifications',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        // Required composite index for the inbox / unread-badge queries.
        {
          fields: ['user_id', 'is_read', 'created_at'],
          name: 'notifications_user_read_created_idx',
        },
        { fields: ['user_id'] },
        { fields: ['type'] },
      ],
    },
  );

  return Notification;
};

export default Notification;
