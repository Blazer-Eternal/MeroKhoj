import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { companyVerificationServices } from '../../services';
import {
  submitVerificationSchema,
  reviewVerificationSchema,
} from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** POST /api/companies/:companyId/verifications */
export const submitVerification = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const input = submitVerificationSchema.parse(req.body);
  const verification = await companyVerificationServices.submitVerification(
    req.user!,
    companyId,
    input,
  );
  return ok(res, { verification }, 201);
});

/** GET /api/companies/:companyId/verifications */
export const listVerifications = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const verifications = await companyVerificationServices.listVerifications(
    req.user!,
    companyId,
  );
  return ok(res, { verifications });
});

/** GET /api/companies/:companyId/verifications/latest */
export const getLatestVerification = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const verification = await companyVerificationServices.getLatestVerification(companyId);
  return ok(res, { verification });
});

/** GET /api/admin/verifications/pending */
export const listPendingVerifications = asyncHandler(async (_req: ICustomRequest, res: Response) => {
  const verifications = await companyVerificationServices.listPendingVerifications();
  return ok(res, { verifications });
});

/** PATCH /api/admin/verifications/:id/review */
export const reviewVerification = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const review = reviewVerificationSchema.parse(req.body);
  const verification = await companyVerificationServices.reviewVerification(req.user!, id, {
    ...review,
    reviewed_by: req.user!.id,
  });
  return ok(res, { verification });
});

export default {
  submitVerification,
  listVerifications,
  getLatestVerification,
  listPendingVerifications,
  reviewVerification,
};
