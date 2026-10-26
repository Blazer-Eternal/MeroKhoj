import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IApplicationStatusHistory, IApplicationStatusHistoryCreation } from '../interfaces';
import { ApplicationStatus } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * Immutable audit trail of an application's status changes.
 *
 * This is what powers the recruitment funnel and time-to-hire analytics: rather
 * than only storing the current status, every transition is recorded with who
 * made it and when.
 */
class ApplicationStatusHistory
  extends Model<IApplicationStatusHistory, IApplicationStatusHistoryCreation>
  implements IApplicationStatusHistory
{
  public id!: string;
  public application_id!: string;
  public old_status!: ApplicationStatus | null;
  public new_status!: ApplicationStatus;
  public changed_by!: string;
  public reason!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly application?: unknown;
  public readonly changer?: unknown;
}

export type ApplicationStatusHistoryCreationAttributes = Optional<
  IApplicationStatusHistoryCreation,
  'old_status' | 'reason'
>;

export const initApplicationStatusHistoryModel = (
  sequelize: Sequelize,
): typeof ApplicationStatusHistory => {
  ApplicationStatusHistory.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'CASCADE',
      },
      old_status: {
        type: DataTypes.ENUM(...Object.values(ApplicationStatus)),
        allowNull: true,
      },
      new_status: {
        type: DataTypes.ENUM(...Object.values(ApplicationStatus)),
        allowNull: false,
      },
      changed_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      reason: { type: DataTypes.TEXT, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'application_status_history',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['application_id', 'created_at'] },
        { fields: ['new_status'] },
        { fields: ['changed_by'] },
      ],
      // History is append-only; guard against accidental updates/deletes at the ORM level.
      hooks: {
        beforeUpdate: () => {
          throw new Error('application_status_history is append-only');
        },
        beforeDestroy: () => {
          throw new Error('application_status_history is append-only');
        },
      },
    },
  );

  return ApplicationStatusHistory;
};

export default ApplicationStatusHistory;
