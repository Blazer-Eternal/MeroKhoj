/**
 * Payment transaction lifecycle (entity 35).
 *
 * PENDING    → initiated, awaiting provider confirmation
 * PROCESSING → provider acknowledged, final result pending
 * COMPLETED  → captured (terminal; refunds are separate linked transactions)
 * FAILED     → provider declined (terminal; a new payment may be initiated)
 * REFUNDED   → this row IS a refund transaction linked to a completed payment
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export const PAYMENT_STATUSES: PaymentStatus[] = Object.values(PaymentStatus);

/** Allowed status transitions; enforced in the service layer. */
export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
  ],
  [PaymentStatus.PROCESSING]: [PaymentStatus.COMPLETED, PaymentStatus.FAILED],
  [PaymentStatus.COMPLETED]: [],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.REFUNDED]: [],
};
