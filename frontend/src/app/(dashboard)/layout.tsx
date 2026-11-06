'use client';

/**
 * Dashboard area layout — one file for /jobseeker, /employer and /admin.
 * The area is derived from the pathname; client-side guard re-checks roles
 * via /auth/me (middleware already filtered the first hop by cookie).
 */
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useAuth } from '@/context/auth-context';
import { canAccessPath, AREA_HOME, primaryArea } from '@/lib/permissions';
import { PageLoader } from '@/components/ui';

const areaFromPath = (pathname: string): 'jobseeker' | 'employer' | 'admin' | null => {
  if (pathname.startsWith('/jobseeker')) return 'jobseeker';
  if (pathname.startsWith('/employer')) return 'employer';
  if (pathname.startsWith('/admin')) return 'admin';
  return null;
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { roles, loading, isAuthenticated } = useAuth();
  const area = areaFromPath(pathname);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (area && !canAccessPath(pathname, roles)) {
      const home = primaryArea(roles);
      router.replace(home ? AREA_HOME[home] : '/login');
    }
  }, [loading, isAuthenticated, pathname, roles, area, router]);

  if (loading || !isAuthenticated || (area && !canAccessPath(pathname, roles))) {
    return (
      <div className="min-h-screen bg-slate-100/70">
        <PageLoader label="Checking your access…" />
      </div>
    );
  }

  if (!area) return <>{children}</>;

  return <DashboardShell area={area}>{children}</DashboardShell>;
}
