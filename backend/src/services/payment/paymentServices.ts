import { createHmac, timingSafeEqual } from 'crypto';
import {
  AppError,
  getPaginationParams,
  IPaginationQuery,
  IPaginationMeta,
} from '../../utils';
import { env, getSequelize } from '../../config';
import { IPayment, IAuthUser, IOrder } from '../../interfaces';
import {
  PaymentStatus,
  OrderStatus,
  InvoiceStatus,
  PAYMENT_STATUS_TRANSITIONS,
  PAYMENT_STATUSES,
  INVOICE_DUE_DAYS,
  NotificationType,
} from '../../enums';
import {
  paymentRepository,
  orderRepository,
  invoiceRepository,
  companyMemberRepository,
} from '../../repositories';
import { assertCanManageCompany, resolveCompanyForUser, isPlatformAdmin } from '../shared/accessControl';
import { recordAuditForUser } from '../administration/auditLogServices';
import { notify } from '../notification/notificationServices';

/**
 * Payment business logic (entity 35).
 *
 * Workflow rule 3: provider confirmations are verified BACKEND-side —
 * every webhook carries an HMAC-SHA256 signature over the canonical
 * `transaction_reference|status|amount` string, checked with a timing-safe
 * compare. Callbacks are idempotent: replaying a final state is a 200
 * no-op, and a conflicting state change is a 409.
 *
 * Workflow rule 6: refunds are recorded as a SEPARATE linked payment row
 * (status REFUNDED, provider_response.refund_of) — the original payment
 * is never deleted or overwritten.
 */

/** HMAC-SHA256 hex digest over the canonical webhook string. */
const sign = (canonical: string, secret: string): string =>
  createHmac('sha256', secret).update(canonical).digest('hex');

/** Timing-safe signature comparison (empty secret never matches). */
export const verifyWebhookSignature = (canonical: string, signature: string): boolean => {
  const secret = env.payment.webhookSecret;
  if (!secret) return false;
  const expected = Buffer.from(sign(canonical, secret), 'utf8');
  const provided = Buffer.from(signature, 'utf8');
  return expected.length === provided.length && timingSafeEqual(expected, provided);
};

/** Build the canonical string a provider must sign. */
export const buildWebhookCanonical = (input: {
  transaction_reference: string;
  status: string;
  amount: string | number;
}): string => `${input.transaction_reference}|${input.status}|${input.amount}`;

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

