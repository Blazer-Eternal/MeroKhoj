'use client';

/** Saved jobs list + unsave (GET /saved-jobs, DELETE /saved-jobs/:jobId). */
import Link from 'next/link';
import { apiDelete, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { useApiList } from '@/hooks/use-api-list';
import { Button, Spinner, EmptyState, Badge } from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants';
import type { SavedJob } from '@/types';
import { excerpt, formatSalaryRange, timeAgo } from '@/utils/format';
import { useState } from 'react';

export default function SavedJobsPage() {
  const saved = useApiList<SavedJob>(endpoints.savedJobs.list, { query: { perPage: 100 } });
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const unsave = async (jobId: string) => {
    setBusyId(jobId);
    setError('');
    try {
      await apiDelete(endpoints.savedJobs.toggle(jobId));
      saved.refetch();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not remove the job.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Saved jobs</h1>
        <p className="mt-1 text-sm text-slate-500">
          {saved.data.length} saved job{saved.data.length === 1 ? '' : 's'}. Come back and
          apply before the deadline.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading saved jobs…
        </div>
      ) : saved.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {saved.error}
        </div>
      ) : saved.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="bookmark" className="h-10 w-10" />}
          title="No saved jobs yet"
          description="Tap “Save job” on any posting to keep it here for later."
          action={
            <Link href="/jobs" className="btn-primary">
              Browse jobs
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {saved.data.map((entry) => {
            const job = entry.job;
            return (
              <li key={entry.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/jobs/${entry.job_id}`}
                        className="font-semibold text-slate-900 hover:text-brand-600"
                      >
                        {job?.title ?? 'Job posting'}
                      </Link>
                      {job && (
                        <Badge tone="green">
                          {formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency)}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {job?.location ?? 'Remote'}
                      {job
                        ? ` · ${EMPLOYMENT_TYPE_LABELS[job.employment_type] ?? job.employment_type}`
                        : ''}{' '}
                      · saved {timeAgo(entry.created_at)}
                    </p>
                    {job?.description && (
                      <p className="mt-2 text-sm text-slate-600">{excerpt(job.description, 150)}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/jobs/${entry.job_id}`} className="btn-secondary px-3 py-1.5 text-xs">
                      View
                    </Link>
                    <Link href={`/jobs/${entry.job_id}`} className="btn-primary px-3 py-1.5 text-xs">
                      Apply
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busyId === entry.job_id}
                      onClick={() => void unsave(entry.job_id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
