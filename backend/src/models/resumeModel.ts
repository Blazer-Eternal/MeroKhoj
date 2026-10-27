import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IResume, IResumeCreation } from '../interfaces';
import { timestampAttributes } from './modelHelpers';

/**
 * Resume metadata for a jobseeker profile. The actual file lives in secure
 * storage — only the reference is stored here.
 *
 * Only ONE resume per jobseeker may be the default; this is enforced by a
 * partial unique index (see the resumes migration).
 */
class Resume extends Model<IResume, IResumeCreation> implements IResume {
  public id!: string;
  public jobseeker_id!: string;
  public title!: string;
  public file_url!: string;
  public file_name!: string;
  public file_type!: string;
  public file_size_bytes!: number;
  public is_default!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly jobseeker_profile?: unknown;
}

export type ResumeCreationAttributes = Optional<IResumeCreation, 'is_default'>;

export const initResumeModel = (sequelize: Sequelize): typeof Resume => {
  Resume.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      jobseeker_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'jobseeker_profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: { type: DataTypes.STRING(150), allowNull: false },
      file_url: { type: DataTypes.TEXT, allowNull: false },
      file_name: { type: DataTypes.STRING(255), allowNull: false },
      file_type: { type: DataTypes.STRING(100), allowNull: false },
      file_size_bytes: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: { min: { args: [1], msg: 'file_size_bytes must be greater than 0' } },
      },
      is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'resumes',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['jobseeker_id'] },
        // Partial unique index: at most one default resume per jobseeker.
        {
          unique: true,
          fields: ['jobseeker_id'],
          where: { is_default: true },
          name: 'resumes_one_default_per_jobseeker',
        },
      ],
    },
  );

  return Resume;
};

export default Resume;
