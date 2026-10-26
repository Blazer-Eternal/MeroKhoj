import { AppError } from '../utils';
import { ICompanyMember } from '../interfaces';
import {
  CompanyRole,
  CompanyMemberStatus,
  COMPANY_ROLE_RANK,
} from '../enums';
import { companyMemberRepository } from '../repositories';
import { assertCanManageCompany, isPlatformAdmin } from './accessControl';
import { IAuthUser } from '../interfaces';

/**
 * Company membership business logic.
 *
 * Rules enforced here:
 * - Only company managers (OWNER/ADMIN) or platform admins can add/remove members.
 * - A member cannot assign a role more powerful than their own.
 * - The last active OWNER cannot be demoted or removed.
 */
export const listMembers = async (user: IAuthUser, companyId: string): Promise<ICompanyMember[]> => {
  await assertCanManageCompany(user, companyId);
  return companyMemberRepository.listByCompany(companyId);
};

export const addMember = async (
  actor: IAuthUser,
  companyId: string,
  userId: string,
  role: CompanyRole,
): Promise<ICompanyMember> => {
  await assertCanManageCompany(actor, companyId);

  const existing = await companyMemberRepository.findByCompanyAndUser(companyId, userId);
  if (existing && existing.status !== CompanyMemberStatus.REMOVED) {
    throw AppError.conflict('That user is already a member of this company');
  }

  // Prevent privilege escalation: cannot assign a role above one's own.
  await assertRoleWithinBounds(actor, companyId, role);

  if (existing) {
    // Re-invite a previously removed member.
    return (await companyMemberRepository.update(existing.id, {
      role,
      status: CompanyMemberStatus.ACTIVE,
      joined_at: new Date(),
    }))!;
  }

  return companyMemberRepository.create({
    company_id: companyId,
    user_id: userId,
    role,
    status: CompanyMemberStatus.ACTIVE,
    joined_at: new Date(),
  });
};

export const updateMemberRole = async (
  actor: IAuthUser,
  companyId: string,
  memberId: string,
  role: CompanyRole,
): Promise<ICompanyMember> => {
  await assertCanManageCompany(actor, companyId);

  const member = await companyMemberRepository.findById(memberId);
  if (!member || member.company_id !== companyId) {
    throw AppError.notFound('Company member not found');
  }

  await assertRoleWithinBounds(actor, companyId, role);

  // Guard: do not demote the last owner.
  if (member.role === CompanyRole.OWNER && role !== CompanyRole.OWNER) {
    await assertNotLastOwner(companyId, member.user_id);
  }

  return (await companyMemberRepository.update(memberId, { role }))!;
};

export const removeMember = async (
  actor: IAuthUser,
  companyId: string,
  memberId: string,
): Promise<void> => {
  await assertCanManageCompany(actor, companyId);

  const member = await companyMemberRepository.findById(memberId);
  if (!member || member.company_id !== companyId) {
    throw AppError.notFound('Company member not found');
  }

  if (member.role === CompanyRole.OWNER) {
    await assertNotLastOwner(companyId, member.user_id);
  }

  await companyMemberRepository.update(memberId, { status: CompanyMemberStatus.REMOVED });
};

/** A member may not assign a role ranked above their own. */
const assertRoleWithinBounds = async (
  actor: IAuthUser,
  companyId: string,
  targetRole: CompanyRole,
): Promise<void> => {
  if (isPlatformAdmin(actor)) return;

  const actorMembership = await companyMemberRepository.findByCompanyAndUser(companyId, actor.id);
  if (!actorMembership) {
    throw AppError.forbidden('You are not a member of this company');
  }
  if (COMPANY_ROLE_RANK[targetRole] > COMPANY_ROLE_RANK[actorMembership.role]) {
    throw AppError.forbidden('You cannot assign a role higher than your own');
  }
};

/** Ensure at least one OWNER remains active in the company. */
const assertNotLastOwner = async (companyId: string, ownerUserId: string): Promise<void> => {
  const ownerCount = await companyMemberRepository.countByCompanyAndRole(
    companyId,
    CompanyRole.OWNER,
  );
  if (ownerCount <= 1) {
    throw AppError.conflict('A company must have at least one owner');
  }
  void ownerUserId;
};

export const companyMemberServices = { listMembers, addMember, updateMemberRole, removeMember };

export default companyMemberServices;
