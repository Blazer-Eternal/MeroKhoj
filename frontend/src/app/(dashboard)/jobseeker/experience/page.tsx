'use client';

/** Work experience CRUD for /profiles/:id/work-experiences. */
import { useMemo, useState, type FormEvent } from 'react';
import { useMyProfile } from '@/features/jobseeker/hooks/use-my-profile';
import { useApiList } from '@/hooks/use-api-list';
import { apiPost, apiPatch, apiDelete, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button, Field, Input, Select, Textarea, Spinner, EmptyState, Modal, Badge } from '@/components/ui';
import { EmploymentType } from '@/enums';
import type { WorkExperience } from '@/types';
import { formatDate, humanize } from '@/utils/format';

const EMPTY = {
  company_name: '',
  job_title: '',
  employment_type: EmploymentType.FULL_TIME as EmploymentType,
  location: '',
  start_date: '',
  end_date: '',
  is_current: false,
  description: '',
};

export default function ExperiencePage() {
  const { profileId, loading: profileLoading } = useMyProfile();
  const experiences = useApiList<WorkExperience>(
    profileId ? endpoints.profiles.experiences(profileId) : null,
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkExperience | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const startNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
    setOpen(true);
  };

  const startEdit = (exp: WorkExperience) => {
    setEditing(exp);
    setForm({
      company_name: exp.company_name,
      job_title: exp.job_title,
      employment_type: exp.employment_type,
      location: exp.location ?? '',
      start_date: exp.start_date ? exp.start_date.slice(0, 10) : '',
      end_date: exp.end_date ? exp.end_date.slice(0, 10) : '',
      is_current: exp.is_current,
      description: exp.description ?? '',
    });
    setFormError('');
    setOpen(true);
  };

  const set =
    (key: keyof typeof EMPTY) =>
    (e: { target: { value: string } }) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const setChecked =
    (key: keyof typeof EMPTY) =>
    (e: { target: { checked: boolean } }) => {
      setForm((f) => ({ ...f, [key]: e.target.checked }));
    };

  const validate = (): string => {
    if (!form.company_name.trim()) return 'Company name is required.';
    if (!form.job_title.trim()) return 'Job title is required.';
    if (!form.start_date) return 'Start date is required.';
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      return 'End date must be on or after start date.';
    }
    if (form.is_current && form.end_date) {
      return 'A current role must not have an end date.';
    }
    return '';
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError('');
    setSaving(true);
    const payload = {
      company_name: form.company_name.trim(),
      job_title: form.job_title.trim(),
      employment_type: form.employment_type,
      location: form.location.trim() || null,
      start_date: form.start_date,
      end_date: form.is_current ? null : form.end_date || null,
      is_current: form.is_current,
      description: form.description.trim() || null,
    };
    try {
      if (editing) {
        await apiPatch(endpoints.profiles.experience(editing.id), payload);
      } else if (profileId) {
        await apiPost(endpoints.profiles.experiences(profileId), payload);
      }
      setOpen(false);
      experiences.refetch();
    } catch (err2) {
      setFormError(err2 instanceof ApiRequestError ? err2.message : 'Could not save entry.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await apiDelete(endpoints.profiles.experience(id));
      experiences.refetch();
    } finally {
      setDeletingId('');
    }
  };

  const sorted = useMemo(
    () =>
      [...experiences.data].sort((a, b) =>
        (b.start_date ?? '').localeCompare(a.start_date ?? ''),
      ),
    [experiences.data],
  );

  if (profileLoading) {
    return (
      <div className="card flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading profile…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Work experience</h1>
          <p className="mt-1 text-sm text-slate-500">
            Roles you&apos;ve held — employers see this on your applications.
          </p>
        </div>
        <Button onClick={startNew} disabled={!profileId}>
          + Add experience
        </Button>
      </header>

      {!profileId ? (
        <EmptyState
          title="No profile yet"
          description="Save your profile first — experience entries attach to it."
          action={
            <a href="/jobseeker/profile" className="btn-primary">
              Go to profile
            </a>
          }
        />
      ) : experiences.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading entries…
        </div>
      ) : experiences.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {experiences.error}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="💼"
          title="No experience added yet"
          description="Even internships and part-time roles count — add them."
          action={<Button onClick={startNew}>+ Add experience</Button>}
        />
      ) : (
        <ul className="space-y-4">
          {sorted.map((exp) => (
            <li key={exp.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{exp.job_title}</h2>
                    {exp.is_current && <Badge tone="green">Current</Badge>}
                  </div>
                  <p className="text-sm text-slate-600">
                    {exp.company_name}
                    {exp.location ? ` · ${exp.location}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {humanize(exp.employment_type)} · {formatDate(exp.start_date)} –{' '}
                    {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date) : '—'}
                  </p>
                  {exp.description && (
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                      {exp.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="secondary" size="sm" onClick={() => startEdit(exp)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deletingId === exp.id}
                    onClick={() => void remove(exp.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        title={editing ? 'Edit experience' : 'Add experience'}
        onClose={() => setOpen(false)}
        size="lg"
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" required htmlFor="exp-company">
              <Input
                id="exp-company"
                placeholder="MeroKhoj Labs"
                value={form.company_name}
                onChange={set('company_name')}
              />
            </Field>
            <Field label="Job title" required htmlFor="exp-title">
              <Input
                id="exp-title"
                placeholder="Frontend Developer"
                value={form.job_title}
                onChange={set('job_title')}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Employment type" htmlFor="exp-type">
              <Select
                id="exp-type"
                value={form.employment_type}
                onChange={set('employment_type')}
              >
                {Object.values(EmploymentType).map((t) => (
                  <option key={t} value={t}>
                    {humanize(t)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Location" htmlFor="exp-location">
              <Input
                id="exp-location"
                placeholder="Kathmandu / Remote"
                value={form.location}
                onChange={set('location')}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date" required htmlFor="exp-start">
              <Input
                id="exp-start"
                type="date"
                value={form.start_date}
                onChange={set('start_date')}
              />
            </Field>
            <Field label="End date" htmlFor="exp-end">
              <Input
                id="exp-end"
                type="date"
                value={form.is_current ? '' : form.end_date}
                disabled={form.is_current}
                onChange={set('end_date')}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_current}
              onChange={setChecked('is_current')}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            I currently work here
          </label>
          <Field label="Description" htmlFor="exp-desc">
            <Textarea
              id="exp-desc"
              rows={4}
              placeholder="Responsibilities, achievements, tech stack…"
              value={form.description}
              onChange={set('description')}
            />
          </Field>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Add experience'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
