import { z } from 'zod';

/**
 * Audit log query validators. Audit entries are immutable, so there are no
 * create/update schemas — entries are written by services via recordAudit().
 */
export const auditLogQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  action: z.string().trim().max(100).optional(),
  entity_type: z.string().trim().max(100).optional(),
  entity_id: z.string().uuid().optional(),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
