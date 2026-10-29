import { z } from 'zod';
import { ModerationAction, MODERATION_ACTIONS_REQUIRING_REASON } from '../enums';

/**
 * Job moderation validators. Rejections/removals must carry a reason — checked
 * here (shape) and in the service (context).
 */
export const moderateJobSchema = z
  .object({
    action: z.nativeEnum(ModerationAction),
    reason: z.string().trim().min(1).max(2000).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (MODERATION_ACTIONS_REQUIRING_REASON.includes(value.action) && !value.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: `A reason is required for the ${value.action} action`,
      });
    }
  });

export type ModerateJobInput = z.infer<typeof moderateJobSchema>;
