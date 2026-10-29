import Industry from '../models/industryModel';
import { IIndustry, IIndustryCreation } from '../interfaces';
import { CatalogStatus } from '../enums';
import { plain } from '../utils';

/** Data-access layer for the `industries` table. */
class IndustryRepository {
  async findById(id: string): Promise<IIndustry | null> {
    const row = await Industry.findByPk(id);
    return row ? (plain(row) as IIndustry) : null;
  }

  async findBySlug(slug: string): Promise<IIndustry | null> {
    const row = await Industry.findOne({ where: { slug } });
    return row ? (plain(row) as IIndustry) : null;
  }

  async findByName(name: string): Promise<IIndustry | null> {
    const row = await Industry.findOne({ where: { name } });
    return row ? (plain(row) as IIndustry) : null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await Industry.count({ where: { slug } });
    return count > 0;
  }

  async nameExists(name: string): Promise<boolean> {
    const count = await Industry.count({ where: { name } });
    return count > 0;
  }

  async listAll(status?: CatalogStatus): Promise<IIndustry[]> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const rows = await Industry.findAll({ where, order: [['name', 'ASC']] });
    return plain<IIndustry[]>(rows as unknown as Record<string, unknown>[]);
  }

  async create(payload: IIndustryCreation): Promise<IIndustry> {
    const row = await Industry.create(payload);
    return plain(row) as IIndustry;
  }

  async update(id: string, updates: Partial<IIndustry>): Promise<IIndustry | null> {
    const row = await Industry.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as IIndustry;
  }

  async destroy(id: string): Promise<boolean> {
    const deleted = await Industry.destroy({ where: { id } });
    return deleted > 0;
  }
}

export default new IndustryRepository();
