import Link from 'next/link';
import { serverList } from '@/services/server-api';
import { StatsBand } from '@/components/home/StatsBand';
import { TopEmployersStrip } from '@/components/home/TopEmployersStrip';
import { EverythingYouNeed } from '@/components/home/EverythingYouNeed';
import { EmployerLoginCard } from '@/components/home/EmployerLoginCard';
import { Watermark } from '@/components/home/Watermark';
import type { Company, Job, JobCategory, Location } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'For Employers',
  description: 'Post jobs, review applicants, and hire with MeroKhoj.',
};

const Illustration = () => (
  <div className="relative mx-auto hidden h-[400px] w-full max-w-[480px] lg:block" aria-hidden>
    {/* Orbit rings around the recruiter */}
    <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-brand-300" />
    <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-100" />
    <span className="absolute left-[13%] top-[26%] h-2.5 w-2.5 rounded-full bg-brand-400" />
    <span className="absolute bottom-[22%] right-[14%] h-2.5 w-2.5 rounded-full bg-brand-400" />
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-500">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-24 w-24">
        <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-8 1a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8 12zm8 1c-2.7 0-6 1.34-6 4v2h12v-2c0-2.66-3.3-4-6-4zM8 14c-2.4 0-6 1.2-6 3.6V20h5v-2c0-1.1.5-2.6 1.6-3.8A9.6 9.6 0 0 0 8 14z" />
      </svg>
    </div>

    {/* Yellow call-to-action chip */}
    <span className="absolute left-0 top-8 rounded-lg bg-amber-400 px-5 py-2.5 font-display text-sm font-bold text-slate-900 shadow-md">
      Post a Job
    </span>

    {/* Floating feature card */}
    <div className="absolute left-0 top-32 w-56 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
      <p className="font-display text-sm font-bold text-slate-900">Screening questions</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Set the bar before the first interview.
      </p>
    </div>

    {/* Mock openings card */}
    <div className="absolute right-0 top-6 w-60 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-600 font-display text-sm font-black text-white">
          M
        </span>
        <span className="truncate font-display text-sm font-bold text-slate-900">
          MeroKhoj Labs
        </span>
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="ml-auto h-4 w-4 text-slate-400">
          <path
            fillRule="evenodd"
            d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <ul className="mt-2.5 space-y-1 text-sm font-semibold text-brand-600">
        <li>UX Designer</li>
        <li>Sales Executive</li>
      </ul>
    </div>

    {/* Teal entitlement badge */}
    <div className="absolute bottom-10 right-6 rounded-xl bg-accent-500 px-5 py-3.5 text-center text-white shadow-lg">
      <p className="font-display text-2xl font-black">Free</p>
      <p className="text-[11px] font-semibold">First posting</p>
    </div>
  </div>
);

async function getEmployerData() {
  const [jobsRes, companiesRes, categoriesRes, locationsRes] = await Promise.allSettled([
    serverList<Job>('/jobs', { perPage: 12 }),
    serverList<Company>('/companies', { perPage: 14 }),
    serverList<JobCategory>('/job-categories', { perPage: 100 }),
    serverList<Location>('/locations', { perPage: 100 }),
  ]);

  const jobs = jobsRes.status === 'fulfilled' ? jobsRes.value.data : [];
  const companies = companiesRes.status === 'fulfilled' ? companiesRes.value.data : [];
  const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data : [];
  const locations = locationsRes.status === 'fulfilled' ? locationsRes.value.data : [];

  const jobsTotal = Number(
    jobsRes.status === 'fulfilled' ? jobsRes.value.meta.total ?? jobs.length : jobs.length,
  );
  const companiesTotal = Number(
    companiesRes.status === 'fulfilled'
      ? companiesRes.value.meta.total ?? companies.length
      : companies.length,
  );

  return { companies, categories, locations, jobsTotal, companiesTotal };
}

export default async function EmployerZonePage() {
  const { companies, categories, locations, jobsTotal, companiesTotal } =
    await getEmployerData();

  return (
    <>
      {/* Hero: illustration + login card (merojob employer-zone layout) */}
      <section className="relative overflow-hidden bg-brand-50">
        <Watermark />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Illustration />
              <h1 className="mt-8 text-center font-display text-5xl font-extrabold leading-tight text-slate-900 lg:mt-10 lg:text-left">
                Hire the <span className="text-brand-600">Right Fit</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-center text-lg leading-relaxed text-slate-600 lg:mx-0 lg:text-left">
                Post a role, read real applications, and move every candidate through one
                pipeline your whole team can see.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link
                  href="/register"
                  className="rounded-lg bg-brand-600 px-6 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-brand-700"
                >
                  Create employer account
                </Link>
                <Link
                  href="/companies"
                  className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-display text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Browse employers
                </Link>
              </div>
            </div>

            <div className="mx-auto w-full max-w-md lg:mx-0">
              <EmployerLoginCard />
            </div>
          </div>
        </div>
      </section>

      {/* Platform counters */}
      <StatsBand
        items={[
          { value: jobsTotal.toLocaleString('en-US'), label: 'Live Jobs' },
          { value: companiesTotal.toLocaleString('en-US'), label: 'Verified Employers' },
          { value: categories.length.toLocaleString('en-US'), label: 'Job Categories' },
          { value: locations.length.toLocaleString('en-US'), label: 'Locations Covered' },
        ]}
      />

      <TopEmployersStrip companies={companies} />

      {/* Hiring value band */}
      <EverythingYouNeed
        title={
          <>
            Everything you need to hire <span className="text-brand-600">the right people</span>
          </>
        }
        body="Publish a role with screening questions, review every applicant in one pipeline, schedule interviews, and record the decision where the whole team can see it."
        cta={{ href: '/register', label: 'Start hiring smarter' }}
        stat={{ value: '4', label: 'Steps from posting to offer' }}
      />
    </>
  );
}
