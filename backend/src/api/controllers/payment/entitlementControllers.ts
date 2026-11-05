import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { entitlementServices } from '../../../services';
import { parseId } from '../../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/**
 * GET /api/companies/:companyId/entitlement (member/admin).
 * Returns billing_required, used/allowance/remaining (null = unlimited),
 * active_orders and next_expiry — the numbers checked before the first
 * job publish when COMPANY_BILLING_REQUIRED=true.
 */
export const getEntitlement = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const entitlement = await entitlementServices.getEntitlement(req.user!, companyId);
  return ok(res, { entitlement });
});

export default { getEntitlement };
