/** Verification state of a company as reviewed by platform admins. */
export enum CompanyVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export const COMPANY_VERIFICATION_STATUSES: CompanyVerificationStatus[] =
  Object.values(CompanyVerificationStatus);

/** Only verified companies are allowed to publish jobs. */
export const COMPANY_VERIFICATION_ALLOWED_TO_PUBLISH: CompanyVerificationStatus[] = [
  CompanyVerificationStatus.VERIFIED,
];
