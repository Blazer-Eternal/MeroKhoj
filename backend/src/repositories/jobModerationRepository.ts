import JobModeration from '../models/jobModerationModel';
import { IJobModeration, IJobModerationCreation } from '../interfaces';
import { plain } from '../utils';

/** Data-access layer for the `job_moderation` table (append-only). */
class JobModerationRepository {
  async findById(id: string): Promise<IJobModeration | null> {
    const row = await JobModeration.findByPk(id);
    return row ? (plain(row) as IJobModeration) : null;
  }

  /** Full moderation history for a job, newest first. */
  async listByJob(jobId: string): Promise<IJobModeration[]> {
    const rows = await JobModeration.findAll({
      where: { job_id: jobId },
      order: [['created_at', 'DESC']],
    });
    return plain<IJobModeration[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** The latest moderation decision for a job (null if never moderated). */
  async findLatestByJob(jobId: string): Promise<IJobModeration | null> {
    const row = await JobModeration.findOne({
      where: { job_id: jobId },
      order: [['created_at', 'DESC']],
    });
    return row ? (plain(row) as IJobModeration) : null;
  }

  async create(payload: IJobModerationCreation): Promise<IJobModeration> {
    const row = await JobModeration.create(payload);
    return plain(row) as IJobModeration;
  }
}

export default new JobModerationRepository();
