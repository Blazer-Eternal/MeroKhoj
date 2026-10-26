import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { companyServices, companyMemberServices } from '../../services';
import {
  createCompanySchema,
  updateCompanySchema,
  addCompanyMemberSchema,
  updateCompanyMemberSchema,
} from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** POST /api/companies — creator becomes OWNER. */
export const createCompany = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = createCompanySchema.parse(req.body);
  const company = await companyServices.createCompany(req.user!, input);
  return ok(res, { company }, 201);
});

/** GET /api/companies/:id */
export const getCompany = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const company = await companyServices.getCompanyById(id);
  return ok(res, { company });
});

/** PATCH /api/companies/:id */
export const updateCompany = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateCompanySchema.parse(req.body);
  const company = await companyServices.updateCompany(req.user!, id, input);
  return ok(res, { company });
});

/** GET /api/companies/:companyId/members */
export const listMembers = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const members = await companyMemberServices.listMembers(req.user!, companyId);
  return ok(res, { members });
});

/** POST /api/companies/:companyId/members */
export const addMember = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const input = addCompanyMemberSchema.parse(req.body);
  const member = await companyMemberServices.addMember(
    req.user!,
    companyId,
    input.user_id,
    input.role,
  );
  return ok(res, { member }, 201);
});

/** PATCH /api/companies/:companyId/members/:memberId */
export const updateMember = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const memberId = parseId(req.params.memberId);
  const input = updateCompanyMemberSchema.parse(req.body);
  const member = await companyMemberServices.updateMemberRole(
    req.user!,
    companyId,
    memberId,
    input.role,
  );
  return ok(res, { member });
});

/** DELETE /api/companies/:companyId/members/:memberId */
export const removeMember = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const memberId = parseId(req.params.memberId);
  await companyMemberServices.removeMember(req.user!, companyId, memberId);
  return ok(res, { message: 'Member removed' });
});

export default {
  createCompany,
  getCompany,
  updateCompany,
  listMembers,
  addMember,
  updateMember,
  removeMember,
};
