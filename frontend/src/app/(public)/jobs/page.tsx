import Link from 'next/link';
import { serverList } from '@/services/server-api';
import { JobCard } from '@/features/job/components/JobCard';
import { JobFilters } from '@/features/job/components/JobFilters';
import type { Job, JobCategory, Industry } from '@/types';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS, DEFAULT_PAGE_SIZE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  employment_type?: string;
  experience_level?: string;
  location?: string;
  salary_min?: string;
  salary_max?: string;
  category_id?: string;
  industry_id?: string;
  sort?: string;
  page?: string;
}

export const metadata = { title: 'Find Jobs' };

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'deadline', label: 'Closing soon' },
  { value: 'salary', label: 'Top salary' },
] as const;

/** Params that stay put when the quick tabs or the search band are used. */
const PERSISTENT_KEYS: (keyof SearchParams)[] = [
  'experience_level',
  'location',
  'salary_min',
  'salary_max',
  'category_id',
  'industry_id',
  'sort',
];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const sort = SORT_OPTIONS.some((option) => option.value === params.sort)
    ? params.sort!
    : 'newest';

  const [jobsRes, categoriesRes, industriesRes] = await Promise.allSettled([
    serverList<Job>('/jobs', { ...params, sort, page, perPage: DEFAULT_PAGE_SIZE }),
    serverList<JobCategory>('/job-categories', { perPage: 100 }),
    serverList<Industry>('/industries', { perPage: 100 }),
  ]);

  let jobs = jobsRes.status === 'fulfilled' ? jobsRes.value.data : [];
  let meta = (jobsRes.status === 'fulfilled' ? jobsRes.value.meta : {}) as Record<string, number>;
  let failed = jobsRes.status === 'rejected';
  let currentPage = page;

  // A stale bookmark or an over-eager "Next" can point past the last page.
  // Re-ask from page 1 rather than showing an empty result under a header
  // that claims rows exist.
  if (!failed && jobs.length === 0 && page > 1) {
    const totalSoFar = Number(meta.total ?? 0);
    currentPage = Math.max(1, Math.min(page, Number(meta.totalPages ?? 1) || 1));
    if (totalSoFar > 0 && currentPage !== page) {
      try {
        const retry = await serverList<Job>('/jobs', {
          ...params,
          sort,
          page: currentPage,
          perPage: DEFAULT_PAGE_SIZE,
        });
        jobs = retry.data;
        meta = retry.meta as Record<string, number>;
      } catch {
        failed = true;
      }
    }
  }

  const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data : [];
  const industries = industriesRes.status === 'fulfilled' ? industriesRes.value.data : [];

  const total = Number(meta.total ?? jobs.length);
  const totalPages = Number(meta.totalPages ?? 1);
  const from = total === 0 ? 0 : (currentPage - 1) * DEFAULT_PAGE_SIZE + 1;
  const to = Math.min(currentPage * DEFAULT_PAGE_SIZE, total);

  const buildQuery = (overrides: Partial<SearchParams>): string => {
    // `sort` sits between params and overrides: it supplies the validated
    // default when the caller doesn't set one, but never clobbers an explicit
    // sort from `overrides` (which is how the sort control navigates).
    const merged: SearchParams = { ...params, sort, ...overrides };
    const search = new URLSearchParams();
    // `page` is only emitted when a caller passes it explicitly — every
    // filter/sort link clears it with `page: undefined`, so changing a
    // filter always restarts at page 1 while pagination can still advance.
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === null || value === '') continue;
      search.set(key, String(value));
    }
    const qs = search.toString();
    return qs ? `/jobs?${qs}` : '/jobs';
  };

  /** Hidden inputs so a search or a tab change keeps the other filters. */
  const preserve = (drop: (keyof SearchParams)[]) =>
    PERSISTENT_KEYS.filter((key) => !drop.includes(key) && params[key]).map((key) => (
      <input key={key} type="hidden" name={key} value={String(params[key])} />
    ));

  const activeValues = {
    q: params.q,
    location: params.location,
    employment_type: params.employment_type,
    experience_level: params.experience_level,
    category_id: params.category_id,
    industry_id: params.industry_id,
    salary_min: params.salary_min,
    salary_max: params.salary_max,
  };
  const activeCount = Object.values(activeValues).filter(Boolean).length;

  const categoryName = (id: string) =>
    categories.find((category) => category.id === id)?.name ?? 'Category';
  const industryName = (id: string) =>
    industries.find((industry) => industry.id === id)?.name ?? 'Industry';

  const chips: { key: keyof SearchParams; label: string }[] = [];
  if (params.q) chips.push({ key: 'q', label: `“${params.q}”` });
  if (params.location) chips.push({ key: 'location', label: params.location });
  if (params.employment_type) {
    chips.push({
      key: 'employment_type',
      label: EMPLOYMENT_TYPE_LABELS[params.employment_type] ?? params.employment_type,
    });
  }
  if (params.experience_level) {
    chips.push({
      key: 'experience_level',
      label: EXPERIENCE_LEVEL_LABELS[params.experience_level] ?? params.experience_level,
    });
  }
  if (params.category_id) chips.push({ key: 'category_id', label: categoryName(params.category_id) });
  if (params.industry_id) chips.push({ key: 'industry_id', label: industryName(params.industry_id) });
  if (params.salary_min) {
    chips.push({ key: 'salary_min', label: `Rs. ${Number(params.salary_min).toLocaleString('en-US')}+` });
  }
  if (params.salary_max) {
    chips.push({
      key: 'salary_max',
      label: `Up to Rs. ${Number(params.salary_max).toLocaleString('en-US')}`,
    });
  }

  const tabs = [
    { value: '', label: 'All Jobs' },
    ...Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  ];
  const activeTab = params.employment_type ?? '';

  return (
    <>
      {/* Search band */}
      <section className="border-b border-brand-100 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
          <h1 className="font-display text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Find Jobs
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            {total > 0
              ? `${total.toLocaleString('en-US')} live ${total === 1 ? 'opening' : 'openings'} across Nepal, updated as employers publish.`
              : 'Search verified openings by title, skill, or organization.'}
          </p>

          <form
            action="/jobs"
            method="GET"
            className="mt-6 flex max-w-3xl flex-col gap-2 rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-900/5 sm:flex-row"
          >
            {preserve(['q', 'location'])}
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ''}
              placeholder="Search by title, skill, or organization"
              aria-label="Search jobs"
              className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none"
            />
            <input
              type="text"
              name="location"
              defaultValue={params.location ?? ''}
              placeholder="Location"
              aria-label="Filter by location"
              className="min-w-0 rounded-lg border border-transparent bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none sm:w-44"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-display text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden className="h-5 w-5">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
              Search
            </button>
          </form>

          {/* Quick tabs */}
          <nav
            className="mt-5 -mb-px flex gap-1 overflow-x-auto pb-px"
            aria-label="Job type"
          >
            {tabs.map((tab) => (
              <Link
                key={tab.value || 'all'}
                href={buildQuery({ employment_type: tab.value || undefined, page: undefined })}
                aria-current={activeTab === tab.value ? 'page' : undefined}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.value
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                    : 'bg-white text-slate-600 ring-1 ring-brand-100 hover:bg-brand-100 hover:text-brand-700'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <JobFilters
            values={activeValues}
            categories={categories}
            industries={industries}
            sort={sort}
            activeCount={activeCount}
          />

          {/* Results */}
          <section>
            {failed ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                Live listings are unavailable right now. Please try again in a moment.
              </div>
            ) : (
              <>
                {/* Result bar: count, active chips, sort */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    {total === 0 ? (
                      'No jobs found'
                    ) : (
                      <>
                        Showing{' '}
                        <span className="font-bold text-slate-900">
                          {from.toLocaleString('en-US')}–{to.toLocaleString('en-US')}
                        </span>{' '}
                        of <span className="font-bold text-slate-900">{total.toLocaleString('en-US')}</span>{' '}
                        {total === 1 ? 'job' : 'jobs'}
                      </>
                    )}
                  </p>

                  <div
                    className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
                    role="group"
                    aria-label="Sort results"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <Link
                        key={option.value}
                        href={buildQuery({ sort: option.value, page: undefined })}
                        aria-pressed={sort === option.value}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          sort === option.value
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {option.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {chips.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {chips.map((chip) => (
                      <Link
                        key={chip.key}
                        href={buildQuery({ [chip.key]: undefined, page: undefined })}
                        className="group flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100"
                        title={`Remove ${chip.label} filter`}
                      >
                        {chip.label}
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden
                          className="h-3.5 w-3.5 text-brand-400 group-hover:text-brand-700"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.3 5.3a1 1 0 0 1 1.4 0L10 8.6l3.3-3.3a1 1 0 1 1 1.4 1.4L11.4 10l3.3 3.3a1 1 0 0 1-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 0 1-1.4-1.4L8.6 10 5.3 6.7a1 1 0 0 1 0-1.4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Link>
                    ))}
                    <Link
                      href="/jobs"
                      className="px-2 py-1.5 text-xs font-bold text-slate-500 hover:text-brand-600"
                    >
                      Clear all
                    </Link>
                  </div>
                )}

                {jobs.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                    <p className="font-semibold text-slate-700">No jobs match your filters</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try widening the search or clearing filters.
                    </p>
                    <Link href="/jobs" className="btn-secondary mt-4 inline-flex">
                      Clear filters
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="mt-5 grid gap-4">
                      {jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </div>

                    {/* Server-rendered pagination (page changes reload with new searchParams) */}
                    {totalPages > 1 && (
                      <nav className="mt-6 flex items-center justify-between" aria-label="Pagination">
                        <Link
                          href={buildQuery({ page: String(Math.max(1, currentPage - 1)) })}
                          className={`btn-secondary ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                          aria-disabled={currentPage <= 1}
                        >
                          ← Previous
                        </Link>
                        <span className="text-sm text-slate-500">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Link
                          href={buildQuery({ page: String(currentPage + 1) })}
                          className={`btn-secondary ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                          aria-disabled={currentPage >= totalPages}
                        >
                          Next →
                        </Link>
                      </nav>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
