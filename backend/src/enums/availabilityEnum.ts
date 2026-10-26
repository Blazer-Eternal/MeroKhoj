/** How soon a candidate can start. */
export enum Availability {
  IMMEDIATE = 'IMMEDIATE',
  NOTICE_PERIOD = 'NOTICE_PERIOD',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export const AVAILABILITIES: Availability[] = Object.values(Availability);
