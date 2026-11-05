import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { invoiceServices } from '../../../services';
import { createInvoiceSchema, listInvoicesQuerySchema } from '../../../validators';
import { parseId } from '../../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/invoices — admins see all; employers see their companies'. */
export const listInvoices = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = listInvoicesQuerySchema.parse(req.query);
  const result = await invoiceServices.listInvoices(req.user!, query);
  return res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

/** GET /api/invoices/:id (applies the lazy ISSUED → OVERDUE transition). */
export const getInvoice = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const invoice = await invoiceServices.getInvoice(req.user!, id);
  return ok(res, { invoice });
});

/** POST /api/invoices (admin) — manual DRAFT, totals snapshotted from the order. */
export const createInvoice = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = createInvoiceSchema.parse(req.body);
  const invoice = await invoiceServices.createDraft(req.user!, input);
  return ok(res, { invoice }, 201);
});

/** POST /api/invoices/:id/issue (admin) — DRAFT → ISSUED (+14-day due default). */
export const issueInvoice = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const invoice = await invoiceServices.issueInvoice(req.user!, id);
  return ok(res, { invoice });
});

/** POST /api/invoices/:id/void (admin) — unpaid invoices only (history kept). */
export const voidInvoice = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const invoice = await invoiceServices.voidInvoice(req.user!, id);
  return ok(res, { invoice });
});

export default { listInvoices, getInvoice, createInvoice, issueInvoice, voidInvoice };
