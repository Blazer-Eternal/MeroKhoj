import Link from 'next/link';

const columns = [
  {
    title: 'For Jobseekers',
    links: [
      { href: '/jobs', label: 'Browse jobs' },
      { href: '/job-categories', label: 'Job categories' },
      { href: '/job-alerts', label: 'Job alerts' },
      { href: '/register', label: 'Create account' },
    ],
  },
  {
    title: 'For Employers',
    links: [
      { href: '/companies', label: 'Company directory' },
      { href: '/register', label: 'Post a job' },
      { href: '/employer', label: 'Employer zone' },
      { href: '/contact', label: 'Contact sales' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/contact', label: 'Contact' },
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of service' },
    ],
  },
];

/** Public-site footer. */
export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-extrabold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white">
                M
              </span>
              <span className="text-slate-900">
                Mero<span className="text-brand-600">Khoj</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Seekers discover jobs, employers discover talent, and both start from the same
              search.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-slate-900">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-brand-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} MeroKhoj. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

