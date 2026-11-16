'use client';

/**
 * Admin job directory — one tab per JobStatus, platform-wide.
 *
 *   GET /jobs?status=&q=&company_id=&perPage=
 *
 * Note: without a status param the public endpoint defaults to PUBLISHED
 * only, so every tab always sends an explicit status. Deep links from the
 * company page pass `?company=<id>`; the moderation tab opens the queue.
 */
import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApiList } from '@/hooks/use-api-list';
import { endpoints, withQuery } from '@/services/api-endpoints';
import { Button, Badge, StatusBadge, Spinner, EmptyState, Input } from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { JobStatus } from '@/enums';
import type { Company, Job } from '@/types';
import { formatDate } from '@/utils/format';

const TABS: JobStatus[] = [
  JobStatus.PUBLISHED,
  JobStatus.PENDING_REVIEW,
  JobStatus.DRAFT,
  JobStatus.PAUSED,
  JobStatus.CLOSED,
  JobStatus.CANCELLED,
];

const humanize = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function JobsExplorer() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<JobStatus>(() => {
    const initial = searchParams.get('status');
    return TABS.includes(initial as JobStatus) ? (initial as JobStatus) : JobStatus.PUBLISHED;
  });
  const [companyId, setCompanyId] = useState(searchParams.get('company') ?? '');
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');

  const jobs = useApiList<Job>(
    withQuery(endpoints.jobs.search, {
      status,
      q,
      company_id: companyId,
      perPage: 100,
    }),
  );
  const companies = useApiList<Company>(withQuery(endpoints.companies.list, { perPage: 100 }));

  const companyName = companies.data.find((c) => c.id === companyId)?.name ?? null;

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    setQ(draft.trim());
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">
            {jobs.data.length} job{jobs.data.length === 1 ? '' : 's'} in {humanize(status)} ·
            every company on the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={submitSearch} className="flex items-center gap-2">
            <div className="w-56">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Search job titles"
                aria-label="Search jobs"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          <Link href="/admin/job-moderation" className="btn-secondary">
            Moderation queue
          </Link>
        </div>
      </header>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatus(tab)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              status === tab
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {humanize(tab)}
          </button>
        ))}
      </div>

      {/* Company deep-link chip */}
      {companyId && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="blue">
            Filtered to {companyName ?? `company ${companyId.slice(0, 8)}`}
          </Badge>
          <button
            type="button"
            onClick={() => setCompanyId('')}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Clear company filter
          </button>
        </div>
      )}

      {jobs.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading jobs…
        </div>
      ) : jobs.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {jobs.error}
        </div>
      ) : jobs.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="briefcase" className="h-10 w-10" />}
          title={`No ${humanize(status).toLowerCase()} jobs`}
          description={
            q || companyId
              ? 'Nothing matches the current search and filters.'
              : status === JobStatus.PENDING_REVIEW
                ? 'The moderation queue is empty. New submissions appear here for review.'
                : 'Jobs move into this status as employers and moderators act on them.'
          }
          action={
            q || companyId ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQ('');
                  setDraft('');
                  setCompanyId('');
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Link href="/admin/job-moderation" className="btn-secondary">
                Open moderation queue
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {jobs.data.map((job, index) => (
            <li
              key={job.id}
              className="card lift mk-rise"
              style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-semibold text-slate-900 hover:text-brand-600"
                    >
                      {job.title}
                    </Link>
                    <StatusBadge kind="job" value={job.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {job.company?.name ?? 'Unknown company'} · {job.location ?? 'Remote'} ·{' '}
                    {job.employment_type.replace(/_/g, ' ').toLowerCase()}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {job.published_at
                      ? `Published ${formatDate(job.published_at)}`
                      : `Created ${formatDate(job.created_at)}`}
                    {job.application_deadline
                      ? ` · deadline ${formatDate(job.application_deadline)}`
                      : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/jobs/${job.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                    View
                  </Link>
                  {job.status === JobStatus.PENDING_REVIEW && (
                    <Link
                      href="/admin/job-moderation"
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      Moderate
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading jobs…
        </div>
      }
    >
      <JobsExplorer />
    </Suspense>
  );
}
