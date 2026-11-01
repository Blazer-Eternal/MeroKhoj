import TalentRosterMember from '../models/talentRosterMemberModel';
import { ITalentRosterMember, ITalentRosterMemberCreation } from '../interfaces';
import { plain } from '../utils';

/** Data-access layer for the `talent_roster_members` table. */
class TalentRosterMemberRepository {
  async findById(id: string): Promise<ITalentRosterMember | null> {
    const row = await TalentRosterMember.findByPk(id);
    return row ? (plain(row) as ITalentRosterMember) : null;
  }

  async findByRosterAndJobseeker(
    rosterId: string,
    jobseekerId: string,
  ): Promise<ITalentRosterMember | null> {
    const row = await TalentRosterMember.findOne({
      where: { roster_id: rosterId, jobseeker_id: jobseekerId },
    });
    return row ? (plain(row) as ITalentRosterMember) : null;
  }

  async create(payload: ITalentRosterMemberCreation): Promise<ITalentRosterMember> {
    const row = await TalentRosterMember.create(payload);
    return plain(row) as ITalentRosterMember;
  }

  async update(
    id: string,
    updates: Partial<ITalentRosterMember>,
  ): Promise<ITalentRosterMember | null> {
    const row = await TalentRosterMember.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as ITalentRosterMember;
  }

  async destroy(id: string): Promise<number> {
    return TalentRosterMember.destroy({ where: { id } });
  }

  /** All members of a roster, newest first. */
  async listByRoster(rosterId: string): Promise<ITalentRosterMember[]> {
    const rows = await TalentRosterMember.findAll({
      where: { roster_id: rosterId },
      order: [['created_at', 'DESC']],
    });
    return plain<ITalentRosterMember[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Which rosters (within a set of company rosters) contain this jobseeker? */
  async listByJobseeker(jobseekerId: string): Promise<ITalentRosterMember[]> {
    const rows = await TalentRosterMember.findAll({
      where: { jobseeker_id: jobseekerId },
      order: [['created_at', 'DESC']],
    });
    return plain<ITalentRosterMember[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Membership existence check. */
  async exists(rosterId: string, jobseekerId: string): Promise<boolean> {
    const count = await TalentRosterMember.count({
      where: { roster_id: rosterId, jobseeker_id: jobseekerId },
    });
    return count > 0;
  }

  async countByRoster(rosterId: string): Promise<number> {
    return TalentRosterMember.count({ where: { roster_id: rosterId } });
  }
}

export default new TalentRosterMemberRepository();
