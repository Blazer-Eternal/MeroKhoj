import Link from 'next/link';
import { serverList } from '@/services/server-api';
import { TopJobsTabs } from '@/components/home/TopJobsTabs';
import { TopEmployersStrip } from '@/components/home/TopEmployersStrip';
import { StatsBand } from '@/components/home/StatsBand';
import { EverythingYouNeed } from '@/components/home/EverythingYouNeed';
import { Watermark } from '@/components/home/Watermark';
import type { Company, Job, JobCategory, Location } from '@/types';
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants';
import { formatSalaryRange, timeAgo } from '@/utils/format';

export const dynamic = 'force-dynamic';

const HERO_CHIPS = [
  { label: 'All Jobs', href: '/jobs' },
  { label: 'Jobs by Function', href: '/job-categories' },
  { label: 'Jobs by Title', href: '/jobs' },
  { label: 'Jobs by Industry', href: '/job-categories#industries' },
  { label: 'Jobs by Location', href: '/job-categories#locations' },
];

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden className="h-5 w-5">
    <circle cx="11" cy="11" r="7" />
    <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
  </svg>
);

const StatIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-brand-600 shadow-sm">
    {children}
  </span>
);

async function getHomeData() {
  const [jobsRes, companiesRes, categoriesRes, locationsRes] = await Promise.allSettled([
    serverList<Job>('/jobs', { perPage: 48 }),
    serverList<Company>('/companies', { perPage: 100 }),
    serverList<JobCategory>('/job-categories', { perPage: 100 }),
    serverList<Location>('/locations', { perPage: 100 }),
  ]);

  const jobs = jobsRes.status === 'fulfilled' ? jobsRes.value.data : [];
  const companies = companiesRes.status === 'fulfilled' ? companiesRes.value.data : [];
  const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data : [];
  const locations = locationsRes.status === 'fulfilled' ? locationsRes.value.data : [];

  const jobsTotal = Number(jobsRes.status === 'fulfilled' ? jobsRes.value.meta.total ?? jobs.length : jobs.length);
  const companiesTotal = Number(
    companiesRes.status === 'fulfilled' ? companiesRes.value.meta.total ?? companies.length : companies.length,
  );

  return {
    jobs,
    companies,
    categories,
    locations,
    jobsTotal,
    companiesTotal,
    failed: jobsRes.status === 'rejected',
  };
}

