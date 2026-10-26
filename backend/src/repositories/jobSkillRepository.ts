import { Op } from 'sequelize';
import JobSkill from '../models/jobSkillModel';
import Skill from '../models/skillModel';
import { IJobSkill, IJobSkillCreation } from '../interfaces';
import { JobSkillImportance } from '../enums';
import { plain } from '../utils';

/** Data-access layer for the `job_skills` join table. */
class JobSkillRepository {
  async findByJobAndSkill(jobId: string, skillId: string): Promise<IJobSkill | null> {
    const row = await JobSkill.findOne({ where: { job_id: jobId, skill_id: skillId } });
    return row ? (plain(row) as IJobSkill) : null;
  }

  async create(payload: IJobSkillCreation): Promise<IJobSkill> {
    const row = await JobSkill.create(payload);
    return plain(row) as IJobSkill;
  }

  /** List a job's skills (joined with the skill catalog). */
  async listByJob(jobId: string): Promise<Array<IJobSkill & { skill: { name: string } }>> {
    const rows = await JobSkill.findAll({
      where: { job_id: jobId },
      include: [{ model: Skill, as: 'skill', attributes: ['id', 'name'] }],
      order: [
        ['importance', 'ASC'],
        ['minimum_experience', 'DESC'],
      ],
    });
    return plain(rows as unknown as Record<string, unknown>[]) as Array<
      IJobSkill & { skill: { name: string } }
    >;
  }

  /** Replace a job's skill set in one shot (delete + bulk create). */
  async replaceForJob(
    jobId: string,
    skills: Array<Omit<IJobSkillCreation, 'job_id'>>,
  ): Promise<void> {
    await JobSkill.destroy({ where: { job_id: jobId } });
    if (skills.length > 0) {
      await JobSkill.bulkCreate(skills.map((s) => ({ ...s, job_id: jobId })));
    }
  }

  /** Find all jobs that require a given skill (for talent matching). */
  async findJobIdsBySkill(skillId: string): Promise<string[]> {
    const rows = await JobSkill.findAll({
      where: { skill_id: skillId },
      attributes: ['job_id'],
      raw: true,
    });
    return rows.map((r) => r.job_id);
  }

  /** Count how many REQUIRED skills of a job a candidate possesses. */
  async countMatchingRequiredSkills(jobId: string, candidateSkillIds: string[]): Promise<number> {
    if (candidateSkillIds.length === 0) return 0;
    const count = await JobSkill.count({
      where: {
        job_id: jobId,
        importance: JobSkillImportance.REQUIRED,
        skill_id: { [Op.in]: candidateSkillIds },
      },
    });
    return count;
  }
}

export default new JobSkillRepository();
