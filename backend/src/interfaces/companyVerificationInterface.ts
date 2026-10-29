import { CompanyVerificationStatus } from '../enums';
import { ITimestamps } from './commonInterface';

/**
 * A company verification submission/review record.
 * Multiple rows per company form the verification history (re-verification
 * preserves previous decisions).
 */
export interface ICompanyVerification extends ITimestamps {
  id: string;
  company_id: string;
  submitted_by: string;
  reviewed_by: string | null;
  status: CompanyVerificationStatus;
  document_url: string | null;
  remarks: string | null;
  submitted_at: Date;
  reviewed_at: Date | null;
}

export interface ICompanyVerificationCreation {
  company_id: string;
  submitted_by: string;
  reviewed_by?: string | null;
  status?: CompanyVerificationStatus;
  document_url?: string | null;
  remarks?: string | null;
  submitted_at?: Date;
  reviewed_at?: Date | null;
}

/** Review input from an admin (approve/reject). */
export interface ICompanyVerificationReview {
  status: CompanyVerificationStatus; // VERIFIED or REJECTED
  reviewed_by: string;
  remarks?: string | null;
}
