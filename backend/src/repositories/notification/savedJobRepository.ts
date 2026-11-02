import { Op } from 'sequelize';
import SavedJob from '../../models/notification/savedJobModel';
import { ISavedJob, ISavedJobCreation } from '../../interfaces';
import { plain } from '../../utils';

/** Data-access layer for the `saved_jobs` table. */
class SavedJobRepository {
  async findById(id: string): Promise<ISavedJob | null> {
    const row = await SavedJob.findByPk(id);
    return row ? (plain(row) as ISavedJob) : null;
  }

  async findByUserAndJob(userId: string, jobId: string): Promise<ISavedJob | null> {
    const row = await SavedJob.findOne({ where: { user_id: userId, job_id: jobId } });
    return row ? (plain(row) as ISavedJob) : null;
  }

  async create(payload: ISavedJobCreation): Promise<ISavedJob> {
    const row = await SavedJob.create(payload);
    return plain(row) as ISavedJob;
  }

  async destroy(id: string): Promise<number> {
    return SavedJob.destroy({ where: { id } });
  }

  /** All jobs saved by a user, newest first. */
  async listByUser(userId: string): Promise<ISavedJob[]> {
    const rows = await SavedJob.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
    return plain<ISavedJob[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Users who saved a given job (e.g. to notify on closure). */
  async listUsersByJob(jobId: string): Promise<ISavedJob[]> {
    const rows = await SavedJob.findAll({ where: { job_id: jobId } });
    return plain<ISavedJob[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Does this user have any saved jobs at all? */
  async countByUser(userId: string): Promise<number> {
    return SavedJob.count({ where: { user_id: userId } });
  }

  /** Check existence without loading the row. */
  async exists(userId: string, jobId: string): Promise<boolean> {
    const count = await SavedJob.count({ where: { user_id: userId, job_id: jobId } });
    return count > 0;
  }

  /** Bulk existence check used to flag which of a set of jobs are saved. */
  async findExistingPairs(userId: string, jobIds: string[]): Promise<Set<string>> {
    if (jobIds.length === 0) return new Set();
    const rows = await SavedJob.findAll({
      where: { user_id: userId, job_id: { [Op.in]: jobIds } },
      attributes: ['job_id'],
    });
    return new Set(rows.map((r) => r.job_id));
  }
}

export default new SavedJobRepository();
