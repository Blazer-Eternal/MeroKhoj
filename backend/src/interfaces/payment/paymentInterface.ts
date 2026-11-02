import { PaymentStatus } from '../../enums';
import { ITimestamps } from '../shared/commonInterface';

/**
 * A payment transaction (entity 35).
 *
 * Idempotency: `transaction_reference` is UNIQUE when present — repeated
 * provider callbacks resolve to the same row and re-processing a COMPLETED
 * payment is a no-op. Refunds are recorded as SEPARATE rows with status
 * REFUNDED whose `provider_response.refund_of` points at the original
 * transaction; the original payment is never deleted or overwritten.
 */
export interface IPayment extends ITimestamps {
  id: string;
  order_id: string;
  transaction_reference: string | null;
  provider: string;
  /** DECIMAL(12,2), > 0. */
  amount: number;
  currency: string;
  status: PaymentStatus;
  paid_at: Date | null;
  failure_reason: string | null;
  /** Sanitized gateway response (refund rows carry `refund_of`). */
  provider_response: Record<string, unknown> | null;
}

export interface IPaymentCreation {
  order_id: string;
  transaction_reference?: string | null;
  provider: string;
  amount: number;
  currency: string;
  status?: PaymentStatus;
  paid_at?: Date | null;
  failure_reason?: string | null;
  provider_response?: Record<string, unknown> | null;
}
