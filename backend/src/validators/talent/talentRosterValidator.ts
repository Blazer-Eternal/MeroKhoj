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

/** GET /api/companies/:companyId/candidates — talent-pool search. */
export const candidateSearchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  /** Comma-separated skill names; a candidate must hold ALL of them. */
  skills: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
  min_experience: z.coerce.number().min(0).max(50).optional(),
  sort: z.enum(['relevance', 'experience', 'recent']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateRosterInput = z.infer<typeof createRosterSchema>;
export type UpdateRosterInput = z.infer<typeof updateRosterSchema>;
export type AddRosterMemberInput = z.infer<typeof addRosterMemberSchema>;
export type UpdateRosterMemberInput = z.infer<typeof updateRosterMemberSchema>;
export type CandidateSearchQuery = z.infer<typeof candidateSearchQuerySchema>;
