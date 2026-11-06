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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Alerts</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Tell us what you&apos;re looking for and MeroKhoj will notify you when matching jobs
            are published. Alerts land in your notifications and can be managed any time from
            your dashboard.
          </p>

          <ul className="mt-6 space-y-4">
            {[
              { icon: '🔔', title: 'Never miss a match', text: 'Keyword + location matching runs against every new posting.' },
              { icon: '⚡', title: 'Choose your cadence', text: 'Instant, daily, or weekly digests — you decide.' },
              { icon: '🎛️', title: 'Full control', text: 'Edit, pause, or delete alerts from your jobseeker dashboard.' },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-xl bg-brand-50 p-5 text-sm text-brand-800">
            Already have alerts?{' '}
            <Link href="/jobseeker/job-alerts" className="font-semibold underline">
              Manage them in your dashboard
            </Link>
            .
          </div>
        </div>

        <div className="card h-fit">
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

              <Field label="Location" hint="Optional — match jobs in a specific city" htmlFor="alert-location">
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

              <Field label="Category" hint="Optional — focus on one field" htmlFor="alert-category">
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
                  <option value={JobAlertFrequency.INSTANT}>Instant — as jobs are posted</option>
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
  );
}
