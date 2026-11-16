'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiPost, apiCollection, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button, Field, Input, Select } from '@/components/ui';
import { JobAlertFrequency, EmploymentType } from '@/enums';
import type { Location as GeoLocation, JobCategory } from '@/types';

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-5 w-5">
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.3 19a2 2 0 0 0 3.4 0" />
  </svg>
);

/**
 * Public job-alert signup. Creating an alert requires a jobseeker session —
 * guests are routed to login with a return path (backend enforces the role).
 * Location/category are taxonomy ids (backend `createJobAlertSchema`).
 */
export default function JobAlertsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [locationId, setLocationId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [frequency, setFrequency] = useState<JobAlertFrequency>(JobAlertFrequency.DAILY);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locations, setLocations] = useState<GeoLocation[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);

  // Taxonomy for the dropdowns (public endpoints).
  useEffect(() => {
    void (async () => {
      try {
        const [locs, cats] = await Promise.all([
          apiCollection<GeoLocation>(endpoints.locations.list, { anonymous: true, query: { perPage: 200 } }),
          apiCollection<JobCategory>(endpoints.jobCategories.list, { anonymous: true, query: { perPage: 200 } }),
        ]);
        setLocations(locs.data);
        setCategories(cats.data);
      } catch {
        // Dropdowns stay empty — alert can still be created by keywords alone.
      }
    })();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent('/job-alerts')}`);
      return;
    }
    if (!name.trim()) {
      setError('Give your alert a name.');
      return;
    }

    setBusy(true);
    try {
      await apiPost(endpoints.jobAlerts.list, {
        name: name.trim(),
        keywords: keywords.trim() || null,
        location_id: locationId || null,
        category_id: categoryId || null,
        employment_type: employmentType || null,
        frequency,
        is_active: true,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not create the alert.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Branded header band */}
      <div className="border-b border-slate-100 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1
            className="mk-rise font-display text-3xl font-extrabold text-slate-900 sm:text-4xl"
            style={{ '--mk-delay': '40ms' } as React.CSSProperties}
          >
            Job alerts that <span className="text-brand-600">come to you</span>
          </h1>
          <p
            className="mk-rise mt-3 max-w-2xl text-lg leading-relaxed text-slate-600"
            style={{ '--mk-delay': '110ms' } as React.CSSProperties}
          >
            Save the search once. When an employer publishes a role that matches your
            keywords, location and field, MeroKhoj notifies you — so the good ones reach
            you while they are still fresh instead of after a week of refreshing boards.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">How matching works</h2>
            <ol className="relative mt-5">
              <span
                aria-hidden
                className="absolute left-[19px] top-10 hidden h-[calc(100%-5rem)] w-0.5 bg-slate-200 sm:block"
              />
              {[
                {
                  title: 'You describe the role you want',
                  body: 'Keywords like “react” and “node”, the city you can work from, and the field you want to stay in. Leave any of them open to widen the net.',
                },
                {
                  title: 'Every new posting is checked against it',
                  body: 'Matching runs each time an employer publishes, comparing your saved criteria against the title, skills, category and location of the role.',
                },
                {
                  title: 'You get one message, not fifty',
                  body: 'Depending on your cadence, matches arrive as they post or gathered into a single daily or weekly digest with the salary and deadline already visible.',
                },
              ].map((step, index) => (
                <li
                  key={step.title}
                  className="mk-rise relative mb-7 flex gap-4 last:mb-0"
                  style={{ '--mk-delay': `${160 + index * 110}ms` } as React.CSSProperties}
                >
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 font-display text-sm font-black text-white ring-4 ring-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="font-display text-[15px] font-bold text-slate-900">
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Example alert notification — decorative mock */}
            <div
              className="mk-rise mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_56px_-36px_rgba(15,23,42,0.45)]"
              style={{ '--mk-delay': '480ms' } as React.CSSProperties}
              aria-hidden
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <BellIcon />
                  Alert · React jobs in Kathmandu
                </span>
                <span className="text-xs text-slate-400">now</span>
              </div>
              <p className="mt-3 font-display text-base font-bold text-slate-900">
                Senior Frontend Engineer
              </p>
              <p className="mt-1 text-sm text-slate-500">Himalayan Digital · Kathmandu</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  Full-time
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  Rs. 120,000 – Rs. 160,000
                </span>
                <span className="ml-auto text-xs font-bold text-brand-600">View role →</span>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-brand-50 p-5 text-sm text-brand-800">
              Already have alerts?{' '}
              <Link href="/jobseeker/job-alerts" className="font-semibold underline">
                Manage them in your dashboard
              </Link>
              . Pause one while you are on holiday, or delete it the day you sign an offer —
              alerts never email you after that.
            </div>
          </div>

          <div className="card h-fit lg:sticky lg:top-20">
            <h2 className="text-lg font-semibold text-slate-900">Create a free alert</h2>

          {done ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
              Alert created ✓ We&apos;ll notify you when matching jobs appear.
              <div className="mt-3 flex gap-2">
                <Link href="/jobseeker/job-alerts" className="btn-secondary">View my alerts</Link>
                <Link href="/jobs" className="btn-primary">Browse jobs</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
              <Field label="Alert name" required htmlFor="alert-name">
                <Input
                  id="alert-name"
                  placeholder="e.g. React jobs in Kathmandu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field label="Keywords" hint="Comma-separated, e.g. react, node" htmlFor="alert-keywords">
                <Input
                  id="alert-keywords"
                  placeholder="react, node, typescript"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </Field>

              <Field label="Location" hint="Optional: match jobs in a specific city" htmlFor="alert-location">
                <Select
                  id="alert-location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  <option value="">Any location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                      {loc.city ? ` · ${loc.city}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Category" hint="Optional: focus on one field" htmlFor="alert-category">
                <Select
                  id="alert-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Any category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Job type" htmlFor="alert-employment">
                <Select
                  id="alert-employment"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                >
                  <option value="">Any type</option>
                  {Object.entries(EmploymentType).map(([key, value]) => (
                    <option key={value} value={value}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Frequency" htmlFor="alert-frequency">
                <Select
                  id="alert-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as JobAlertFrequency)}
                >
                  <option value={JobAlertFrequency.INSTANT}>Instant, as jobs are posted</option>
                  <option value={JobAlertFrequency.DAILY}>Daily digest</option>
                  <option value={JobAlertFrequency.WEEKLY}>Weekly digest</option>
                </Select>
              </Field>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" loading={busy}>
                {isAuthenticated ? 'Create alert' : 'Log in to create alert'}
              </Button>
            </form>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
