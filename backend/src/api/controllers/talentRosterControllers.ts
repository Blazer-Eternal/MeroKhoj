import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { talentRosterServices } from '../../services';
import {
  createRosterSchema,
  updateRosterSchema,
  addRosterMemberSchema,
  updateRosterMemberSchema,
} from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

// ---- Rosters -------------------------------------------------------------

/** GET /api/companies/:companyId/rosters */
export const listRosters = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const rosters = await talentRosterServices.listRosters(req.user!, companyId);
  return ok(res, { rosters });
});

/** POST /api/companies/:companyId/rosters */
export const createRoster = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const input = createRosterSchema.parse(req.body);
  const roster = await talentRosterServices.createRoster(req.user!, companyId, input);
  return ok(res, { roster }, 201);
});

/** GET /api/rosters/:id */
export const getRoster = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const roster = await talentRosterServices.getRoster(req.user!, id);
  return ok(res, { roster });
});

/** PATCH /api/rosters/:id */
export const updateRoster = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateRosterSchema.parse(req.body);
  const roster = await talentRosterServices.updateRoster(req.user!, id, input);
  return ok(res, { roster });
});

/** DELETE /api/rosters/:id */
export const deleteRoster = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await talentRosterServices.deleteRoster(req.user!, id);
  return ok(res, { message: 'Talent roster deleted' });
});

// ---- Members -------------------------------------------------------------

/** GET /api/rosters/:rosterId/members */
export const listMembers = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const rosterId = parseId(req.params.rosterId);
  const members = await talentRosterServices.listMembers(req.user!, rosterId);
  return ok(res, { members });
});

/** POST /api/rosters/:rosterId/members */
export const addMember = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const rosterId = parseId(req.params.rosterId);
  const input = addRosterMemberSchema.parse(req.body);
  const member = await talentRosterServices.addMember(req.user!, rosterId, input);
  return ok(res, { member }, 201);
});

/** PATCH /api/rosters/:rosterId/members/:jobseekerId */
export const updateMemberNotes = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const rosterId = parseId(req.params.rosterId);
  const jobseekerId = parseId(req.params.jobseekerId);
  const input = updateRosterMemberSchema.parse(req.body);
  const member = await talentRosterServices.updateMemberNotes(
    req.user!,
    rosterId,
    jobseekerId,
    input.notes,
  );
  return ok(res, { member });
});

/** DELETE /api/rosters/:rosterId/members/:jobseekerId */
export const removeMember = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const rosterId = parseId(req.params.rosterId);
  const jobseekerId = parseId(req.params.jobseekerId);
  await talentRosterServices.removeMember(req.user!, rosterId, jobseekerId);
  return ok(res, { message: 'Member removed from roster' });
});

export default {
  listRosters,
  createRoster,
  getRoster,
  updateRoster,
  deleteRoster,
  listMembers,
  addMember,
  updateMemberNotes,
  removeMember,
};
