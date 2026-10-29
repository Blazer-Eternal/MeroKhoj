import { Op } from 'sequelize';
import Education from '../models/educationModel';
import { IEducation, IEducationCreation } from '../interfaces';
import { plain } from '../utils';

/** Data-access layer for the `educations` table. */
class EducationRepository {
  async findById(id: string): Promise<IEducation | null> {
    const row = await Education.findByPk(id);
    return row ? (plain(row) as IEducation) : null;
  }

  async listByJobseeker(jobseekerId: string): Promise<IEducation[]> {
    const rows = await Education.findAll({
      where: { jobseeker_id: jobseekerId },
      order: [
        ['start_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
    return plain<IEducation[]>(rows as unknown as Record<string, unknown>[]);
  }

  async create(payload: IEducationCreation): Promise<IEducation> {
    const row = await Education.create(payload);
    return plain(row) as IEducation;
  }

  async update(id: string, updates: Partial<IEducation>): Promise<IEducation | null> {
    const row = await Education.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as IEducation;
  }

  async destroy(id: string): Promise<boolean> {
    const deleted = await Education.destroy({ where: { id } });
    return deleted > 0;
  }

  async countByJobseeker(jobseekerId: string): Promise<number> {
    return Education.count({ where: { jobseeker_id: jobseekerId } });
  }

  /** Detect overlapping current entries (end_date in the future, etc.). */
  async hasCurrentEntry(jobseekerId: string, excludeId?: string): Promise<boolean> {
    const where: Record<string, unknown> = { jobseeker_id: jobseekerId, is_current: true };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const count = await Education.count({ where });
    return count > 0;
  }
}

export default new EducationRepository();
