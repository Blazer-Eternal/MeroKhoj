import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Job } from '@/types';
import { StatusBadge } from '@/components/ui';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '@/lib/constants';
import { formatDate, formatSalaryRange, timeAgo } from '@/utils/format';
import { SaveJobButton } from './JobActions';

/**
 * Job card used on the search results and company profiles.
 * Server-safe (no hooks) — the save heart is a client island.
 */
export function JobCard({ job, showStatus = false }: { job: Job; showStatus?: boolean }) {
  const company = job.company;
  const locationLabel = job.job_location?.city ?? job.location;
  const typeLabel = EMPLOYMENT_TYPE_LABELS[job.employment_type] ?? job.employment_type;
  const levelLabel = job.experience_level
    ? (EXPERIENCE_LEVEL_LABELS[job.experience_level] ?? null)
    : null;
  const postedAt = job.published_at ?? job.created_at;
  const hasSalary = job.salary_min != null || job.salary_max != null;

  return (
    <article className="group lift relative flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <CompanyLogo name={company?.name} logoUrl={company?.logo_url} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-600">
              <Link href={`/jobs/${job.id}`} className="focus-visible:outline-none">
                {job.title}
              </Link>
            </h3>
            <p className="mt-1 truncate text-sm text-slate-500">
              {company?.name ?? 'MeroKhoj employer'}
            </p>
          </div>
          <SaveJobButton jobId={job.id} variant="icon" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {locationLabel && (
            <Meta icon={<PinIcon />}>{locationLabel}</Meta>
          )}
          <Meta icon={<BriefcaseIcon />}>{typeLabel}</Meta>
          {levelLabel && <Meta icon={<LevelIcon />}>{levelLabel}</Meta>}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <Meta icon={<CoinIcon />}>
            <span className={hasSalary ? 'font-semibold text-slate-700' : 'text-slate-500'}>
              {formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency)}
            </span>
          </Meta>
          {job.vacancies > 0 && (
            <Meta icon={<PeopleIcon />}>
              {job.vacancies} {job.vacancies === 1 ? 'opening' : 'openings'}
            </Meta>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {job.category && (
              <Link
                href={`/jobs?category_id=${job.category.id}`}
                className="rounded-md bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700 transition-colors hover:bg-brand-100"
              >
                {job.category.name}
              </Link>
            )}
            {job.application_deadline && (
              <Meta icon={<CalendarIcon />}>
                Closes {formatDate(job.application_deadline)}
              </Meta>
            )}
            {showStatus && <StatusBadge kind="job" value={job.status} />}
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-400">{timeAgo(postedAt)}</span>
        </div>
      </div>
    </article>
  );
}

/** 48px company mark — real logo when present, tinted initial otherwise. */
export function CompanyLogo({
  name,
  logoUrl,
  size = 'h-12 w-12',
  letterClass = 'text-lg',
}: {
  name?: string | null;
  logoUrl?: string | null;
  size?: string;
  letterClass?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className={`${size} shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1.5`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`grid ${size} shrink-0 place-items-center rounded-lg bg-brand-50 font-display font-black text-brand-600 ${letterClass}`}
    >
      {(name ?? 'M').charAt(0).toUpperCase()}
    </span>
  );
}

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-slate-600">
      <span className="text-slate-400">{icon}</span>
      {children}
    </span>
  );
}

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden className="h-4 w-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6.5-5.2-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.8 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.4" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden className="h-4 w-4 shrink-0">
    <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
    <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
  </svg>
);

const LevelIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden className="h-4 w-4 shrink-0">
    <path strokeLinecap="round" d="M4 20V11M10 20V4.5M16 20v-6.5M2 20h20" />
  </svg>
);

const CoinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden className="h-4 w-4 shrink-0">
    <circle cx="12" cy="12" r="8.5" />
    <path strokeLinecap="round" d="M14.6 9.6c-.6-.7-1.5-1.1-2.6-1.1-1.4 0-2.4.7-2.4 1.8 0 2.6 5.2 1.3 5.2 4 0 1.2-1.1 2-2.7 2-1.2 0-2.3-.4-3-1.3M12 6.6v10.8" />
  </svg>
);

const PeopleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden className="h-4 w-4 shrink-0">
    <circle cx="9" cy="8.5" r="3.4" />
    <path strokeLinecap="round" d="M2.8 20c0-3.3 2.8-5.4 6.2-5.4s6.2 2.1 6.2 5.4" />
    <path strokeLinecap="round" d="M16.2 5.7a3.4 3.4 0 0 1 0 6.6M18.4 20c0-2.3-.9-4.1-2.4-5.2" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden className="h-4 w-4 shrink-0">
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path strokeLinecap="round" d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
  </svg>
);
