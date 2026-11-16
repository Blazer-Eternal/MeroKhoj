'use client';

/**
 * Hiring decisions — the record of who you hired, rejected or put on hold.
 *
 *   GET  /applications/:id/decision → { decision } or { decision: null }
 *   POST /applications/:id/decision { outcome, notes? } → 201 { decision }
 *   GET  /companies/:id/applications (pipeline rows the decisions attach to)
 *
 * A decision also moves the application status in one transaction
 * (HIRED → hired, REJECTED → rejected, ON_HOLD → under review,
 * SHORTLISTED → shortlisted). Terminal applications answer 409 and the modal
 * shows that message; deciding again replaces the previous decision.
 */
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useCompany } from '@/hooks/use-company';
import { useApiList } from '@/hooks/use-api-list';
import { apiGet, apiPost, ApiRequestError } from '@/services/api-client';
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
import { ApplicationStatus, HiringDecisionOutcome } from '@/enums';
import { formatDate, timeAgo, humanize } from '@/utils/format';

/** Pipeline row: `jobseeker` is the applicant's user record. */
interface PipelineRow {
  id: string;
  job_id: string;
  status: ApplicationStatus;
  applied_at: string | null;
  created_at: string;
  job?: { id: string; title: string; company_id: string } | null;
  jobseeker?: { id: string; first_name: string; last_name: string; email: string } | null;
}

/** Decision payload returned by GET/POST /applications/:id/decision. */
interface DecisionRow {
  id?: string;
  application_id?: string;
  outcome: HiringDecisionOutcome;
  notes: string | null;
  decided_at?: string | null;
  created_at?: string | null;
}

/** Application status each outcome lands on (mirrors the backend service). */
const DECISION_APPLICATION_STATUS: Record<HiringDecisionOutcome, ApplicationStatus> = {
  [HiringDecisionOutcome.HIRED]: ApplicationStatus.HIRED,
  [HiringDecisionOutcome.REJECTED]: ApplicationStatus.REJECTED,
  [HiringDecisionOutcome.ON_HOLD]: ApplicationStatus.UNDER_REVIEW,
  [HiringDecisionOutcome.SHORTLISTED]: ApplicationStatus.SHORTLISTED,
};

const OUTCOME_TONE: Record<HiringDecisionOutcome, 'green' | 'red' | 'amber' | 'blue'> = {
  [HiringDecisionOutcome.HIRED]: 'green',
  [HiringDecisionOutcome.REJECTED]: 'red',
  [HiringDecisionOutcome.ON_HOLD]: 'amber',
  [HiringDecisionOutcome.SHORTLISTED]: 'blue',
};

const candidateName = (row: PipelineRow): string =>
  row.jobseeker
    ? `${row.jobseeker.first_name} ${row.jobseeker.last_name}`.trim()
    : 'Candidate';

const decisionDate = (decision: DecisionRow | undefined): string | null =>
  decision?.decided_at ?? decision?.created_at ?? null;

