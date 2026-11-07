'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { AREA_HOME, areasForRoles } from '@/lib/permissions';
import { displayName } from '@/utils/format';
import { Button } from '@/components/ui';
import { MegaPanel } from './MegaPanel';

const navLinks = [
  { href: '/companies', label: 'Companies' },
  { href: '/job-categories', label: 'Categories' },
  { href: '/job-alerts', label: 'Job Alerts' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const ChevronDown = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={`h-4 w-4 ${className}`}>
    <path
      fillRule="evenodd"
      d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z"
      clipRule="evenodd"
    />
  </svg>
);

/** Public-site top navigation (auth-aware, merojob-style). */
export function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout, area, roles } = useAuth();
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const areas = useMemo(() => areasForRoles(roles).map((a) => AREA_HOME[a]), [roles]);

  // Close the mega menu whenever the route changes.
  useEffect(() => {
    setMegaOpen(false);
    setOpen(false);
  }, [pathname]);

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      pathname === href || pathname.startsWith(`${href}/`)
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="MeroKhoj home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 font-display text-lg font-black text-white">
            M
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
              Mero<span className="text-brand-600">Khoj</span>
            </span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Find what&apos;s yours
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {/* Browse Jobs opens the mega menu on hover or click. */}
          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button
              type="button"
              aria-expanded={megaOpen}
              onClick={() => setMegaOpen((v) => !v)}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                megaOpen ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Browse Jobs
              <ChevronDown className={megaOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            {megaOpen && <MegaPanel onClose={() => setMegaOpen(false)} />}
          </div>

          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {loading ? (
            <span className="h-9 w-28 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <>
              {area && (
                <Link
                  href={AREA_HOME[area]}
                  className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
                >
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
              <span
                className="max-w-[10rem] truncate text-sm font-medium text-slate-600"
                title={displayName(user)}
              >
                {displayName(user)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => void logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-brand-600 px-5 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Register
              </Link>
              <span className="h-6 w-px bg-slate-200" aria-hidden />
              <Link
                href="/employer"
                className="flex items-center gap-1 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600"
              >
                For Employers
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-3.5 w-3.5">
                  <path
                    fillRule="evenodd"
                    d="M7.2 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.58 10 7.2 5.7a1 1 0 0 1 0-1.4Z"
                    clipRule="evenodd"
                  />
                </svg>
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
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            <Link href="/jobs" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Browse Jobs
            </Link>
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
            <Link
              href="/employer"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-slate-50"
            >
              For Employers
            </Link>
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
                  Login
                </Link>
                <Link href="/register" className="btn-primary flex-1">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
