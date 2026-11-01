/** Frequency at which a job alert is evaluated for matching jobs. */
export enum JobAlertFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  INSTANT = 'INSTANT',
}

export const JOB_ALERT_FREQUENCIES: JobAlertFrequency[] = Object.values(JobAlertFrequency);
