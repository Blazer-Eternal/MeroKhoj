import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IInterview, IInterviewCreation } from '../interfaces';
import { InterviewType, InterviewStatus } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * A scheduled interview tied to an application.
 *
 * Interview state is intentionally independent of application state: cancelling
 * an interview must NOT automatically reject the application.
 */
class Interview extends Model<IInterview, IInterviewCreation> implements IInterview {
  public id!: string;
  public application_id!: string;
  public scheduled_by!: string;
  public interview_type!: InterviewType;
  public scheduled_at!: Date;
  public duration_minutes!: number;
  public location!: string | null;
  public meeting_url!: string | null;
  public status!: InterviewStatus;
  public notes!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly application?: unknown;
  public readonly scheduler?: unknown;
}

export type InterviewCreationAttributes = Optional<
  IInterviewCreation,
  'status' | 'location' | 'meeting_url' | 'notes'
>;

export const initInterviewModel = (sequelize: Sequelize): typeof Interview => {
  Interview.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'CASCADE',
      },
      scheduled_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      interview_type: {
        type: DataTypes.ENUM(...Object.values(InterviewType)),
        allowNull: false,
      },
      scheduled_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60,
        validate: {
          min: { args: [15], msg: 'duration_minutes must be at least 15' },
          max: { args: [240], msg: 'duration_minutes must be at most 240' },
        },
      },
      location: { type: DataTypes.TEXT, allowNull: true },
      meeting_url: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM(...Object.values(InterviewStatus)),
        allowNull: false,
        defaultValue: InterviewStatus.SCHEDULED,
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'interviews',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['application_id'] },
        { fields: ['status'] },
        { fields: ['scheduled_at'] },
        { fields: ['scheduled_by'] },
      ],
    },
  );

  return Interview;
};

export default Interview;
