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
 */
export const DECISION_APPLICATION_STATUS: Record<HiringDecisionOutcome, string> = {
  [HiringDecisionOutcome.HIRED]: 'HIRED',
  [HiringDecisionOutcome.REJECTED]: 'REJECTED',
  [HiringDecisionOutcome.ON_HOLD]: 'ON_HOLD',
  [HiringDecisionOutcome.SHORTLISTED]: 'SHORTLISTED',
};
