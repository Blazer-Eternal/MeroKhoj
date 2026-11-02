import QuestionOption from '../../models/job/questionOptionModel';
import { IQuestionOption, IQuestionOptionCreation } from '../../interfaces';
import { plain } from '../../utils';

/** Data-access layer for the `question_options` table. */
class QuestionOptionRepository {
  async findById(id: string): Promise<IQuestionOption | null> {
    const row = await QuestionOption.findByPk(id);
    return row ? (plain(row) as IQuestionOption) : null;
  }

  async create(payload: IQuestionOptionCreation): Promise<IQuestionOption> {
    const row = await QuestionOption.create(payload);
    return plain(row) as IQuestionOption;
  }

  async update(
    id: string,
    updates: Partial<IQuestionOption>,
  ): Promise<IQuestionOption | null> {
    const row = await QuestionOption.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as IQuestionOption;
  }

  async destroy(id: string): Promise<number> {
    return QuestionOption.destroy({ where: { id } });
  }

  /** All options for a question, in display order. */
  async listByQuestion(questionId: string): Promise<IQuestionOption[]> {
    const rows = await QuestionOption.findAll({
      where: { question_id: questionId },
      order: [['position', 'ASC'], ['created_at', 'ASC']],
    });
    return plain<IQuestionOption[]>(rows as unknown as Record<string, unknown>[]);
  }

  async destroyByQuestion(questionId: string): Promise<number> {
    return QuestionOption.destroy({ where: { question_id: questionId } });
  }

  async countByQuestion(questionId: string): Promise<number> {
    return QuestionOption.count({ where: { question_id: questionId } });
  }

  /** Do any of these option ids belong to this question? */
  async countByIdsForQuestion(questionId: string, optionIds: string[]): Promise<number> {
    if (optionIds.length === 0) return 0;
    return QuestionOption.count({
      where: { question_id: questionId, id: optionIds },
    });
  }
}

export default new QuestionOptionRepository();
