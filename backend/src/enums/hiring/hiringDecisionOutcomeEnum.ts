import { ApplicationStatus } from '../application/applicationStatusEnum';

/** Outcome of a hiring decision on an application. */
export enum HiringDecisionOutcome {
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  ON_HOLD = 'ON_HOLD',
  SHORTLISTED = 'SHORTLISTED',
}

export const HIRING_DECISION_OUTCOMES: HiringDecisionOutcome[] = Object.values(
  HiringDecisionOutcome,
);

/**
 * Application status each decision drives the application toward, keeping the
 * decision and the pipeline consistent (enforced in the service, one txn).
 *
 * NOTE: ON_HOLD has no dedicated pipeline stage, so the application is moved
 * back to UNDER_REVIEW where it stays visible to the hiring team.
 */
export const DECISION_APPLICATION_STATUS: Record<HiringDecisionOutcome, ApplicationStatus> = {
  [HiringDecisionOutcome.HIRED]: ApplicationStatus.HIRED,
  [HiringDecisionOutcome.REJECTED]: ApplicationStatus.REJECTED,
  [HiringDecisionOutcome.ON_HOLD]: ApplicationStatus.UNDER_REVIEW,
  [HiringDecisionOutcome.SHORTLISTED]: ApplicationStatus.SHORTLISTED,
};
