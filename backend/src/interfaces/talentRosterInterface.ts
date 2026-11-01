import { ITimestamps } from './commonInterface';

/**
 * A company-owned shortlist of talent. All access is scoped to the owning
 * company's members (company isolation).
 */
export interface ITalentRoster extends ITimestamps {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_by: string;
}

export interface ITalentRosterCreation {
  company_id: string;
  name: string;
  description?: string | null;
  created_by: string;
}

export type ITalentRosterUpdate = Partial<Omit<ITalentRosterCreation, 'company_id' | 'created_by'>>;
