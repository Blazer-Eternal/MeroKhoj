import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { paymentServices } from '../../../services';
import {
  initiatePaymentSchema,
  paymentWebhookSchema,
  refundPaymentSchema,
  listPaymentsQuerySchema,
} from '../../../validators';
import { parseId } from '../../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** First `x-signature` header value (Express gives string | string[]). */
const signatureFrom = (req: ICustomRequest): string | undefined => {
  const raw = req.headers['x-signature'];
  return Array.isArray(raw) ? raw[0] : raw;
};

/**
 * POST /api/orders/:id/payments (company management).
 * Creates/reuses the PENDING payment for the order — amount is the
 * ORDER's total (server-side), never a client-supplied value.
 */
export const initiatePayment = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const orderId = parseId(req.params.id);
  const input = initiatePaymentSchema.parse(req.body ?? {});
  const payment = await paymentServices.initiatePayment(req.user!, orderId, {
    provider: input.provider ?? 'manual',
  });
  return ok(res, { payment }, 201);
});

/** GET /api/orders/:id/payments — the order's transaction history. */
export const listOrderPayments = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const orderId = parseId(req.params.id);
  const payments = await paymentServices.listOrderPayments(req.user!, orderId);
  return ok(res, { payments });
});

/** GET /api/payments — admins see all; employers see their companies'. */
export const listPayments = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = listPaymentsQuerySchema.parse(req.query);
  const result = await paymentServices.listPayments(req.user!, query);
  return res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

/** GET /api/payments/:id */
export const getPayment = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const payment = await paymentServices.getPayment(req.user!, id);
  return ok(res, { payment });
});

/**
 * POST /api/payments/webhook — UNAUTHENTICATED provider callback.
 * Trust is established by the HMAC-SHA256 signature over
 * `transaction_reference|status|amount` (x-signature header):
 * 503 when unconfigured (fail closed), 401 on a bad signature.
 * Callbacks are idempotent — replays report `idempotent: true`.
 */
export const handleWebhook = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = paymentWebhookSchema.parse(req.body);
  const result = await paymentServices.handleWebhook(input, signatureFrom(req));
  return ok(res, { idempotent: result.idempotent, payment: result.payment });
});

/** POST /api/payments/:id/confirm (admin) — shares the webhook completion path. */
export const confirmPayment = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const payment = await paymentServices.confirmPayment(req.user!, id);
  return ok(res, { payment });
});

/**
 * POST /api/payments/:id/refund (admin).
 * Records a SEPARATE linked refund transaction — the original payment
 * row is never modified (workflow rule 6).
 */
export const refundPayment = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = refundPaymentSchema.parse(req.body ?? {});
  const refund = await paymentServices.refundPayment(req.user!, id, {
    reason: input.reason ?? null,
  });
  return ok(res, { refund }, 201);
});

export default {
  initiatePayment,
  listOrderPayments,
  listPayments,
  getPayment,
  handleWebhook,
  confirmPayment,
  refundPayment,
};
