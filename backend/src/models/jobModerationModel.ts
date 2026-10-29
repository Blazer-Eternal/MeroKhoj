import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IJobModeration, IJobModerationCreation } from '../interfaces';
import { ModerationAction } from '../enums';
import { createdAtAttribute } from './modelHelpers';

/**
 * Append-only moderation decision for a job. Each row records who reviewed a
 * job and what action was taken; the job's status is updated to stay
 * consistent with the action (enforced in the service layer).
 */
class JobModeration
  extends Model<IJobModeration, IJobModerationCreation>
  implements IJobModeration
{
  public id!: string;
  public job_id!: string;
  public reviewed_by!: string;
  public action!: ModerationAction;
  public reason!: string | null;

  public readonly created_at!: Date;

  public readonly job?: unknown;
  public readonly reviewer?: unknown;
}

export type JobModerationCreationAttributes = Optional<IJobModerationCreation, 'reason'>;

export const initJobModerationModel = (sequelize: Sequelize): typeof JobModeration => {
  JobModeration.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      job_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'jobs', key: 'id' },
        onDelete: 'CASCADE',
      },
      reviewed_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      action: {
        type: DataTypes.ENUM(...Object.values(ModerationAction)),
        allowNull: false,
      },
      reason: { type: DataTypes.TEXT, allowNull: true },
      ...createdAtAttribute,
    },
    {
      sequelize,
      tableName: 'job_moderation',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: false, // append-only: no updated_at column
      indexes: [
        { fields: ['job_id'] },
        { fields: ['reviewed_by'] },
        { fields: ['action'] },
        { fields: ['job_id', 'created_at'] },
      ],
    },
  );

  return JobModeration;
};

export default JobModeration;
