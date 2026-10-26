import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IJobseekerProfile, IJobseekerProfileCreation } from '../interfaces';
import { ProfileVisibility, Availability } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * Professional profile, one per user (1:1).
 *
 * Kept separate from `users` so authentication concerns never mix with
 * searchable professional data. This is the row employers see.
 */
class JobseekerProfile
  extends Model<IJobseekerProfile, IJobseekerProfileCreation>
  implements IJobseekerProfile
{
  public id!: string;
  public user_id!: string;
  public headline!: string | null;
  public professional_summary!: string | null;
  public date_of_birth!: Date | null;
  public gender!: string | null;
  public address!: string | null;
  public city!: string | null;
  public country!: string | null;
  public profile_photo_url!: string | null;
  public expected_salary!: number | null;
  public availability!: Availability | null;
  public profile_visibility!: ProfileVisibility;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly user?: unknown;
}

export type JobseekerProfileCreationAttributes = Optional<
  IJobseekerProfileCreation,
  'profile_visibility'
>;

export const initJobseekerProfileModel = (sequelize: Sequelize): typeof JobseekerProfile => {
  JobseekerProfile.init(
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
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      headline: { type: DataTypes.STRING(255), allowNull: true },
      professional_summary: { type: DataTypes.TEXT, allowNull: true },
      date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
      gender: { type: DataTypes.STRING(30), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      city: { type: DataTypes.STRING(100), allowNull: true },
      country: { type: DataTypes.STRING(100), allowNull: true },
      profile_photo_url: { type: DataTypes.TEXT, allowNull: true },
      expected_salary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: { min: 0 },
      },
      availability: {
        type: DataTypes.ENUM(...Object.values(Availability)),
        allowNull: true,
      },
      profile_visibility: {
        type: DataTypes.ENUM(...Object.values(ProfileVisibility)),
        allowNull: false,
        defaultValue: ProfileVisibility.PUBLIC,
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'jobseeker_profiles',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['user_id'] }, { fields: ['city'] }, { fields: ['profile_visibility'] }],
    },
  );

  return JobseekerProfile;
};

export default JobseekerProfile;
