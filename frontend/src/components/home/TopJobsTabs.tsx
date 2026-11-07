'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Company, Job } from '@/types';
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants';
import { timeAgo } from '@/utils/format';

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

  const individual = jobs.slice(0, 12);

  const tile = (company: Company) =>
    company.logo_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={company.logo_url}
        alt=""
        className="h-12 w-12 rounded-lg border border-slate-100 object-contain p-1"
      />
    ) : (
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-50 font-display text-lg font-black text-brand-600">
        {company.name.charAt(0).toUpperCase()}
      </span>
    );

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="flex items-center gap-2.5 font-display text-2xl font-extrabold text-slate-900">
          <StarIcon />
          Top Jobs
        </h2>
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
            <div key={company.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                {tile(company)}
                <Link
                  href={`/companies/${company.id}`}
                  className="min-w-0 truncate font-semibold text-slate-900 hover:text-brand-600"
                >
                  {company.name}
                </Link>
              </div>
              <ul className="mt-3 space-y-1.5">
                {companyJobs.map((job) => (
                  <li key={job.id} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden />
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-sm font-semibold text-brand-600 hover:underline"
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
            const company = companyById.get(job.company_id);
            return (
              <article key={job.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-4">
                <Link
                  href={`/jobs/${job.id}`}
                  className="line-clamp-2 font-semibold text-brand-600 hover:underline"
                >
                  {job.title}
                </Link>
                <p className="mt-1.5 truncate text-sm text-slate-600">
                  {company?.name ?? 'MeroKhoj employer'}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="truncate">{job.location ?? 'Remote'}</span>
                  <span className="shrink-0">{timeAgo(job.published_at ?? job.created_at)}</span>
                </div>
                <span className="mt-3 w-fit rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                  {EMPLOYMENT_TYPE_LABELS[job.employment_type] ?? job.employment_type}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
