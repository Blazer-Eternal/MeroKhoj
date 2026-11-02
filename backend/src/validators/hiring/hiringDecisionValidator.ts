import { z } from 'zod';
import { HiringDecisionOutcome } from '../../enums';

/** Hiring decision validators. */
export const makeDecisionSchema = z.object({
  outcome: z.nativeEnum(HiringDecisionOutcome),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export type MakeDecisionInput = z.infer<typeof makeDecisionSchema>;
