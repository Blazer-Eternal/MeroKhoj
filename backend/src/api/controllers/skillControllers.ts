import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { skillServices } from '../../services';
import { createSkillSchema } from '../../validators';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/skills */
export const listSkills = asyncHandler(async (_req: ICustomRequest, res: Response) => {
  const skills = await skillServices.listSkills();
  return ok(res, { skills });
});

/** GET /api/skills/search?q=... */
export const searchSkills = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const term = (req.query.q as string) ?? '';
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const skills = await skillServices.searchSkills(term, limit);
  return ok(res, { skills });
});

/** POST /api/skills */
export const createSkill = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = createSkillSchema.parse(req.body);
  const skill = await skillServices.createSkill(input);
  return ok(res, { skill }, 201);
});

export default { listSkills, searchSkills, createSkill };
