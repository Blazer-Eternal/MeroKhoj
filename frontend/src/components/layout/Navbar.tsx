'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { AREA_HOME, areasForRoles } from '@/lib/permissions';
import { Button } from '@/components/ui';

const navLinks = [
  { href: '/jobs', label: 'Find Jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/job-categories', label: 'Categories' },
  { href: '/job-alerts', label: 'Job Alerts' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/** Public-site top navigation (auth-aware). */
export function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout, area, roles } = useAuth();
  const [open, setOpen] = useState(false);
  const areas = useMemo(() => areasForRoles(roles).map((a) => AREA_HOME[a]), [roles]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white">
            M
          </span>
          <span className="text-slate-900">
            Mero<span className="text-brand-600">Khoj</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {loading ? (
            <span className="h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <>
              {area && (
                <Link href={AREA_HOME[area]} className="btn-secondary">
                  Dashboard
                </Link>
              )}
              {areas.length > 1 && (
                <select
                  className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) window.location.assign(e.target.value);
                  }}
                >
                  <option value="" disabled>
                    Switch area
                  </option>
                  {areas.map((href) => (
                    <option key={href} value={href}>
                      {href.split('/')[1]}
                    </option>
                  ))}
                </select>
              )}
              <span className="max-w-[10rem] truncate text-sm text-slate-600" title={user.full_name}>
                {user.full_name}
              </span>
              <Button variant="ghost" size="sm" onClick={() => void logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3">
            {user ? (
              <>
                {area && (
                  <Link href={AREA_HOME[area]} className="btn-primary flex-1">
                    Dashboard
                  </Link>
                )}
                <Button variant="secondary" onClick={() => void logout()}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary flex-1">
                  Log in
                </Link>
                <Link href="/register" className="btn-primary flex-1">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
