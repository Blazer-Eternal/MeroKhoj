import ApplicationAnswer from '../../models/application/applicationAnswerModel';
import { IApplicationAnswer, IApplicationAnswerCreation } from '../../interfaces';
import { plain } from '../../utils';

/** Data-access layer for the `application_answers` table. */
class ApplicationAnswerRepository {
  async findById(id: string): Promise<IApplicationAnswer | null> {
    const row = await ApplicationAnswer.findByPk(id);
    return row ? (plain(row) as IApplicationAnswer) : null;
  }

  async create(payload: IApplicationAnswerCreation): Promise<IApplicationAnswer> {
    const row = await ApplicationAnswer.create(payload);
    return plain(row) as IApplicationAnswer;
  }

  async update(
    id: string,
    updates: Partial<IApplicationAnswer>,
  ): Promise<IApplicationAnswer | null> {
    const row = await ApplicationAnswer.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as IApplicationAnswer;
  }

  async destroy(id: string): Promise<number> {
    return ApplicationAnswer.destroy({ where: { id } });
  }

  /** All answers submitted for an application. */
  async listByApplication(applicationId: string): Promise<IApplicationAnswer[]> {
    const rows = await ApplicationAnswer.findAll({
      where: { application_id: applicationId },
    });
    return plain<IApplicationAnswer[]>(rows as unknown as Record<string, unknown>[]);
  }

  async destroyByApplication(applicationId: string): Promise<number> {
    return ApplicationAnswer.destroy({ where: { application_id: applicationId } });
  }

  async countByQuestion(questionId: string): Promise<number> {
    return ApplicationAnswer.count({ where: { question_id: questionId } });
  }
}

export default new ApplicationAnswerRepository();
