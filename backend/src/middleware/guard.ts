import { NextFunction, Response } from 'express';
import { AppError, extractBearerToken, verifyAccessToken } from '../utils';
import { ICustomRequest } from '../interfaces';
import { RoleName } from '../enums';
import { asyncHandler } from './exceptionHandler';

/**
 * Auth & role guards.
 *
 * `requireAuth` validates the JWT and attaches `req.user`.
 * `requireRole` / `requireAnyRole` then gate the route on the user's roles.
 */

/** Populate `req.user` from a valid bearer token. */
export const requireAuth = asyncHandler(
  async (req: ICustomRequest, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req.headers.authorization) ?? undefined;
    if (!token) {
      throw AppError.unauthorized('Authentication token missing');
    }

    const payload = verifyAccessToken(token);
    if (!payload?.sub) {
      throw AppError.unauthorized('Invalid token payload');
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
    };
    req.token = token;
    next();
  },
);

/** Require that the authenticated user holds every one of the given roles. */
export const requireRole =
  (...roles: RoleName[]) =>
  (req: ICustomRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }
    const hasAll = roles.every((role) => req.user?.roles.includes(role));
    if (!hasAll) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };

/** Require that the authenticated user holds at least one of the given roles. */
export const requireAnyRole =
  (...roles: RoleName[]) =>
  (req: ICustomRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }
    const hasAny = roles.some((role) => req.user?.roles.includes(role));
    if (!hasAny) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };

/** Require platform-administrator privileges. */
export const requireAdmin = requireAnyRole(RoleName.ADMIN, RoleName.SUPER_ADMIN);

/** Require that the user acts as a jobseeker. */
export const requireJobseeker = requireAnyRole(RoleName.JOBSEEKER);

/**
 * Require that the user acts as an employer (recruiter / company admin).
 * Platform administrators are included so they can administer any company;
 * fine-grained company membership is still enforced in the service layer.
 */
export const requireEmployer = requireAnyRole(
  RoleName.RECRUITER,
  RoleName.COMPANY_ADMIN,
  RoleName.ADMIN,
  RoleName.SUPER_ADMIN,
);

/** Convenience: assert the request is authenticated (throws otherwise). */
export const getAuthUser = (req: ICustomRequest) => {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }
  return req.user;
};
