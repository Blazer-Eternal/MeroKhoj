import { z } from 'zod';

/** Saved-job validators. The job id comes from the route. */
export const saveJobSchema = z.object({
  job_id: z.string().uuid(),
});

export type SaveJobInput = z.infer<typeof saveJobSchema>;
