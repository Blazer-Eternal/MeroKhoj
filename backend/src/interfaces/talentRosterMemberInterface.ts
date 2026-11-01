import { ITimestamps } from './commonInterface';

/**
 * A jobseeker added to a company's talent roster.
 * Constraint: UNIQUE (roster_id, jobseeker_id) — no duplicate members.
 */
export interface ITalentRosterMember extends ITimestamps {
  id: string;
  roster_id: string;
  jobseeker_id: string;
  added_by: string;
  notes: string | null;
}

export interface ITalentRosterMemberCreation {
  roster_id: string;
  jobseeker_id: string;
  added_by: string;
  notes?: string | null;
}
