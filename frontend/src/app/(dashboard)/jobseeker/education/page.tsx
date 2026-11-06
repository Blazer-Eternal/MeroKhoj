'use client';

/**
 * Education CRUD for /profiles/:id/educations (list/create) and
 * /educations/:id (update/delete). Cross-field date rules are also checked
 * client-side to match the backend's zod superRefine.
 */
import { useMemo, useState, type FormEvent } from 'react';
import { useMyProfile } from '@/features/jobseeker/hooks/use-my-profile';
import { useApiList } from '@/hooks/use-api-list';
import { apiPost, apiPatch, apiDelete, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button, Field, Input, Textarea, Spinner, EmptyState, Modal, Badge } from '@/components/ui';
import type { Education } from '@/types';
import { formatDate } from '@/utils/format';

const EMPTY = {
  institution: '',
  degree: '',
  field_of_study: '',
  start_date: '',
  end_date: '',
  is_current: false,
  grade: '',
  description: '',
};

export default function EducationPage() {
  const { profileId, loading: profileLoading, refetch: refetchProfile } = useMyProfile();
  const educations = useApiList<Education>(
    profileId ? endpoints.profiles.educations(profileId) : null,
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Education | null>(null);
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

  const startEdit = (edu: Education) => {
    setEditing(edu);
    setForm({
      institution: edu.institution,
      degree: edu.degree,
      field_of_study: edu.field_of_study ?? '',
      start_date: edu.start_date ? edu.start_date.slice(0, 10) : '',
      end_date: edu.end_date ? edu.end_date.slice(0, 10) : '',
      is_current: edu.is_current,
      grade: edu.grade ?? '',
      description: edu.description ?? '',
    });
    setFormError('');
    setOpen(true);
  };

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validate = (): string => {
    if (!form.institution.trim()) return 'Institution is required.';
    if (!form.degree.trim()) return 'Degree is required.';
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      return 'End date must be on or after start date.';
    }
    if (form.is_current && form.end_date) {
      return 'A current entry must not have an end date.';
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
      institution: form.institution.trim(),
      degree: form.degree.trim(),
      field_of_study: form.field_of_study.trim() || null,
      start_date: form.start_date || null,
      end_date: form.is_current ? null : form.end_date || null,
      is_current: form.is_current,
      grade: form.grade.trim() || null,
      description: form.description.trim() || null,
    };
    try {
      if (editing) {
        await apiPatch(endpoints.profiles.education(editing.id), payload);
      } else if (profileId) {
        await apiPost(endpoints.profiles.educations(profileId), payload);
      }
      setOpen(false);
      educations.refetch();
    } catch (err2) {
      setFormError(err2 instanceof ApiRequestError ? err2.message : 'Could not save entry.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await apiDelete(endpoints.profiles.education(id));
      educations.refetch();
      void refetchProfile();
    } catch {
      // keep list as-is; surfaced by refetch failure next load
    } finally {
      setDeletingId('');
    }
  };

  const sorted = useMemo(
    () =>
      [...educations.data].sort((a, b) =>
        (b.start_date ?? '').localeCompare(a.start_date ?? ''),
      ),
    [educations.data],
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
          <h1 className="text-xl font-bold text-slate-900">Education</h1>
          <p className="mt-1 text-sm text-slate-500">
            Degrees, diplomas and certifications on your profile.
          </p>
        </div>
        <Button onClick={startNew} disabled={!profileId}>
          + Add education
        </Button>
      </header>

      {!profileId ? (
        <EmptyState
          title="No profile yet"
          description="Save your profile first — education entries attach to it."
          action={
            <a href="/jobseeker/profile" className="btn-primary">
              Go to profile
            </a>
          }
        />
      ) : educations.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading entries…
        </div>
      ) : educations.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {educations.error}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="No education added yet"
          description="Add your most recent qualification — employers filter on it."
          action={
            <Button onClick={startNew}>+ Add education</Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {sorted.map((edu) => (
            <li key={edu.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{edu.degree}</h2>
                    {edu.is_current && <Badge tone="blue">Current</Badge>}
                  </div>
                  <p className="text-sm text-slate-600">{edu.institution}</p>
                  {edu.field_of_study && (
                    <p className="text-sm text-slate-500">{edu.field_of_study}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {edu.start_date ? formatDate(edu.start_date) : '—'} –{' '}
                    {edu.is_current ? 'Present' : edu.end_date ? formatDate(edu.end_date) : '—'}
                    {edu.grade ? ` · Grade ${edu.grade}` : ''}
                  </p>
                  {edu.description && (
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                      {edu.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="secondary" size="sm" onClick={() => startEdit(edu)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deletingId === edu.id}
                    onClick={() => void remove(edu.id)}
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
        title={editing ? 'Edit education' : 'Add education'}
        onClose={() => setOpen(false)}
        size="lg"
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Institution" required htmlFor="edu-inst">
            <Input
              id="edu-inst"
              placeholder="Tribhuvan University"
              value={form.institution}
              error={!form.institution.trim() && !!formError}
              onChange={set('institution')}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Degree" required htmlFor="edu-degree">
              <Input
                id="edu-degree"
                placeholder="BSc CSIT"
                value={form.degree}
                onChange={set('degree')}
              />
            </Field>
            <Field label="Field of study" htmlFor="edu-field">
              <Input
                id="edu-field"
                placeholder="Computer Science"
                value={form.field_of_study}
                onChange={set('field_of_study')}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date" htmlFor="edu-start">
              <Input
                id="edu-start"
                type="date"
                value={form.start_date}
                onChange={set('start_date')}
              />
            </Field>
            <Field label="End date" htmlFor="edu-end">
              <Input
                id="edu-end"
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
              onChange={set('is_current')}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Currently studying here
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Grade" htmlFor="edu-grade">
              <Input
                id="edu-grade"
                placeholder="3.6 GPA"
                value={form.grade}
                onChange={set('grade')}
              />
            </Field>
          </div>
          <Field label="Description" htmlFor="edu-desc">
            <Textarea
              id="edu-desc"
              rows={3}
              placeholder="Highlights, thesis, activities…"
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
              {editing ? 'Save changes' : 'Add education'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
