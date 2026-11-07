'use client';

/**
 * Resume list + metadata CRUD for /profiles/:id/resumes.
 * The backend has no file-upload route yet (only metadata with a file_url),
 * so the form takes a document link and derives name/type/size from it —
 * honest about the missing upload service.
 */
import { useMemo, useState, type FormEvent } from 'react';
import { useMyProfile } from '@/features/jobseeker/hooks/use-my-profile';
import { useApiList } from '@/hooks/use-api-list';
import { apiPost, apiPatch, apiDelete, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button, Field, Input, Spinner, EmptyState, Modal, Badge } from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import type { Resume } from '@/types';
import { formatDate } from '@/utils/format';

const ALLOWED = ['.pdf', '.doc', '.docx'];

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Derive file metadata from the URL (backend validates type + size). */
const deriveFromFileUrl = (
  url: string,
  sizeKb: number,
): { file_name: string; file_type: string; file_size_bytes: number } => {
  let name = 'resume.pdf';
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split('/').filter(Boolean).pop();
    if (last) name = decodeURIComponent(last);
  } catch {
    // keep default name
  }
  if (!/\.[a-z0-9]+$/i.test(name)) name = `${name}.pdf`;
  const dot = name.lastIndexOf('.');
  const ext = name.slice(dot).toLowerCase();
  const file_type = ALLOWED.includes(ext) ? ext : '.pdf';
  return {
    file_name: ALLOWED.includes(ext) ? name : `${name}.pdf`,
    file_type,
    file_size_bytes: Math.max(1, Math.round(sizeKb * 1024)),
  };
};

export default function ResumesPage() {
  const { profileId, loading: profileLoading } = useMyProfile();
  const resumes = useApiList<Resume>(profileId ? endpoints.profiles.resumes(profileId) : null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Resume | null>(null);
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [sizeKb, setSizeKb] = useState('120');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [defaultingId, setDefaultingId] = useState('');

  const startNew = () => {
    setEditing(null);
    setTitle('');
    setFileUrl('');
    setSizeKb('120');
    setIsDefault(false);
    setFormError('');
    setOpen(true);
  };

  const startEdit = (res: Resume) => {
    setEditing(res);
    setTitle(res.title);
    setFileUrl(res.file_url);
    setSizeKb(String(Math.round(res.file_size_bytes / 1024)));
    setIsDefault(res.is_default);
    setFormError('');
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) {
      setFormError('Give the resume a title.');
      return;
    }
    if (!fileUrl.trim()) {
      setFormError('A document URL is required (file upload service is pending).');
      return;
    }
    const kb = Number(sizeKb);
    if (!Number.isFinite(kb) || kb <= 0) {
      setFormError('File size must be a positive number.');
      return;
    }
    const derived = deriveFromFileUrl(fileUrl.trim(), kb);
    if (derived.file_size_bytes > 10 * 1024 * 1024) {
      setFormError('Resume exceeds the 10 MB limit.');
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      file_url: fileUrl.trim(),
      ...derived,
      is_default: isDefault,
    };
    try {
      if (editing) {
        await apiPatch(endpoints.profiles.resume(editing.id), payload);
      } else if (profileId) {
        await apiPost(endpoints.profiles.resumes(profileId), payload);
      }
      setOpen(false);
      resumes.refetch();
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : 'Could not save resume.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await apiDelete(endpoints.profiles.resume(id));
      resumes.refetch();
    } finally {
      setDeletingId('');
    }
  };

  const makeDefault = async (id: string) => {
    setDefaultingId(id);
    try {
      await apiPatch(endpoints.profiles.resumeDefault(id));
      resumes.refetch();
    } finally {
      setDefaultingId('');
    }
  };

  const sorted = useMemo(
    () => [...resumes.data].sort((a, b) => Number(b.is_default) - Number(a.is_default)),
    [resumes.data],
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
          <h1 className="text-xl font-bold text-slate-900">Resumes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep versions ready. Pick a default so applications attach it automatically.
          </p>
        </div>
        <Button onClick={startNew} disabled={!profileId}>
          + Add resume
        </Button>
      </header>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Attach your CV as a document link (PDF, DOC or DOCX, max 10&nbsp;MB).
      </div>

      {!profileId ? (
        <EmptyState
          title="No profile yet"
          description="Save your profile first; resumes attach to it."
          action={
            <a href="/jobseeker/profile" className="btn-primary">
              Go to profile
            </a>
          }
        />
      ) : resumes.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading resumes…
        </div>
      ) : resumes.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {resumes.error}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="document" className="h-10 w-10" />}
          title="No resumes yet"
          description="Add your CV so you can apply with one click."
          action={<Button onClick={startNew}>+ Add resume</Button>}
        />
      ) : (
        <ul className="space-y-4">
          {sorted.map((res) => (
            <li key={res.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <NavIcon name="document" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold text-slate-900">{res.title}</h2>
                    {res.is_default && <Badge tone="green">Default</Badge>}
                    <Badge tone="slate">{res.file_type}</Badge>
                  </div>
                  <p className="truncate text-sm text-slate-500">{res.file_name}</p>
                  <p className="text-xs text-slate-400">
                    {formatBytes(res.file_size_bytes)} · added {formatDate(res.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap shrink-0 gap-2">
                <a
                  href={res.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Open
                </a>
                {!res.is_default && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={defaultingId === res.id}
                    onClick={() => void makeDefault(res.id)}
                  >
                    Set default
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => startEdit(res)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deletingId === res.id}
                  onClick={() => void remove(res.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        title={editing ? 'Edit resume' : 'Add resume'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Title" required htmlFor="res-title" hint="e.g. Frontend CV, 2026">
            <Input
              id="res-title"
              placeholder="My resume"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field
            label="Document URL"
            required
            htmlFor="res-url"
            hint={`Must end in ${ALLOWED.join(', ')}`}
          >
            <Input
              id="res-url"
              type="url"
              placeholder="https://example.com/cv.pdf"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </Field>
          <Field label="File size (KB)" htmlFor="res-size" hint="Used for the 10 MB validation">
            <Input
              id="res-size"
              type="number"
              min={1}
              value={sizeKb}
              onChange={(e) => setSizeKb(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Use as my default resume
          </label>

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
              {editing ? 'Save changes' : 'Add resume'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
