'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiPost, apiDelete, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button } from '@/components/ui';

/** Save/unsave a job (jobseeker only — backend enforces the role).
 *  `variant="icon"` renders a compact heart for job cards; the default block
 *  button is used on the job detail sidebar. */
export function SaveJobButton({
  jobId,
  initialSaved = false,
  variant = 'block',
}: {
  jobId: string;
  initialSaved?: boolean;
  variant?: 'block' | 'icon';
}) {
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

  if (variant === 'icon') {
    return (
      <button
        type="button"
        aria-label={saved ? 'Remove saved job' : 'Save job'}
        aria-pressed={saved}
        disabled={busy}
        title={msg || (saved ? 'Saved' : 'Save job')}
        onClick={() => void toggle()}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-60 ${
          saved
            ? 'border-amber-200 bg-amber-50 text-amber-500'
            : 'border-slate-200 bg-white text-slate-400 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden
          className="h-[18px] w-[18px]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 20.3l-1.35-1.24C5.6 14.5 2.75 11.93 2.75 8.7 2.75 6.05 4.83 4 7.45 4c1.5 0 2.94.69 3.9 1.79A5.02 5.02 0 0 1 15.3 4c2.62 0 4.7 2.05 4.7 4.7 0 3.23-2.85 5.8-7.9 10.37L12 20.3z"
          />
        </svg>
      </button>
    );
  }

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

/** Share a job: Web Share where the platform has it, clipboard otherwise. */
export function ShareJobButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const share = async () => {
    const url = new URL(path, window.location.origin).href;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        // A dismissed share sheet is not a failure — leave silently.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Anything else (unsupported, blocked) falls through to the clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setFailed(true);
    }
  };

  return (
    <div>
      <button type="button" className="btn-secondary w-full" onClick={() => void share()}>
        {copied ? 'Link copied' : 'Share job'}
      </button>
      {failed && (
        <p className="field-error">Could not copy the link — copy it from the address bar.</p>
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

