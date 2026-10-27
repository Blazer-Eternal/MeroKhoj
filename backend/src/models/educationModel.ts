import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IEducation, IEducationCreation } from '../interfaces';
import { timestampAttributes } from './modelHelpers';

/**
 * Education history entry, owned by a jobseeker profile.
 * A profile can have many education rows.
 */
class Education extends Model<IEducation, IEducationCreation> implements IEducation {
  public id!: string;
  public jobseeker_id!: string;
  public institution!: string;
  public degree!: string;
  public field_of_study!: string | null;
  public start_date!: Date | null;
  public end_date!: Date | null;
  public is_current!: boolean;
  public grade!: string | null;
  public description!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly jobseeker_profile?: unknown;
}

export type EducationCreationAttributes = Optional<
  IEducationCreation,
  'field_of_study' | 'start_date' | 'end_date' | 'is_current' | 'grade' | 'description'
>;

export const initEducationModel = (sequelize: Sequelize): typeof Education => {
  Education.init(
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
      institution: { type: DataTypes.STRING(255), allowNull: false },
      degree: { type: DataTypes.STRING(150), allowNull: false },
      field_of_study: { type: DataTypes.STRING(150), allowNull: true },
      start_date: { type: DataTypes.DATEONLY, allowNull: true },
      // Cross-field check (end_date >= start_date, is_current ⇒ end_date null)
      // is enforced in Zod + the service layer.
      end_date: { type: DataTypes.DATEONLY, allowNull: true },
      is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      grade: { type: DataTypes.STRING(50), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'educations',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['jobseeker_id'] },
        // Sorting education by recency is the common listing pattern.
        { fields: ['jobseeker_id', 'start_date'] },
      ],
    },
  );

  return Education;
};

export default Education;
