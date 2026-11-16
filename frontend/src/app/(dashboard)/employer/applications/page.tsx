'use client';

/**
 * Employer applicant pipeline — every application to this company's jobs.
 *
 *   GET   /companies/:id/applications?status=&job_id=&perPage=
 *   PATCH /applications/:id/status { status, reason? }
 *   GET   /applications/:id/history   → { history } (oldest first)
 *
 * The status moves mirror APPLICATION_STATUS_TRANSITIONS on the backend; a
 * terminal application (hired, rejected, withdrawn) has no moves left and the
 * button disables. Each change can carry a reason that lands in the history.
 */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCompany } from '@/hooks/use-company';
import { useApiList } from '@/hooks/use-api-list';
import { apiGet, apiPatch, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import {
  Button,
  Badge,
  StatusBadge,
  Spinner,
  EmptyState,
  Field,
  Select,
  Textarea,
  Modal,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { ApplicationSource, ApplicationStatus, JobStatus } from '@/enums';
import { formatDate, timeAgo, humanize } from '@/utils/format';
import type { Job } from '@/types';

/** Company pipeline row: `jobseeker` is the applicant's user record. */
interface PipelineRow {
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

/** History row as `GET /applications/:id/history` returns it. */
interface HistoryRow {
  id: string;
  old_status: ApplicationStatus | null;
  new_status: ApplicationStatus;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
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

const candidateName = (row: PipelineRow): string =>
  row.jobseeker
    ? `${row.jobseeker.first_name} ${row.jobseeker.last_name}`.trim()
    : 'Candidate';

export default function EmployerApplicationsPage() {
  const { company, loading: companyLoading, error: companyError } = useCompany();
  const companyId = company?.id ?? null;

  const [status, setStatus] = useState('');
  const [jobId, setJobId] = useState('');

  const applications = useApiList<PipelineRow>(
    companyId
      ? withQuery(endpoints.companies.applications(companyId), {
          status,
          job_id: jobId,
          perPage: 100,
        })
      : null,
  );
  const jobs = useApiList<Job>(
    companyId ? withQuery(endpoints.companies.jobs(companyId), { perPage: 100 }) : null,
  );

  const jobTitle = useMemo(() => {
    const map = new Map<string, string>();
    for (const job of jobs.data) map.set(job.id, job.title);
    return map;
  }, [jobs.data]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const app of applications.data) {
      map.set(app.status, (map.get(app.status) ?? 0) + 1);
    }
    return map;
  }, [applications.data]);

  // Status change modal
  const [target, setTarget] = useState<PipelineRow | null>(null);
  const [nextStatus, setNextStatus] = useState<ApplicationStatus>(ApplicationStatus.UNDER_REVIEW);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  // History modal
  const [historyFor, setHistoryFor] = useState<PipelineRow | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const openChange = (app: PipelineRow) => {
    const options = NEXT_STATUSES[app.status];
    setTarget(app);
    setNextStatus(options[0] ?? ApplicationStatus.REJECTED);
    setReason('');
    setFormError('');
  };

  const submitChange = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const openHistory = async (app: PipelineRow) => {
    setHistoryFor(app);
    setHistory([]);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      const res = await apiGet<{ history: HistoryRow[] }>(
        endpoints.applications.history(app.id),
      );
      setHistory(res.history);
    } catch (err) {
      setHistoryError(
        err instanceof ApiRequestError ? err.message : 'Could not load the status history.',
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const hasFilters = Boolean(status || jobId);
  const clearFilters = () => {
    setStatus('');
    setJobId('');
  };

  if (companyLoading) {
    return (
      <div className="card flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading applications…
      </div>
    );
  }

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Applications</h1>
        <p className="mt-1 text-sm text-slate-500">
          {company
            ? `${applications.data.length} application${applications.data.length === 1 ? '' : 's'} in the pipeline.`
            : 'Create a company to receive applications.'}
        </p>
      </div>
      <Link href="/employer/hiring" className="btn-secondary">
        Hiring decisions
      </Link>
    </header>
  );

  if (companyError) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {companyError}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={<NavIcon name="envelope" className="h-10 w-10" />}
          title="No company yet"
          description="Applications arrive once your company has published jobs."
        />
      </div>
    );
  }

  const loading = applications.loading || jobs.loading;
  const listError = applications.error || jobs.error;

  return (
    <div className="space-y-6">
      {header}

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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            aria-label="Filter by job"
          >
            <option value="">All jobs</option>
            {jobs.data.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
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
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading applications…
        </div>
      ) : listError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {listError}
        </div>
      ) : applications.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="envelope" className="h-10 w-10" />}
          title={hasFilters ? 'No applications match those filters' : 'No applications yet'}
          description={
            hasFilters
              ? 'Try a different job or status.'
              : 'Candidates appear here as soon as they apply to a published job.'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Link href="/employer/jobs" className="btn-secondary">
                Manage jobs
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {applications.data.map((app, index) => {
            const options = NEXT_STATUSES[app.status];
            return (
              <li
                key={app.id}
                className="card lift mk-rise"
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{candidateName(app)}</p>
                      <StatusBadge kind="application" value={app.status} />
                      <Badge tone="slate">{app.source.replace(/_/g, ' ').toLowerCase()}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {app.jobseeker?.email ?? 'Email not available'} ·{' '}
                      <Link
                        href={`/jobs/${app.job_id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {app.job?.title ?? jobTitle.get(app.job_id) ?? 'Job posting'}
                      </Link>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Applied{' '}
                      {app.applied_at ? formatDate(app.applied_at) : timeAgo(app.created_at)}
                      {app.withdrawn_at ? ` · withdrawn ${formatDate(app.withdrawn_at)}` : ''}
                    </p>
                    {app.cover_letter && (
                      <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-slate-500">
                        &ldquo;{app.cover_letter}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/employer/interviews?application=${app.id}`}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      Schedule
                    </Link>
                    <Button variant="secondary" size="sm" onClick={() => void openHistory(app)}>
                      History
                    </Button>
                    <Button
                      size="sm"
                      disabled={options.length === 0}
                      title={
                        options.length > 0
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
            <Button type="submit" form="app-status-form" loading={busy}>
              Save status
            </Button>
          </>
        }
      >
        <form id="app-status-form" onSubmit={submitChange} className="space-y-4" noValidate>
          {target && (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{candidateName(target)}</span>{' '}
              applied to{' '}
              <span className="font-medium text-slate-800">
                {target.job?.title ?? jobTitle.get(target.job_id) ?? 'this job'}
              </span>{' '}
              · currently {humanize(target.status)}
            </p>
          )}
          {target && (
            <Field label="New status" required htmlFor="ap-status">
              <Select
                id="ap-status"
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
            htmlFor="ap-reason"
          >
            <Textarea
              id="ap-reason"
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
        </form>
      </Modal>

      {/* History modal */}
      <Modal
        open={historyFor !== null}
        title="Status history"
        onClose={() => setHistoryFor(null)}
        footer={
          <Button variant="secondary" onClick={() => setHistoryFor(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          {historyFor && (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{candidateName(historyFor)}</span>{' '}
              · {historyFor.job?.title ?? jobTitle.get(historyFor.job_id) ?? 'Job posting'}
            </p>
          )}
          {historyLoading ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Spinner /> Loading history…
            </div>
          ) : historyError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {historyError}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-500">No status changes recorded yet.</p>
          ) : (
            <ol className="space-y-3">
              {history.map((row, index) => (
                <li
                  key={row.id}
                  className="rounded-lg border border-slate-200 px-3 py-2.5"
                  style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-slate-500">
                      {row.old_status ? humanize(row.old_status) : 'New'}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="font-semibold text-slate-800">
                      {humanize(row.new_status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(row.created_at)} · {timeAgo(row.created_at)}
                  </p>
                  {row.reason && (
                    <p className="mt-1 text-sm text-slate-600">{row.reason}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </Modal>
    </div>
  );
}
