/** How an application originated (attribution for analytics). */
export enum ApplicationSource {
  DIRECT = 'DIRECT',
  SEARCH = 'SEARCH',
  RECOMMENDATION = 'RECOMMENDATION',
  REFERRAL = 'REFERRAL',
  JOB_ALERT = 'JOB_ALERT',
  TALENT_POOL = 'TALENT_POOL',
}

export const APPLICATION_SOURCES: ApplicationSource[] = Object.values(ApplicationSource);
