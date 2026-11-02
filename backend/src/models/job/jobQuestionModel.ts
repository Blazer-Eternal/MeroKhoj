import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IJobQuestion, IJobQuestionCreation } from '../../interfaces';
import { QuestionType } from '../../enums';
import { timestampAttributes } from '../modelHelpers';

/**
 * A screening question on a job's application form. Questions lock once the
 * job has applications (enforced in the service layer) so submitted answers
 * stay coherent.
 */
class JobQuestion extends Model<IJobQuestion, IJobQuestionCreation> implements IJobQuestion {
  public id!: string;
  public job_id!: string;
  public question_text!: string;
  public question_type!: QuestionType;
  public is_required!: boolean;
  public position!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly job?: unknown;
  public readonly options?: unknown[];
}

export type JobQuestionCreationAttributes = Optional<IJobQuestionCreation, 'is_required' | 'position'>;

export const initJobQuestionModel = (sequelize: Sequelize): typeof JobQuestion => {
  JobQuestion.init(
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
      question_text: { type: DataTypes.TEXT, allowNull: false },
      question_type: {
        type: DataTypes.ENUM(...Object.values(QuestionType)),
        allowNull: false,
      },
      is_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'job_questions',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['job_id'] },
        // Render questions in order.
        { fields: ['job_id', 'position'] },
      ],
    },
  );

  return JobQuestion;
};

export default JobQuestion;
