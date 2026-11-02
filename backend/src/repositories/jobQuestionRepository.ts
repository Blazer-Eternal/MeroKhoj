import JobQuestion from '../models/jobQuestionModel';
import { IJobQuestion, IJobQuestionCreation, IJobQuestionUpdate } from '../interfaces';
import { plain } from '../utils';

/** Data-access layer for the `job_questions` table. */
class JobQuestionRepository {
  async findById(id: string): Promise<IJobQuestion | null> {
    const row = await JobQuestion.findByPk(id);
    return row ? (plain(row) as IJobQuestion) : null;
  }

  async create(payload: IJobQuestionCreation): Promise<IJobQuestion> {
    const row = await JobQuestion.create(payload);
    return plain(row) as IJobQuestion;
  }

  async update(id: string, updates: IJobQuestionUpdate): Promise<IJobQuestion | null> {
    const row = await JobQuestion.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as IJobQuestion;
  }

  async destroy(id: string): Promise<number> {
    return JobQuestion.destroy({ where: { id } });
  }

  /** All questions for a job, in display order. */
  async listByJob(jobId: string): Promise<IJobQuestion[]> {
    const rows = await JobQuestion.findAll({
      where: { job_id: jobId },
      order: [['position', 'ASC'], ['created_at', 'ASC']],
    });
    return plain<IJobQuestion[]>(rows as unknown as Record<string, unknown>[]);
  }

  async countByJob(jobId: string): Promise<number> {
    return JobQuestion.count({ where: { job_id: jobId } });
  }

  /** Next display position for a job's questions. */
  async nextPosition(jobId: string): Promise<number> {
    const rows = await JobQuestion.findAll({
      where: { job_id: jobId },
      attributes: ['position'],
      order: [['position', 'DESC']],
      limit: 1,
    });
    return rows.length > 0 ? (rows[0].position ?? 0) + 1 : 0;
  }
}

export default new JobQuestionRepository();
