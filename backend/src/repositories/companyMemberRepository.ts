import { Op } from 'sequelize';
import CompanyMember from '../models/companyMemberModel';
import { ICompanyMember, ICompanyMemberCreation } from '../interfaces';
import { CompanyRole, CompanyMemberStatus } from '../enums';
import { plain } from '../utils';

/** Data-access layer for `company_members`. */
class CompanyMemberRepository {
  async findByCompanyAndUser(
    companyId: string,
    userId: string,
  ): Promise<ICompanyMember | null> {
    const member = await CompanyMember.findOne({
      where: { company_id: companyId, user_id: userId },
    });
    return member ? (plain(member) as ICompanyMember) : null;
  }

  async findById(id: string): Promise<ICompanyMember | null> {
    const member = await CompanyMember.findByPk(id);
    return member ? (plain(member) as ICompanyMember) : null;
  }

  async create(payload: ICompanyMemberCreation): Promise<ICompanyMember> {
    const member = await CompanyMember.create(payload);
    return plain(member) as ICompanyMember;
  }

  async update(
    id: string,
    updates: Partial<ICompanyMember>,
  ): Promise<ICompanyMember | null> {
    const member = await CompanyMember.findByPk(id);
    if (!member) return null;
    await member.update(updates);
    return plain(member) as ICompanyMember;
  }

  /** List all active members of a company. */
  async listByCompany(companyId: string): Promise<ICompanyMember[]> {
    const members = await CompanyMember.findAll({
      where: { company_id: companyId, status: CompanyMemberStatus.ACTIVE },
      order: [['joined_at', 'ASC']],
    });
    return plain<ICompanyMember[]>(members as unknown as Record<string, unknown>[]);
  }

  /** Does the user have at least `minRole` power in the company? */
  async hasMinimumRole(
    companyId: string,
    userId: string,
    allowedRoles: CompanyRole[],
  ): Promise<boolean> {
    const count = await CompanyMember.count({
      where: {
        company_id: companyId,
        user_id: userId,
        role: { [Op.in]: allowedRoles },
        status: CompanyMemberStatus.ACTIVE,
      },
    });
    return count > 0;
  }

  /** Count members holding a given role (used to protect the last OWNER). */
  async countByCompanyAndRole(companyId: string, role: CompanyRole): Promise<number> {
    return CompanyMember.count({
      where: { company_id: companyId, role, status: CompanyMemberStatus.ACTIVE },
    });
  }
}

export default new CompanyMemberRepository();
