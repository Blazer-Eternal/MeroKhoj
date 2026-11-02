import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IInterviewFeedback, IInterviewFeedbackCreation } from '../interfaces';
import { timestampAttributes } from './modelHelpers';

/**
 * Interviewer feedback on an interview. UNIQUE (interview_id, reviewer_id)
 * means one feedback record per reviewer per interview. Scores are integers
 * 1–5 (validated in Zod + the service).
 */
class InterviewFeedback
  extends Model<IInterviewFeedback, IInterviewFeedbackCreation>
  implements IInterviewFeedback
{
  public id!: string;
  public interview_id!: string;
  public reviewer_id!: string;
  public communication_score!: number | null;
  public technical_score!: number | null;
  public cultural_fit_score!: number | null;
  public overall_score!: number | null;
  public strengths!: string | null;
  public weaknesses!: string | null;
  public comments!: string | null;
  public recommendation!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly interview?: unknown;
  public readonly reviewer?: unknown;
}

export type InterviewFeedbackCreationAttributes = Optional<
  IInterviewFeedbackCreation,
  | 'communication_score'
  | 'technical_score'
  | 'cultural_fit_score'
  | 'overall_score'
  | 'strengths'
  | 'weaknesses'
  | 'comments'
  | 'recommendation'
>;

export const initInterviewFeedbackModel = (sequelize: Sequelize): typeof InterviewFeedback => {
  InterviewFeedback.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      interview_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'interviews', key: 'id' },
        onDelete: 'CASCADE',
      },
      reviewer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      communication_score: { type: DataTypes.INTEGER, allowNull: true },
      technical_score: { type: DataTypes.INTEGER, allowNull: true },
      cultural_fit_score: { type: DataTypes.INTEGER, allowNull: true },
      overall_score: { type: DataTypes.INTEGER, allowNull: true },
      strengths: { type: DataTypes.TEXT, allowNull: true },
      weaknesses: { type: DataTypes.TEXT, allowNull: true },
      comments: { type: DataTypes.TEXT, allowNull: true },
      recommendation: { type: DataTypes.TEXT, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'interview_feedback',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        // One feedback per reviewer per interview.
        {
          unique: true,
          fields: ['interview_id', 'reviewer_id'],
          name: 'interview_feedback_unique',
        },
        { fields: ['reviewer_id'] },
      ],
    },
  );

  return InterviewFeedback;
};

export default InterviewFeedback;
