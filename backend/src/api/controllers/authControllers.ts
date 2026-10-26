import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { authServices } from '../../services';
import { registerSchema, loginSchema, refreshSchema } from '../../validators';

/** Standard success envelope. */
const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** POST /api/auth/register */
export const register = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await authServices.register(input);
  return ok(res, result, 201);
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authServices.login(input);
  return ok(res, result);
});

/** POST /api/auth/refresh */
export const refresh = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const { refresh_token } = refreshSchema.parse(req.body);
  const tokens = await authServices.refreshTokens(refresh_token);
  return ok(res, { tokens });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const result = await authServices.getMe(req.user!.id);
  return ok(res, result);
});

/** POST /api/auth/logout — stateless JWT: client discards the token. */
export const logout = asyncHandler(async (_req: ICustomRequest, res: Response) => {
  return ok(res, { message: 'Logged out' });
});

export default { register, login, refresh, me, logout };
