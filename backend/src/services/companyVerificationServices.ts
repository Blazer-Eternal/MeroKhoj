import { AppError } from '../utils';
import {
  ICompanyVerification,
  ICompanyVerificationReview,
  IAuthUser,
} from '../interfaces';
import {
  CompanyVerificationStatus,
  CompanyRole,
  COMPANY_VERIFICATION_ALLOWED_TO_PUBLISH,
} from '../enums';
import {
  companyVerificationRepository,
  companyRepository,
  companyMemberRepository,
} from '../repositories';
import { assertCanManageCompany, isPlatformAdmin } from './accessControl';
import { recordAuditForUser } from './auditLogServices';

/**
 * Company verification workflow.
 *
 *   1. A company member submits a verification (document_url + remarks) → PENDING.
 *      Also sets the company's verification_status to PENDING.
 *   2. A platform admin reviews it: VERIFIED or REJECTED, stamping reviewed_by
 *      and reviewed_at, and syncing the company's verification_status.
 *   3. Re-verification appends a NEW record (previous decisions are preserved
 *      as history) — the company's current status reflects the latest review.
 *
 * Only VERIFIED companies can publish jobs (checked in jobServices).
 */

/** Submit a new verification request for a company. */
export const submitVerification = async (
  user: IAuthUser,
  companyId: string,
  input: { document_url?: string | null; remarks?: string | null },
): Promise<ICompanyVerification> => {
  // Any active member of the company may submit (not just managers).
  const isMember = await companyMemberRepository.hasMinimumRole(
    companyId,
    user.id,
    Object.values(CompanyRole),
  );
  if (!isMember && !isPlatformAdmin(user)) {
    throw AppError.forbidden('You are not a member of this company');
  }

  const company = await companyRepository.findById(companyId);
  if (!company) throw AppError.notFound('Company not found');

  // Block duplicate pending requests.
  if (await companyVerificationRepository.hasPending(companyId)) {
    throw AppError.conflict('A verification request is already pending for this company');
  }

  const verification = await companyVerificationRepository.create({
    company_id: companyId,
    submitted_by: user.id,
    status: CompanyVerificationStatus.PENDING,
    document_url: input.document_url ?? null,
    remarks: input.remarks ?? null,
    submitted_at: new Date(),
  });

  // Reflect the pending state on the company itself.
  await companyRepository.update(companyId, {
    verification_status: CompanyVerificationStatus.PENDING,
  });

  await recordAuditForUser(user, {
    action: 'COMPANY_VERIFICATION_SUBMITTED',
    entity_type: 'COMPANY',
    entity_id: companyId,
    new_values: { verification_id: verification.id, status: 'PENDING' },
  });

  return verification;
};

/** Admin reviews a pending verification (approve/reject). */
export const reviewVerification = async (
  user: IAuthUser,
  verificationId: string,
  review: ICompanyVerificationReview,
): Promise<ICompanyVerification> => {
  if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('Only platform administrators can review verifications');
  }

  const verification = await companyVerificationRepository.findById(verificationId);
  if (!verification) throw AppError.notFound('Verification not found');
  if (verification.status !== CompanyVerificationStatus.PENDING) {
    throw AppError.conflict('This verification has already been reviewed');
  }

  if (
    review.status !== CompanyVerificationStatus.VERIFIED &&
    review.status !== CompanyVerificationStatus.REJECTED
  ) {
    throw AppError.badRequest('Review status must be VERIFIED or REJECTED');
  }

  const now = new Date();
  const updated = await companyVerificationRepository.update(verificationId, {
    status: review.status,
    reviewed_by: review.reviewed_by,
    reviewed_at: now,
    remarks: review.remarks ?? verification.remarks,
  });
  if (!updated) throw AppError.notFound('Verification not found');

  // Sync the company's current verification status with the decision.
  await companyRepository.update(verification.company_id, {
    verification_status: review.status,
  });

  await recordAuditForUser(user, {
    action: `COMPANY_VERIFICATION_${review.status}`,
    entity_type: 'COMPANY',
    entity_id: verification.company_id,
    old_values: { status: CompanyVerificationStatus.PENDING },
    new_values: { status: review.status, verification_id: verificationId },
  });

  return updated;
};

/** Full verification history for a company (admin or its members). */
export const listVerifications = async (
  user: IAuthUser,
  companyId: string,
): Promise<ICompanyVerification[]> => {
  if (!isPlatformAdmin(user)) {
    await assertCanManageCompany(user, companyId);
  }
  return companyVerificationRepository.listByCompany(companyId);
};

/** The current/latest verification record for a company. */
export const getLatestVerification = async (
  companyId: string,
): Promise<ICompanyVerification | null> =>
  companyVerificationRepository.findLatestByCompany(companyId);

/** Admin review queue: all pending verifications. */
export const listPendingVerifications = async (): Promise<ICompanyVerification[]> =>
  companyVerificationRepository.listPending();

/** Is the company currently allowed to publish (i.e. VERIFIED)? */
export const canPublish = (verificationStatus: CompanyVerificationStatus): boolean =>
  COMPANY_VERIFICATION_ALLOWED_TO_PUBLISH.includes(verificationStatus);

export const companyVerificationServices = {
  submitVerification,
  reviewVerification,
  listVerifications,
  getLatestVerification,
  listPendingVerifications,
  canPublish,
};

export default companyVerificationServices;
