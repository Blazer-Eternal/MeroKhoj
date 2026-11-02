/** Approximate headcount band for a company. */
export enum CompanySize {
  SOLO = 'SOLO',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ENTERPRISE = 'ENTERPRISE',
}

export const COMPANY_SIZES: CompanySize[] = Object.values(CompanySize);
