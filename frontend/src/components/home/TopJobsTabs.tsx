'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Company, Job } from '@/types';
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants';
import { CompanyLogo } from '@/features/job/components/JobCard';
import { formatSalaryRange, timeAgo } from '@/utils/format';

interface Props {
  jobs: Job[];
  companies: Company[];
}

const StarIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="h-7 w-7">
    <path
      d="M12 2.5l2.9 6.2 6.8.7-5.1 4.6 1.4 6.7L12 17.3l-6 3.4 1.4-6.7-5.1-4.6 6.8-.7L12 2.5z"
      fill="#8FD14F"
      stroke="#ffffff"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden className="h-3.5 w-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6.5-5.2-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.8 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.4" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden className="h-3.5 w-3.5 shrink-0">
    <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
    <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
  </svg>
);

/**
 * "Top Jobs" section with the Company / Individual Jobs toggle from the
 * reference homepage. Company view groups live jobs under their employer.
 */
export function TopJobsTabs({ jobs, companies }: Props) {
  const [tab, setTab] = useState<'company' | 'individual'>('company');

  const companyById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );

  const groups = useMemo(() => {
    const byCompany = new Map<string, Job[]>();
    for (const job of jobs) {
      const list = byCompany.get(job.company_id) ?? [];
      list.push(job);
      byCompany.set(job.company_id, list);
    }
    return [...byCompany.entries()]
      .map(([companyId, list]) => ({ company: companyById.get(companyId), jobs: list.slice(0, 3) }))
      .filter((group): group is { company: Company; jobs: Job[] } => Boolean(group.company))
      .sort((a, b) => b.jobs.length - a.jobs.length)
      .slice(0, 8);
  }, [jobs, companyById]);

  const individual = jobs.slice(0, 8);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 font-display text-2xl font-extrabold text-slate-900">
            <StarIcon />
            Top Jobs
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Fresh roles from employers actively hiring this week.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Top jobs view">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'company'}
            onClick={() => setTab('company')}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === 'company' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Company
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'individual'}
            onClick={() => setTab('individual')}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === 'individual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Individual Jobs
          </button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="font-semibold text-slate-700">The board is warming up</p>
          <p className="mt-1 text-sm text-slate-500">
            New openings land here as soon as employers publish them.
          </p>
        </div>
      ) : tab === 'company' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map(({ company, jobs: companyJobs }) => (
            <div key={company.id} className="lift flex flex-col rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <CompanyLogo name={company.name} logoUrl={company.logo_url} size="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/companies/${company.id}`}
                    className="block truncate font-display text-sm font-bold text-slate-900 hover:text-brand-600"
                  >
                    {company.name}
                  </Link>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {companyJobs.length} {companyJobs.length === 1 ? 'opening' : 'openings'}
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                {companyJobs.map((job) => (
                  <li key={job.id} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden />
                    <Link
                      href={`/jobs/${job.id}`}
                      className="line-clamp-2 text-sm font-semibold text-brand-600 hover:underline"
                    >
                      {job.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {individual.map((job) => {
            const company = companyById.get(job.company_id) ?? job.company;
            const place = job.job_location?.city ?? job.location;
            const hasSalary = job.salary_min != null || job.salary_max != null;

            return (
              <article key={job.id} className="group lift flex flex-col rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <CompanyLogo
                    name={company?.name}
                    logoUrl={company?.logo_url}
                    size="h-11 w-11"
                    letterClass="text-base"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="line-clamp-2 font-display text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-600"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {company?.name ?? 'MeroKhoj employer'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span className="flex min-w-0 items-center gap-1">
                    <PinIcon />
                    <span className="truncate">{place ?? 'Remote'}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-1">
                    <BriefcaseIcon />
                    <span className="truncate">
                      {EMPLOYMENT_TYPE_LABELS[job.employment_type] ?? job.employment_type}
                    </span>
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="truncate text-xs font-bold text-brand-700">
                    {hasSalary
                      ? formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency)
                      : 'Negotiable'}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-slate-400">
                    {timeAgo(job.published_at ?? job.created_at)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-7 text-center">
        <Link
          href="/jobs"
          className="btn-secondary inline-flex px-6 py-3"
        >
          Browse all openings
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M3 10a1 1 0 0 1 1-1h10.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L14.586 11H4a1 1 0 0 1-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
