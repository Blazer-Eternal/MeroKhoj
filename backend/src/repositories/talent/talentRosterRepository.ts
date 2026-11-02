import { Op } from 'sequelize';
import TalentRoster from '../../models/talent/talentRosterModel';
import { ITalentRoster, ITalentRosterCreation, ITalentRosterUpdate } from '../../interfaces';
import { plain } from '../../utils';

/** Data-access layer for the `talent_rosters` table. */
class TalentRosterRepository {
  async findById(id: string): Promise<ITalentRoster | null> {
    const row = await TalentRoster.findByPk(id);
    return row ? (plain(row) as ITalentRoster) : null;
  }

  async create(payload: ITalentRosterCreation): Promise<ITalentRoster> {
    const row = await TalentRoster.create(payload);
    return plain(row) as ITalentRoster;
  }

  async update(id: string, updates: ITalentRosterUpdate): Promise<ITalentRoster | null> {
    const row = await TalentRoster.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as ITalentRoster;
  }

  async destroy(id: string): Promise<number> {
    return TalentRoster.destroy({ where: { id } });
  }

  /** All rosters belonging to a company (the isolation boundary). */
  async listByCompany(companyId: string): Promise<ITalentRoster[]> {
    const rows = await TalentRoster.findAll({
      where: { company_id: companyId },
      order: [['created_at', 'DESC']],
    });
    return plain<ITalentRoster[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Is a roster name already used within this company? */
  async nameExists(companyId: string, name: string, excludeId?: string): Promise<boolean> {
    const where: Record<string, unknown> = { company_id: companyId, name };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const count = await TalentRoster.count({ where });
    return count > 0;
  }
}

export default new TalentRosterRepository();
