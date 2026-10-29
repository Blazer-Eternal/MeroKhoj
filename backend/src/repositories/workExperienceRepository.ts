import { Op } from 'sequelize';
import WorkExperience from '../models/workExperienceModel';
import { IWorkExperience, IWorkExperienceCreation } from '../interfaces';
import { plain } from '../utils';

/** Data-access layer for the `work_experiences` table. */
class WorkExperienceRepository {
  async findById(id: string): Promise<IWorkExperience | null> {
    const row = await WorkExperience.findByPk(id);
    return row ? (plain(row) as IWorkExperience) : null;
  }

  async listByJobseeker(jobseekerId: string): Promise<IWorkExperience[]> {
    const rows = await WorkExperience.findAll({
      where: { jobseeker_id: jobseekerId },
      order: [
        ['start_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
    return plain<IWorkExperience[]>(rows as unknown as Record<string, unknown>[]);
  }

  async create(payload: IWorkExperienceCreation): Promise<IWorkExperience> {
    const row = await WorkExperience.create(payload);
    return plain(row) as IWorkExperience;
  }

  async update(id: string, updates: Partial<IWorkExperience>): Promise<IWorkExperience | null> {
    const row = await WorkExperience.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as IWorkExperience;
  }

  async destroy(id: string): Promise<boolean> {
    const deleted = await WorkExperience.destroy({ where: { id } });
    return deleted > 0;
  }

  async hasCurrentEntry(jobseekerId: string, excludeId?: string): Promise<boolean> {
    const where: Record<string, unknown> = { jobseeker_id: jobseekerId, is_current: true };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const count = await WorkExperience.count({ where });
    return count > 0;
  }
}

export default new WorkExperienceRepository();
