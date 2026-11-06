import Link from 'next/link';
import { serverList } from '@/services/server-api';
import { JobCard } from '@/features/job/components/JobCard';
import type { Company, Job, JobCategory } from '@/types';
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants';
import { excerpt } from '@/utils/format';

export const dynamic = 'force-dynamic';

const STATS = [
  { value: '36', label: 'Entities tracked' },
  { value: '146', label: 'API endpoints' },
  { value: '3', label: 'User areas' },
  { value: '100%', label: 'Open source' },
];

async function getHomeData() {
  const [jobsRes, companiesRes, categoriesRes] = await Promise.allSettled([
    serverList<Job>('/jobs', { perPage: 6 }),
    serverList<Company>('/companies', { perPage: 8 }),
    serverList<JobCategory>('/job-categories', { perPage: 12 }),
  ]);
  return {
    jobs: jobsRes.status === 'fulfilled' ? jobsRes.value.data : [],
    companies: companiesRes.status === 'fulfilled' ? companiesRes.value.data : [],
    categories: categoriesRes.status === 'fulfilled' ? categoriesRes.value.data : [],
    failed: jobsRes.status === 'rejected',
  };
}

export default async function HomePage() {
  const { jobs, companies, categories, failed } = await getHomeData();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">
              Nepal&apos;s job marketplace
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Find what&apos;s yours.
            </h1>
            <p className="mt-4 text-lg text-brand-100">
              Khoj is a function, not a channel — seekers discover jobs, employers discover
              talent.
            </p>
          </div>

          {/* Search bar */}
          <form
            action="/jobs"
            method="GET"
            className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-xl sm:flex-row"
          >
            <input
              type="search"
              name="q"
              placeholder="Job title, keyword, or skill"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              aria-label="Search jobs"
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-48"
              aria-label="Location"
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
            >
              Search
            </button>
          </form>

          {/* Quick category chips */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
              <Link
                key={value}
                href={`/jobs?employment_type=${value}`}
                className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-extrabold text-brand-600">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top jobs */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Top Jobs</h2>
            <p className="mt-1 text-sm text-slate-500">Fresh openings from verified employers</p>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>

        {failed ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            Can&apos;t reach the API — start the backend on port 8000 to see live jobs.
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500">No published jobs yet — check back soon.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Top employers */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Top Employers</h2>
              <p className="mt-1 text-sm text-slate-500">Companies hiring on MeroKhoj</p>
            </div>
            <Link
              href="/companies"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              View all →
            </Link>
          </div>

          {companies.length === 0 ? (
            <p className="text-sm text-slate-500">No companies listed yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-lg font-bold text-brand-600">
                      {company.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{company.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {company.industry ?? 'Company'} · {company.city ?? company.country}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                    {company.description ? excerpt(company.description, 110) : 'No description yet.'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Browse by Category</h2>
            <p className="mt-1 text-sm text-slate-500">Jump straight to your field</p>
          </div>
          <Link
            href="/job-categories"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            All categories →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/jobs?category_id=${category.id}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-700 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to hire great talent?</h2>
          <p className="max-w-xl text-brand-100">
            Create an employer account, verify your company, and start posting jobs in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              Get started free
            </Link>
            <Link
              href="/companies"
              className="rounded-lg border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
            >
              Browse companies
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
