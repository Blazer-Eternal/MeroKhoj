'use client';

/** Application history + withdraw (GET /applications/mine, POST …/withdraw). */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button, StatusBadge, Spinner, EmptyState, Select, Badge } from '@/components/ui';
import { ApplicationStatus } from '@/enums';
import type { Application } from '@/types';
import { formatDate, timeAgo } from '@/utils/format';

const FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  ...Object.values(ApplicationStatus).map((s) => ({
    value: s,
    label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  })),
];

const WITHDRAWABLE: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.UNDER_REVIEW,
  ApplicationStatus.SHORTLISTED,
];

export default function ApplicationsPage() {
  const applications = useApiList<Application>(endpoints.applications.mine, {
    query: { perPage: 100 },
  });
  const [filter, setFilter] = useState('');
  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const filtered = useMemo(
    () =>
      filter
        ? applications.data.filter((a) => a.status === filter)
        : applications.data,
    [applications.data, filter],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of applications.data) {
      map.set(a.status, (map.get(a.status) ?? 0) + 1);
    }
    return map;
  }, [applications.data]);

  const withdraw = async (id: string) => {
    setBusyId(id);
    setMsg(null);
    try {
      await apiPost(endpoints.applications.withdraw(id), {});
      setMsg({ id, text: 'Application withdrawn.', ok: true });
      applications.refetch();
    } catch (err) {
      setMsg({
        id,
        text: err instanceof ApiRequestError ? err.message : 'Could not withdraw.',
        ok: false,
      });
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {applications.data.length} application{applications.data.length === 1 ? '' : 's'}{' '}
            submitted · withdraw anytime before a decision.
          </p>
        </div>
        <div className="w-56">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
                {f.value && counts.get(f.value) ? ` (${counts.get(f.value)})` : ''}
              </option>
            ))}
          </Select>
        </div>
      </header>

      {applications.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading applications…
        </div>
      ) : applications.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {applications.error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📨"
          title={filter ? 'No applications with that status' : 'No applications yet'}
          description={
            filter
              ? 'Try a different status filter.'
              : 'Jobs you apply to will show up here with their live status.'
          }
          action={
            filter ? (
              <Button variant="secondary" onClick={() => setFilter('')}>
                Clear filter
              </Button>
            ) : (
              <Link href="/jobs" className="btn-primary">
                Browse jobs
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((app) => {
            const canWithdraw = WITHDRAWABLE.includes(app.status);
            return (
              <li key={app.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/jobs/${app.job_id}`}
                        className="font-semibold text-slate-900 hover:text-brand-600"
                      >
                        {app.job?.title ?? 'Job posting'}
                      </Link>
                      <StatusBadge kind="application" value={app.status} />
                      <Badge tone="slate">{app.source.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {app.job?.location ?? ''} · applied{' '}
                      {app.applied_at ? formatDate(app.applied_at) : timeAgo(app.created_at)}
                      {app.withdrawn_at ? ` · withdrawn ${formatDate(app.withdrawn_at)}` : ''}
                    </p>
                    {app.cover_letter && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        “{app.cover_letter}”
                      </p>
                    )}
                    {msg?.id === app.id && (
                      <p
                        className={`mt-2 text-xs font-semibold ${
                          msg.ok ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {msg.text}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/jobs/${app.job_id}`} className="btn-secondary px-3 py-1.5 text-xs">
                      View job
                    </Link>
                    {canWithdraw && (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={busyId === app.id}
                        onClick={() => void withdraw(app.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
