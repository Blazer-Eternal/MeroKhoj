'use client';

/**
 * Employer dashboard — company banner, hiring stats, the application funnel
 * and the latest postings and applicants (GET /dashboard/employer).
 *
 * The payload nests under `data.dashboard` and already carries every number
 * this page shows, so no extra list fetches are needed.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Spinner, StatusBadge, EmptyState } from '@/components/ui';
import { NavIcon, type NavIconName } from '@/components/ui/icons';
import { formatDate, timeAgo } from '@/utils/format';
import type { EmployerDashboard } from '@/types';

function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  index,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: NavIconName;
  href: string;
  index: number;
}) {
  return (
    <Link
      href={href}
      className="card lift mk-rise flex items-center gap-4"
      style={{ '--mk-delay': `${index * 70}ms` } as React.CSSProperties}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <NavIcon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        <p className="truncate text-sm text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{hint}</p>
      </div>
    </Link>
  );
}

function FunnelRow({
  status,
  count,
  total,
}: {
  status: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0">
        <StatusBadge kind="application" value={status} />
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="mk-bar h-2 rounded-full bg-brand-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-sm font-semibold text-slate-700">
        {count} <span className="font-normal text-slate-400">{pct}%</span>
      </span>
    </div>
  );
}

export default function EmployerDashboardPage() {
  const [dash, setDash] = useState<EmployerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiGet<{ dashboard: EmployerDashboard }>(
          endpoints.dashboard.employer,
        );
        if (!cancelled) setDash(res.dashboard);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiRequestError
              ? err.message
              : 'Could not load the dashboard.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="card flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  if (!dash) return null;

  // No company yet: the onboarding state lives on /employer/company.
  if (!dash.company) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your hiring command view, once your company profile exists.
          </p>
        </header>
        <EmptyState
          icon={<NavIcon name="building" className="h-10 w-10" />}
          title="No company profile yet"
          description="Create your company to start posting jobs, reviewing applicants and scheduling interviews."
          action={
            <Link href="/employer/company" className="btn-primary">
              Create your company
            </Link>
          }
        />
      </div>
    );
  }

  const { stats, funnel, upcomingInterviews, recentPostings, recentApplicants } = dash;
  const funnelTotal = funnel.reduce((sum, row) => sum + row.count, 0);
  const today = formatDate(new Date());

  return (
    <div className="space-y-6">
      {/* Company context banner */}
      <section className="rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              className="mk-rise text-sm font-semibold text-brand-100"
              style={{ '--mk-delay': '40ms' } as React.CSSProperties}
            >
              {today}
            </p>
            <div
              className="mk-rise mt-1 flex flex-wrap items-center gap-3"
              style={{ '--mk-delay': '100ms' } as React.CSSProperties}
            >
              <h1 className="text-2xl font-extrabold sm:text-3xl">{dash.company.name}</h1>
              <StatusBadge kind="verification" value={dash.company.verification_status} />
            </div>
            <p
              className="mk-rise mt-2 max-w-xl text-sm text-brand-100"
              style={{ '--mk-delay': '170ms' } as React.CSSProperties}
            >
              {dash.company.city ?? 'Location not set'} ·{' '}
              <span className="font-bold text-white">
                {stats.activeJobs} published job{stats.activeJobs === 1 ? '' : 's'}
              </span>{' '}
              and{' '}
              <span className="font-bold text-white">
                {stats.totalApplications} application
                {stats.totalApplications === 1 ? '' : 's'}
              </span>{' '}
              in the pipeline.
            </p>
          </div>
          <div
            className="mk-rise flex flex-wrap gap-2"
            style={{ '--mk-delay': '240ms' } as React.CSSProperties}
          >
            <Link
              href="/employer/jobs"
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              Manage jobs
            </Link>
            <Link
              href="/employer/applications"
              className="rounded-lg border border-white/40 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"
            >
              Review applicants
            </Link>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Active jobs"
          value={stats.activeJobs}
          hint="Published on the board"
          icon="briefcase"
          href="/employer/jobs"
          index={0}
        />
        <StatCard
          label="Applications"
          value={stats.totalApplications}
          hint="Across every posting"
          icon="envelope"
          href="/employer/applications"
          index={1}
        />
        <StatCard
          label="Awaiting review"
          value={stats.newApplications}
          hint="Still in the applied stage"
          icon="bell"
          href="/employer/applications"
          index={2}
        />
        <StatCard
          label="Upcoming interviews"
          value={stats.upcomingInterviews}
          hint="Scheduled and confirmed"
          icon="calendar"
          href="/employer/interviews"
          index={3}
        />
        <StatCard
          label="Hires"
          value={stats.hires}
          hint="Hired or selected"
          icon="check-circle"
          href="/employer/hiring"
          index={4}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Funnel */}
        <section
          className="card lift mk-rise"
          style={{ '--mk-delay': '240ms' } as React.CSSProperties}
        >
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pipeline funnel</h2>
              <p className="text-sm text-slate-500">
                {funnelTotal} application{funnelTotal === 1 ? '' : 's'} in total
              </p>
            </div>
            <Link
              href="/employer/applications"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Details →
            </Link>
          </div>
          {funnelTotal === 0 ? (
            <p className="text-sm text-slate-500">
              No applications yet. Published jobs start collecting candidates right away.
            </p>
          ) : (
            <div className="space-y-3">
              {funnel.map((row) => (
                <FunnelRow
                  key={row.status}
                  status={row.status}
                  count={row.count}
                  total={funnelTotal}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming interviews */}
        <aside
          className="card lift mk-rise h-fit"
          style={{ '--mk-delay': '310ms' } as React.CSSProperties}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Upcoming interviews</h2>
            <Link
              href="/employer/interviews"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              All →
            </Link>
          </div>
          {upcomingInterviews.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nothing scheduled yet. Shortlist a candidate to book a slot.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcomingInterviews.map((iv) => (
                <li key={iv.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {iv.candidate_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{iv.job_title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDate(iv.scheduled_at)} · {timeAgo(iv.scheduled_at)}
                    </p>
                  </div>
                  <StatusBadge kind="interview" value={iv.status} />
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent postings */}
        <section
          className="card lift mk-rise"
          style={{ '--mk-delay': '380ms' } as React.CSSProperties}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent postings</h2>
            <Link
              href="/employer/jobs"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              All jobs →
            </Link>
          </div>
          {recentPostings.length === 0 ? (
            <p className="text-sm text-slate-500">No jobs posted yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentPostings.map((job) => (
                <li key={job.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href="/employer/jobs"
                      className="block truncate text-sm font-medium text-slate-800 hover:text-brand-600"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {job.published_at
                        ? `Published ${timeAgo(job.published_at)}`
                        : `Created ${timeAgo(job.created_at)}`}
                    </p>
                  </div>
                  <StatusBadge kind="job" value={job.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent applicants */}
        <section
          className="card lift mk-rise"
          style={{ '--mk-delay': '450ms' } as React.CSSProperties}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent applicants</h2>
            <Link
              href="/employer/applications"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              All applicants →
            </Link>
          </div>
          {recentApplicants.length === 0 ? (
            <p className="text-sm text-slate-500">
              No applications yet. Candidates appear here as they apply.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentApplicants.map((app) => (
                <li key={app.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {app.candidate_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{app.job_title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {app.applied_at ? timeAgo(app.applied_at) : ''}
                    </p>
                  </div>
                  <StatusBadge kind="application" value={app.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
