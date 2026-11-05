import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { orderServices } from '../../../services';
import { createOrderSchema, listOrdersQuerySchema } from '../../../validators';
import { parseId } from '../../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/**
 * POST /api/orders (employer/admin).
 * Totals are computed SERVER-SIDE from the plan's current price — the
 * client only supplies company, plan, quantity and optional discount/tax.
 */
export const createOrder = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = createOrderSchema.parse(req.body);
  const order = await orderServices.createOrder(req.user!, {
    ...input,
    quantity: input.quantity ?? 1,
    discount_amount: input.discount_amount ?? 0,
    tax_amount: input.tax_amount ?? 0,
  });
  return ok(res, { order }, 201);
});

/** GET /api/orders — admins see all; employers see their companies'. */
export const listOrders = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = listOrdersQuerySchema.parse(req.query);
  const result = await orderServices.listOrders(req.user!, query);
  return res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

/** GET /api/orders/:id */
export const getOrder = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const order = await orderServices.getOrder(req.user!, id);
  return ok(res, { order });
});

/** POST /api/orders/:id/cancel — PENDING orders only (history is immutable). */
export const cancelOrder = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const order = await orderServices.cancelOrder(req.user!, id);
  return ok(res, { order });
});

export default { createOrder, listOrders, getOrder, cancelOrder };
