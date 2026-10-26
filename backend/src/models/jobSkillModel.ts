import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IJobSkill, IJobSkillCreation } from '../interfaces';
import { JobSkillImportance } from '../enums';

/**
 * Join table linking a job to the skills it requires.
 *
 * UNIQUE(job_id, skill_id) prevents the same skill being attached twice.
 */
class JobSkill extends Model<IJobSkill, IJobSkillCreation> implements IJobSkill {
  public id!: string;
  public job_id!: string;
  public skill_id!: string;
  public importance!: JobSkillImportance;
  public minimum_experience!: number | null;

  public readonly job?: unknown;
  public readonly skill?: unknown;
}

export type JobSkillCreationAttributes = Optional<IJobSkillCreation, 'minimum_experience'>;

export const initJobSkillModel = (sequelize: Sequelize): typeof JobSkill => {
  JobSkill.init(
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
      skill_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'skills', key: 'id' },
        onDelete: 'CASCADE',
      },
      importance: {
        type: DataTypes.ENUM(...Object.values(JobSkillImportance)),
        allowNull: false,
        defaultValue: JobSkillImportance.REQUIRED,
      },
      minimum_experience: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: true,
        validate: { min: 0 },
      },
    },
    {
      sequelize,
      tableName: 'job_skills',
      timestamps: false, // pure join table
      indexes: [
        { unique: true, fields: ['job_id', 'skill_id'] },
        { fields: ['skill_id'] },
      ],
    },
  );

  return JobSkill;
};

export default JobSkill;
