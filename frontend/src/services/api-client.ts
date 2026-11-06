/**
 * Centralized API client — the ONLY place that talks to the Express backend.
 *
 * - Every request goes to NEXT_PUBLIC_API_URL with the envelope contract
 *   `{ success, data, meta? }` / `{ success: false, error: { code, message } }`.
 * - The access token is attached as `Authorization: Bearer …` from a cookie
 *   (also readable by src/middleware.ts for role gating).
 * - On a 401 the client performs ONE single-flight refresh
 *   (`POST /auth/refresh` with the refresh token) and retries the request.
 * - Business logic stays in the backend; this file only does transport,
 *   auth plumbing, and envelope unwrapping.
 */

export const ACCESS_TOKEN_COOKIE = 'mk_access_token';
export const REFRESH_TOKEN_COOKIE = 'mk_refresh_token';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// ---- cookies -------------------------------------------------------------
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const setCookie = (name: string, value: string, maxAgeDays = 30): void => {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${
    maxAgeDays * 86400
  }; SameSite=Lax${secure}`;
};

export const deleteCookie = (name: string): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
};

export const getAccessToken = (): string | null => getCookie(ACCESS_TOKEN_COOKIE);
export const getRefreshToken = (): string | null => getCookie(REFRESH_TOKEN_COOKIE);

// ---- errors --------------------------------------------------------------
export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = 'UNKNOWN', status = 0) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
  }
}

// ---- envelope ------------------------------------------------------------
interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: { code?: string; message?: string };
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  /** Skip the Authorization header even if a token exists (public reads). */
  anonymous?: boolean;
  /** Internal: prevents infinite refresh loops. */
  _retried?: boolean;
}

const buildUrl = (
  path: string,
  query?: RequestOptions['query'],
): string => {
  const url = new URL(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
};

// ---- token refresh (single-flight) ---------------------------------------
let refreshPromise: Promise<boolean> | null = null;

const performRefresh = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as Envelope<{ tokens: { accessToken: string; refreshToken: string } }>;
    const tokens = json?.data?.tokens;
    if (!tokens?.accessToken) return false;
    setCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken);
    setCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
    return true;
  } catch {
    return false;
  }
};

const refreshTokens = (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// ---- core request --------------------------------------------------------
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    headers = {},
    anonymous = false,
    _retried = false,
  } = options;

  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (!anonymous) {
    const token = getAccessToken();
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiRequestError('Cannot reach the server. Is the backend running on :8000?', 'NETWORK');
  }

  // Expired access token → refresh once, then retry the original request.
  if (res.status === 401 && !anonymous && !_retried && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _retried: true });
    }
  }

  if (res.status === 204) return undefined as T;

  let json: Envelope<T> & { meta?: Record<string, unknown> };
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiRequestError(`Unexpected response (${res.status})`, 'BAD_RESPONSE', res.status);
  }

  if (!res.ok || json.success === false) {
    const message = json.error?.message ?? `Request failed (${res.status})`;
    const code = json.error?.code ?? `HTTP_${res.status}`;
    throw new ApiRequestError(message, code, res.status);
  }

  return json.data;
}

/** Attach the standard `meta` to list results (envelope keeps it beside data). */
export async function apiList<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T[]; meta: Record<string, unknown> }> {
  const {
    method = 'GET',
    body,
    query,
    headers = {},
    anonymous = false,
    _retried = false,
  } = options;

  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (!anonymous) {
    const token = getAccessToken();
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiRequestError('Cannot reach the server. Is the backend running on :8000?', 'NETWORK');
  }

  if (res.status === 401 && !anonymous && !_retried && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) return apiList<T>(path, { ...options, _retried: true });
  }

  let json: Envelope<T[]> & { meta?: Record<string, unknown> };
  try {
    json = (await res.json()) as Envelope<T[]>;
  } catch {
    throw new ApiRequestError(`Unexpected response (${res.status})`, 'BAD_RESPONSE', res.status);
  }

  if (!res.ok || json.success === false) {
    throw new ApiRequestError(
      json.error?.message ?? `Request failed (${res.status})`,
      json.error?.code ?? `HTTP_${res.status}`,
      res.status,
    );
  }

  return { data: json.data ?? [], meta: json.meta ?? {} };
}

// ---- convenience ---------------------------------------------------------
export const apiGet = <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> =>
  apiRequest<T>(path, { ...options, method: 'GET' });

export const apiPost = <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> =>
  apiRequest<T>(path, { ...options, method: 'POST', body });

export const apiPatch = <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> =>
  apiRequest<T>(path, { ...options, method: 'PATCH', body });

export const apiPut = <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> =>
  apiRequest<T>(path, { ...options, method: 'PUT', body });

export const apiDelete = <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> =>
  apiRequest<T>(path, { ...options, method: 'DELETE' });

/** Clear both tokens (used by logout / hard auth failures). */
export const clearTokens = (): void => {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
};
