'use client';

/**
 * DashboardShell — sidebar + topbar chrome for all three dashboard areas.
 * Nav items come from NAV_BY_AREA so each area stays a pure config list.
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { AREA_HOME, type DashboardArea } from '@/lib/permissions';
import { displayName } from '@/utils/format';
import { Button } from '@/components/ui';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_BY_AREA: Record<DashboardArea, NavItem[]> = {
  jobseeker: [
    { href: '/jobseeker/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/jobseeker/profile', label: 'Profile', icon: '👤' },
    { href: '/jobseeker/education', label: 'Education', icon: '🎓' },
    { href: '/jobseeker/experience', label: 'Experience', icon: '💼' },
    { href: '/jobseeker/resumes', label: 'Resumes', icon: '📄' },
    { href: '/jobseeker/applications', label: 'Applications', icon: '📨' },
    { href: '/jobseeker/saved-jobs', label: 'Saved Jobs', icon: '🔖' },
    { href: '/jobseeker/job-alerts', label: 'Job Alerts', icon: '🔔' },
    { href: '/jobseeker/interviews', label: 'Interviews', icon: '📅' },
    { href: '/jobseeker/notifications', label: 'Notifications', icon: '📣' },
    { href: '/jobseeker/settings', label: 'Settings', icon: '⚙️' },
  ],
  employer: [
    { href: '/employer/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/employer/company', label: 'Company', icon: '🏢' },
    { href: '/employer/company-members', label: 'Members', icon: '👥' },
    { href: '/employer/jobs', label: 'Jobs', icon: '💼' },
    { href: '/employer/applications', label: 'Applicants', icon: '📨' },
    { href: '/employer/interviews', label: 'Interviews', icon: '📅' },
    { href: '/employer/hiring', label: 'Hiring', icon: '🤝' },
    { href: '/employer/talent-roster', label: 'Talent Roster', icon: '⭐' },
    { href: '/employer/notifications', label: 'Notifications', icon: '📣' },
    { href: '/employer/billing', label: 'Billing', icon: '💳' },
    { href: '/employer/orders', label: 'Orders', icon: '🧾' },
    { href: '/employer/settings', label: 'Settings', icon: '⚙️' },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👤' },
    { href: '/admin/companies', label: 'Companies', icon: '🏢' },
    { href: '/admin/company-verifications', label: 'Verifications', icon: '✅' },
    { href: '/admin/jobs', label: 'Jobs', icon: '💼' },
    { href: '/admin/job-moderation', label: 'Moderation', icon: '🛡️' },
    { href: '/admin/applications', label: 'Applications', icon: '📨' },
    { href: '/admin/reports', label: 'Reports', icon: '🚩' },
    { href: '/admin/service-plans', label: 'Service Plans', icon: '📦' },
    { href: '/admin/orders', label: 'Orders', icon: '🧾' },
    { href: '/admin/payments', label: 'Payments', icon: '💳' },
    { href: '/admin/invoices', label: 'Invoices', icon: '📑' },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: '📜' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ],
};

const AREA_LABEL: Record<DashboardArea, string> = {
  jobseeker: 'Jobseeker',
  employer: 'Employer',
  admin: 'Administration',
};

export function DashboardShell({
  area,
  children,
}: {
  area: DashboardArea;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV_BY_AREA[area];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const sidebar = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span aria-hidden className="w-5 text-center text-base">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-100/70">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <Link href="/" className="flex items-center gap-2 font-extrabold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white">
              M
            </span>
            <span className="text-slate-900">
              Mero<span className="text-brand-600">Khoj</span>
            </span>
          </Link>
        </div>
        <div className="border-b border-slate-200 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {AREA_LABEL[area]} area
          </p>
        </div>
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <span className="font-extrabold">MeroKhoj</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2">
                ✕
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {AREA_LABEL[area]} dashboard
              </p>
              <p className="text-xs text-slate-400">MeroKhoj platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={AREA_HOME[area]}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:block"
            >
              Home
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {(displayName(user) || '?').charAt(0).toUpperCase()}
              </span>
              <div className="hidden sm:block">
                <p className="max-w-40 truncate text-sm font-medium text-slate-800">
                  {displayName(user) || '…'}
                </p>
                <p className="max-w-40 truncate text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => void handleLogout()}>
              Log out
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
