import Link from 'next/link';
import { serverList } from '@/services/server-api';
import { JobCard } from '@/features/job/components/JobCard';
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
  page?: string;
}

export const metadata = { title: 'Find Jobs' };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [jobsRes, categoriesRes, industriesRes] = await Promise.allSettled([
    serverList<Job>('/jobs', { ...params, page, perPage: DEFAULT_PAGE_SIZE }),
    serverList<JobCategory>('/job-categories', { perPage: 100 }),
    serverList<Industry>('/industries', { perPage: 100 }),
  ]);

  const jobs = jobsRes.status === 'fulfilled' ? jobsRes.value.data : [];
  const meta = (jobsRes.status === 'fulfilled' ? jobsRes.value.meta : {}) as Record<string, number>;
  const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data : [];
  const industries = industriesRes.status === 'fulfilled' ? industriesRes.value.data : [];
  const failed = jobsRes.status === 'rejected';

  const buildQuery = (overrides: Partial<SearchParams>): string => {
    const merged: SearchParams = { ...params, ...overrides };
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === null || value === '' || key === 'page') continue;
      search.set(key, String(value));
    }
    const qs = search.toString();
    return qs ? `/jobs?${qs}` : '/jobs';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Find Jobs</h1>
        <p className="mt-1 text-sm text-slate-500">
          {meta.total != null
            ? `${meta.total} job${meta.total === 1 ? '' : 's'} found`
            : 'Search the MeroKhoj job board'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20">
          <form method="GET" action="/jobs" className="space-y-4">
            <div>
              <label htmlFor="f-q" className="label">Keyword</label>
              <input
                id="f-q"
                type="search"
                name="q"
                defaultValue={params.q ?? ''}
                placeholder="Title, skill, keyword"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="f-location" className="label">Location</label>
              <input
                id="f-location"
                type="text"
                name="location"
                defaultValue={params.location ?? ''}
                placeholder="e.g. Kathmandu"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="f-employment" className="label">Job type</label>
              <select
                id="f-employment"
                name="employment_type"
                defaultValue={params.employment_type ?? ''}
                className="input"
              >
                <option value="">Any type</option>
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="f-experience" className="label">Experience level</label>
              <select
                id="f-experience"
                name="experience_level"
                defaultValue={params.experience_level ?? ''}
                className="input"
              >
                <option value="">Any level</option>
                {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="f-category" className="label">Category</label>
              <select
                id="f-category"
                name="category_id"
                defaultValue={params.category_id ?? ''}
                className="input"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="f-industry" className="label">Industry</label>
              <select
                id="f-industry"
                name="industry_id"
                defaultValue={params.industry_id ?? ''}
                className="input"
              >
                <option value="">All industries</option>
                {industries.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="f-salary-min" className="label">Min salary</label>
                <input
                  id="f-salary-min"
                  type="number"
                  name="salary_min"
                  min={0}
                  defaultValue={params.salary_min ?? ''}
                  placeholder="0"
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="f-salary-max" className="label">Max salary</label>
                <input
                  id="f-salary-max"
                  type="number"
                  name="salary_max"
                  min={0}
                  defaultValue={params.salary_max ?? ''}
                  placeholder="Any"
                  className="input"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1">Apply filters</button>
              <Link href="/jobs" className="btn-secondary">Reset</Link>
            </div>
          </form>
        </aside>

        {/* Results */}
        <section>
          {failed ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              Can&apos;t reach the API — start the backend on port 8000.
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
              <p className="font-semibold text-slate-700">No jobs match your filters</p>
              <p className="mt-1 text-sm text-slate-500">Try widening the search or clearing filters.</p>
              <Link href="/jobs" className="btn-secondary mt-4 inline-flex">Clear filters</Link>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
              {/* Server-rendered pagination (page changes reload with new searchParams) */}
              <nav className="mt-6 flex items-center justify-between" aria-label="Pagination">
                <Link
                  href={buildQuery({ page: String(Math.max(1, page - 1)) })}
                  className={`btn-secondary ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                >
                  ← Previous
                </Link>
                <span className="text-sm text-slate-500">
                  Page {page} of {meta.totalPages ?? 1}
                </span>
                <Link
                  href={buildQuery({ page: String(page + 1) })}
                  className={`btn-secondary ${(meta.hasNextPage ?? false) ? '' : 'pointer-events-none opacity-50'}`}
                >
                  Next →
                </Link>
              </nav>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
