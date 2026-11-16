'use client';

/**
 * DashboardShell — sidebar + topbar chrome for all three dashboard areas.
 * Nav items come from NAV_BY_AREA so each area stays a pure config list.
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { type DashboardArea } from '@/lib/permissions';
import { displayName } from '@/utils/format';
import { NavIcon, type NavIconName } from '@/components/ui/icons';

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
}

export const NAV_BY_AREA: Record<DashboardArea, NavItem[]> = {
  jobseeker: [
    { href: '/jobseeker/dashboard', label: 'Dashboard', icon: 'grid' },
    { href: '/jobseeker/profile', label: 'Profile', icon: 'user' },
    { href: '/jobseeker/education', label: 'Education', icon: 'education' },
    { href: '/jobseeker/experience', label: 'Experience', icon: 'briefcase' },
    { href: '/jobseeker/resumes', label: 'Resumes', icon: 'document' },
    { href: '/jobseeker/applications', label: 'Applications', icon: 'envelope' },
    { href: '/jobseeker/saved-jobs', label: 'Saved Jobs', icon: 'bookmark' },
    { href: '/jobseeker/job-alerts', label: 'Job Alerts', icon: 'bell' },
    { href: '/jobseeker/interviews', label: 'Interviews', icon: 'calendar' },
    { href: '/jobseeker/notifications', label: 'Notifications', icon: 'speaker' },
    { href: '/jobseeker/settings', label: 'Settings', icon: 'settings' },
  ],
  employer: [
    { href: '/employer/dashboard', label: 'Dashboard', icon: 'grid' },
    { href: '/employer/company', label: 'Company', icon: 'building' },
    { href: '/employer/company-members', label: 'Members', icon: 'users' },
    { href: '/employer/jobs', label: 'Jobs', icon: 'briefcase' },
    { href: '/employer/applications', label: 'Applicants', icon: 'envelope' },
    { href: '/employer/interviews', label: 'Interviews', icon: 'calendar' },
    { href: '/employer/hiring', label: 'Hiring', icon: 'check-circle' },
    { href: '/employer/talent-roster', label: 'Talent Roster', icon: 'star' },
    { href: '/employer/notifications', label: 'Notifications', icon: 'speaker' },
    { href: '/employer/billing', label: 'Billing', icon: 'card' },
    { href: '/employer/orders', label: 'Orders', icon: 'receipt' },
    { href: '/employer/settings', label: 'Settings', icon: 'settings' },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'grid' },
    { href: '/admin/users', label: 'Users', icon: 'user' },
    { href: '/admin/companies', label: 'Companies', icon: 'building' },
    { href: '/admin/company-verifications', label: 'Verifications', icon: 'shield-check' },
    { href: '/admin/jobs', label: 'Jobs', icon: 'briefcase' },
    { href: '/admin/job-moderation', label: 'Moderation', icon: 'shield' },
    { href: '/admin/applications', label: 'Applications', icon: 'envelope' },
    { href: '/admin/reports', label: 'Reports', icon: 'flag' },
    { href: '/admin/service-plans', label: 'Service Plans', icon: 'package' },
    { href: '/admin/orders', label: 'Orders', icon: 'receipt' },
    { href: '/admin/payments', label: 'Payments', icon: 'card' },
    { href: '/admin/invoices', label: 'Invoices', icon: 'document' },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: 'list' },
    { href: '/admin/settings', label: 'Settings', icon: 'settings' },
  ],
};

/** Time-of-day greeting for the topbar (replaces the static area title). */const greetingFor = (date: Date): string => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const items = NAV_BY_AREA[area];

  const accountName = displayName(user);
  const firstName = accountName.split(' ')[0] || 'there';
  const initials =
    accountName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  const now = new Date();
  const todayLabel = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
            <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
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
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <span className="font-extrabold">MeroKhoj</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="p-2 text-slate-500 hover:text-slate-800"
              >
                <NavIcon name="close" className="h-5 w-5" />
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
                {greetingFor(now)}, {firstName}
              </p>
              <p className="text-xs text-slate-400">{todayLabel}</p>
            </div>
          </div>

          {/* Account menu — initials avatar, logout lives inside */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 hover:bg-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {initials}
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
                >
                  <div className="border-b border-slate-100 px-4 pb-2.5 pt-1.5">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {displayName(user) || 'Account'}
                    </p>
                    <p className="truncate text-xs text-slate-400">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleLogout();
                    }}
                    className="mt-1.5 flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <NavIcon name="logout" className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