export default async function HomePage() {
  const { jobs, companies, categories, locations, jobsTotal, companiesTotal, failed } =
    await getHomeData();

  const companyById = new Map(companies.map((company) => [company.id, company]));
  const categoryCounts = new Map<string, number>();
  for (const job of jobs) {
    if (job.category_id) {
      categoryCounts.set(job.category_id, (categoryCounts.get(job.category_id) ?? 0) + 1);
    }
  }

  const [firstJob, secondJob] = jobs;
  const firstCompany = firstJob ? companyById.get(firstJob.company_id) : undefined;
  const secondCompany = secondJob ? companyById.get(secondJob.company_id) : undefined;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-50">
        <Watermark />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] text-slate-900 sm:text-5xl">
                Find the job that fits <span className="text-brand-600">your life</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
                Search verified openings across Nepal, save the ones worth coming back to, and
                follow every application from submitted to offer.
              </p>

              {/* Platform counters */}
              <div className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
                <div className="flex items-center gap-3">
                  <StatIcon>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-5 w-5">
                      <rect x="3" y="7" width="18" height="13" rx="2" />
                      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </StatIcon>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Live Jobs</p>
                    <p className="font-display text-3xl font-extrabold text-slate-900">
                      {jobsTotal.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatIcon>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-5 w-5">
                      <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h4a2 2 0 0 1 2 2v10" />
                      <path d="M9 7h2M9 11h2M9 15h2" />
                    </svg>
                  </StatIcon>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Organizations</p>
                    <p className="font-display text-3xl font-extrabold text-slate-900">
                      {companiesTotal.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatIcon>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-5 w-5">
                      <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </StatIcon>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Locations</p>
                    <p className="font-display text-3xl font-extrabold text-slate-900">
                      {locations.length.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Search bar */}
              <form
                action="/jobs"
                method="GET"
                className="mt-8 flex max-w-2xl flex-col gap-2 rounded-xl bg-white p-2 shadow-lg sm:flex-row"
              >
                <input
                  type="search"
                  name="q"
                  placeholder="Search by title, skill, or organization"
                  aria-label="Search jobs"
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-brand-700"
                >
                  <SearchIcon />
                  Search Job
                </button>
              </form>

              {/* Quick filters */}
              <div className="mt-5 flex flex-wrap gap-2.5">
                {HERO_CHIPS.map((chip) => (
                  <Link
                    key={chip.label}
                    href={chip.href}
                    className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-200"
                  >
                    {chip.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Product visual: live matches over big brand type */}
            <div className="relative hidden h-[430px] lg:block" aria-hidden>
              <div className="absolute right-0 top-2 select-none text-right font-display text-7xl font-black leading-[0.9] text-brand-200">
                FIND
                <br />
                YOURS
              </div>

              {firstJob && (
                <div className="absolute left-0 top-24 w-80 rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                      New match
                    </span>
                    <span className="text-xs text-slate-400">{timeAgo(firstJob.published_at ?? firstJob.created_at)}</span>
                  </div>
                  <p className="mt-3 line-clamp-1 font-display text-base font-bold text-slate-900">
                    {firstJob.title}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {firstCompany?.name ?? 'MeroKhoj employer'} · {firstJob.location ?? 'Remote'}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {EMPLOYMENT_TYPE_LABELS[firstJob.employment_type] ?? firstJob.employment_type}
                    </span>
                    <span className="truncate rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {formatSalaryRange(firstJob.salary_min, firstJob.salary_max, firstJob.salary_currency)}
                    </span>
                    <Link
                      href={`/jobs/${firstJob.id}`}
                      className="ml-auto shrink-0 text-sm font-bold text-brand-600"
                    >
                      View
                    </Link>
                  </div>
                </div>
              )}

              {secondJob && (
                <div className="absolute right-0 top-56 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                  <p className="line-clamp-1 text-sm font-bold text-slate-900">{secondJob.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {secondCompany?.name ?? 'MeroKhoj employer'} · {secondJob.location ?? 'Remote'}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                      Applications open
                    </span>
                    <Link href={`/jobs/${secondJob.id}`} className="text-xs font-bold text-brand-600">
                      View
                    </Link>
                  </div>
                </div>
              )}

              <div className="absolute bottom-10 left-16 rounded-xl bg-accent-500 px-6 py-4 text-center text-white shadow-lg">
                <p className="font-display text-2xl font-black">100%</p>
                <p className="text-[11px] font-semibold">Free for jobseekers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top employers */}
      <TopEmployersStrip companies={companies} />

      {/* Top jobs */}
      <TopJobsTabs jobs={jobs} companies={companies} />

      {/* Browse by function */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                Browse by Function
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Every field, one click from the live board.
              </p>
            </div>
            <Link
              href="/job-categories"
              className="text-sm font-bold text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.slice(0, 12).map((category) => (
              <Link
                key={category.id}
                href={`/jobs?category_id=${category.id}`}
                className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="truncate text-sm font-semibold text-slate-700 group-hover:text-brand-700">
                  {category.name}
                </span>
                <span className="shrink-0 text-xs font-bold text-slate-400">
                  {categoryCounts.get(category.id) ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Platform stats */}
      <StatsBand
        items={[
          { value: jobsTotal.toLocaleString('en-US'), label: 'Live Jobs' },
          { value: companiesTotal.toLocaleString('en-US'), label: 'Verified Employers' },
          { value: categories.length.toLocaleString('en-US'), label: 'Job Categories' },
          { value: locations.length.toLocaleString('en-US'), label: 'Locations Covered' },
        ]}
      />

      {/* Jobseeker value band */}
      <EverythingYouNeed
        title={
          <>
            Everything you need to land <span className="text-brand-600">the right role</span>
          </>
        }
        body="Build one profile, apply with a click, and follow every application from submitted to decision. Searching, saving and applying on MeroKhoj costs nothing."
        cta={{ href: '/register', label: 'Create your free profile' }}
        stat={{ value: '0', label: 'Fees for jobseekers' }}
      />

      {/* Employer CTA */}
      <section className="bg-brand-50">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-slate-900">
              Hiring? Your next teammate is already searching.
            </h2>
            <p className="mt-2 max-w-xl text-slate-600">
              Create an employer account, verify your company, and publish your first job. The
              first posting is on us.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-6 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-brand-700"
            >
              Post a job
            </Link>
            <Link
              href="/employer"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-display text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Employer login
            </Link>
          </div>
        </div>
      </section>

      {failed && (
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Live listings are unavailable right now. Please try again in a moment.
          </p>
        </div>
      )}
    </>
  );
}
