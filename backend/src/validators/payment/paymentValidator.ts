import { z } from 'zod';
import { PaymentStatus } from '../../enums';

/** Payment validators (entity 35). */

/** Starting a payment: the AMOUNT is never accepted from the client. */
export const initiatePaymentSchema = z.object({
  provider: z.string().trim().min(1).max(50).optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

/**
 * Provider webhook body. The amount/status/reference triple is what the
 * HMAC signature covers (canonical `reference|status|amount`).
 */
export const paymentWebhookSchema = z.object({
  transaction_reference: z.string().trim().min(1).max(255),
  status: z.nativeEnum(PaymentStatus),
  // Decimal as sent by the provider (string or number).
  amount: z.union([z.string().min(1), z.number()]),
  failure_reason: z.string().trim().max(2000).optional().nullable(),
});

export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;

export const refundPaymentSchema = z.object({
  reason: z.string().trim().max(1000).optional().nullable(),
});

export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  provider: z.string().trim().min(1).max(50).optional(),
});

export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
