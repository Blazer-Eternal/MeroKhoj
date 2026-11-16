'use client';

/**
 * Admin dashboard — platform counters, job/application breakdowns and the
 * newest postings.
 *
 * Single fetch: GET /dashboard/admin → { dashboard: AdminDashboard }.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Spinner, StatusBadge } from '@/components/ui';
import { NavIcon, type NavIconName } from '@/components/ui/icons';
import { formatDate, timeAgo } from '@/utils/format';
import type { AdminDashboard } from '@/types';

function StatCard({
  label,
  value,
  icon,
  href,
  hint,
  index = 0,
}: {
  label: string;
  value: number | string;
  icon: NavIconName;
  href: string;
  hint?: string;
  index?: number;
}) {
  return (
    <Link href={href}>
      <div
        className="card lift mk-rise flex items-center gap-4"
        style={{ '--mk-delay': `${index * 70}ms` } as React.CSSProperties}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <NavIcon name={icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold text-slate-900">{value}</p>
          <p className="truncate text-sm text-slate-500">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
        </div>
      </div>
    </Link>
  );
}

/** Horizontal status bars with a StatusBadge label (mk-bar animation). */
function StatusBars({
  title,
  subtitle,
  rows,
  kind,
  emptyText,
  delay,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ status: string; count: number }>;
  kind: 'job' | 'application';
  emptyText: string;
  delay: string;
}) {
  const nonzero = rows.filter((row) => row.count > 0);
  const total = nonzero.reduce((sum, row) => sum + row.count, 0);

  return (
    <section
      className="card lift mk-rise"
      style={{ '--mk-delay': delay } as React.CSSProperties}
    >
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      {nonzero.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {nonzero.map((row) => {
            const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
            return (
              <div key={row.status} className="flex items-center gap-3">
                <div className="w-32 shrink-0">
                  <StatusBadge kind={kind} value={row.status} />
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="mk-bar h-2 rounded-full bg-brand-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-sm font-semibold text-slate-700">
                  {row.count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void apiGet<{ dashboard: AdminDashboard }>(endpoints.dashboard.admin)
      .then((res) => {
        if (!cancelled) setData(res.dashboard);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiRequestError ? err.message : 'Could not load the dashboard.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const today = formatDate(new Date());
  const pending = data?.stats.pendingVerifications ?? 0;

  return (
    <div className="space-y-6">
      {/* Overview banner */}
      <section className="rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="mk-rise text-sm font-semibold text-brand-100"
              style={{ '--mk-delay': '40ms' } as React.CSSProperties}
            >
              {today}
            </p>
            <h1
              className="mk-rise mt-1 text-2xl font-extrabold sm:text-3xl"
              style={{ '--mk-delay': '100ms' } as React.CSSProperties}
            >
              Platform overview
            </h1>
            <p
              className="mk-rise mt-2 max-w-xl text-sm text-brand-100"
              style={{ '--mk-delay': '170ms' } as React.CSSProperties}
            >
              Users, companies, jobs and billing in one place. The moderation and
              verification queues need attention first.
            </p>
          </div>
          <div
            className="mk-rise flex flex-wrap gap-2"
            style={{ '--mk-delay': '240ms' } as React.CSSProperties}
          >
            <Link
              href="/admin/job-moderation"
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              Moderation queue
            </Link>
            <Link
              href="/admin/company-verifications"
              className="rounded-lg border border-white/40 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"
            >
              Verification queue
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading dashboard…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No dashboard data available.
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Users"
              value={data.stats.users}
              icon="user"
              href="/admin/users"
              index={0}
            />
            <StatCard
              label="Companies"
              value={data.stats.companies}
              icon="building"
              href="/admin/companies"
              index={1}
            />
            <StatCard
              label="Jobs"
              value={data.stats.jobs}
              icon="briefcase"
              href="/admin/jobs"
              hint={`${data.stats.publishedJobs} published`}
              index={2}
            />
            <StatCard
              label="Published jobs"
              value={data.stats.publishedJobs}
              icon="check-circle"
              href="/admin/jobs"
              index={3}
            />
            <StatCard
              label="Applications"
              value={data.stats.applications}
              icon="envelope"
              href="/admin/applications"
              index={4}
            />
            <StatCard
              label="Pending verifications"
              value={data.stats.pendingVerifications}
              icon="shield-check"
              href="/admin/company-verifications"
              index={5}
            />
          </section>

          {/* Pending verification queue callout */}
          <section
            className="card lift mk-rise flex flex-wrap items-center justify-between gap-4 bg-brand-50"
            style={{ '--mk-delay': '140ms' } as React.CSSProperties}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600">
                <NavIcon name="shield-check" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-900">
                  {pending === 0
                    ? 'The verification queue is clear'
                    : `${pending} verification request${pending === 1 ? '' : 's'} waiting for review`}
                </p>
                <p className="mt-1 text-sm text-brand-800">
                  {pending === 0
                    ? 'New company document submissions appear here as soon as they arrive.'
                    : 'Approve or reject the documents companies submitted for verification.'}
                </p>
              </div>
            </div>
            <Link href="/admin/company-verifications" className="btn-primary">
              Open queue
            </Link>
          </section>

          {/* Status breakdowns */}
          <div className="grid gap-6 lg:grid-cols-2">
            <StatusBars
              title="Jobs by status"
              subtitle="Every posting on the platform"
              rows={data.jobsByStatus}
              kind="job"
              emptyText="No jobs in any status yet."
              delay="0ms"
            />
            <StatusBars
              title="Applications by status"
              subtitle="All company pipelines combined"
              rows={data.applicationsByStatus}
              kind="application"
              emptyText="No applications submitted yet."
              delay="70ms"
            />
          </div>

          {/* Recent postings */}
          <section
            className="card lift mk-rise"
            style={{ '--mk-delay': '140ms' } as React.CSSProperties}
          >
            <div className="mb-2 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent postings</h2>
                <p className="text-sm text-slate-500">Newest jobs across every company</p>
              </div>
              <Link
                href="/admin/jobs"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                All jobs →
              </Link>
            </div>
            {data.recentPostings.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No jobs posted yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentPostings.map((job, index) => (
                  <li
                    key={job.id}
                    className="mk-rise flex flex-wrap items-center justify-between gap-3 py-3"
                    style={
                      { '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties
                    }
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-600"
                      >
                        {job.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {job.company_name ?? 'Unknown company'} ·{' '}
                        {job.published_at
                          ? `published ${timeAgo(job.published_at)}`
                          : `created ${timeAgo(job.created_at)}`}
                      </p>
                    </div>
                    <StatusBadge kind="job" value={job.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
