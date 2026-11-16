'use client';

/**
 * Employer job postings — create drafts, move them through the workflow and
 * keep the board tidy.
 *
 *   GET    /companies/:id/jobs?status=&perPage=  company-scoped, any status
 *   POST   /jobs                                 create (always starts DRAFT)
 *   PATCH  /jobs/:id/status                      workflow transitions
 *   DELETE /jobs/:id                             drafts only
 *
 * Publishing requires a VERIFIED company, so an unverified account gets the
 * backend conflict message in the modal instead of a silent failure.
 */
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useCompany } from '@/hooks/use-company';
import { useApiList } from '@/hooks/use-api-list';
import { apiDelete, apiPatch, apiPost, ApiRequestError } from '@/services/api-client';
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
import { EmploymentType, ExperienceLevel, JobStatus } from '@/enums';
import { formatDate, humanize } from '@/utils/format';
import type { Job } from '@/types';

/** Mirrors JOB_STATUS_TRANSITIONS from the backend job workflow. */
const NEXT_JOB_STATUSES: Record<JobStatus, JobStatus[]> = {
  [JobStatus.DRAFT]: [JobStatus.PENDING_REVIEW, JobStatus.CANCELLED],
  [JobStatus.PENDING_REVIEW]: [JobStatus.PUBLISHED, JobStatus.CANCELLED],
  [JobStatus.PUBLISHED]: [JobStatus.PAUSED, JobStatus.CLOSED, JobStatus.CANCELLED],
  [JobStatus.PAUSED]: [JobStatus.PUBLISHED, JobStatus.CLOSED, JobStatus.CANCELLED],
  [JobStatus.CLOSED]: [],
  [JobStatus.CANCELLED]: [],
};

const TABS: Array<JobStatus | 'ALL'> = [
  'ALL',
  JobStatus.PUBLISHED,
  JobStatus.PENDING_REVIEW,
  JobStatus.DRAFT,
  JobStatus.PAUSED,
  JobStatus.CLOSED,
  JobStatus.CANCELLED,
];

interface JobForm {
  title: string;
  description: string;
  employment_type: string;
  experience_level: string;
  salary_min: string;
  salary_max: string;
  location: string;
  vacancies: string;
  application_deadline: string;
}

const EMPTY_JOB_FORM: JobForm = {
  title: '',
  description: '',
  employment_type: EmploymentType.FULL_TIME,
  experience_level: '',
  salary_min: '',
  salary_max: '',
  location: '',
  vacancies: '1',
  application_deadline: '',
};

