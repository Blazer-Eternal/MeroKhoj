'use client';

/**
 * Employer interviews — the schedule built on top of the pipeline.
 *
 *   GET   /interviews?status=          { interviews } scoped to this company
 *   POST  /interviews                  { application_id, interview_type,
 *                                        scheduled_at, duration_minutes,
 *                                        location? | meeting_url?, notes? }
 *   PATCH /interviews/:id/status       { status }
 *
 * `scheduled_at` must land on a slot with either a place or a meeting link,
 * because the backend refuses interviews with neither. The `?application=`
 * deep link from the applications page preselects the candidate.
 */
import Link from 'next/link';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCompany } from '@/hooks/use-company';
import { useApiList } from '@/hooks/use-api-list';
import { apiPost, apiPatch, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import {
  Button,
  Badge,
  StatusBadge,
  Spinner,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
  Modal,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { InterviewStatus, InterviewType } from '@/enums';
import { formatDate, timeAgo, humanize } from '@/utils/format';

/** Interview row as the list endpoint returns it (application embedded). */
interface InterviewRow {
  id: string;
  application_id: string;
  interview_type: InterviewType;
  scheduled_at: string;
  duration_minutes: number | null;
  location: string | null;
  meeting_url: string | null;
  status: InterviewStatus;
  notes: string | null;
  created_at: string;
  application?: {
    id: string;
    job_id: string;
    status: string;
    job?: { id: string; title: string; company_id: string; status: string } | null;
    jobseeker?: { id: string; first_name: string; last_name: string; email: string } | null;
  } | null;
}

/** Pipeline rows used as candidates in the schedule form. */
interface PipelineRow {
  id: string;
  status: string;
  job?: { id: string; title: string } | null;
  jobseeker?: { id: string; first_name: string; last_name: string; email: string } | null;
}

/** Mirrors INTERVIEW_STATUS_TRANSITIONS from the backend. */
const NEXT_INTERVIEW_STATUSES: Record<InterviewStatus, InterviewStatus[]> = {
  [InterviewStatus.SCHEDULED]: [
    InterviewStatus.CONFIRMED,
    InterviewStatus.CANCELLED,
    InterviewStatus.RESCHEDULED,
  ],
  [InterviewStatus.CONFIRMED]: [
    InterviewStatus.COMPLETED,
    InterviewStatus.CANCELLED,
    InterviewStatus.RESCHEDULED,
    InterviewStatus.NO_SHOW,
  ],
  [InterviewStatus.COMPLETED]: [],
  [InterviewStatus.CANCELLED]: [InterviewStatus.RESCHEDULED],
  [InterviewStatus.RESCHEDULED]: [InterviewStatus.CONFIRMED, InterviewStatus.CANCELLED],
  [InterviewStatus.NO_SHOW]: [InterviewStatus.RESCHEDULED],
};

const candidateName = (person: {
  first_name: string;
  last_name: string;
} | null): string =>
  person ? `${person.first_name} ${person.last_name}`.trim() : 'Candidate';

function InterviewsContent() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get('application');

  const { company, loading: companyLoading, error: companyError } = useCompany();
  const companyId = company?.id ?? null;

  const [status, setStatus] = useState('');
  const interviews = useApiList<InterviewRow>(
    withQuery(endpoints.interviews.list, { status, perPage: 100 }),
  );
  const applications = useApiList<PipelineRow>(
    companyId
      ? withQuery(endpoints.companies.applications(companyId), { perPage: 100 })
      : null,
  );

  // Schedule modal
  const [createOpen, setCreateOpen] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [type, setType] = useState<string>(InterviewType.VIDEO);
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Status modal
  const [target, setTarget] = useState<InterviewRow | null>(null);
  const [nextStatus, setNextStatus] = useState<InterviewStatus>(InterviewStatus.CONFIRMED);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState('');

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (preselected) setApplicationId(preselected);
  }, [preselected]);

  const labelFor = (id: string): string => {
    const app = applications.data.find((row) => row.id === id);
    if (!app) return 'Selected application';
    return `${candidateName(app.jobseeker ?? null)} · ${app.job?.title ?? 'Job posting'}`;
  };

  const openCreate = () => {
    setApplicationId(preselected ?? '');
    setType(InterviewType.VIDEO);
    setScheduledAt('');
    setDuration('60');
    setLocation('');
    setMeetingUrl('');
    setNotes('');
    setCreateError('');
    setCreateOpen(true);
  };

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!applicationId) {
      setCreateError('Pick the application this interview belongs to.');
      return;
    }
    if (!scheduledAt) {
      setCreateError('Choose a date and time.');
      return;
    }
    const durationMinutes = Number(duration);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240) {
      setCreateError('Duration must be between 15 and 240 minutes.');
      return;
    }
    const place = location.trim();
    const link = meetingUrl.trim();
    if (!place && !link) {
      setCreateError('Provide either a place or a meeting link.');
      return;
    }
    if (link && !/^https?:\/\/\S+$/i.test(link)) {
      setCreateError('Meeting link must be a full URL starting with http.');
      return;
    }

    setCreating(true);
    try {
      await apiPost(endpoints.interviews.create, {
        application_id: applicationId,
        interview_type: type,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        location: place || null,
        meeting_url: link || null,
        notes: notes.trim() || null,
      });
      setCreateOpen(false);
      setMsg({ ok: true, text: 'Interview scheduled.' });
      interviews.refetch();
    } catch (err) {
      setCreateError(
        err instanceof ApiRequestError ? err.message : 'Could not schedule the interview.',
      );
    } finally {
      setCreating(false);
    }
  };

  const openStatus = (row: InterviewRow) => {
    const options = NEXT_INTERVIEW_STATUSES[row.status];
    setTarget(row);
    setNextStatus(options[0] ?? InterviewStatus.CANCELLED);
    setStatusError('');
  };

  const submitStatus = async (e: FormEvent) => {
    e.preventDefault();
    if (!target) return;
    if (nextStatus === target.status) {
      setStatusError('Pick a different status.');
      return;
    }
    setStatusSaving(true);
    setStatusError('');
    try {
      await apiPatch(endpoints.interviews.status(target.id), { status: nextStatus });
      setTarget(null);
      setMsg({ ok: true, text: `Interview marked as ${humanize(nextStatus)}.` });
      interviews.refetch();
    } catch (err) {
      setStatusError(
        err instanceof ApiRequestError ? err.message : 'Could not change the status.',
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Interviews</h1>
        <p className="mt-1 text-sm text-slate-500">
          {company
            ? `${interviews.data.length} scheduled interview${interviews.data.length === 1 ? '' : 's'} for ${company.name}.`
            : 'Create a company to schedule interviews.'}
        </p>
      </div>
      {company && <Button onClick={openCreate}>Schedule interview</Button>}
    </header>
  );

  if (companyLoading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading interviews…
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
          icon={<NavIcon name="calendar" className="h-10 w-10" />}
          title="No company yet"
          description="Interviews are booked from your applicant pipeline once a company exists."
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
        <div className="w-52">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter interviews by status"
          >
            <option value="">All statuses</option>
            {Object.values(InterviewStatus).map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </Select>
        </div>
        <Link href="/employer/applications" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          Open the pipeline →
        </Link>
      </div>

      {interviews.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading interviews…
        </div>
      ) : interviews.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {interviews.error}
        </div>
      ) : interviews.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="calendar" className="h-10 w-10" />}
          title={status ? 'No interviews with that status' : 'No interviews yet'}
          description={
            status
              ? 'Try another status, or clear the filter.'
              : 'Shortlist a candidate and book the first slot from the applications page.'
          }
          action={
            status ? (
              <Button variant="secondary" onClick={() => setStatus('')}>
                Clear filter
              </Button>
            ) : (
              <Link href="/employer/applications" className="btn-secondary">
                Review applicants
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {interviews.data.map((row, index) => {
            const options = NEXT_INTERVIEW_STATUSES[row.status];
            const app = row.application;
            return (
              <li
                key={row.id}
                className="card lift mk-rise"
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {candidateName(app?.jobseeker ?? null)}
                      </p>
                      <StatusBadge kind="interview" value={row.status} />
                      <Badge tone="slate">{humanize(row.interview_type)}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {app?.job?.title ?? 'Job posting'} · {row.duration_minutes ?? '?'} minutes
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(row.scheduled_at)} · {timeAgo(row.scheduled_at)}
                      {row.location ? ` · ${row.location}` : ''}
                    </p>
                    {row.meeting_url && (
                      <a
                        href={row.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block break-all text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        {row.meeting_url}
                      </a>
                    )}
                    {row.notes && (
                      <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-slate-500">
                        {row.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={options.length === 0}
                      title={
                        options.length > 0
                          ? 'Change interview status'
                          : 'This interview is finished'
                      }
                      onClick={() => openStatus(row)}
                    >
                      Change status
                    </Button>
                    {app && (
                      <Link
                        href={`/employer/interviews?application=${app.id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Book another →
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Schedule modal */}
      <Modal
        open={createOpen}
        title="Schedule an interview"
        onClose={() => setCreateOpen(false)}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" form="interview-create-form" loading={creating}>
              Schedule interview
            </Button>
          </>
        }
      >
        <form id="interview-create-form" onSubmit={submitCreate} className="space-y-4" noValidate>
          <Field
            label="Candidate"
            required
            hint="Pick the application this interview belongs to."
            htmlFor="iv-app"
          >
            <Select
              id="iv-app"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
            >
              <option value="">Select an application</option>
              {applications.data.map((app) => (
                <option key={app.id} value={app.id}>
                  {labelFor(app.id)}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Interview type" required htmlFor="iv-type">
              <Select id="iv-type" value={type} onChange={(e) => setType(e.target.value)}>
                {Object.values(InterviewType).map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date and time" required htmlFor="iv-when">
              <Input
                id="iv-when"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </Field>
            <Field label="Duration (minutes)" required htmlFor="iv-duration">
              <Input
                id="iv-duration"
                type="number"
                min={15}
                max={240}
                step={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </Field>
            <Field label="Place" hint="Office address or meeting point." htmlFor="iv-location">
              <Input
                id="iv-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kathmandu office, 4th floor"
              />
            </Field>
          </div>

          <Field
            label="Meeting link"
            hint="Required when there is no place. Full http(s) URL."
            htmlFor="iv-meeting"
          >
            <Input
              id="iv-meeting"
              type="url"
              placeholder="https://meet.example.com/room"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </Field>

          <Field label="Notes" hint="Optional context shared with the panel." htmlFor="iv-notes">
            <Textarea
              id="iv-notes"
              rows={3}
              maxLength={5000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>

          {createError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {createError}
            </div>
          )}
        </form>
      </Modal>

      {/* Status modal */}
      <Modal
        open={target !== null}
        title="Change interview status"
        onClose={() => setTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={statusSaving}>
              Cancel
            </Button>
            <Button type="submit" form="interview-status-form" loading={statusSaving}>
              Save status
            </Button>
          </>
        }
      >
        <form id="interview-status-form" onSubmit={submitStatus} className="space-y-4" noValidate>
          {target && (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">
                {candidateName(target.application?.jobseeker ?? null)}
              </span>{' '}
              · {formatDate(target.scheduled_at)} · currently {humanize(target.status)}
            </p>
          )}
          {target && (
            <Field label="New status" required htmlFor="iv-status">
              <Select
                id="iv-status"
                value={nextStatus}
                onChange={(e) => {
                  setNextStatus(e.target.value as InterviewStatus);
                  setStatusError('');
                }}
              >
                {NEXT_INTERVIEW_STATUSES[target.status].map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {statusError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {statusError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

export default function EmployerInterviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading interviews…
        </div>
      }
    >
      <InterviewsContent />
    </Suspense>
  );
}
