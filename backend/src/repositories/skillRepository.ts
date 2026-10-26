import { Op } from 'sequelize';
import Skill from '../models/skillModel';
import { ISkill, ISkillCreation } from '../interfaces';
import { SkillStatus } from '../enums';
import { plain } from '../utils';

/** Data-access layer for the `skills` catalog. */
class SkillRepository {
  async findById(id: string): Promise<ISkill | null> {
    const skill = await Skill.findByPk(id);
    return skill ? (plain(skill) as ISkill) : null;
  }

  async findByName(name: string): Promise<ISkill | null> {
    const skill = await Skill.findOne({ where: { name: name.toLowerCase() } });
    return skill ? (plain(skill) as ISkill) : null;
  }

  async nameExists(name: string): Promise<boolean> {
    const count = await Skill.count({ where: { name: name.toLowerCase() } });
    return count > 0;
  }

  async create(payload: ISkillCreation): Promise<ISkill> {
    const skill = await Skill.create({
      ...payload,
      name: payload.name.toLowerCase(),
    });
    return plain(skill) as ISkill;
  }

  /** Case-insensitive name search for the skills autocomplete. */
  async search(term: string, limit = 20): Promise<ISkill[]> {
    const skills = await Skill.findAll({
      where: {
        name: { [Op.iLike]: `%${term}%` },
        status: SkillStatus.ACTIVE,
      },
      limit,
      order: [['name', 'ASC']],
    });
    return plain<ISkill[]>(skills as unknown as Record<string, unknown>[]);
  }

  async findAllActive(): Promise<ISkill[]> {
    const skills = await Skill.findAll({
      where: { status: SkillStatus.ACTIVE },
      order: [['name', 'ASC']],
    });
    return plain<ISkill[]>(skills as unknown as Record<string, unknown>[]);
  }
}

export default new SkillRepository();