/** INV-YYYYMM-<random> (fits VARCHAR(50)). */
const generateInvoiceNumber = (): string => {
  const ym = new Date().toISOString().slice(0, 7).replace('-', '');
  return `INV-${ym}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

/**
 * Initiate a payment for a PENDING order. The row is created with the
 * ORDER's total (server-side — the client never supplies the amount) and
 * a local transaction reference the provider callbacks will match on.
 */
export const initiatePayment = async (
  user: IAuthUser,
  orderId: string,
  input: { provider: string },
): Promise<IPayment> => {
  const order = await orderRepository.findById(orderId);
  if (!order) throw AppError.notFound('Order not found');
  await assertCanManageCompany(user, order.company_id);

  if (order.status !== OrderStatus.PENDING) {
    throw AppError.conflict(`Order is ${order.status} and cannot accept new payments`);
  }

  // One outstanding payment per order: reuse it (idempotent initiate).
  const outstanding = (await paymentRepository.listByOrder(orderId)).find(
    (payment) =>
      payment.status === PaymentStatus.PENDING ||
      payment.status === PaymentStatus.PROCESSING,
  );
  if (outstanding) return outstanding;

  const reference = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const payment = await paymentRepository.create({
    order_id: orderId,
    transaction_reference: reference,
    provider: input.provider,
    amount: order.total_amount,
    currency: order.currency,
    status: PaymentStatus.PENDING,
  });

  await notify(
    order.created_by,
    NotificationType.PAYMENT_UPDATE,
    'Payment initiated',
    `We are processing your payment for order ${order.order_number}.`,
    { order_id: order.id, order_number: order.order_number, payment_id: payment.id },
  );
  await recordAuditForUser(user, {
    action: 'PAYMENT_INITIATED',
    entity_type: 'PAYMENT',
    entity_id: payment.id,
    new_values: {
      order_number: order.order_number,
      amount: payment.amount,
      provider: payment.provider,
    },
  });

  return payment;
};

/**
 * THE completion path — shared by webhook callbacks and the admin
 * confirm endpoint. Runs in ONE transaction: payment → COMPLETED,
 * order PENDING → CONFIRMED, invoice generated (snapshot) → PAID.
 * Notification + audit land after commit (best-effort).
 */
const completePayment = async (
  paymentId: string,
  actor: IAuthUser | undefined,
  transactionReference?: string,
): Promise<IPayment> => {
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) throw AppError.notFound('Payment not found');
  if (payment.status === PaymentStatus.COMPLETED) return payment; // idempotent

  const order = await orderRepository.findById(payment.order_id);
  if (!order) throw AppError.notFound('Order not found');
  if (order.status === OrderStatus.CANCELLED) {
    throw AppError.conflict('Order is cancelled — payment cannot be confirmed');
  }

  const sequelize = getSequelize();
  const t = await sequelize.transaction();

  try {
    const now = new Date();
    const completed = await paymentRepository.update(
      paymentId,
      {
        status: PaymentStatus.COMPLETED,
        paid_at: now,
        ...(transactionReference ? { transaction_reference: transactionReference } : {}),
      },
      { transaction: t },
    );
    if (!completed) throw AppError.internal('Failed to update payment');

    // Entitlements become active with the order.
    if (order.status === OrderStatus.PENDING) {
      await orderRepository.setStatus(order.id, OrderStatus.CONFIRMED, { transaction: t });
    }

    // Invoice from the ORDER's snapshot (never the plan's current price).
    const existingInvoice = await invoiceRepository.findActiveByOrder(order.id);
    if (!existingInvoice) {
      await invoiceRepository.create(
        {
          order_id: order.id,
          invoice_number: generateInvoiceNumber(),
          issue_date: toDateOnly(now),
          due_date: toDateOnly(addDays(now, INVOICE_DUE_DAYS)),
          subtotal: order.subtotal,
          tax_amount: order.tax_amount,
          total_amount: order.total_amount,
          status: InvoiceStatus.ISSUED,
        },
        { transaction: t },
      );
    }
    // Status syncs on payment: ISSUED/OVERDUE/DRAFT → PAID.
    await invoiceRepository.markPaidByOrder(order.id, { transaction: t });

    await t.commit();

    await notify(
      order.created_by,
      NotificationType.PAYMENT_UPDATE,
      'Payment confirmed',
      `Your payment for order ${order.order_number} was confirmed.`,
      { order_id: order.id, order_number: order.order_number, payment_id: paymentId },
    );
    await recordAuditForUser(actor, {
      action: 'PAYMENT_COMPLETED',
      entity_type: 'PAYMENT',
      entity_id: paymentId,
      new_values: {
        order_number: order.order_number,
        amount: completed.amount,
        transaction_reference: completed.transaction_reference,
      },
    });

    return completed;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/** Webhook payload accepted from a payment provider. */
export interface IPaymentWebhookInput {
  transaction_reference: string;
  status: PaymentStatus;
  amount: string | number;
  failure_reason?: string | null;
}

/** Statuses a provider callback may report. */
const WEBHOOK_STATUSES: PaymentStatus[] = [
  PaymentStatus.PROCESSING,
  PaymentStatus.COMPLETED,
  PaymentStatus.FAILED,
];

/**
 * Handle a signed provider callback. Order of operations:
 * fail closed (503) when unconfigured → verify HMAC (401) → resolve the
 * payment by reference (404) → verify amount server-side (409) →
 * idempotent final-state check (200 no-op / 409 conflict) → transition.
 */
export const handleWebhook = async (
  input: IPaymentWebhookInput,
  signature: string | undefined,
): Promise<{ idempotent: boolean; payment: IPayment }> => {
  if (!env.payment.webhookSecret) {
    throw new AppError(
      'Payment webhook is not configured (PAYMENT_WEBHOOK_SECRET)',
      503,
      'WEBHOOK_NOT_CONFIGURED',
    );
  }
  if (!signature) throw AppError.unauthorized('Missing webhook signature');
  if (!WEBHOOK_STATUSES.includes(input.status)) {
    throw AppError.badRequest(`Unsupported webhook status: ${input.status}`);
  }

  const canonical = buildWebhookCanonical(input);
  if (!verifyWebhookSignature(canonical, signature)) {
    throw AppError.unauthorized('Invalid webhook signature');
  }

  const payment = await paymentRepository.findByTransactionReference(
    input.transaction_reference,
  );
  if (!payment) {
    throw AppError.notFound('No payment matches this transaction reference');
  }

  // Backend-side amount verification — never trust the payload alone.
  if (Number(input.amount) !== Number(payment.amount)) {
    throw AppError.conflict('Webhook amount does not match the payment amount');
  }

  // Already final? Replay of the same state is a no-op; anything else 409.
  if (PAYMENT_STATUSES.includes(payment.status) && !PAYMENT_STATUS_TRANSITIONS[payment.status].length) {
    if (payment.status === input.status) {
      return { idempotent: true, payment };
    }
    throw AppError.conflict(
      `Payment already ${payment.status}; cannot move to ${input.status}`,
    );
  }

  const allowed = PAYMENT_STATUS_TRANSITIONS[payment.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw AppError.conflict(`Cannot move payment from ${payment.status} to ${input.status}`);
  }

  if (input.status === PaymentStatus.COMPLETED) {
    const completed = await completePayment(payment.id, undefined, input.transaction_reference);
    return { idempotent: false, payment: completed };
  }

  // PROCESSING / FAILED — record the provider's verdict.
  const updated = await paymentRepository.update(payment.id, {
    status: input.status,
    ...(input.status === PaymentStatus.FAILED
      ? { failure_reason: input.failure_reason ?? 'Provider reported a failure' }
      : {}),
  });
  if (!updated) throw AppError.internal('Failed to update payment');

  if (input.status === PaymentStatus.FAILED) {
    const order = await orderRepository.findById(payment.order_id);
    if (order) {
      await notify(
        order.created_by,
        NotificationType.PAYMENT_UPDATE,
        'Payment failed',
        `Your payment for order ${order.order_number} failed: ${updated.failure_reason}`,
        { order_id: order.id, order_number: order.order_number, payment_id: payment.id },
      );
      await recordAuditForUser(undefined, {
        action: 'PAYMENT_FAILED',
        entity_type: 'PAYMENT',
        entity_id: payment.id,
        new_values: { order_number: order.order_number, reason: updated.failure_reason },
      });
    }
  }

  return { idempotent: false, payment: updated };
};

/** Admin manual confirmation — shares the exact webhook completion path. */
export const confirmPayment = async (
  user: IAuthUser,
  paymentId: string,
): Promise<IPayment> => {
  if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('Only admins can confirm payments');
  }
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) throw AppError.notFound('Payment not found');
  if (payment.status === PaymentStatus.COMPLETED) return payment; // idempotent

  const allowed = PAYMENT_STATUS_TRANSITIONS[payment.status] ?? [];
  if (!allowed.includes(PaymentStatus.COMPLETED)) {
    throw AppError.conflict(`Payment in status ${payment.status} cannot be confirmed`);
  }

  return completePayment(paymentId, user);
};

/**
 * Refund = a NEW linked payment row (status REFUNDED, generated RFND-
 * reference, provider_response.refund_of → original). The original
 * payment row is untouched; double refunds are rejected (409).
 */
export const refundPayment = async (
  user: IAuthUser,
  paymentId: string,
  input: { reason?: string | null },
): Promise<IPayment> => {
  if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('Only admins can refund payments');
  }
  const original = await paymentRepository.findById(paymentId);
  if (!original) throw AppError.notFound('Payment not found');
  if (original.status !== PaymentStatus.COMPLETED) {
    throw AppError.conflict('Only completed payments can be refunded');
  }

  const existingRefunds = await paymentRepository.listRefundsFor(paymentId);
  if (existingRefunds.length > 0) {
    throw AppError.conflict('Payment has already been refunded');
  }

  const order = await orderRepository.findById(original.order_id);
  if (!order) throw AppError.notFound('Order not found');

  const refund = await paymentRepository.create({
    order_id: original.order_id,
    transaction_reference: `RFND-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`,
    provider: original.provider,
    amount: original.amount,
    currency: original.currency,
    status: PaymentStatus.REFUNDED,
    paid_at: new Date(),
    provider_response: { refund_of: original.id, reason: input.reason ?? null },
  });

  await notify(
    order.created_by,
    NotificationType.PAYMENT_UPDATE,
    'Payment refunded',
    `Your payment for order ${order.order_number} was refunded.`,
    { order_id: order.id, order_number: order.order_number, refund_id: refund.id },
  );
  await recordAuditForUser(user, {
    action: 'PAYMENT_REFUNDED',
    entity_type: 'PAYMENT',
    entity_id: refund.id,
    new_values: {
      refund_of: original.id,
      order_number: order.order_number,
      amount: refund.amount,
      reason: input.reason ?? null,
    },
  });

  return refund;
};

/** List payments — admins see everything, employers see their companies'. */
export const listPayments = async (
  user: IAuthUser,
  query: IPaginationQuery & { status?: PaymentStatus; provider?: string },
): Promise<{ data: IPayment[]; meta: IPaginationMeta }> => {
  const pagination = getPaginationParams(query);
  const companyIds = isPlatformAdmin(user)
    ? undefined
    : await companyMemberRepository.listCompanyIdsByUser(user.id);
  return paymentRepository.list(query.status, query.provider, companyIds, pagination);
};

/** Load a payment the user is allowed to see (its order's company or admin). */
export const getPayment = async (user: IAuthUser, id: string): Promise<IPayment> => {
  const payment = await paymentRepository.findById(id);
  if (!payment) throw AppError.notFound('Payment not found');
  const order: IOrder | null = await orderRepository.findById(payment.order_id);
  if (!order) throw AppError.notFound('Order not found');
  await resolveCompanyForUser(user, order.company_id);
  return payment;
};

/** All payments recorded against an order (read, scoped by getOrder). */
export const listOrderPayments = async (
  user: IAuthUser,
  orderId: string,
): Promise<IPayment[]> => {
  const order = await orderRepository.findById(orderId);
  if (!order) throw AppError.notFound('Order not found');
  await resolveCompanyForUser(user, order.company_id);
  return paymentRepository.listByOrder(orderId);
};

export const paymentServices = {
  initiatePayment,
  handleWebhook,
  confirmPayment,
  refundPayment,
  listPayments,
  getPayment,
  listOrderPayments,
  verifyWebhookSignature,
  buildWebhookCanonical,
};

export default paymentServices;
