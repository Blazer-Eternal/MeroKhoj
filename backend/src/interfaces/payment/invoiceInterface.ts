import { InvoiceStatus } from '../../enums';
import { ITimestamps } from '../shared/commonInterface';

/**
 * An invoice generated from an order (entity 36).
 *
 * Snapshot: subtotal / tax_amount / total_amount are copied from the ORDER
 * at generation time — the invoice is never recalculated from the plan's
 * current price. Status mirrors payment: PAID once the order's payment is
 * confirmed; lazily OVERDUE when past due and still ISSUED.
 */
export interface IInvoice extends ITimestamps {
  id: string;
  order_id: string;
  invoice_number: string;
  /** DATE — issue date (YYYY-MM-DD). */
  issue_date: Date | string;
  /** DATE — must be >= issue_date; NULL means no payment window. */
  due_date: Date | string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
}

export interface IInvoiceCreation {
  order_id: string;
  invoice_number: string;
  issue_date: Date | string;
  due_date?: Date | string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status?: InvoiceStatus;
}
