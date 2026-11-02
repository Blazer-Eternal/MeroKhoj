/** Lifecycle state of a user account. */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export const USER_STATUSES: UserStatus[] = Object.values(UserStatus);

/** Statuses that are allowed to authenticate. */
export const LOGIN_ALLOWED_STATUSES: UserStatus[] = [UserStatus.ACTIVE];
