/**
 * Server-side fetch helper for public (unauthenticated) pages.
 * Server components can't use cookies()-based client auth, so this is only
 * for open data: jobs, companies, taxonomy. Authenticated server reads go
 * through the client api-client instead.
 */

const BASE_URL = process.env.API_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export class ServerApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: { code?: string; message?: string };
}

export async function serverGet<T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
  nextOptions?: { revalidate?: number | false },
): Promise<{ data: T; meta: Record<string, unknown> }> {
  const url = new URL(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }

  const init: RequestInit & { next?: { revalidate?: number | false } } = {
    cache: 'no-store',
  };
  if (nextOptions?.revalidate !== undefined) {
    init.cache = undefined;
    init.next = { revalidate: nextOptions.revalidate };
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), init);
  } catch {
    throw new ServerApiError('Backend unreachable — is it running on :8000?', 0);
  }

  let json: Envelope<T>;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    throw new ServerApiError(`Unexpected response (${res.status})`, res.status);
  }

  if (!res.ok || json.success === false) {
    throw new ServerApiError(
      json.error?.message ?? `Request failed (${res.status})`,
      res.status,
    );
  }

  return { data: json.data, meta: json.meta ?? {} };
}

/**
 * List fetch that normalizes the two backend list shapes:
 *   - bare array:            `{ data: [...] }`
 *   - wrapped object:        `{ data: { categories: [...] } }`
 * Wrapped responses are unwrapped by taking the first array-valued key
 * (or an explicit `key` when provided).
 */
export async function serverList<T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
  key?: string,
): Promise<{ data: T[]; meta: Record<string, unknown> }> {
  const res = await serverGet<unknown>(path, query);
  const raw = res.data;

  if (Array.isArray(raw)) return { data: raw as T[], meta: res.meta };

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (key && Array.isArray(obj[key])) return { data: obj[key] as T[], meta: res.meta };
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) return { data: value as T[], meta: res.meta };
    }
  }

  return { data: [], meta: res.meta };
}
