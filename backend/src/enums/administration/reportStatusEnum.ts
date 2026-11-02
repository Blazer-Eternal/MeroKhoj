/** Entity type a report can refer to. */
export enum ReportEntityType {
  USER = 'USER',
  COMPANY = 'COMPANY',
  JOB = 'JOB',
}

export const REPORT_ENTITY_TYPES: ReportEntityType[] = Object.values(ReportEntityType);

/** Lifecycle of a report. */
export enum ReportStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export const REPORT_STATUSES: ReportStatus[] = Object.values(ReportStatus);

/**
 * Allowed report status transitions. OPEN → UNDER_REVIEW → RESOLVED/DISMISSED,
 * with a direct OPEN → RESOLVED/DISMISSED shortcut for obvious cases.
 */
export const REPORT_STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  [ReportStatus.OPEN]: [ReportStatus.UNDER_REVIEW, ReportStatus.RESOLVED, ReportStatus.DISMISSED],
  [ReportStatus.UNDER_REVIEW]: [ReportStatus.RESOLVED, ReportStatus.DISMISSED],
  [ReportStatus.RESOLVED]: [],
  [ReportStatus.DISMISSED]: [],
};

/** Terminal report statuses (no further transitions). */
export const REPORT_TERMINAL_STATUSES: ReportStatus[] = [
  ReportStatus.RESOLVED,
  ReportStatus.DISMISSED,
];
