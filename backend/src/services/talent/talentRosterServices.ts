import { AppError } from '../../utils';
import {
  ITalentRoster,
  ITalentRosterCreation,
  ITalentRosterUpdate,
  ITalentRosterMember,
  ITalentRosterMemberCreation,
  IAuthUser,
} from '../../interfaces';
import {
  talentRosterRepository,
  talentRosterMemberRepository,
  companyRepository,
  jobseekerProfileRepository,
} from '../../repositories';
import { resolveCompanyForUser } from '../shared/accessControl';
import { recordAuditForUser } from '../administration/auditLogServices';

/**
 * Talent rosters business logic (company-owned talent shortlists).
 *
 * Company isolation is the core rule: every read/write is scoped to a company
 * the caller is an active member of. A user can never touch another company's
 * roster, enforced via resolveCompanyForUser on every path.
 */

/** Load a roster or throw 404. */
const loadRosterOrThrow = async (rosterId: string): Promise<ITalentRoster> => {
  const roster = await talentRosterRepository.findById(rosterId);
  if (!roster) throw AppError.notFound('Talent roster not found');
  return roster;
};

export const createRoster = async (
  user: IAuthUser,
  companyId: string,
  input: Omit<ITalentRosterCreation, 'company_id' | 'created_by'>,
): Promise<ITalentRoster> => {
  const resolved = await resolveCompanyForUser(user, companyId);
  const company = await companyRepository.findById(resolved);
  if (!company) throw AppError.notFound('Company not found');

  if (await talentRosterRepository.nameExists(resolved, input.name)) {
    throw AppError.conflict('A roster with this name already exists for the company');
  }

  const roster = await talentRosterRepository.create({
    ...input,
    company_id: resolved,
    created_by: user.id,
  });

  await recordAuditForUser(user, {
    action: 'TALENT_ROSTER_CREATED',
    entity_type: 'TALENT_ROSTER',
    entity_id: roster.id,
    new_values: { company_id: resolved, name: roster.name },
  });

  return roster;
};

export const updateRoster = async (
  user: IAuthUser,
  rosterId: string,
  updates: ITalentRosterUpdate,
): Promise<ITalentRoster> => {
  const roster = await loadRosterOrThrow(rosterId);
  await resolveCompanyForUser(user, roster.company_id);

  if (
    updates.name &&
    updates.name !== roster.name &&
    (await talentRosterRepository.nameExists(roster.company_id, updates.name, rosterId))
  ) {
    throw AppError.conflict('A roster with this name already exists for the company');
  }

  const updated = await talentRosterRepository.update(rosterId, updates);
  if (!updated) throw AppError.notFound('Talent roster not found');
  return updated;
};

export const deleteRoster = async (user: IAuthUser, rosterId: string): Promise<void> => {
  const roster = await loadRosterOrThrow(rosterId);
  await resolveCompanyForUser(user, roster.company_id);
  await talentRosterRepository.destroy(rosterId);

  await recordAuditForUser(user, {
    action: 'TALENT_ROSTER_DELETED',
    entity_type: 'TALENT_ROSTER',
    entity_id: rosterId,
    old_values: { company_id: roster.company_id, name: roster.name },
  });
};

/** All rosters for a company (membership-checked). */
export const listRosters = async (user: IAuthUser, companyId: string): Promise<ITalentRoster[]> => {
  const resolved = await resolveCompanyForUser(user, companyId);
  return talentRosterRepository.listByCompany(resolved);
};

/** A single roster, provided the caller belongs to its company. */
export const getRoster = async (user: IAuthUser, rosterId: string): Promise<ITalentRoster> => {
  const roster = await loadRosterOrThrow(rosterId);
  await resolveCompanyForUser(user, roster.company_id);
  return roster;
};

// ---- Roster members -------------------------------------------------------

/** Add a jobseeker to a roster (company-scoped). */
export const addMember = async (
  user: IAuthUser,
  rosterId: string,
  input: Omit<ITalentRosterMemberCreation, 'roster_id' | 'added_by'>,
): Promise<ITalentRosterMember> => {
  const roster = await loadRosterOrThrow(rosterId);
  await resolveCompanyForUser(user, roster.company_id);

  const profile = await jobseekerProfileRepository.findById(input.jobseeker_id);
  if (!profile) throw AppError.notFound('Jobseeker profile not found');

  if (await talentRosterMemberRepository.exists(rosterId, input.jobseeker_id)) {
    throw AppError.conflict('This jobseeker is already on the roster');
  }

  return talentRosterMemberRepository.create({
    ...input,
    roster_id: rosterId,
    added_by: user.id,
  });
};

/** Remove a jobseeker from a roster (company-scoped). */
export const removeMember = async (
  user: IAuthUser,
  rosterId: string,
  jobseekerId: string,
): Promise<void> => {
  const roster = await loadRosterOrThrow(rosterId);
  await resolveCompanyForUser(user, roster.company_id);

  const member = await talentRosterMemberRepository.findByRosterAndJobseeker(
    rosterId,
    jobseekerId,
  );
  if (!member) throw AppError.notFound('Roster member not found');

  await talentRosterMemberRepository.destroy(member.id);
};

/** Update the notes attached to a roster member (company-scoped). */
export const updateMemberNotes = async (
  user: IAuthUser,
  rosterId: string,
  jobseekerId: string,
  notes: string | null,
): Promise<ITalentRosterMember> => {
  const roster = await loadRosterOrThrow(rosterId);
  await resolveCompanyForUser(user, roster.company_id);

  const member = await talentRosterMemberRepository.findByRosterAndJobseeker(
    rosterId,
    jobseekerId,
  );
  if (!member) throw AppError.notFound('Roster member not found');

  const updated = await talentRosterMemberRepository.update(member.id, { notes });
  if (!updated) throw AppError.notFound('Roster member not found');
  return updated;
};

/** List members of a roster (company-scoped). */
export const listMembers = async (
  user: IAuthUser,
  rosterId: string,
): Promise<ITalentRosterMember[]> => {
  const roster = await loadRosterOrThrow(rosterId);
  await resolveCompanyForUser(user, roster.company_id);
  return talentRosterMemberRepository.listByRoster(rosterId);
};

export const talentRosterServices = {
  createRoster,
  updateRoster,
  deleteRoster,
  listRosters,
  getRoster,
  addMember,
  removeMember,
  updateMemberNotes,
  listMembers,
};

export default talentRosterServices;
