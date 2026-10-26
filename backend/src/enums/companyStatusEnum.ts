/** Operational status of a company account. */
export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export const COMPANY_STATUSES: CompanyStatus[] = Object.values(CompanyStatus);

export const COMPANY_STATUS_ACTIVE: CompanyStatus = CompanyStatus.ACTIVE;
