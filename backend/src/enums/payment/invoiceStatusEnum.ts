/**
 * Invoice lifecycle (entity 36).
 *
 * DRAFT   → manually created, not yet issued
 * ISSUED  → generated from a confirmed order, awaiting/unaware of payment
 * PAID    → payment confirmed (financial history retained)
 * VOID    → cancelled; row kept for history
 * OVERDUE → issued past its due date (lazy transition on read)
 */
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  VOID = 'VOID',
  OVERDUE = 'OVERDUE',
}

export const INVOICE_STATUSES: InvoiceStatus[] = Object.values(InvoiceStatus);

/** Allowed status transitions; enforced in the service layer. */
export const INVOICE_STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.ISSUED, InvoiceStatus.VOID],
  [InvoiceStatus.ISSUED]: [InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.VOID],
  [InvoiceStatus.OVERDUE]: [InvoiceStatus.PAID, InvoiceStatus.VOID],
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.VOID]: [],
};

/** Default payment window (days) applied when issuing an invoice. */
export const INVOICE_DUE_DAYS = 14;
