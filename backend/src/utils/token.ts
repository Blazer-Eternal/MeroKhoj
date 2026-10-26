import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from '../config';
import { AppError } from './appError';
import { RoleName } from '../enums';

/** Claims carried by the MeroKhoj access token. */
export interface IJwtAccessPayload extends JwtPayload {
  sub: string; // user id
  email: string;
  roles: RoleName[];
}

/** Claims carried by the MeroKhoj refresh token. */
export interface IJwtRefreshPayload extends JwtPayload {
  sub: string;
  token_version?: number;
}

/**
 * Sign an access token. Short-lived; carries identity + roles so guards can
 * authorize without a database hit on every request.
 */
export const signAccessToken = (payload: {
  userId: string;
  email: string;
  roles: RoleName[];
}): string => {
  const options: SignOptions = { expiresIn: env.jwt.accessExpires as SignOptions['expiresIn'] };
  return jwt.sign(
    { sub: payload.userId, email: payload.email, roles: payload.roles },
    env.jwt.accessSecret,
    options,
  );
};

/** Sign a refresh token. Long-lived; used only to mint new access tokens. */
export const signRefreshToken = (payload: { userId: string }): string => {
  const options: SignOptions = { expiresIn: env.jwt.refreshExpires as SignOptions['expiresIn'] };
  return jwt.sign({ sub: payload.userId }, env.jwt.refreshSecret, options);
};

/** Verify an access token and return its decoded payload. */
export const verifyAccessToken = (token: string): IJwtAccessPayload => {
  try {
    return jwt.verify(token, env.jwt.accessSecret) as IJwtAccessPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Access token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw AppError.unauthorized('Invalid access token');
    }
    throw AppError.unauthorized('Unable to verify access token');
  }
};

/** Verify a refresh token and return its decoded payload. */
export const verifyRefreshToken = (token: string): IJwtRefreshPayload => {
  try {
    return jwt.verify(token, env.jwt.refreshSecret) as IJwtRefreshPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Refresh token has expired');
    }
    throw AppError.unauthorized('Invalid refresh token');
  }
};

/** Extract a bearer token from an Authorization header. */
export const extractBearerToken = (header?: string): string | null => {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
};
