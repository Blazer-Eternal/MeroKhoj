import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IJob, IJobCreation } from '../interfaces';
import { EmploymentType, ExperienceLevel, JobStatus } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * A job posting. One of the most important entities in the system.
 *
 * Lifecycle (status) is enforced through JOB_STATUS_TRANSITIONS in jobServices.
 * `published_at` is stamped when the job first becomes PUBLISHED; `closed_at`
 * when it reaches CLOSED.
 */
class Job extends Model<IJob, IJobCreation> implements IJob {
  public id!: string;
  public company_id!: string;
  public created_by!: string;
  public title!: string;
  public slug!: string;
  public description!: string;
  public employment_type!: EmploymentType;
  public experience_level!: ExperienceLevel | null;
  public salary_min!: number | null;
  public salary_max!: number | null;
  public salary_currency!: string;
  public vacancies!: number;
  public education_requirement!: string | null;
  public experience_requirement!: string | null;
  public location!: string | null;
  public application_deadline!: Date | null;
  public status!: JobStatus;
  public published_at!: Date | null;
  public closed_at!: Date | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly company?: unknown;
  public readonly creator?: unknown;
  public readonly skills?: unknown;
  public readonly applications?: unknown;
}

export type JobCreationAttributes = Optional<
  IJobCreation,
  'salary_currency' | 'status' | 'published_at' | 'closed_at' | 'application_deadline'
>;

export const initJobModel = (sequelize: Sequelize): typeof Job => {
  Job.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      company_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: { msg: 'Job title is required' } },
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: { msg: 'Job description is required' } },
      },
      employment_type: {
        type: DataTypes.ENUM(...Object.values(EmploymentType)),
        allowNull: false,
      },
      experience_level: {
        type: DataTypes.ENUM(...Object.values(ExperienceLevel)),
        allowNull: true,
      },
      salary_min: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: { min: 0 },
      },
      // Cross-field check (salary_max >= salary_min) is enforced in Zod.
      salary_max: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: { min: 0 },
      },
      salary_currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'NPR',
      },
      vacancies: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: { args: [1], msg: 'vacancies must be at least 1' } },
      },
      education_requirement: { type: DataTypes.TEXT, allowNull: true },
      experience_requirement: { type: DataTypes.TEXT, allowNull: true },
      location: { type: DataTypes.STRING(255), allowNull: true },
      application_deadline: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM(...Object.values(JobStatus)),
        allowNull: false,
        defaultValue: JobStatus.DRAFT,
      },
      published_at: { type: DataTypes.DATE, allowNull: true },
      closed_at: { type: DataTypes.DATE, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'jobs',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['slug'] },
        { fields: ['company_id'] },
        { fields: ['status'] },
        { fields: ['employment_type'] },
        { fields: ['experience_level'] },
        { fields: ['location'] },
        { fields: ['application_deadline'] },
        // Composite index supporting the common "published jobs by recency" query.
        { fields: ['status', 'published_at'] },
      ],
    },
  );

  return Job;
};

export default Job;
