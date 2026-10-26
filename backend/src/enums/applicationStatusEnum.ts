/**
 * Recruitment pipeline stages.
 *
 * The happy path is:
 *   APPLIED → UNDER_REVIEW → SHORTLISTED → INTERVIEW → SELECTED → HIRED
 *
 * Terminal outcomes: HIRED, REJECTED, WITHDRAWN.
 */
export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  SELECTED = 'SELECTED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export const APPLICATION_STATUSES: ApplicationStatus[] = Object.values(ApplicationStatus);

/** Statuses from which no further forward progress is possible. */
export const APPLICATION_TERMINAL_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
];

/** Statuses that still require employer action. */
export const APPLICATION_ACTIVE_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.UNDER_REVIEW,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.SELECTED,
];

/**
 * Allowed application status transitions.
 *
 * - The happy path advances forward one stage at a time.
 * - From any *active* stage the employer may REJECT the candidate.
 * - Only the candidate (jobseeker) may move an application to WITHDRAWN,
 *   and only while it is still active.
 * - SELECTED → HIRED records the final hiring decision.
 */
export const APPLICATION_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.APPLIED]: [
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.UNDER_REVIEW]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.INTERVIEW]: [
    ApplicationStatus.SELECTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.SELECTED]: [
    ApplicationStatus.HIRED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  // Terminal states — no further transitions.
  [ApplicationStatus.HIRED]: [],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};

/** Statuses the *candidate* is allowed to set (withdrawal only). */
export const APPLICATION_CANDIDATE_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.APPLIED]: [ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.UNDER_REVIEW]: [ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.SHORTLISTED]: [ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.INTERVIEW]: [ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.SELECTED]: [ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.HIRED]: [],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};
