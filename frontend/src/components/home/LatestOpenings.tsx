import Link from 'next/link';
import type { Job } from '@/types';
import { CompanyLogo } from '@/features/job/components/JobCard';
import { formatSalaryRange, timeAgo } from '@/utils/format';

interface Props {
  jobs: Job[];
}

/**
 * Two-column digest of the newest published roles — the section a returning
 * visitor scans first, so every row leads with the mark, the title and pay.
 */
export function LatestOpenings({ jobs }: Props) {
  if (jobs.length === 0) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {jobs.map((job) => {
        const company = job.company;
        const place = job.job_location?.city ?? job.location;
        const hasSalary = job.salary_min != null || job.salary_max != null;

        return (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="group lift flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5"
          >
            <CompanyLogo name={company?.name} logoUrl={company?.logo_url} size="h-11 w-11" />

            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[15px] font-bold text-slate-900 transition-colors group-hover:text-brand-600">
                {job.title}
              </span>
              <span className="mt-0.5 block truncate text-sm text-slate-500">
                {company?.name ?? 'MeroKhoj employer'}
                {place ? ` · ${place}` : ''}
              </span>
            </span>

            <span className="hidden shrink-0 text-right sm:block">
              <span className="block text-sm font-bold text-slate-700">
                {hasSalary
                  ? formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency)
                  : 'Negotiable'}
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">
                {timeAgo(job.published_at ?? job.created_at)}
              </span>
            </span>

            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
              className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-brand-600"
            >
              <path
                fillRule="evenodd"
                d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.6 11H4a1 1 0 1 1 0-2h7.6L7.3 5.7a1 1 0 0 1 0-1.4z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