export default function EmployerJobsPage() {
  const { company, loading: companyLoading, error: companyError } = useCompany();
  const companyId = company?.id ?? null;

  const [status, setStatus] = useState<JobStatus | 'ALL'>('ALL');
  const jobs = useApiList<Job>(
    companyId
      ? withQuery(endpoints.companies.jobs(companyId), {
          status: status === 'ALL' ? undefined : status,
          perPage: 100,
        })
      : null,
  );

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<JobForm>(EMPTY_JOB_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Status modal
  const [statusTarget, setStatusTarget] = useState<Job | null>(null);
  const [nextStatus, setNextStatus] = useState<JobStatus>(JobStatus.PENDING_REVIEW);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const openCreate = () => {
    setForm(EMPTY_JOB_FORM);
    setCreateError('');
    setCreateOpen(true);
  };

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setCreateError('');

    const title = form.title.trim();
    const description = form.description.trim();
    if (title.length < 3) {
      setCreateError('Title must be at least 3 characters.');
      return;
    }
    if (description.length < 20) {
      setCreateError('Description must be at least 20 characters.');
      return;
    }
    const salaryMin = form.salary_min.trim() ? Number(form.salary_min) : null;
    const salaryMax = form.salary_max.trim() ? Number(form.salary_max) : null;
    if (salaryMin !== null && !Number.isFinite(salaryMin)) {
      setCreateError('Minimum salary must be a number.');
      return;
    }
    if (salaryMax !== null && !Number.isFinite(salaryMax)) {
      setCreateError('Maximum salary must be a number.');
      return;
    }
    if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) {
      setCreateError('Maximum salary must be greater than or equal to the minimum.');
      return;
    }
    const vacancies = Number(form.vacancies || '1');
    if (!Number.isInteger(vacancies) || vacancies < 1) {
      setCreateError('Vacancies must be a whole number of at least 1.');
      return;
    }

    setCreating(true);
    try {
      await apiPost(endpoints.jobs.create, {
        company_id: companyId,
        title,
        description,
        employment_type: form.employment_type,
        experience_level: form.experience_level || null,
        salary_min: salaryMin,
        salary_max: salaryMax,
        salary_currency: 'NPR',
        vacancies,
        location: form.location.trim() || null,
        application_deadline: form.application_deadline || null,
      });
      setCreateOpen(false);
      setMsg({
        ok: true,
        text: 'Draft created. Send it to review when the description is ready.',
      });
      jobs.refetch();
    } catch (err) {
      setCreateError(err instanceof ApiRequestError ? err.message : 'Could not create the job.');
    } finally {
      setCreating(false);
    }
  };

  const openStatus = (job: Job) => {
    const options = NEXT_JOB_STATUSES[job.status];
    setStatusTarget(job);
    setNextStatus(options[0] ?? JobStatus.CANCELLED);
    setStatusError('');
  };

  const submitStatus = async (e: FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;
    if (nextStatus === statusTarget.status) {
      setStatusError('Pick a different status.');
      return;
    }
    setStatusSaving(true);
    setStatusError('');
    try {
      await apiPatch(endpoints.jobs.status(statusTarget.id), { status: nextStatus });
      setStatusTarget(null);
      setMsg({ ok: true, text: `Job moved to ${humanize(nextStatus)}.` });
      jobs.refetch();
    } catch (err) {
      setStatusError(err instanceof ApiRequestError ? err.message : 'Could not change the status.');
    } finally {
      setStatusSaving(false);
    }
  };

  const submitDelete = async (e: FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await apiDelete(endpoints.jobs.byId(deleteTarget.id));
      setDeleteTarget(null);
      setMsg({ ok: true, text: 'Draft deleted.' });
      jobs.refetch();
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : 'Could not delete the job.');
    } finally {
      setDeleting(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="card flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading jobs…
      </div>
    );
  }

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Jobs</h1>
        <p className="mt-1 text-sm text-slate-500">
          {company
            ? `${jobs.data.length} posting${jobs.data.length === 1 ? '' : 's'} for ${company.name}.`
            : 'Create a company to start posting jobs.'}
        </p>
      </div>
      {company && <Button onClick={openCreate}>New job</Button>}
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
          icon={<NavIcon name="briefcase" className="h-10 w-10" />}
          title="No company yet"
          description="Jobs belong to a company profile. Create yours on the company page first."
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
            {tab === 'ALL' ? 'All' : humanize(tab)}
          </button>
        ))}
      </div>

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
          title={status === 'ALL' ? 'No jobs yet' : `No ${humanize(status).toLowerCase()} jobs`}
          description={
            status === 'ALL'
              ? 'Create a draft, send it to review and it goes live once approved.'
              : 'Jobs move into this status as you and the moderators act on them.'
          }
          action={
            status === 'ALL' ? (
              <Button onClick={openCreate}>Create a job</Button>
            ) : (
              <Button variant="secondary" onClick={() => setStatus('ALL')}>
                Show all jobs
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {jobs.data.map((job, index) => {
            const options = NEXT_JOB_STATUSES[job.status];
            return (
              <li
                key={job.id}
                className="card lift mk-rise"
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <StatusBadge kind="job" value={job.status} />
                      <Badge tone="slate">{humanize(job.employment_type)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {job.location ?? 'Remote'} · {job.vacancies} open{' '}
                      {job.vacancies === 1 ? 'vacancy' : 'vacancies'}
                      {job.experience_level ? ` · ${humanize(job.experience_level)} level` : ''}
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
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link href={`/jobs/${job.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                      View
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={options.length === 0}
                      title={
                        options.length > 0
                          ? 'Change job status'
                          : 'This job is in a terminal state'
                      }
                      onClick={() => openStatus(job)}
                    >
                      Change status
                    </Button>
                    {job.status === JobStatus.DRAFT && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setDeleteError('');
                          setDeleteTarget(job);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        title="Create a job"
        onClose={() => setCreateOpen(false)}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" form="job-create-form" loading={creating}>
              Save draft
            </Button>
          </>
        }
      >
        <form id="job-create-form" onSubmit={submitCreate} className="space-y-4" noValidate>
          <p className="text-sm text-slate-600">
            New jobs start as a draft. Send it to review from the status menu when you are
            ready to publish.
          </p>
          <Field label="Title" required htmlFor="j-title">
            <Input
              id="j-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Senior Frontend Engineer"
            />
          </Field>
          <Field
            label="Description"
            required
            hint="At least 20 characters. Duties, stack and what a good week looks like."
            htmlFor="j-desc"
          >
            <Textarea
              id="j-desc"
              rows={6}
              maxLength={20000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Employment type" required htmlFor="j-type">
              <Select
                id="j-type"
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
              >
                {Object.values(EmploymentType).map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Experience level" htmlFor="j-level">
              <Select
                id="j-level"
                value={form.experience_level}
                onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
              >
                <option value="">Not set</option>
                {Object.values(ExperienceLevel).map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Minimum salary" htmlFor="j-min">
              <Input
                id="j-min"
                type="number"
                min={0}
                placeholder="40000"
                value={form.salary_min}
                onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
              />
            </Field>
            <Field label="Maximum salary" htmlFor="j-max">
              <Input
                id="j-max"
                type="number"
                min={0}
                placeholder="70000"
                value={form.salary_max}
                onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
              />
            </Field>
            <Field label="Location" htmlFor="j-loc">
              <Input
                id="j-loc"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Kathmandu or Remote"
              />
            </Field>
            <Field label="Vacancies" required htmlFor="j-vac">
              <Input
                id="j-vac"
                type="number"
                min={1}
                step={1}
                value={form.vacancies}
                onChange={(e) => setForm({ ...form, vacancies: e.target.value })}
              />
            </Field>
            <Field label="Application deadline" hint="Optional." htmlFor="j-deadline">
              <Input
                id="j-deadline"
                type="date"
                value={form.application_deadline}
                onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
              />
            </Field>
          </div>
          {createError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {createError}
            </div>
          )}
        </form>
      </Modal>

      {/* Status modal */}
      <Modal
        open={statusTarget !== null}
        title="Change job status"
        onClose={() => setStatusTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusTarget(null)} disabled={statusSaving}>
              Cancel
            </Button>
            <Button type="submit" form="job-status-form" loading={statusSaving}>
              Save status
            </Button>
          </>
        }
      >
        <form id="job-status-form" onSubmit={submitStatus} className="space-y-4" noValidate>
          {statusTarget && (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{statusTarget.title}</span> is
              currently {humanize(statusTarget.status)}.
            </p>
          )}
          {statusTarget && (
            <Field label="New status" required htmlFor="js-status">
              <Select
                id="js-status"
                value={nextStatus}
                onChange={(e) => {
                  setNextStatus(e.target.value as JobStatus);
                  setStatusError('');
                }}
              >
                {NEXT_JOB_STATUSES[statusTarget.status].map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <p className="text-xs text-slate-400">
            Publishing sends the job to moderation and needs a verified company.
          </p>
          {statusError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {statusError}
            </div>
          )}
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteTarget !== null}
        title="Delete draft"
        onClose={() => setDeleteTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Keep draft
            </Button>
            <Button variant="danger" type="submit" form="job-delete-form" loading={deleting}>
              Delete draft
            </Button>
          </>
        }
      >
        <form id="job-delete-form" onSubmit={submitDelete} className="space-y-3">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{deleteTarget?.title}</span> will be
            removed permanently. Only drafts can be deleted; close published jobs instead.
          </p>
          {deleteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {deleteError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
