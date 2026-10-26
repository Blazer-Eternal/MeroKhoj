import bcrypt from 'bcryptjs';
import { env } from '../config';
import { AppError, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils';
import { IUser, IUserPublic, IAuthUser } from '../interfaces';
import { RoleName, UserStatus, LOGIN_ALLOWED_STATUSES } from '../enums';
import { userRepository } from '../repositories';

/**
 * Authentication business logic: register, login, token refresh, profile.
 *
 * Passwords are hashed with bcrypt; plaintext never touches the database.
 * Tokens are a short-lived access JWT + a longer-lived refresh JWT.
 */

export interface IRegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: RoleName;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: string;
}

export interface IAuthPayload {
  user: IUserPublic;
  roles: RoleName[];
  tokens: IAuthTokens;
}

const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, env.security.bcryptSaltRounds);

const comparePassword = async (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

const issueTokens = (user: IUser, roles: RoleName[]): IAuthTokens => ({
  access_token: signAccessToken({ userId: user.id, email: user.email, roles }),
  refresh_token: signRefreshToken({ userId: user.id }),
  token_type: 'Bearer',
  expires_in: env.jwt.accessExpires,
});

/** Register a new account and seed it with its first role. */
export const register = async (input: IRegisterInput): Promise<IAuthPayload> => {
  const email = input.email.toLowerCase();

  if (await userRepository.emailExists(email)) {
    throw AppError.conflict('An account with that email already exists');
  }
  if (input.phone && (await userRepository.phoneExists(input.phone))) {
    throw AppError.conflict('An account with that phone number already exists');
  }

  const password_hash = await hashPassword(input.password);
  const role = input.role ?? RoleName.JOBSEEKER;

  const user = await userRepository.create({
    email,
    password_hash,
    first_name: input.first_name,
    last_name: input.last_name,
    phone: input.phone ?? null,
    status: UserStatus.ACTIVE,
    email_verified: false,
  });

  // Attach the initial role (JOBSEEKER by default).
  await userRepository.addRole(user.id, role);

  const roles = await userRepository.getRoleNames(user.id);
  return {
    user: userRepository.toPublic(user),
    roles,
    tokens: issueTokens(user, roles),
  };
};

/** Authenticate with email + password. */
export const login = async (input: ILoginInput): Promise<IAuthPayload> => {
  const user = await userRepository.findByEmailWithPassword(input.email);
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const valid = await comparePassword(input.password, user.password_hash);
  if (!valid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (!LOGIN_ALLOWED_STATUSES.includes(user.status)) {
    throw AppError.forbidden(`Account is ${user.status.toLowerCase()}`);
  }

  await userRepository.updateLastLogin(user.id);

  const roles = await userRepository.getRoleNames(user.id);
  return {
    user: userRepository.toPublic(user),
    roles,
    tokens: issueTokens(user, roles),
  };
};

/** Exchange a valid refresh token for a fresh access/refresh token pair. */
export const refreshTokens = async (refreshToken: string): Promise<IAuthTokens> => {
  const payload = verifyRefreshToken(refreshToken);
  const user = await userRepository.findById(payload.sub);
  if (!user) {
    throw AppError.unauthorized('User no longer exists');
  }
  if (user.status !== UserStatus.ACTIVE) {
    throw AppError.forbidden(`Account is ${user.status.toLowerCase()}`);
  }
  const roles = await userRepository.getRoleNames(user.id);
  return issueTokens(user, roles);
};

/** Fetch the authenticated user's account + roles. */
export const getMe = async (userId: string): Promise<{ user: IUserPublic; roles: RoleName[] }> => {
  const user = await userRepository.findByIdWithRoles(userId);
  if (!user) throw AppError.notFound('User not found');
  const { roles, ...rest } = user;
  return { user: userRepository.toPublic(rest as IUser), roles };
};

/** Convenience helper for controllers that need the auth context. */
export const toAuthUser = (user: IUser, roles: RoleName[]): IAuthUser => ({
  id: user.id,
  email: user.email,
  roles,
});

export const authServices = { register, login, refreshTokens, getMe };

export default authServices;
