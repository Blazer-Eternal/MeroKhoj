import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { ISavedJob, ISavedJobCreation } from '../interfaces';
import { timestampAttributes } from './modelHelpers';

/**
 * A job saved by a jobseeker. UNIQUE (user_id, job_id) guarantees a job can
 * only be saved once per user (enforced at the DB level).
 */
class SavedJob extends Model<ISavedJob, ISavedJobCreation> implements ISavedJob {
  public id!: string;
  public user_id!: string;
  public job_id!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly user?: unknown;
  public readonly job?: unknown;
}

export type SavedJobCreationAttributes = Optional<ISavedJobCreation, never>;

export const initSavedJobModel = (sequelize: Sequelize): typeof SavedJob => {
  SavedJob.init(
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
      job_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'jobs', key: 'id' },
        onDelete: 'CASCADE',
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'saved_jobs',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        // The core uniqueness guarantee.
        { unique: true, fields: ['user_id', 'job_id'], name: 'saved_jobs_user_job_unique' },
        // Listing "my saved jobs" newest-first.
        { fields: ['user_id', 'created_at'] },
      ],
    },
  );

  return SavedJob;
};

export default SavedJob;
