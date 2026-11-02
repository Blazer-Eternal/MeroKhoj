import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { hiringDecisionServices } from '../../../services';
import { makeDecisionSchema } from '../../../validators';
import { parseId } from '../../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/**
 * POST /api/applications/:id/decision (employer/admin).
 * The service records the decision and moves the application status in ONE
 * transaction, appending status history + audit trail.
 */
export const makeDecision = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const applicationId = parseId(req.params.id);
  const input = makeDecisionSchema.parse(req.body);
  const decision = await hiringDecisionServices.makeDecision(req.user!, applicationId, input);
  return ok(res, { decision });
});

/** GET /api/applications/:id/decision (current decision, null if none yet) */
export const getDecision = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const applicationId = parseId(req.params.id);
  const decision = await hiringDecisionServices.getDecision(req.user!, applicationId);
  return ok(res, { decision });
});

export default { makeDecision, getDecision };
