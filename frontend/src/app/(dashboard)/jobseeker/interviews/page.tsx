'use client';

/**
 * Interviews — real list from GET /interviews (scoped server-side to this
 * jobseeker's applications). Upcoming first, then the past record.
 */
import Link from 'next/link';
import { useMemo } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { endpoints } from '@/services/api-endpoints';
import { StatusBadge, Spinner, EmptyState, Badge } from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { InterviewStatus, InterviewType } from '@/enums';
import type { Interview } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  [InterviewType.PHONE]: 'Phone',
  [InterviewType.VIDEO]: 'Video call',
  [InterviewType.IN_PERSON]: 'In person',
  [InterviewType.TECHNICAL]: 'Technical',
  [InterviewType.HR]: 'HR',
  [InterviewType.FINAL]: 'Final round',
};

const UPCOMING: InterviewStatus[] = [
  InterviewStatus.SCHEDULED,
  InterviewStatus.CONFIRMED,
  InterviewStatus.RESCHEDULED,
];

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

function InterviewRow({ interview }: { interview: Interview }) {
  const job = interview.application?.job;

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-4">
      <div className="min-w-0">
        {job ? (
          <Link
            href={`/jobs/${job.id}`}
            className="font-semibold text-slate-900 hover:text-brand-600"
          >
            {job.title}
          </Link>
        ) : (
          <p className="font-semibold text-slate-900">Interview</p>
        )}
        <p className="mt-1 text-sm text-slate-600">{formatWhen(interview.scheduled_at)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="slate">{TYPE_LABELS[interview.interview_type] ?? interview.interview_type}</Badge>
          {interview.duration_minutes ? (
            <span className="text-xs text-slate-400">{interview.duration_minutes} min</span>
          ) : null}
          {interview.meeting_url ? (
            <a
              href={interview.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Join link
            </a>
          ) : null}
          {interview.location && (
            <span className="truncate text-xs text-slate-500">{interview.location}</span>
          )}
        </div>
        {interview.notes && (
          <p className="mt-2 max-w-2xl text-sm text-slate-500">{interview.notes}</p>
        )}
      </div>
      <StatusBadge kind="interview" value={interview.status} />
    </li>
  );
}

export default function InterviewsPage() {
  const interviews = useApiList<Interview>(endpoints.interviews.list, {
    query: { perPage: 100 },
  });

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: Interview[] = [];
    const done: Interview[] = [];
    for (const item of interviews.data) {
      const isUpcoming =
        UPCOMING.includes(item.status) && new Date(item.scheduled_at).getTime() >= now;
      (isUpcoming ? up : done).push(item);
    }
    up.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    done.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
    return { upcoming: up, past: done };
  }, [interviews.data]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Interviews</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every scheduled conversation with an employer, in one place.
        </p>
      </header>

      {interviews.loading ? (
        <div className="card flex items-center gap-2 text-sm text-slate-500">
          <Spinner /> Loading interviews…
        </div>
      ) : interviews.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {interviews.error}
        </div>
      ) : interviews.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="calendar" className="h-10 w-10" />}
          title="No interviews scheduled"
          description="When an employer moves you forward, the invitation appears here."
          action={
            <Link href="/jobs" className="btn-primary">
              Keep applying
            </Link>
          }
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="card">
              <h2 className="mb-2 text-lg font-bold text-slate-900">Upcoming</h2>
              <ul className="divide-y divide-slate-100">
                {upcoming.map((interview) => (
                  <InterviewRow key={interview.id} interview={interview} />
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section className="card">
              <h2 className="mb-2 text-lg font-bold text-slate-900">Past</h2>
              <ul className="divide-y divide-slate-100">
                {past.map((interview) => (
                  <InterviewRow key={interview.id} interview={interview} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
