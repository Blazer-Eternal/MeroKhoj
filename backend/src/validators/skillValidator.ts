import { z } from 'zod';
import { SkillStatus } from '../enums';

export const createSkillSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.nativeEnum(SkillStatus).optional(),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
