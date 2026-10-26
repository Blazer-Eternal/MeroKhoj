/** Membership state of a company member. */
export enum CompanyMemberStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REMOVED = 'REMOVED',
}

export const COMPANY_MEMBER_STATUSES: CompanyMemberStatus[] = Object.values(CompanyMemberStatus);

/** Statuses that count as an active participant of the company. */
export const COMPANY_MEMBER_ACTIVE_STATUSES: CompanyMemberStatus[] = [
  CompanyMemberStatus.ACTIVE,
];
