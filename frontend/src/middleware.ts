import { NextResponse, type NextRequest } from 'next/server';
import { ROLE_HOME, PROTECTED_PREFIXES } from '@/lib/constants';

/**
 * Route gating (role-based UX layer).
 *
 * Reads the cookie session written by src/lib/auth.ts:
 *   - no access token  → /login?next=… for any protected area
 *   - roles cookie     → must include the area's roles, else redirect to the
 *                        user's own dashboard (backend re-checks everything;
 *                        this only keeps users out of UI they can't use)
 *   - token but no roles yet → let it through; AuthProvider re-validates
 *     via /auth/me and the area page handles a hard 403.
 */
const roleAllowed = (prefix: string, roles: string[]): boolean => {
  if (prefix === PROTECTED_PREFIXES.admin) return roles.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN' || r === 'MODERATOR');
  if (prefix === PROTECTED_PREFIXES.employer) return roles.some((r) => r === 'RECRUITER' || r === 'COMPANY_ADMIN');
  if (prefix === PROTECTED_PREFIXES.jobseeker) return roles.includes('JOBSEEKER');
  return true;
};

const homeFor = (roles: string[]): string => {
  if (roles.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN' || r === 'MODERATOR')) return ROLE_HOME.ADMIN;
  if (roles.some((r) => r === 'RECRUITER' || r === 'COMPANY_ADMIN')) return ROLE_HOME.EMPLOYER;
  if (roles.includes('JOBSEEKER')) return ROLE_HOME.JOBSEEKER;
  return '/login';
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('mk_access_token')?.value;
  const roles = (request.cookies.get('mk_roles')?.value ?? '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  const isProtected = Object.values(PROTECTED_PREFIXES).some((p) => pathname.startsWith(p));
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Protected area without a session → login with return path.
  if (isProtected && !accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Signed-in users don't sit on the auth pages.
  if (isAuthPage && accessToken && roles.length > 0) {
    const url = request.nextUrl.clone();
    url.pathname = homeFor(roles);
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Wrong area for the held roles → bounce to the user's own dashboard.
  if (isProtected && accessToken && roles.length > 0) {
    const prefix = Object.values(PROTECTED_PREFIXES).find((p) => pathname.startsWith(p))!;
    if (!roleAllowed(prefix, roles)) {
      const url = request.nextUrl.clone();
      url.pathname = homeFor(roles);
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/jobseeker/:path*',
    '/employer/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
