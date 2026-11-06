/**
 * Session persistence helpers (client-side).
 *
 * Tokens + roles live in cookies so src/middleware.ts can gate routes
 * without waiting for an API round-trip. The backend remains the authority:
 * middleware only filters UX; /auth/me re-validates on the client.
 */
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearTokens,
  setCookie,
  deleteCookie,
  getAccessToken,
} from '@/services/api-client';
import type { AuthPayload, MePayload } from '@/types';
import type { RoleName } from '@/enums';

export const ROLES_COOKIE = 'mk_roles';

export const storeSession = (
  payload: AuthPayload | (MePayload & { tokens?: AuthPayload['tokens'] }),
): void => {
  const tokens = (payload as AuthPayload).tokens;
  if (tokens) {
    setCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken);
    setCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
  }
  setCookie(ROLES_COOKIE, payload.roles.join(','), 30);
};

export const clearSession = (): void => {
  clearTokens();
  deleteCookie(ROLES_COOKIE);
};

/** Roles from the cookie (used by middleware and first paint before /auth/me). */
export const rolesFromCookie = (cookieHeader?: string): RoleName[] => {
  const raw = cookieHeader
    ? cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${ROLES_COOKIE}=`))
        ?.slice(ROLES_COOKIE.length + 1)
    : (typeof document !== 'undefined'
        ? document.cookie
            .split(';')
            .map((c) => c.trim())
            .find((c) => c.startsWith(`${ROLES_COOKIE}=`))
            ?.slice(ROLES_COOKIE.length + 1)
        : undefined);
  if (!raw) return [];
  return decodeURIComponent(raw)
    .split(',')
    .filter(Boolean) as RoleName[];
};

export const hasSession = (): boolean => getAccessToken() !== null;
