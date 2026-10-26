import {
  CompanyStatus,
  CompanyVerificationStatus,
  CompanySize,
  CompanyRole,
  CompanyMemberStatus,
} from '../enums';
import { ITimestamps } from './commonInterface';

/** An employer organization. */
export interface ICompany extends ITimestamps {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  company_size: CompanySize | null;
  address: string | null;
  city: string | null;
  country: string;
  verification_status: CompanyVerificationStatus;
  status: CompanyStatus;
}

export interface ICompanyCreation {
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  company_size?: CompanySize | null;
  address?: string | null;
  city?: string | null;
  country?: string;
  verification_status?: CompanyVerificationStatus;
  status?: CompanyStatus;
}

export type ICompanyUpdate = Partial<Omit<ICompanyCreation, 'slug'>>;

/** A user's membership in a company. */
export interface ICompanyMember extends ITimestamps {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyRole;
  status: CompanyMemberStatus;
  joined_at: Date | null;
}

export interface ICompanyMemberCreation {
  company_id: string;
  user_id: string;
  role: CompanyRole;
  status?: CompanyMemberStatus;
  joined_at?: Date | null;
}
