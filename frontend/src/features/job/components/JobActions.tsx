'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiPost, apiDelete, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button } from '@/components/ui';

/** Save/unsave a job (jobseeker only — backend enforces the role). */
export function SaveJobButton({ jobId, initialSaved = false }: { jobId: string; initialSaved?: boolean }) {
  const { isAuthenticated, area } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const toggle = async () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/jobs/${jobId}`);
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      if (saved) {
        await apiDelete(endpoints.savedJobs.toggle(jobId));
        setSaved(false);
      } else {
        await apiPost(endpoints.savedJobs.list, { job_id: jobId });
        setSaved(true);
      }
    } catch (err) {
      setMsg(err instanceof ApiRequestError ? err.message : 'Could not update saved job.');
      if (err instanceof ApiRequestError && err.status === 403) {
        // Non-jobseeker (e.g. employer) — hide the button silently next render.
        setSaved(initialSaved);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Button variant="secondary" className="w-full" loading={busy} onClick={() => void toggle()}>
        {saved ? '★ Saved' : '☆ Save job'}
      </Button>
      {msg && <p className="field-error">{msg}</p>}
      {area && area !== 'jobseeker' && !msg && (
        <p className="mt-1 text-xs text-slate-400">Saving jobs is a jobseeker feature.</p>
      )}
    </div>
  );
}

/** Apply to a job (jobseeker only). On success routes to Applications. */
export function ApplyToJobButton({ jobId, disabled = false }: { jobId: string; disabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const apply = async () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/jobs/${jobId}`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await apiPost(endpoints.jobs.apply(jobId), {});
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not apply.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Application submitted ✓{' '}
        <button
          type="button"
          className="font-semibold underline"
          onClick={() => router.push('/jobseeker/applications')}
        >
          Track it
        </button>
      </div>
    );
  }

  return (
    <div>
      <Button className="w-full" loading={busy} disabled={disabled} onClick={() => void apply()}>
        {disabled ? 'No longer accepting' : 'Apply now'}
      </Button>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
