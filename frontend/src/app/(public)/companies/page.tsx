import Link from 'next/link';
import { serverList } from '@/services/server-api';
import { CompanyLogo } from '@/features/job/components/JobCard';
import type { Company, Job } from '@/types';
import { COMPANY_SIZE_LABELS } from '@/lib/constants';
import { excerpt } from '@/utils/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Companies' };

interface SearchParams {
  q?: string;
  page?: string;
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [res, jobsRes] = await Promise.all([
    serverList<Company>('/companies', { q: params.q, page, perPage: 12 }).catch(() => null),
    serverList<Job>('/jobs', { perPage: 100 }).catch(() => null),
  ]);

  const companies = res?.data ?? [];
  const meta = (res?.meta ?? {}) as Record<string, number>;
  const failed = res === null;

  // Live openings per employer, so a directory card can say how much is hiring.
  const openings = new Map<string, number>();
  for (const job of jobsRes?.data ?? []) {
    openings.set(job.company_id, (openings.get(job.company_id) ?? 0) + 1);
  }

  const buildHref = (overrides: Partial<SearchParams>): string => {
    const merged = { ...params, ...overrides };
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (!value || key === 'page') continue;
      search.set(key, String(value));
    }
    const qs = search.toString();
    return qs ? `/companies?${qs}` : '/companies';
  };

  return (
    <>
      <section className="border-b border-brand-100 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
          <h1 className="font-display text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Company Directory
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            {meta.total != null
              ? `${meta.total} employer${meta.total === 1 ? '' : 's'} hiring on MeroKhoj — browse by name, industry, or city.`
              : 'Explore employers on MeroKhoj'}
          </p>

          <form
            method="GET"
            action="/companies"
            className="mt-6 flex max-w-xl gap-2 rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-900/5"
          >
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ''}
              placeholder="Search companies by name…"
              className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none"
              aria-label="Search companies"
            />
            <button type="submit" className="btn-primary shrink-0">Search</button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {failed ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            The company directory is unavailable right now. Please try again in a moment.
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
            <p className="font-semibold text-slate-700">
              {params.q ? 'No companies match your search' : 'No companies listed yet'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {params.q ? 'Try a different name.' : 'Employers appear here once they join.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => {
                const count = openings.get(company.id) ?? 0;
                return (
                  <Link
                    key={company.id}
                    href={`/companies/${company.id}`}
                    className="group lift flex flex-col rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        name={company.name}
                        logoUrl={company.logo_url}
                        size="h-12 w-12"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display text-[15px] font-bold text-slate-900 transition-colors group-hover:text-brand-600">
                          {company.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {company.industry ?? 'Industry'} · {company.city ?? company.country}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 min-h-[3rem] flex-1 text-sm leading-relaxed text-slate-600">
                      {company.description
                        ? excerpt(company.description, 140)
                        : 'No description yet.'}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <span className="flex flex-wrap gap-1.5">
                        {company.verification_status === 'VERIFIED' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-3 w-3">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Verified
                          </span>
                        )}
                        {company.company_size && (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                            {COMPANY_SIZE_LABELS[company.company_size] ?? company.company_size}{' '}
                            employees
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-[11px] font-bold text-brand-600">
                        {count > 0
                          ? `${count} opening${count === 1 ? '' : 's'}`
                          : 'Hiring soon'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {(meta.totalPages ?? 1) > 1 && (
              <nav className="mt-8 flex items-center justify-between" aria-label="Pagination">
                <Link
                  href={buildHref({ page: String(Math.max(1, page - 1)) })}
                  className={`btn-secondary ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                >
                  ← Previous
                </Link>
                <span className="text-sm text-slate-500">
                  Page {page} of {meta.totalPages}
                </span>
                <Link
                  href={buildHref({ page: String(page + 1) })}
                  className={`btn-secondary ${meta.hasNextPage ? '' : 'pointer-events-none opacity-50'}`}
                >
                  Next →
                </Link>
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
