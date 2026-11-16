'use client';

/**
 * Platform-wide application pipeline (every company).
 *
 *   GET   /applications?status=&job_id=&perPage= → admin sees all companies
 *   PATCH /applications/:id/status { status, reason? }
 *
 * The status change is available to platform admins on the backend
 * (requireEmployer includes ADMIN) and validates each move against the
 * employer transition table, mirrored below.
 */
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { apiPatch, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import {
  Button,
  Badge,
  StatusBadge,
  Spinner,
  EmptyState,
  Select,
  Modal,
  Field,
  Textarea,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { ApplicationSource, ApplicationStatus, JobStatus } from '@/enums';
import { formatDate, timeAgo } from '@/utils/format';

/** Admin list row: `jobseeker` here is the applicant's user record. */
interface AdminApplicationRow {
  id: string;
  job_id: string;
  status: ApplicationStatus;
  source: ApplicationSource;
  applied_at: string | null;
  created_at: string;
  cover_letter: string | null;
  withdrawn_at?: string | null;
  job?: { id: string; title: string; company_id: string; status: JobStatus } | null;
  jobseeker?: { id: string; first_name: string; last_name: string; email: string } | null;
}

/** Mirrors APPLICATION_STATUS_TRANSITIONS (employer side) from the backend. */
const NEXT_STATUSES: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.APPLIED]: [
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.UNDER_REVIEW]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.INTERVIEW]: [
    ApplicationStatus.SELECTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.SELECTED]: [
    ApplicationStatus.HIRED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.HIRED]: [],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};

const humanize = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminApplicationsPage() {
  const [status, setStatus] = useState('');
  const [jobId, setJobId] = useState('');

  const applications = useApiList<AdminApplicationRow>(
    withQuery(endpoints.applications.list, { status, job_id: jobId, perPage: 100 }),
  );
  const publishedJobs = useApiList<{
    id: string;
    title: string;
  }>(withQuery(endpoints.jobs.search, { status: JobStatus.PUBLISHED, perPage: 100 }));

  // Job filter options: published jobs plus anything the pipeline references.
  const [jobOptions, setJobOptions] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    if (publishedJobs.data.length === 0 && applications.data.length === 0) return;
    setJobOptions((prev) => {
      const next = new Map(prev);
      for (const job of publishedJobs.data) next.set(job.id, job.title);
      for (const app of applications.data) {
        if (app.job) next.set(app.job.id, app.job.title);
      }
      return next;
    });
  }, [publishedJobs.data, applications.data]);

  // Status change modal
  const [target, setTarget] = useState<AdminApplicationRow | null>(null);
  const [nextStatus, setNextStatus] = useState<ApplicationStatus>(ApplicationStatus.UNDER_REVIEW);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const app of applications.data) {
      map.set(app.status, (map.get(app.status) ?? 0) + 1);
    }
    return map;
  }, [applications.data]);

  const openChange = (app: AdminApplicationRow) => {
    const options = NEXT_STATUSES[app.status];
    setTarget(app);
    setNextStatus(options[0] ?? ApplicationStatus.REJECTED);
    setReason('');
    setFormError('');
  };

  const submitChange = async () => {
    if (!target) return;
    if (nextStatus === target.status) {
      setFormError('Pick a different status.');
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      await apiPatch(endpoints.applications.status(target.id), {
        status: nextStatus,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      setTarget(null);
      setMsg({ ok: true, text: `Application moved to ${humanize(nextStatus)}.` });
      applications.refetch();
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.message : 'Could not change the status.',
      );
    } finally {
      setBusy(false);
    }
  };

  const hasFilters = Boolean(status || jobId);
  const clearFilters = () => {
    setStatus('');
    setJobId('');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {applications.data.length} application{applications.data.length === 1 ? '' : 's'}{' '}
            across every company.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-56">
            <Select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              aria-label="Filter by job"
            >
              <option value="">All jobs</option>
              {Array.from(jobOptions.entries()).map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-52">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {Object.values(ApplicationStatus).map((value) => (
                <option key={value} value={value}>
                  {humanize(value)}
                  {counts.get(value) ? ` (${counts.get(value)})` : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </header>

      {msg && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            msg.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      {applications.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading applications…
        </div>
      ) : applications.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {applications.error}
        </div>
      ) : applications.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="envelope" className="h-10 w-10" />}
          title={hasFilters ? 'No applications match those filters' : 'No applications yet'}
          description={
            hasFilters
              ? 'Try a different job or status.'
              : 'Applications arrive as soon as jobseekers apply to published jobs.'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Link href="/admin/jobs" className="btn-secondary">
                Browse jobs
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {applications.data.map((app, index) => {
            const candidate = app.jobseeker;
            const canChange = NEXT_STATUSES[app.status].length > 0;
            return (
              <li
                key={app.id}
                className="card lift mk-rise"
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {candidate
                          ? `${candidate.first_name} ${candidate.last_name}`
                          : 'Candidate'}
                      </p>
                      <StatusBadge kind="application" value={app.status} />
                      <Badge tone="slate">{app.source.replace(/_/g, ' ').toLowerCase()}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {candidate?.email ?? 'Email not available'} ·{' '}
                      <Link
                        href={`/jobs/${app.job_id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {app.job?.title ?? 'Job posting'}
                      </Link>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Applied {app.applied_at ? formatDate(app.applied_at) : timeAgo(app.created_at)}
                      {app.withdrawn_at ? ` · withdrawn ${formatDate(app.withdrawn_at)}` : ''}
                    </p>
                    {app.cover_letter && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        “{app.cover_letter}”
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/jobs/${app.job_id}`} className="btn-secondary px-3 py-1.5 text-xs">
                      View job
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!canChange}
                      title={
                        canChange
                          ? 'Change application status'
                          : 'This application is in a terminal state'
                      }
                      onClick={() => openChange(app)}
                    >
                      Change status
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Status change modal */}
      <Modal
        open={target !== null}
        title="Change application status"
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button loading={busy} onClick={() => void submitChange()}>
              Save status
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {target && (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">
                {target.jobseeker
                  ? `${target.jobseeker.first_name} ${target.jobseeker.last_name}`
                  : 'Candidate'}
              </span>{' '}
              applied to{' '}
              <span className="font-medium text-slate-800">
                {target.job?.title ?? 'this job'}
              </span>{' '}
              · currently {humanize(target.status)}
            </p>
          )}
          {target && (
            <Field label="New status" required htmlFor="app-status">
              <Select
                id="app-status"
                value={nextStatus}
                onChange={(e) => {
                  setNextStatus(e.target.value as ApplicationStatus);
                  setFormError('');
                }}
              >
                {NEXT_STATUSES[target.status].map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field
            label="Reason"
            hint="Optional. Recorded in the application status history."
            htmlFor="app-reason"
          >
            <Textarea
              id="app-reason"
              rows={2}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this status changing?"
            />
          </Field>
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
