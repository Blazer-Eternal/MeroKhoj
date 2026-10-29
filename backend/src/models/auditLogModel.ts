import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IAuditLog, IAuditLogCreation } from '../interfaces';
import { createdAtAttribute } from './modelHelpers';

/**
 * Append-only audit log. Records who did what to which entity, with optional
 * before/after JSONB snapshots and the actor's IP.
 *
 * `user_id` is nullable for system-initiated actions. There are deliberately
 * no update/delete service methods — audit rows are immutable.
 */
class AuditLog extends Model<IAuditLog, IAuditLogCreation> implements IAuditLog {
  public id!: string;
  public user_id!: string | null;
  public action!: string;
  public entity_type!: string;
  public entity_id!: string | null;
  public old_values!: Record<string, unknown> | null;
  public new_values!: Record<string, unknown> | null;
  public ip_address!: string | null;

  public readonly created_at!: Date;

  public readonly user?: unknown;
}

export type AuditLogCreationAttributes = Optional<
  IAuditLogCreation,
  'user_id' | 'entity_id' | 'old_values' | 'new_values' | 'ip_address'
>;

export const initAuditLogModel = (sequelize: Sequelize): typeof AuditLog => {
  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      action: { type: DataTypes.STRING(100), allowNull: false },
      entity_type: { type: DataTypes.STRING(100), allowNull: false },
      entity_id: { type: DataTypes.UUID, allowNull: true },
      old_values: { type: DataTypes.JSONB, allowNull: true },
      new_values: { type: DataTypes.JSONB, allowNull: true },
      // Stored as TEXT to avoidINET type-mapping quirks; validated in Zod.
      ip_address: { type: DataTypes.STRING(45), allowNull: true },
      ...createdAtAttribute,
    },
    {
      sequelize,
      tableName: 'audit_logs',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: false, // immutable: no updated_at column
      indexes: [
        { fields: ['user_id'] },
        { fields: ['action'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['created_at'] },
      ],
    },
  );

  return AuditLog;
};

export default AuditLog;
