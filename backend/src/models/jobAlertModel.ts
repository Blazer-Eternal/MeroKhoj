import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IJobAlert, IJobAlertCreation } from '../interfaces';
import { JobAlertFrequency } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * A saved job search ("alert"). The worker periodically evaluates active
 * alerts and dispatches notifications for newly-matching jobs.
 */
class JobAlert extends Model<IJobAlert, IJobAlertCreation> implements IJobAlert {
  public id!: string;
  public user_id!: string;
  public name!: string;
  public keywords!: string | null;
  public category_id!: string | null;
  public location_id!: string | null;
  public employment_type!: string | null;
  public is_active!: boolean;
  public frequency!: JobAlertFrequency;
  public last_sent_at!: Date | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly user?: unknown;
  public readonly category?: unknown;
  public readonly location?: unknown;
}

export type JobAlertCreationAttributes = Optional<
  IJobAlertCreation,
  | 'keywords'
  | 'category_id'
  | 'location_id'
  | 'employment_type'
  | 'is_active'
  | 'frequency'
  | 'last_sent_at'
>;

export const initJobAlertModel = (sequelize: Sequelize): typeof JobAlert => {
  JobAlert.init(
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
      name: { type: DataTypes.STRING(150), allowNull: false },
      keywords: { type: DataTypes.STRING(500), allowNull: true },
      category_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'job_categories', key: 'id' },
        onDelete: 'SET NULL',
      },
      location_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'locations', key: 'id' },
        onDelete: 'SET NULL',
      },
      employment_type: { type: DataTypes.STRING(50), allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      frequency: {
        type: DataTypes.ENUM(...Object.values(JobAlertFrequency)),
        allowNull: false,
        defaultValue: JobAlertFrequency.DAILY,
      },
      last_sent_at: { type: DataTypes.DATE, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'job_alerts',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        // The worker scans active alerts; this index covers that lookup.
        { fields: ['user_id', 'is_active'] },
        { fields: ['is_active', 'frequency'] },
        { fields: ['category_id'] },
        { fields: ['location_id'] },
      ],
    },
  );

  return JobAlert;
};

export default JobAlert;
