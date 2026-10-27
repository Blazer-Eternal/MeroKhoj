import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IWorkExperience, IWorkExperienceCreation } from '../interfaces';
import { EmploymentType } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * Work experience entry, owned by a jobseeker profile.
 */
class WorkExperience
  extends Model<IWorkExperience, IWorkExperienceCreation>
  implements IWorkExperience
{
  public id!: string;
  public jobseeker_id!: string;
  public company_name!: string;
  public job_title!: string;
  public employment_type!: EmploymentType;
  public location!: string | null;
  public start_date!: Date;
  public end_date!: Date | null;
  public is_current!: boolean;
  public description!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly jobseeker_profile?: unknown;
}

export type WorkExperienceCreationAttributes = Optional<
  IWorkExperienceCreation,
  'location' | 'end_date' | 'is_current' | 'description'
>;

export const initWorkExperienceModel = (sequelize: Sequelize): typeof WorkExperience => {
  WorkExperience.init(
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
      company_name: { type: DataTypes.STRING(255), allowNull: false },
      job_title: { type: DataTypes.STRING(200), allowNull: false },
      employment_type: {
        type: DataTypes.ENUM(...Object.values(EmploymentType)),
        allowNull: false,
      },
      location: { type: DataTypes.STRING(255), allowNull: true },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: true },
      is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'work_experiences',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['jobseeker_id'] }, { fields: ['jobseeker_id', 'start_date'] }],
    },
  );

  return WorkExperience;
};

export default WorkExperience;
