import { HiringDecisionOutcome } from '../enums';
import { ITimestamps } from './commonInterface';

/**
 * The hiring decision made for an application.
 *
 * Constraint: UNIQUE (application_id) — exactly one current decision per
 * application. The service writes the decision AND the resulting application
 * status change in a single transaction, plus an audit log entry. Historical
 * decisions are preserved via audit_logs.
 */
export interface IHiringDecision extends ITimestamps {
  id: string;
  application_id: string;
  decided_by: string;
  outcome: HiringDecisionOutcome;
  notes: string | null;
  decided_at: Date;
}

export interface IHiringDecisionCreation {
  application_id: string;
  decided_by: string;
  outcome: HiringDecisionOutcome;
  notes?: string | null;
  decided_at?: Date;
}
