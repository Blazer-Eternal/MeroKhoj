import { AppError } from '../utils';
import { ISkill, ISkillCreation } from '../interfaces';
import { skillRepository, jobSkillRepository } from '../repositories';
import { plain } from '../utils';

/** Skill catalog business logic (reusable skills shared by jobs & candidates). */
export const listSkills = async (): Promise<ISkill[]> => skillRepository.findAllActive();

export const searchSkills = async (term: string, limit?: number): Promise<ISkill[]> => {
  if (!term || term.trim().length === 0) return [];
  return skillRepository.search(term.trim(), limit);
};

export const getSkillById = async (id: string): Promise<ISkill> => {
  const skill = await skillRepository.findById(id);
  if (!skill) throw AppError.notFound('Skill not found');
  return skill;
};

export const createSkill = async (input: ISkillCreation): Promise<ISkill> => {
  if (await skillRepository.nameExists(input.name)) {
    throw AppError.conflict('A skill with that name already exists');
  }
  return skillRepository.create(input);
};

/** Skills required/preferred by a job (joined with catalog details). */
export const listSkillsForJob = async (jobId: string) =>
  jobSkillRepository.listByJob(jobId);

export const skillServices = { listSkills, searchSkills, getSkillById, createSkill, listSkillsForJob };

export default skillServices;

// Re-exported for convenience in controllers that map skill rows.
export type { ISkill };
export const toPlainSkill = (skill: unknown) => plain<ISkill>(skill as Record<string, unknown>);
