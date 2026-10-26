/** Scheduling / attendance state of an interview. */
export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
  NO_SHOW = 'NO_SHOW',
}

export const INTERVIEW_STATUSES: InterviewStatus[] = Object.values(InterviewStatus);

/**
 * Allowed interview status transitions.
 *
 * Important rule from the spec: cancelling an interview must NOT automatically
 * reject the application. Interview state is independent of application state.
 */
export const INTERVIEW_STATUS_TRANSITIONS: Record<InterviewStatus, InterviewStatus[]> = {
  [InterviewStatus.SCHEDULED]: [
    InterviewStatus.CONFIRMED,
    InterviewStatus.CANCELLED,
    InterviewStatus.RESCHEDULED,
  ],
  [InterviewStatus.CONFIRMED]: [
    InterviewStatus.COMPLETED,
    InterviewStatus.CANCELLED,
    InterviewStatus.RESCHEDULED,
    InterviewStatus.NO_SHOW,
  ],
  [InterviewStatus.COMPLETED]: [],
  [InterviewStatus.CANCELLED]: [InterviewStatus.RESCHEDULED],
  [InterviewStatus.RESCHEDULED]: [
    InterviewStatus.CONFIRMED,
    InterviewStatus.CANCELLED,
  ],
  [InterviewStatus.NO_SHOW]: [InterviewStatus.RESCHEDULED],
};

/** Interview statuses considered "upcoming" for dashboards / reminders. */
export const INTERVIEW_UPCOMING_STATUSES: InterviewStatus[] = [
  InterviewStatus.SCHEDULED,
  InterviewStatus.CONFIRMED,
];
