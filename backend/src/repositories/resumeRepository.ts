import Resume from '../models/resumeModel';
import { IResume, IResumeCreation } from '../interfaces';
import { plain } from '../utils';

/** Data-access layer for the `resumes` table. */
class ResumeRepository {
  async findById(id: string): Promise<IResume | null> {
    const row = await Resume.findByPk(id);
    return row ? (plain(row) as IResume) : null;
  }

  async listByJobseeker(jobseekerId: string): Promise<IResume[]> {
    const rows = await Resume.findAll({
      where: { jobseeker_id: jobseekerId },
      order: [
        ['is_default', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
    return plain<IResume[]>(rows as unknown as Record<string, unknown>[]);
  }

  async findDefault(jobseekerId: string): Promise<IResume | null> {
    const row = await Resume.findOne({ where: { jobseeker_id: jobseekerId, is_default: true } });
    return row ? (plain(row) as IResume) : null;
  }

  async create(payload: IResumeCreation): Promise<IResume> {
    const row = await Resume.create(payload);
    return plain(row) as IResume;
  }

  async update(id: string, updates: Partial<IResume>): Promise<IResume | null> {
    const row = await Resume.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as IResume;
  }

  async destroy(id: string): Promise<boolean> {
    const deleted = await Resume.destroy({ where: { id } });
    return deleted > 0;
  }

  /**
   * Clear the default flag for every resume of a jobseeker.
   * Used in a transaction before setting a new default (partial unique index
   * would otherwise reject a second default row).
   */
  async clearDefault(jobseekerId: string): Promise<void> {
    await Resume.update({ is_default: false }, { where: { jobseeker_id: jobseekerId } });
  }

  async countByJobseeker(jobseekerId: string): Promise<number> {
    return Resume.count({ where: { jobseeker_id: jobseekerId } });
  }
}

export default new ResumeRepository();
