import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { servicePlanServices } from '../../../services';
import {
  createServicePlanSchema,
  updateServicePlanSchema,
  listServicePlansQuerySchema,
} from '../../../validators';
import { parseId } from '../../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/**
 * GET /api/service-plans — public catalog (ACTIVE only for anonymous
 * callers; admins see the full catalog with an optional status filter).
 */
export const listPlans = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = listServicePlansQuerySchema.parse(req.query);
  const result = await servicePlanServices.listPlans(req.user, query);
  return res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

/** GET /api/service-plans/:id */
export const getPlan = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const plan = await servicePlanServices.getPlan(req.user, id);
  return ok(res, { plan });
});

/** POST /api/service-plans (admin). */
export const createPlan = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = createServicePlanSchema.parse(req.body);
  const plan = await servicePlanServices.createPlan(req.user!, input);
  return ok(res, { plan }, 201);
});

/** PATCH /api/service-plans/:id (admin) — price edits affect FUTURE orders only. */
export const updatePlan = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateServicePlanSchema.parse(req.body);
  const plan = await servicePlanServices.updatePlan(req.user!, id, input);
  return ok(res, { plan });
});

/** DELETE /api/service-plans/:id (admin) — 409 when orders reference it. */
export const deletePlan = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await servicePlanServices.deletePlan(req.user!, id);
  return ok(res, { message: 'Service plan deleted' });
});

export default { listPlans, getPlan, createPlan, updatePlan, deletePlan };
