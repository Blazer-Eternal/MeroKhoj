import Link from 'next/link';
import type { Job } from '@/types';
import { Badge, StatusBadge } from '@/components/ui';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '@/lib/constants';
import { excerpt, formatDate, formatSalaryRange, timeAgo } from '@/utils/format';

/**
 * Job card used on the homepage, search results, and company profiles.
 * Server-safe (no hooks) so it renders in server components.
 */
export function JobCard({ job, showStatus = false }: { job: Job; showStatus?: boolean }) {
  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/jobs/${job.id}`}
              className="text-base font-semibold text-slate-900 hover:text-brand-600"
            >
              {job.title}
            </Link>
            {showStatus && <StatusBadge kind="job" value={job.status} />}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {job.location ?? 'Remote'} · {EMPLOYMENT_TYPE_LABELS[job.employment_type] ?? job.employment_type}
            {job.experience_level
              ? ` · ${EXPERIENCE_LEVEL_LABELS[job.experience_level] ?? job.experience_level}`
              : ''}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
          {job.title.charAt(0).toUpperCase()}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-600">{excerpt(job.description, 160)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="green">{formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency)}</Badge>
        {job.vacancies > 1 && <Badge tone="blue">{job.vacancies} vacancies</Badge>}
        {job.application_deadline && (
          <Badge tone="amber">Closes {formatDate(job.application_deadline)}</Badge>
        )}
        <span className="ml-auto text-xs text-slate-400">{timeAgo(job.published_at ?? job.created_at)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <Link
          href={`/jobs/${job.id}`}
          className="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          View details →
        </Link>
      </div>
    </article>
  );
}

