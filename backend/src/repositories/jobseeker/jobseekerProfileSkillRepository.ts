import { JobseekerProfile, JobseekerProfileSkill, Skill } from '../../models';
import { plain } from '../../utils';

export interface IProfileSkill {
  id: string;
  name: string;
}

/** Data-access layer for candidate skills (`jobseeker_profile_skills`). */
class JobseekerProfileSkillRepository {
  /** Skills listed on a user's profile, ordered alphabetically. */
  async listByUserId(userId: string): Promise<IProfileSkill[]> {
    const profile = await JobseekerProfile.findOne({
      where: { user_id: userId },
      attributes: ['id'],
    });
    if (!profile) return [];

    const rows = await JobseekerProfileSkill.findAll({
      where: { jobseeker_id: profile.id },
      include: [{ model: Skill, as: 'skill', attributes: ['id', 'name'] }],
      order: [['skill_id', 'ASC']],
    });
    const joined = plain(rows as unknown as Record<string, unknown>[]) as Array<{
      skill?: { id: string; name: string } | null;
    }>;

    return joined
      .map((row) => row.skill)
      .filter((skill): skill is { id: string; name: string } => Boolean(skill))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((skill) => ({ id: skill.id, name: skill.name }));
  }

  /** Skill ids listed on a user's profile (for scoring / matching). */
  async idsByUserId(userId: string): Promise<string[]> {
    const skills = await this.listByUserId(userId);
    return skills.map((skill) => skill.id);
  }

  /** Replace a candidate's skills in one shot (delete + bulk create). */
  async replaceByUserId(userId: string, skillIds: string[]): Promise<void> {
    const profile = await JobseekerProfile.findOne({
      where: { user_id: userId },
      attributes: ['id'],
    });
    if (!profile) return;

    await JobseekerProfileSkill.destroy({ where: { jobseeker_id: profile.id } });
    if (skillIds.length > 0) {
      await JobseekerProfileSkill.bulkCreate(
        skillIds.map((skillId) => ({ jobseeker_id: profile.id, skill_id: skillId })),
      );
    }
  }

  /** Whether every skill id exists in the catalog. */
  async missingSkillIds(skillIds: string[]): Promise<string[]> {
    if (skillIds.length === 0) return [];
    const rows = await Skill.findAll({
      where: { id: skillIds },
      attributes: ['id'],
      raw: true,
    });
    const found = new Set(rows.map((row) => row.id));
    return skillIds.filter((id) => !found.has(id));
  }

  /** Plain-object helper kept for symmetry with other repositories. */
  async listRowsByUserId(userId: string): Promise<unknown[]> {
    const rows = await JobseekerProfileSkill.findAll({ where: { jobseeker_id: userId } });
    return plain(rows);
  }
}

export default new JobseekerProfileSkillRepository();
