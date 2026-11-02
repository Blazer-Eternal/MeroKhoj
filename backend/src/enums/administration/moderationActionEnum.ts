/** Moderation action taken on a job by a moderator/admin. */
export enum ModerationAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
  REMOVED = 'REMOVED',
}

export const MODERATION_ACTIONS: ModerationAction[] = Object.values(ModerationAction);

/**
 * Job status each moderation action drives the job toward. This keeps the
 * moderation outcome consistent with the job's lifecycle status.
 */
export const MODERATION_JOB_STATUS: Record<ModerationAction, string> = {
  [ModerationAction.APPROVED]: 'PUBLISHED',
  [ModerationAction.REJECTED]: 'CANCELLED',
  [ModerationAction.FLAGGED]: 'PAUSED',
  [ModerationAction.REMOVED]: 'CLOSED',
};

/** Moderation actions that require a reason (rejection/removal). */
export const MODERATION_ACTIONS_REQUIRING_REASON: ModerationAction[] = [
  ModerationAction.REJECTED,
  ModerationAction.REMOVED,
];
