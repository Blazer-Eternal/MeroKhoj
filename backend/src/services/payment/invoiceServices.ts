import { AppError, getPaginationParams, IPaginationQuery, IPaginationMeta } from '../../utils';
import { IInvoice, IAuthUser } from '../../interfaces';
import {
  InvoiceStatus,
  INVOICE_STATUS_TRANSITIONS,
  INVOICE_DUE_DAYS,
} from '../../enums';
import { invoiceRepository, orderRepository, companyMemberRepository } from '../../repositories';
import { resolveCompanyForUser, isPlatformAdmin } from '../shared/accessControl';
import { recordAuditForUser } from '../administration/auditLogServices';

/**
 * Invoice business logic (entity 36).
 *
 * Workflow rule 4: invoices are generated FROM the order's financials
 * (snapshot) and their status syncs on payment (see paymentServices —
 * the completion path marks them PAID in the same transaction). History
 * is retained: invoices are voided, never deleted, and an order may hold
 * at most one non-VOID invoice.
 *
 * Workflow rule 5 support: reads lazily flip ISSUED → OVERDUE past the
 * due date so listings stay truthful without a cron job.
 */

const assertAdmin = (user: IAuthUser): void => {
  if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('Only admins can manage invoices');
  }
};

const today = (): string => new Date().toISOString().slice(0, 10);
const addDaysToDateOnly = (dateOnly: string, days: number): string => {
  const date = new Date(`${dateOnly}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** INV-YYYYMM-<random> (fits VARCHAR(50)). */
const generateInvoiceNumber = (): string => {
  const ym = new Date().toISOString().slice(0, 7).replace('-', '');
  return `INV-${ym}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

/**
 * Lazy lifecycle: an ISSUED invoice past its due date becomes OVERDUE on
 * read. Returns the (possibly updated) invoice.
 */
const applyLazyOverdue = async (invoice: IInvoice): Promise<IInvoice> => {
  if (invoice.status !== InvoiceStatus.ISSUED || !invoice.due_date) return invoice;
  const due = String(invoice.due_date).slice(0, 10);
  if (due >= today()) return invoice;

  const updated = await invoiceRepository.update(invoice.id, {
    status: InvoiceStatus.OVERDUE,
  });
  if (!updated) return invoice;

  await recordAuditForUser(undefined, {
    action: 'INVOICE_OVERDUE',
    entity_type: 'INVOICE',
    entity_id: invoice.id,
    old_values: { status: invoice.status },
    new_values: { status: updated.status, due_date: due },
  });
  return updated;
};

/** Load an invoice the user may see (its order's company or admin). */
const loadScopedInvoice = async (user: IAuthUser, id: string): Promise<IInvoice> => {
  const invoice = await invoiceRepository.findById(id);
  if (!invoice) throw AppError.notFound('Invoice not found');
  const order = (invoice as IInvoice & { order?: { company_id?: string } }).order;
  if (order?.company_id) {
    await resolveCompanyForUser(user, order.company_id);
  } else if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('You are not authorized to view this invoice');
  }
  return invoice;
};

/** List invoices — admins see everything, employers see their companies'. */
export const listInvoices = async (
  user: IAuthUser,
  query: IPaginationQuery & { status?: InvoiceStatus },
): Promise<{ data: IInvoice[]; meta: IPaginationMeta }> => {
  const pagination = getPaginationParams(query);
  const companyIds = isPlatformAdmin(user)
    ? undefined
    : await companyMemberRepository.listCompanyIdsByUser(user.id);
  const result = await invoiceRepository.list(query.status, companyIds, pagination);

  // Refresh overdue state for the returned page (lazy transition).
  const data = await Promise.all(result.data.map(applyLazyOverdue));
  return { data, meta: result.meta };
};

/** Get one invoice (lazy overdue applied). */
export const getInvoice = async (user: IAuthUser, id: string): Promise<IInvoice> => {
  const invoice = await loadScopedInvoice(user, id);
  return applyLazyOverdue(invoice);
};

/**
 * Manually create a DRAFT invoice for an order (admin). Totals are
 * snapshotted from the order — never recalculated from the plan.
 */
export const createDraft = async (
  user: IAuthUser,
  input: { order_id: string; issue_date?: string; due_date?: string | null },
): Promise<IInvoice> => {
  assertAdmin(user);
  const order = await orderRepository.findById(input.order_id);
  if (!order) throw AppError.notFound('Order not found');

  const active = await invoiceRepository.findActiveByOrder(order.id);
  if (active) {
    throw AppError.conflict(
      `Order already has invoice ${active.invoice_number} (status ${active.status})`,
    );
  }

  const issueDate = input.issue_date ?? today();
  let invoiceNumber = generateInvoiceNumber();
  for (let attempt = 0; attempt < 3; attempt++) {
    const clash = await invoiceRepository.findByInvoiceNumber(invoiceNumber);
    if (!clash) break;
    invoiceNumber = generateInvoiceNumber();
  }

  const invoice = await invoiceRepository.create({
    order_id: order.id,
    invoice_number: invoiceNumber,
    issue_date: issueDate,
    due_date: input.due_date ?? null,
    subtotal: order.subtotal,
    tax_amount: order.tax_amount,
    total_amount: order.total_amount,
    status: InvoiceStatus.DRAFT,
  });

  await recordAuditForUser(user, {
    action: 'INVOICE_CREATED',
    entity_type: 'INVOICE',
    entity_id: invoice.id,
    new_values: {
      invoice_number: invoice.invoice_number,
      order_number: order.order_number,
      total_amount: invoice.total_amount,
    },
  });

  return invoice;
};

/** Issue a DRAFT invoice (admin); fills a missing due date with +14 days. */
export const issueInvoice = async (user: IAuthUser, id: string): Promise<IInvoice> => {
  assertAdmin(user);
  const invoice = await invoiceRepository.findById(id);
  if (!invoice) throw AppError.notFound('Invoice not found');

  const allowed = INVOICE_STATUS_TRANSITIONS[invoice.status] ?? [];
  if (!allowed.includes(InvoiceStatus.ISSUED)) {
    throw AppError.conflict(`Cannot issue an invoice in status ${invoice.status}`);
  }

  const issueDate = String(invoice.issue_date).slice(0, 10);
  const dueDate = invoice.due_date
    ? String(invoice.due_date).slice(0, 10)
    : addDaysToDateOnly(issueDate, INVOICE_DUE_DAYS);

  const updated = await invoiceRepository.update(id, {
    status: InvoiceStatus.ISSUED,
    due_date: dueDate,
  });
  if (!updated) throw AppError.notFound('Invoice not found');

  await recordAuditForUser(user, {
    action: 'INVOICE_ISSUED',
    entity_type: 'INVOICE',
    entity_id: id,
    old_values: { status: invoice.status },
    new_values: { status: updated.status, due_date: dueDate },
  });

  return updated;
};

/** Void an unpaid invoice (admin). PAID invoices are immutable history. */
export const voidInvoice = async (user: IAuthUser, id: string): Promise<IInvoice> => {
  assertAdmin(user);
  const invoice = await invoiceRepository.findById(id);
  if (!invoice) throw AppError.notFound('Invoice not found');

  const allowed = INVOICE_STATUS_TRANSITIONS[invoice.status] ?? [];
  if (!allowed.includes(InvoiceStatus.VOID)) {
    throw AppError.conflict(
      invoice.status === InvoiceStatus.PAID
        ? 'Paid invoices cannot be voided — issue a refund instead'
        : `Cannot void an invoice in status ${invoice.status}`,
    );
  }

  const updated = await invoiceRepository.update(id, { status: InvoiceStatus.VOID });
  if (!updated) throw AppError.notFound('Invoice not found');

  await recordAuditForUser(user, {
    action: 'INVOICE_VOIDED',
    entity_type: 'INVOICE',
    entity_id: id,
    old_values: { status: invoice.status },
    new_values: { status: updated.status },
  });

  return updated;
};

export const invoiceServices = {
  listInvoices,
  getInvoice,
  createDraft,
  issueInvoice,
  voidInvoice,
};

export default invoiceServices;
