'use client';

/**
 * AuthProvider — the single source of truth for session state in the client.
 *
 * - On mount: revalidates the cookie session against GET /auth/me.
 * - login/register/logout live here; they persist tokens + roles cookies
 *   (readable by src/middleware.ts for route gating).
 * - Backend remains authoritative: this context only mirrors what /auth says.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiGet, apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { clearSession, storeSession, hasSession } from '@/lib/auth';
import { primaryArea, type DashboardArea } from '@/lib/permissions';
import type { AuthPayload, MePayload, PublicUser } from '@/types';
import type { RoleName } from '@/enums';

interface AuthContextValue {
  user: PublicUser | null;
  roles: RoleName[];
  /** true until the initial /auth/me check finishes. */
  loading: boolean;
  isAuthenticated: boolean;
  /** Dashboard area this user may open (null → no dashboard yet). */
  area: DashboardArea | null;
  login: (email: string, password: string) => Promise<AuthPayload>;
  register: (input: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: RoleName;
  }) => Promise<AuthPayload>;
  logout: () => Promise<void>;
  /** Re-read /auth/me (after profile edits etc.). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [roles, setRoles] = useState<RoleName[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!hasSession()) {
      setUser(null);
      setRoles([]);
      setLoading(false);
      return;
    }
    try {
      const me = await apiGet<MePayload>(endpoints.auth.me);
      setUser(me.user);
      setRoles(me.roles);
      // Keep the roles cookie fresh for middleware gating.
      storeSession(me);
    } catch (err) {
      if (err instanceof ApiRequestError && (err.status === 401 || err.code === 'UNAUTHORIZED')) {
        clearSession();
      }
      setUser(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthPayload> => {
    const payload = await apiPost<AuthPayload>(endpoints.auth.login, { email, password }, { anonymous: true });
    storeSession(payload);
    setUser(payload.user);
    setRoles(payload.roles);
    return payload;
  }, []);

  const register = useCallback(
    async (input: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      role: RoleName;
    }): Promise<AuthPayload> => {
      const payload = await apiPost<AuthPayload>(endpoints.auth.register, input, { anonymous: true });
      storeSession(payload);
      setUser(payload.user);
      setRoles(payload.roles);
      return payload;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiPost(endpoints.auth.logout);
    } catch {
      // Stateless JWT: even if the call fails we clear the local session.
    }
    clearSession();
    setUser(null);
    setRoles([]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      roles,
      loading,
      isAuthenticated: user !== null,
      area: primaryArea(roles),
      login,
      register,
      logout,
      refresh,
    }),
    [user, roles, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
