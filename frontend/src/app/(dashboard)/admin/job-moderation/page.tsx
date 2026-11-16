'use client';

/**
 * Job moderation queue — jobs waiting for review plus per-job history.
 *
 *   GET  /jobs?status=PENDING_REVIEW&perPage=        → queue
 *   POST /admin/moderation/jobs/:jobId { action, reason? }
 *   GET  /admin/moderation/jobs/:jobId/history       → { history }
 *
 * Moderation actions move the job status in the same transaction:
 *   APPROVED → PUBLISHED   REJECTED → CANCELLED
 *   FLAGGED  → PAUSED      REMOVED  → CLOSED
 * REJECTED and REMOVED require a reason (validated server-side too).
 */
import Link from 'next/link';
import { useState } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { apiGet, apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import {
  Button,
  Badge,
  StatusBadge,
  Spinner,
  EmptyState,
  Modal,
  Field,
  Select,
  Textarea,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { JobStatus, ModerationAction } from '@/enums';
import type { Job } from '@/types';
import { formatDate, timeAgo } from '@/utils/format';

/**
 * History row as the API returns it. The shared `JobModeration` type names
 * this actor `moderated_by`, but the backend column (and JSON key) is
 * `reviewed_by`, so the page declares its own shape.
 */
interface ModerationEntry {
  id: string;
  job_id: string;
  reviewed_by: string | null;
  action: ModerationAction;
  reason: string | null;
  created_at: string;
}

/** Mirrors MODERATION_ACTIONS_REQUIRING_REASON (backend enum, no frontend copy). */
const REASON_REQUIRED: ModerationAction[] = [ModerationAction.REJECTED, ModerationAction.REMOVED];

/** Mirrors MODERATION_JOB_STATUS (backend enum). */
const ACTION_TARGET_STATUS: Record<ModerationAction, JobStatus> = {
  [ModerationAction.APPROVED]: JobStatus.PUBLISHED,
  [ModerationAction.REJECTED]: JobStatus.CANCELLED,
  [ModerationAction.FLAGGED]: JobStatus.PAUSED,
  [ModerationAction.REMOVED]: JobStatus.CLOSED,
};

const ACTION_TONES: Record<ModerationAction, 'green' | 'red' | 'amber' | 'slate'> = {
  [ModerationAction.APPROVED]: 'green',
  [ModerationAction.REJECTED]: 'red',
  [ModerationAction.FLAGGED]: 'amber',
  [ModerationAction.REMOVED]: 'slate',
};

const humanize = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function JobModerationPage() {
  const queue = useApiList<Job>(
    withQuery(endpoints.jobs.search, { status: JobStatus.PENDING_REVIEW, perPage: 100 }),
  );

  // Action modal state
  const [target, setTarget] = useState<Job | null>(null);
  const [action, setAction] = useState<ModerationAction>(ModerationAction.APPROVED);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  // History modal state
  const [historyJob, setHistoryJob] = useState<Job | null>(null);
  const [history, setHistory] = useState<ModerationEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const openAction = (job: Job) => {
    setTarget(job);
    setAction(ModerationAction.APPROVED);
    setReason('');
    setFormError('');
  };

  const openHistory = (job: Job) => {
    setHistoryJob(job);
    setHistory([]);
    setHistoryError('');
    setHistoryLoading(true);
    void apiGet<{ history: ModerationEntry[] }>(endpoints.admin.moderation.history(job.id))
      .then((res) => setHistory(res.history))
      .catch((err: unknown) =>
        setHistoryError(
          err instanceof ApiRequestError ? err.message : 'Could not load the history.',
        ),
      )
      .finally(() => setHistoryLoading(false));
  };

  const submitAction = async () => {
    if (!target) return;
    const trimmed = reason.trim();
    if (REASON_REQUIRED.includes(action) && !trimmed) {
      setFormError(`A reason is required for the ${humanize(action)} action.`);
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      await apiPost(endpoints.admin.moderation.moderate(target.id), {
        action,
        ...(trimmed ? { reason: trimmed } : {}),
      });
      setTarget(null);
      setMsg({
        ok: true,
        text: `${humanize(action)}: job moved to ${humanize(ACTION_TARGET_STATUS[action])}.`,
      });
      queue.refetch();
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.message : 'Could not apply the action.',
      );
    } finally {
      setBusy(false);
    }
  };

  const pending = queue.data.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Job moderation</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pending} job{pending === 1 ? '' : 's'} waiting for review · approve, reject, flag
            or remove.
          </p>
        </div>
        <Link href="/admin/jobs" className="btn-secondary">
          All jobs
        </Link>
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

      {queue.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading the moderation queue…
        </div>
      ) : queue.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {queue.error}
        </div>
      ) : queue.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="shield" className="h-10 w-10" />}
          title="Nothing waiting for review"
          description="Jobs submitted by employers land here until a moderator decides. New submissions will show up automatically."
          action={
            <Link href="/admin/jobs" className="btn-secondary">
              Browse published jobs
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {queue.data.map((job, index) => (
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
                    Submitted {timeAgo(job.created_at)}
                    {job.application_deadline
                      ? ` · deadline ${formatDate(job.application_deadline)}`
                      : ''}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{job.description}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Button variant="primary" size="sm" onClick={() => openAction(job)}>
                    Review
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openHistory(job)}>
                    History
                  </Button>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="btn-secondary px-3 py-1.5 text-center text-xs"
                  >
                    View
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Moderation action modal */}
      <Modal
        open={target !== null}
        title="Moderate job"
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button loading={busy} onClick={() => void submitAction()}>
              Apply action
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {target && (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{target.title}</span> at{' '}
              {target.company?.name ?? 'Unknown company'}
            </p>
          )}
          <Field
            label="Action"
            hint={`The job moves to ${humanize(ACTION_TARGET_STATUS[action])} once applied.`}
            htmlFor="mod-action"
            required
          >
            <Select
              id="mod-action"
              value={action}
              onChange={(e) => {
                setAction(e.target.value as ModerationAction);
                setFormError('');
              }}
            >
              {Object.values(ModerationAction).map((value) => (
                <option key={value} value={value}>
                  {humanize(value)} (job becomes {ACTION_TARGET_STATUS[value]})
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Reason"
            required={REASON_REQUIRED.includes(action)}
            hint={
              REASON_REQUIRED.includes(action)
                ? 'Required for rejection and removal. Stored in the moderation history.'
                : 'Optional note stored in the moderation history.'
            }
            htmlFor="mod-reason"
          >
            <Textarea
              id="mod-reason"
              rows={3}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this decision being made?"
            />
          </Field>
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
        </div>
      </Modal>

      {/* History modal */}
      <Modal
        open={historyJob !== null}
        title="Moderation history"
        onClose={() => setHistoryJob(null)}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setHistoryJob(null)}>
            Close
          </Button>
        }
      >
        {historyJob && (
          <p className="mb-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{historyJob.title}</span>
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
          <p className="text-sm text-slate-500">This job has never been moderated.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((entry, index) => (
              <li
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone={ACTION_TONES[entry.action]}>{humanize(entry.action)}</Badge>
                    <span className="text-xs text-slate-400">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    by {entry.reviewed_by ? entry.reviewed_by.slice(0, 8) : 'system'}
                  </span>
                </div>
                {entry.reason && (
                  <p className="mt-2 text-sm text-slate-600">“{entry.reason}”</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
