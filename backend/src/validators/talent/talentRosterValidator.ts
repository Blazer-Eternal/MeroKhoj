import { z } from 'zod';

/** Talent roster validators. Company scoping happens in the service layer. */
export const createRosterSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const updateRosterSchema = createRosterSchema.partial();

export const addRosterMemberSchema = z.object({
  jobseeker_id: z.string().uuid(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateRosterMemberSchema = z.object({
  notes: z.string().trim().max(2000).nullable(),
});

export type CreateRosterInput = z.infer<typeof createRosterSchema>;
export type UpdateRosterInput = z.infer<typeof updateRosterSchema>;
export type AddRosterMemberInput = z.infer<typeof addRosterMemberSchema>;
export type UpdateRosterMemberInput = z.infer<typeof updateRosterMemberSchema>;
