import { Op } from 'sequelize';
import JobCategory from '../models/jobCategoryModel';
import { IJobCategory, IJobCategoryCreation } from '../interfaces';
import { CatalogStatus } from '../enums';
import { plain } from '../utils';

/** Data-access layer for the `job_categories` table. */
class JobCategoryRepository {
  async findById(id: string): Promise<IJobCategory | null> {
    const row = await JobCategory.findByPk(id);
    return row ? (plain(row) as IJobCategory) : null;
  }

  async findBySlug(slug: string): Promise<IJobCategory | null> {
    const row = await JobCategory.findOne({ where: { slug } });
    return row ? (plain(row) as IJobCategory) : null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await JobCategory.count({ where: { slug } });
    return count > 0;
  }

  async listAll(status?: CatalogStatus): Promise<IJobCategory[]> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const rows = await JobCategory.findAll({
      where,
      order: [
        ['name', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });
    return plain<IJobCategory[]>(rows as unknown as Record<string, unknown>[]);
  }

  async listByParent(parentId: string | null): Promise<IJobCategory[]> {
    const where: Record<string, unknown> = {
      parent_id: parentId === null ? { [Op.is]: null } : parentId,
    };
    const rows = await JobCategory.findAll({ where, order: [['name', 'ASC']] });
    return plain<IJobCategory[]>(rows as unknown as Record<string, unknown>[]);
  }

  async create(payload: IJobCategoryCreation): Promise<IJobCategory> {
    const row = await JobCategory.create(payload);
    return plain(row) as IJobCategory;
  }

  async update(id: string, updates: Partial<IJobCategory>): Promise<IJobCategory | null> {
    const row = await JobCategory.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as IJobCategory;
  }

  async destroy(id: string): Promise<boolean> {
    const deleted = await JobCategory.destroy({ where: { id } });
    return deleted > 0;
  }

  /** Walk up the ancestor chain (used for circular-hierarchy prevention). */
  async getAncestors(id: string): Promise<IJobCategory[]> {
    const chain: IJobCategory[] = [];
    let current = await this.findById(id);
    // Hard stop at a sane depth to defend against a corrupted graph.
    let depth = 0;
    while (current?.parent_id && depth < 20) {
      const parent = await this.findById(current.parent_id);
      if (!parent) break;
      chain.push(parent);
      current = parent;
      depth += 1;
    }
    return chain;
  }
}

export default new JobCategoryRepository();
