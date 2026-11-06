'use client';

/**
 * Jobseeker dashboard — welcome banner, stat cards, recommended jobs and
 * the application tracker (reference design #2).
 *
 * All numbers are derived from list endpoints (the API has no stats route):
 *   - applications → GET /applications/mine
 *   - saved jobs   → GET /saved-jobs
 *   - alerts       → GET /job-alerts
 *   - notifications→ GET /notifications/unread-count
 *   - recommended  → GET /jobs (published board)
 */
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApiList } from '@/hooks/use-api-list';
import { apiGet, apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Spinner, StatusBadge, EmptyState } from '@/components/ui';
import { displayName, formatDate, timeAgo } from '@/utils/format';
import { ApplicationStatus } from '@/enums';
import type { Application, Job, JobAlert } from '@/types';

const STATUSES_IN_TRACKER: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.UNDER_REVIEW,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.SELECTED,
  ApplicationStatus.HIRED,
];

interface UnreadCount {
  unread_count: number;
}

function StatCard({
  label,
  value,
  icon,
  href,
  hint,
}: {
  label: string;
  value: number | string;
  icon: string;
  href?: string;
  hint?: string;
}) {
  const body = (
    <div className="card flex items-center gap-4 transition-shadow hover:shadow-md">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        <p className="truncate text-sm text-slate-500">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** Compact tracker row for a single application status. */
function TrackerRow({
  status,
  count,
  total,
}: {
  status: ApplicationStatus;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0">
        <StatusBadge kind="application" value={status} />
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-brand-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-semibold text-slate-700">{count}</span>
    </div>
  );
}

/** Inline apply-less job row used in "recommended". */
function ApplyButton({ jobId }: { jobId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const apply = async () => {
    setBusy(true);
    setMsg('');
    try {
      await apiPost(endpoints.jobs.apply(jobId), {});
      setMsg('✓ Applied');
    } catch (err) {
      setMsg(err instanceof ApiRequestError ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  if (msg === '✓ Applied') {
    return (
      <span className="text-xs font-semibold text-emerald-600">✓ Applied</span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => void apply()}
      disabled={busy}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {busy ? '…' : 'Apply'}
      {msg && msg !== '✓ Applied' ? ` — ${msg}` : ''}
    </button>
  );
}

export default function JobseekerDashboardPage() {
  const { user } = useAuth();

  const applications = useApiList<Application>(endpoints.applications.mine, {
    query: { perPage: 100 },
  });
  const saved = useApiList<{ id: string; job?: Job }>(endpoints.savedJobs.list, {
    query: { perPage: 100 },
  });
  const alerts = useApiList<JobAlert>(endpoints.jobAlerts.list, {
    query: { perPage: 100 },
  });
  const jobs = useApiList<Job>(endpoints.jobs.search, {
    query: { perPage: 6, status: 'PUBLISHED' },
    anonymous: true,
  });

  // Unread notifications — separate tiny fetch (count endpoint).
  const [unread, setUnread] = useState<number | null>(null);
  useEffect(() => {
    void apiGet<UnreadCount>(endpoints.notifications.unreadCount)
      .then((r) => setUnread(r.unread_count))
      .catch(() => setUnread(null));
  }, []);

  const tracker = useMemo(() => {
    const counts = new Map<ApplicationStatus, number>();
    for (const app of applications.data) {
      counts.set(app.status, (counts.get(app.status) ?? 0) + 1);
    }
    return counts;
  }, [applications.data]);

  const activeCount = applications.data.filter(
    (a) => a.status !== ApplicationStatus.WITHDRAWN && a.status !== ApplicationStatus.REJECTED,
  ).length;

  const firstName = user ? displayName(user).split(' ')[0] : 'there';
  const today = formatDate(new Date());

  const loading =
    applications.loading || saved.loading || alerts.loading || jobs.loading;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-100">{today}</p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-2 max-w-xl text-sm text-brand-100">
              You have{' '}
              <span className="font-bold text-white">{activeCount} active application
              {activeCount === 1 ? '' : 's'}</span>{' '}
              and{' '}
              <span className="font-bold text-white">{saved.data.length} saved job
              {saved.data.length === 1 ? '' : 's'}</span>
              {unread ? (
                <>
                  {' '}· <span className="font-bold text-white">{unread} unread notification{unread === 1 ? '' : 's'}</span>
                </>
              ) : null}
              . Keep the search going.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/jobs"
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              Browse jobs
            </Link>
            <Link
              href="/jobseeker/profile"
              className="rounded-lg border border-white/40 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"
            >
              Complete profile
            </Link>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Applications"
          value={applications.data.length}
          icon="📨"
          href="/jobseeker/applications"
          hint={`${activeCount} active`}
        />
        <StatCard
          label="Saved jobs"
          value={saved.data.length}
          icon="🔖"
          href="/jobseeker/saved-jobs"
        />
        <StatCard
          label="Job alerts"
          value={alerts.data.filter((a) => a.is_active).length}
          icon="🔔"
          href="/jobseeker/job-alerts"
          hint={`${alerts.data.length} total`}
        />
        <StatCard
          label="Unread notifications"
          value={unread ?? '—'}
          icon="📣"
          href="/jobseeker/notifications"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Recommended jobs */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recommended for you</h2>
              <p className="text-sm text-slate-500">Fresh published roles on the board</p>
            </div>
            <Link href="/jobs" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>

          {jobs.loading ? (
            <div className="card flex items-center gap-3 text-sm text-slate-500">
              <Spinner /> Loading jobs…
            </div>
          ) : jobs.error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              {jobs.error}
            </div>
          ) : jobs.data.length === 0 ? (
            <EmptyState
              title="No jobs posted yet"
              description="Check back soon — new roles are added daily."
            />
          ) : (
            <div className="space-y-3">
              {jobs.data.map((job) => (
                <article
                  key={job.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-semibold text-slate-900 hover:text-brand-600"
                      >
                        {job.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {job.location ?? 'Remote'} ·{' '}
                        {job.employment_type.replace(/_/g, ' ').toLowerCase()}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Posted {timeAgo(job.published_at ?? job.created_at)}
                      </p>
                    </div>
                    <ApplyButton jobId={job.id} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Application tracker */}
        <aside className="h-fit space-y-6">
          <section className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Application tracker</h2>
              <Link
                href="/jobseeker/applications"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Details →
              </Link>
            </div>

            {applications.loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Spinner /> Loading…
              </div>
            ) : applications.error ? (
              <p className="text-sm text-red-600">{applications.error}</p>
            ) : applications.data.length === 0 ? (
              <div className="text-center">
                <p className="text-sm text-slate-500">No applications yet.</p>
                <Link href="/jobs" className="btn-primary mt-3 inline-flex text-sm">
                  Find your first job
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {STATUSES_IN_TRACKER.map((status) => (
                  <TrackerRow
                    key={status}
                    status={status}
                    count={tracker.get(status) ?? 0}
                    total={applications.data.length}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recent activity */}
          <section className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent applications</h2>
            </div>
            {applications.data.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing here yet.</p>
            ) : (
              <ul className="space-y-3">
                {applications.data.slice(0, 5).map((app) => (
                  <li key={app.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/jobs/${app.job_id}`}
                        className="block truncate text-sm font-medium text-slate-800 hover:text-brand-600"
                      >
                        {app.job?.title ?? 'Job'}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {app.applied_at ? timeAgo(app.applied_at) : ''}
                      </p>
                    </div>
                    <StatusBadge kind="application" value={app.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Profile completeness nudge */}
          <section className="card bg-brand-50">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-semibold text-brand-900">Stand out to employers</p>
                <p className="mt-1 text-sm text-brand-800">
                  Add your education, experience and a default resume — profiles with complete
                  details get more interviews.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/jobseeker/education" className="btn-secondary bg-white text-xs">
                    Education
                  </Link>
                  <Link href="/jobseeker/experience" className="btn-secondary bg-white text-xs">
                    Experience
                  </Link>
                  <Link href="/jobseeker/resumes" className="btn-secondary bg-white text-xs">
                    Resumes
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {loading && applications.data.length === 0 && (
        <div className="flex items-center justify-center py-6">
          <Spinner />
        </div>
      )}
    </div>
  );
}
