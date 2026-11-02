import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IQuestionOption, IQuestionOptionCreation } from '../interfaces';
import { timestampAttributes } from './modelHelpers';

/**
 * One selectable option for a choice question.
 * UNIQUE (question_id, option_text) prevents duplicate options.
 */
class QuestionOption
  extends Model<IQuestionOption, IQuestionOptionCreation>
  implements IQuestionOption
{
  public id!: string;
  public question_id!: string;
  public option_text!: string;
  public position!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly question?: unknown;
}

export type QuestionOptionCreationAttributes = Optional<IQuestionOptionCreation, 'position'>;

export const initQuestionOptionModel = (sequelize: Sequelize): typeof QuestionOption => {
  QuestionOption.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      question_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'job_questions', key: 'id' },
        onDelete: 'CASCADE',
      },
      option_text: { type: DataTypes.STRING(500), allowNull: false },
      position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'question_options',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        // No duplicate options within a question.
        {
          unique: true,
          fields: ['question_id', 'option_text'],
          name: 'question_options_unique',
        },
        { fields: ['question_id', 'position'] },
      ],
    },
  );

  return QuestionOption;
};

export default QuestionOption;
