import { Request } from 'express';
import { RoleName } from '../enums';

/** Decoded JWT payload attached to an authenticated request. */
export interface IAuthTokenPayload {
  sub: string; // user id (UUID)
  email: string;
  roles: RoleName[];
  iat?: number;
  exp?: number;
}

/** Authenticated user context injected by the auth guard. */
export interface IAuthUser {
  id: string;
  email: string;
  roles: RoleName[];
}

/**
 * Express Request extended with the authenticated user populated by
 * `requireAuth` middleware. Controllers should read `req.user`.
 */
export interface ICustomRequest extends Request {
  user?: IAuthUser;
  /** Convenience: the JWT access token, if present. */
  token?: string;
}

/** Alias kept for compatibility with the reference structure. */
export type AuthenticatedRequest = ICustomRequest;