import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { industryServices } from '../../services';
import { createIndustrySchema, updateIndustrySchema, industryQuerySchema } from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/industries */
export const listIndustries = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const { status } = industryQuerySchema.parse(req.query);
  const industries = await industryServices.listIndustries(status);
  return ok(res, { industries });
});

/** GET /api/industries/:id */
export const getIndustry = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const industry = await industryServices.getIndustryById(id);
  return ok(res, { industry });
});

/** POST /api/industries */
export const createIndustry = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = createIndustrySchema.parse(req.body);
  const industry = await industryServices.createIndustry(input);
  return ok(res, { industry }, 201);
});

/** PATCH /api/industries/:id */
export const updateIndustry = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateIndustrySchema.parse(req.body);
  const industry = await industryServices.updateIndustry(id, input);
  return ok(res, { industry });
});

/** DELETE /api/industries/:id */
export const deleteIndustry = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await industryServices.deleteIndustry(id);
  return ok(res, { message: 'Industry deleted' });
});

export default { listIndustries, getIndustry, createIndustry, updateIndustry, deleteIndustry };
