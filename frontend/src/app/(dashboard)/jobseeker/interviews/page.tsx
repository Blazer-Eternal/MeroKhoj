'use client';

/**
 * Interviews — the backend has no interview LIST endpoint yet (deferred gap
 * B3: only create/update/status/feedback by id). Until it lands this page
 * shows the honest state plus how applications map to upcoming interviews.
 */
import Link from 'next/link';
import { useApiList } from '@/hooks/use-api-list';
import { endpoints } from '@/services/api-endpoints';
import { StatusBadge, Spinner, EmptyState, Badge } from '@/components/ui';
import { ApplicationStatus } from '@/enums';
import type { Application } from '@/types';
import { formatDate } from '@/utils/format';

export default function InterviewsPage() {
  const applications = useApiList<Application>(endpoints.applications.mine, {
    query: { perPage: 100 },
  });

  // Applications whose pipeline stage implies an interview is scheduled.
  const inInterviewStage = applications.data.filter(
    (a) =>
      a.status === ApplicationStatus.INTERVIEW ||
      a.status === ApplicationStatus.SHORTLISTED ||
      a.status === ApplicationStatus.SELECTED,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Interviews</h1>
        <p className="mt-1 text-sm text-slate-500">
          Interview scheduling lands here once the backend exposes the interview list.
        </p>
      </header>

      {/* Honest gap notice (backend gap B3) */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
        <p className="font-semibold">⏳ Interview listing is coming soon</p>
        <p className="mt-1">
          The API currently supports creating and updating interviews by id, but there is no{' '}
          <code className="rounded bg-amber-100 px-1">GET /interviews</code> list endpoint yet
          (tracked as backend gap B3). Until it ships, your pipeline stage below is the best
          proxy for interview activity.
        </p>
      </div>

      {/* Proxy: applications at interview-ish stages */}
      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Interview-stage applications</h2>
          <Link
            href="/jobseeker/applications"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            All applications →
          </Link>
        </div>

        {applications.loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner /> Loading…
          </div>
        ) : inInterviewStage.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No interviews scheduled"
            description="When an employer moves you to interview stage, it appears here."
            action={
              <Link href="/jobs" className="btn-primary">
                Keep applying
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {inInterviewStage.map((app) => (
              <li key={app.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/jobs/${app.job_id}`}
                    className="font-medium text-slate-900 hover:text-brand-600"
                  >
                    {app.job?.title ?? 'Job posting'}
                  </Link>
                  <p className="text-xs text-slate-400">
                    Applied {app.applied_at ? formatDate(app.applied_at) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="teal">Stage</Badge>
                  <StatusBadge kind="application" value={app.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
