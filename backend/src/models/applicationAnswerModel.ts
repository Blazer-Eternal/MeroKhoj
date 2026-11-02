import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IApplicationAnswer, IApplicationAnswerCreation } from '../interfaces';
import { timestampAttributes } from './modelHelpers';

/**
 * An answer to one screening question for an application.
 * The typed columns (text/number/boolean/date/option) mirror the question
 * type; the service validates the answer format matches. UNIQUE
 * (application_id, question_id) guarantees one answer per question.
 */
class ApplicationAnswer
  extends Model<IApplicationAnswer, IApplicationAnswerCreation>
  implements IApplicationAnswer
{
  public id!: string;
  public application_id!: string;
  public question_id!: string;
  public answer_text!: string | null;
  public answer_number!: number | null;
  public answer_boolean!: boolean | null;
  public answer_date!: Date | null;
  public selected_option_id!: string | null;
  public selected_option_ids!: string[] | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly application?: unknown;
  public readonly question?: unknown;
}

export type ApplicationAnswerCreationAttributes = Optional<
  IApplicationAnswerCreation,
  | 'answer_text'
  | 'answer_number'
  | 'answer_boolean'
  | 'answer_date'
  | 'selected_option_id'
  | 'selected_option_ids'
>;

export const initApplicationAnswerModel = (
  sequelize: Sequelize,
): typeof ApplicationAnswer => {
  ApplicationAnswer.init(
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
      question_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'job_questions', key: 'id' },
        onDelete: 'CASCADE',
      },
      answer_text: { type: DataTypes.TEXT, allowNull: true },
      answer_number: { type: DataTypes.DOUBLE, allowNull: true },
      answer_boolean: { type: DataTypes.BOOLEAN, allowNull: true },
      answer_date: { type: DataTypes.DATEONLY, allowNull: true },
      selected_option_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'question_options', key: 'id' },
        onDelete: 'SET NULL',
      },
      // JSONB array of selected option ids for MULTI_CHOICE.
      selected_option_ids: { type: DataTypes.JSONB, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'application_answers',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        // One answer per question per application.
        {
          unique: true,
          fields: ['application_id', 'question_id'],
          name: 'application_answers_unique',
        },
        { fields: ['question_id'] },
      ],
    },
  );

  return ApplicationAnswer;
};

export default ApplicationAnswer;