export default function EmployerHiringPage() {
  const { company, loading: companyLoading, error: companyError } = useCompany();
  const companyId = company?.id ?? null;

  const [status, setStatus] = useState('');
  const applications = useApiList<PipelineRow>(
    companyId
      ? withQuery(endpoints.companies.applications(companyId), { status, perPage: 100 })
      : null,
  );

  // One decision lookup per loaded application (the API has no bulk route).
  const [decisions, setDecisions] = useState<Record<string, DecisionRow>>({});
  const [decisionsLoading, setDecisionsLoading] = useState(false);
  const ids = applications.data.map((row) => row.id).join(',');

  useEffect(() => {
    const idList = ids ? ids.split(',') : [];
    if (idList.length === 0) {
      setDecisions({});
      return;
    }
    let cancelled = false;
    setDecisionsLoading(true);
    void (async () => {
      const entries = await Promise.all(
        idList.map(async (id) => {
          try {
            const res = await apiGet<{ decision: DecisionRow | null }>(
              endpoints.applications.decision(id),
            );
            return res.decision ? ([id, res.decision] as const) : null;
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      const map: Record<string, DecisionRow> = {};
      for (const entry of entries) {
        if (entry) map[entry[0]] = entry[1];
      }
      setDecisions(map);
      setDecisionsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  // Decision modal
  const [target, setTarget] = useState<PipelineRow | null>(null);
  const [outcome, setOutcome] = useState<HiringDecisionOutcome>(HiringDecisionOutcome.HIRED);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [existing, setExisting] = useState<DecisionRow | null>(null);
  const [existingLoading, setExistingLoading] = useState(false);

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const openDecision = async (row: PipelineRow) => {
    setTarget(row);
    setNotes('');
    setFormError('');
    setExisting(null);
    const known = decisions[row.id];
    setOutcome(known?.outcome ?? HiringDecisionOutcome.HIRED);
    setExisting(known ?? null);
    if (known) return;
    setExistingLoading(true);
    try {
      const res = await apiGet<{ decision: DecisionRow | null }>(
        endpoints.applications.decision(row.id),
      );
      if (res.decision) {
        setExisting(res.decision);
        setOutcome(res.decision.outcome);
      }
    } catch {
      // Leave the form empty; the submit path surfaces any real failure.
    } finally {
      setExistingLoading(false);
    }
  };

  const submitDecision = async (e: FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setBusy(true);
    setFormError('');
    try {
      await apiPost(endpoints.applications.decision(target.id), {
        outcome,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      const applicationStatus = DECISION_APPLICATION_STATUS[outcome];
      setTarget(null);
      setMsg({
        ok: true,
        text: `Decision saved. ${candidateName(target)} moved to ${humanize(applicationStatus)}.`,
      });
      applications.refetch();
      setDecisions((prev) => ({
        ...prev,
        [target.id]: {
          ...prev[target.id],
          outcome,
          notes: notes.trim() || null,
          decided_at: new Date().toISOString(),
        },
      }));
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.message : 'Could not record the decision.',
      );
    } finally {
      setBusy(false);
    }
  };

  const hiredCount = useMemo(
    () =>
      applications.data.filter(
        (row) =>
          row.status === ApplicationStatus.HIRED ||
          decisions[row.id]?.outcome === HiringDecisionOutcome.HIRED,
      ).length,
    [applications.data, decisions],
  );

  const decidedCount = useMemo(
    () => applications.data.filter((row) => decisions[row.id]).length,
    [applications.data, decisions],
  );

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Hiring</h1>
        <p className="mt-1 text-sm text-slate-500">
          {company
            ? `${decidedCount} decision${decidedCount === 1 ? '' : 's'} recorded · ${hiredCount} hire${hiredCount === 1 ? '' : 's'}.`
            : 'Create a company to record hiring decisions.'}
        </p>
      </div>
      <Link href="/employer/applications" className="btn-secondary">
        Open the pipeline
      </Link>
    </header>
  );

  if (companyLoading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading hiring…
        </div>
      </div>
    );
  }

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
          icon={<NavIcon name="check-circle" className="h-10 w-10" />}
          title="No company yet"
          description="Decisions are attached to applications, which start once your company posts jobs."
        />
      </div>
    );
  }

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

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by application status"
          >
            <option value="">All application statuses</option>
            {Object.values(ApplicationStatus).map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </Select>
        </div>
        {status && (
          <Button variant="ghost" onClick={() => setStatus('')}>
            Clear filter
          </Button>
        )}
      </div>

      {applications.loading || decisionsLoading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading hiring…
        </div>
      ) : applications.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {applications.error}
        </div>
      ) : applications.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="check-circle" className="h-10 w-10" />}
          title={status ? 'No applications with that status' : 'No applications yet'}
          description={
            status
              ? 'Try another status, or clear the filter.'
              : 'Once candidates apply you can record a decision on each of them here.'
          }
          action={
            status ? (
              <Button variant="secondary" onClick={() => setStatus('')}>
                Clear filter
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
          {applications.data.map((row, index) => {
            const decision = decisions[row.id];
            const decidedAt = decisionDate(decision);
            return (
              <li
                key={row.id}
                className="card lift mk-rise"
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{candidateName(row)}</p>
                      <StatusBadge kind="application" value={row.status} />
                      {decision ? (
                        <Badge tone={OUTCOME_TONE[decision.outcome]}>
                          {humanize(decision.outcome)}
                        </Badge>
                      ) : (
                        <Badge tone="slate">No decision yet</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {row.jobseeker?.email ?? 'Email not available'} ·{' '}
                      <Link
                        href={`/jobs/${row.job_id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {row.job?.title ?? 'Job posting'}
                      </Link>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Applied{' '}
                      {row.applied_at ? formatDate(row.applied_at) : timeAgo(row.created_at)}
                      {decidedAt ? ` · decided ${formatDate(decidedAt)}` : ''}
                    </p>
                    {decision?.notes && (
                      <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-slate-500">
                        {decision.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Button size="sm" onClick={() => void openDecision(row)}>
                      {decision ? 'Update decision' : 'Record decision'}
                    </Button>
                    <Link
                      href={`/employer/interviews?application=${row.id}`}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Schedule interview →
                    </Link>
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
        title="Hiring decision"
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" form="decision-form" loading={busy}>
              Save decision
            </Button>
          </>
        }
      >
        <form id="decision-form" onSubmit={submitDecision} className="space-y-4" noValidate>
          {target && (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{candidateName(target)}</span>{' '}
              applied to{' '}
              <span className="font-medium text-slate-800">
                {target.job?.title ?? 'this job'}
              </span>{' '}
              · currently {humanize(target.status)}
            </p>
          )}

          {existingLoading ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Spinner /> Checking the current decision…
            </div>
          ) : existing ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Current decision:{' '}
              <span className="font-semibold text-slate-800">{humanize(existing.outcome)}</span>
              {decisionDate(existing) ? ` on ${formatDate(decisionDate(existing)!)}` : ''}
              {existing.notes ? ` · ${existing.notes}` : ''}
            </div>
          ) : null}

          <Field label="Outcome" required htmlFor="d-outcome">
            <Select
              id="d-outcome"
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value as HiringDecisionOutcome);
                setFormError('');
              }}
            >
              {Object.values(HiringDecisionOutcome).map((value) => (
                <option key={value} value={value}>
                  {humanize(value)}
                </option>
              ))}
            </Select>
          </Field>

          <p className="text-xs text-slate-400">
            Saving moves the application to{' '}
            <span className="font-semibold text-slate-600">
              {humanize(DECISION_APPLICATION_STATUS[outcome])}
            </span>
            . Terminal applications cannot be decided again.
          </p>

          <Field
            label="Notes"
            hint="Optional. Visible to your team on this decision."
            htmlFor="d-notes"
          >
            <Textarea
              id="d-notes"
              rows={3}
              maxLength={5000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
