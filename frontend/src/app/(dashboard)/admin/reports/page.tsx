'use client';

/**
 * Abuse reports triage — resolve or dismiss reports filed by users.
 *
 *   GET   /reports?status=            → { reports } (admin only)
 *   PATCH /reports/:id/status { status: RESOLVED | DISMISSED, reason? }
 *
 * The backend transition table allows OPEN and UNDER_REVIEW reports to move
 * straight to RESOLVED or DISMISSED; terminal reports are read-only. The
 * optional reason is written to the audit trail with the transition.
 */
import Link from 'next/link';
import { useState } from 'react';
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
import { ReportEntityType, ReportStatus } from '@/enums';
import { timeAgo } from '@/utils/format';

/** Row as the API returns it (the shared `Report` type uses older names). */
interface ReportRow {
  id: string;
  reported_by: string;
  entity_type: ReportEntityType;
  entity_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

const ENTITY_TONES: Record<ReportEntityType, 'blue' | 'teal' | 'amber'> = {
  [ReportEntityType.USER]: 'blue',
  [ReportEntityType.COMPANY]: 'teal',
  [ReportEntityType.JOB]: 'amber',
};

const TERMINAL: ReportStatus[] = [ReportStatus.RESOLVED, ReportStatus.DISMISSED];

const humanize = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminReportsPage() {
  const [status, setStatus] = useState('');
  const reports = useApiList<ReportRow>(
    withQuery(endpoints.admin.reports.list, { status, perPage: 100 }),
  );

  const [target, setTarget] = useState<ReportRow | null>(null);
  const [decision, setDecision] = useState<ReportStatus.RESOLVED | ReportStatus.DISMISSED>(
    ReportStatus.RESOLVED,
  );
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const openDecision = (report: ReportRow, next: ReportStatus.RESOLVED | ReportStatus.DISMISSED) => {
    setTarget(report);
    setDecision(next);
    setReason('');
    setFormError('');
  };

  const submitDecision = async () => {
    if (!target) return;
    setBusy(true);
    setFormError('');
    try {
      await apiPatch(endpoints.admin.reports.status(target.id), {
        status: decision,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      setTarget(null);
      setMsg({ ok: true, text: `Report marked ${humanize(decision)}.` });
      reports.refetch();
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.message : 'Could not update the report.',
      );
    } finally {
      setBusy(false);
    }
  };

  const hasFilter = Boolean(status);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            {reports.data.length} report{reports.data.length === 1 ? '' : 's'} loaded ·
            resolve or dismiss to close them.
          </p>
        </div>
        <div className="w-56">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter reports by status"
          >
            <option value="">All statuses</option>
            {Object.values(ReportStatus).map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </Select>
        </div>
      </header>

      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {msg.text}
        </div>
      )}

      {reports.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading reports…
        </div>
      ) : reports.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {reports.error}
        </div>
      ) : reports.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="flag" className="h-10 w-10" />}
          title={hasFilter ? 'No reports with that status' : 'No reports filed'}
          description={
            hasFilter
              ? 'Try a different status filter.'
              : 'Users can flag abusive jobs, companies or accounts. Anything they report lands here for triage.'
          }
          action={
            hasFilter ? (
              <Button variant="secondary" onClick={() => setStatus('')}>
                Clear filter
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-4">
          {reports.data.map((report, index) => {
            const open = !TERMINAL.includes(report.status);
            const entityHref =
              report.entity_type === ReportEntityType.JOB
                ? `/jobs/${report.entity_id}`
                : report.entity_type === ReportEntityType.COMPANY
                  ? `/companies/${report.entity_id}`
                  : null;
            return (
              <li
                key={report.id}
                className="card lift mk-rise"
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={ENTITY_TONES[report.entity_type]}>
                        {humanize(report.entity_type)}
                      </Badge>
                      <StatusBadge kind="report" value={report.status} />
                      <span className="text-xs text-slate-400">{timeAgo(report.created_at)}</span>
                    </div>
                    <p className="mt-1.5 font-semibold text-slate-900">{report.reason}</p>
                    {report.description && (
                      <p className="mt-1 line-clamp-3 text-sm text-slate-500">
                        {report.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-slate-400">
                      Reporter {report.reported_by.slice(0, 8)} · target{' '}
                      {entityHref ? (
                        <Link
                          href={entityHref}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-brand-600 hover:text-brand-700"
                        >
                          {report.entity_id.slice(0, 8)} (open)
                        </Link>
                      ) : (
                        report.entity_id.slice(0, 8)
                      )}
                    </p>
                    {!open && report.resolved_at && (
                      <p className="mt-1 text-xs text-slate-400">
                        Closed {timeAgo(report.resolved_at)}
                        {report.resolved_by ? ` by ${report.resolved_by.slice(0, 8)}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {open ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openDecision(report, ReportStatus.RESOLVED)}
                        >
                          Resolve
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openDecision(report, ReportStatus.DISMISSED)}
                        >
                          Dismiss
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Closed</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Decision modal */}
      <Modal
        open={target !== null}
        title={decision === ReportStatus.RESOLVED ? 'Resolve report' : 'Dismiss report'}
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={decision === ReportStatus.RESOLVED ? 'primary' : 'secondary'}
              loading={busy}
              onClick={() => void submitDecision()}
            >
              {decision === ReportStatus.RESOLVED ? 'Mark resolved' : 'Mark dismissed'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {decision === ReportStatus.RESOLVED
              ? 'The report closes as resolved. This status cannot be changed again.'
              : 'The report closes as dismissed, meaning no action was taken.'}
          </p>
          {target && (
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{target.reason}</span>{' '}
              ({humanize(target.entity_type)})
            </p>
          )}
          <Field
            label="Resolution note"
            hint="Optional. Recorded in the audit trail with the transition."
            htmlFor="rep-reason"
          >
            <Textarea
              id="rep-reason"
              rows={3}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What was decided and why?"
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
