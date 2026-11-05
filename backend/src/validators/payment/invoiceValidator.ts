import { z } from 'zod';
import { InvoiceStatus } from '../../enums';

/** Invoice validators (entity 36). */

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

/** Manual DRAFT creation — totals always come from the order (server-side). */
export const createInvoiceSchema = z
  .object({
    order_id: z.string().uuid(),
    issue_date: dateOnly.optional(),
    due_date: dateOnly.optional().nullable(),
  })
  .refine(
    (data) =>
      !data.issue_date || !data.due_date || data.due_date >= data.issue_date,
    { message: 'due_date must be on or after issue_date', path: ['due_date'] },
  );

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
});

export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
