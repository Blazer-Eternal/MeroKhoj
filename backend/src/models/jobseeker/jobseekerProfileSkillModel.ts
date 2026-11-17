import { Model, DataTypes, Sequelize } from 'sequelize';
import { IJobseekerProfileSkill, IJobseekerProfileSkillCreation } from '../../interfaces';

/**
 * Join table linking a jobseeker profile to the skills it lists.
 *
 * UNIQUE(jobseeker_id, skill_id) prevents the same skill being attached twice.
 */
class JobseekerProfileSkill
  extends Model<IJobseekerProfileSkill, IJobseekerProfileSkillCreation>
  implements IJobseekerProfileSkill
{
  public id!: string;
  public jobseeker_id!: string;
  public skill_id!: string;

  public readonly jobseeker?: unknown;
  public readonly skill?: unknown;
}

export const initJobseekerProfileSkillModel = (
  sequelize: Sequelize,
): typeof JobseekerProfileSkill => {
  JobseekerProfileSkill.init(
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
      skill_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'skills', key: 'id' },
        onDelete: 'CASCADE',
      },
    },
    {
      sequelize,
      tableName: 'jobseeker_profile_skills',
      timestamps: false, // pure join table
      indexes: [
        { unique: true, fields: ['jobseeker_id', 'skill_id'] },
        { fields: ['skill_id'] },
      ],
    },
  );

  return JobseekerProfileSkill;
};

export default JobseekerProfileSkill;
