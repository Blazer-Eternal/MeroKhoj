import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IApplication, IApplicationCreation } from '../interfaces';
import { ApplicationStatus, ApplicationSource } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * A candidate's application to a job — the central recruitment entity.
 *
 * UNIQUE(job_id, jobseeker_id) prevents one candidate applying to the same job
 * twice (unless reapplication is deliberately enabled later).
 *
 * The current `status` is a fast read-model; the audit trail lives in
 * `application_status_history`.
 */
class Application extends Model<IApplication, IApplicationCreation> implements IApplication {
  public id!: string;
  public job_id!: string;
  public jobseeker_id!: string;
  public resume_url!: string | null;
  public cover_letter!: string | null;
  public status!: ApplicationStatus;
  public source!: ApplicationSource;
  public applied_at!: Date;
  public withdrawn_at!: Date | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly job?: unknown;
  public readonly jobseeker?: unknown;
  public readonly status_history?: unknown;
  public readonly interviews?: unknown;
}

export type ApplicationCreationAttributes = Optional<
  IApplicationCreation,
  'status' | 'source' | 'applied_at' | 'withdrawn_at' | 'resume_url' | 'cover_letter'
>;

export const initApplicationModel = (sequelize: Sequelize): typeof Application => {
  Application.init(
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
      jobseeker_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      resume_url: { type: DataTypes.TEXT, allowNull: true },
      cover_letter: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM(...Object.values(ApplicationStatus)),
        allowNull: false,
        defaultValue: ApplicationStatus.APPLIED,
      },
      source: {
        type: DataTypes.ENUM(...Object.values(ApplicationSource)),
        allowNull: false,
        defaultValue: ApplicationSource.DIRECT,
      },
      applied_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      withdrawn_at: { type: DataTypes.DATE, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'applications',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        // The critical constraint: one application per candidate per job.
        { unique: true, fields: ['job_id', 'jobseeker_id'] },
        { fields: ['jobseeker_id'] },
        { fields: ['status'] },
        { fields: ['applied_at'] },
        // Supports the recruiter's "pipeline by status" dashboard query.
        { fields: ['job_id', 'status'] },
      ],
    },
  );

  return Application;
};

export default Application;
