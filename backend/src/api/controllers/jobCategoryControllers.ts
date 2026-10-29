import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { jobCategoryServices } from '../../services';
import { createCategorySchema, updateCategorySchema, categoryQuerySchema } from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/job-categories */
export const listCategories = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const { status } = categoryQuerySchema.parse(req.query);
  const categories = await jobCategoryServices.listCategories(status);
  return ok(res, { categories });
});

/** GET /api/job-categories/tree */
export const getCategoryTree = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const { status } = categoryQuerySchema.parse(req.query);
  const tree = await jobCategoryServices.getCategoryTree(status);
  return ok(res, { tree });
});

/** GET /api/job-categories/:id */
export const getCategory = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const category = await jobCategoryServices.getCategoryById(id);
  return ok(res, { category });
});

/** POST /api/job-categories */
export const createCategory = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = createCategorySchema.parse(req.body);
  const category = await jobCategoryServices.createCategory(input);
  return ok(res, { category }, 201);
});

/** PATCH /api/job-categories/:id */
export const updateCategory = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateCategorySchema.parse(req.body);
  const category = await jobCategoryServices.updateCategory(id, input);
  return ok(res, { category });
});

/** DELETE /api/job-categories/:id */
export const deleteCategory = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await jobCategoryServices.deleteCategory(id);
  return ok(res, { message: 'Job category deleted' });
});

export default {
  listCategories,
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
