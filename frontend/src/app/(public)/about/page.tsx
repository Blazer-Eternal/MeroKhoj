import Link from 'next/link';
import { serverList } from '@/services/server-api';
import { CountUp } from '@/components/home/CountUp';
import type { Company, Job } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'About' };

/**
 * About — editorial layout rather than a feature-card grid: a claim on the
 * left, the values as a numbered ledger on the right, live platform figures
 * between, and the three-step flow drawn as one connected rail.
 */

const VALUES = [
  {
    title: 'Khoj means to search',
    text: 'The name is the brief. Seekers search roles, employers search people, and both sides meet in the middle of one board instead of two disconnected marketplaces.',
  },
  {
    title: 'A board worth reading',
    text: 'Companies verify before they post, jobs pass moderation before they publish, and every sensitive action leaves a record someone can point at later.',
  },
  {
    title: 'Permissions, not promises',
    text: 'Access is checked on the server for every request. Jobseekers, employers and administrators each see what belongs to them and nothing that does not.',
  },
  {
    title: 'Candidates never pay',
    text: 'Searching, saving and applying stay free for jobseekers forever. Employers fund the board with plans, which is why the people applying are actually looking.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Search and shortlist',
    text: 'Filter by function, industry, city, or salary. Save what looks right and set alerts for the rest so the board comes to you.',
  },
  {
    n: '2',
    title: 'Apply and track',
    text: 'One profile, one click to apply. Every application shows its own status, from submitted through to the decision.',
  },
  {
    n: '3',
    title: 'Interview and decide',
    text: 'Employers schedule interviews, collect feedback, and record the hiring decision in the same pipeline the whole team can see.',
  },
];

async function getTotals() {
  const [jobsRes, companiesRes] = await Promise.allSettled([
    serverList<Job>('/jobs', { perPage: 1 }),
    serverList<Company>('/companies', { perPage: 1 }),
  ]);
  const jobs = jobsRes.status === 'fulfilled' ? Number(jobsRes.value.meta.total ?? 0) : 0;
  const companies = companiesRes.status === 'fulfilled' ? Number(companiesRes.value.meta.total ?? 0) : 0;
  return { jobs, companies };
}

export default async function AboutPage() {
  const { jobs, companies } = await getTotals();

  return (
    <>
      <div className="border-b border-slate-100 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h1
            className="mk-rise max-w-3xl font-display text-4xl font-extrabold text-slate-900 sm:text-5xl"
            style={{ '--mk-delay': '40ms' } as React.CSSProperties}
          >
            About MeroKhoj
          </h1>
          <p
            className="mk-rise mt-4 max-w-3xl text-lg leading-relaxed text-slate-600"
            style={{ '--mk-delay': '110ms' } as React.CSSProperties}
          >
            MeroKhoj is where Nepal&apos;s jobseekers and employers find each other. One search
            box for candidates, one pipeline for hiring teams, and a board that stays clean
            because companies and jobs are checked before they go live.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        {/* Claim + numbered values ledger */}
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight text-slate-900">
              What we hold to
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              A job board is only as good as what it lets through. These four rules decide what
              ships, what gets moderated, and who pays for the lights.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/jobs" className="btn-primary px-6 py-3">
                Find jobs
              </Link>
              <Link href="/employer" className="btn-secondary px-6 py-3">
                Hire talent
              </Link>
            </div>
          </div>

          <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {VALUES.map((value, index) => (
              <div
                key={value.title}
                className="mk-rise border-t-2 border-slate-900/10 pt-4"
                style={{ '--mk-delay': `${140 + index * 90}ms` } as React.CSSProperties}
              >
                <dt className="flex items-baseline gap-3">
                  <span className="font-display text-sm font-black text-brand-600">
                    0{index + 1}
                  </span>
                  <span className="font-display text-base font-bold leading-snug text-slate-900">
                    {value.title}
                  </span>
                </dt>
                <dd className="mt-2 pl-8 text-[15px] leading-relaxed text-slate-600">
                  {value.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Live figures — the board as it stands on this load */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-navy-800 px-6 py-8 text-center text-white">
            <p className="font-display text-4xl font-black">
              <CountUp value={jobs} />
            </p>
            <p className="mt-2 text-sm font-medium text-blue-200">live roles on the board</p>
          </div>
          <div className="rounded-xl bg-navy-800 px-6 py-8 text-center text-white">
            <p className="font-display text-4xl font-black">
              <CountUp value={companies} />
            </p>
            <p className="mt-2 text-sm font-medium text-blue-200">employers publishing here</p>
          </div>
          <div className="rounded-xl bg-navy-800 px-6 py-8 text-center text-white">
            <p className="font-display text-4xl font-black text-accent-400">Rs. 0</p>
            <p className="mt-2 text-sm font-medium text-blue-200">for a candidate to apply</p>
          </div>
        </div>

        {/* How it works — one connected rail */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
            How MeroKhoj works
          </h2>
          <div className="relative mt-9">
            <span
              aria-hidden
              className="absolute left-6 top-6 hidden h-0.5 w-[calc(100%-3rem)] bg-slate-200 md:block"
            />
            <ol className="relative grid gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.n}
                  className="mk-rise"
                  style={{ '--mk-delay': `${index * 120}ms` } as React.CSSProperties}
                >
                  <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full bg-navy-800 font-display text-lg font-black text-white ring-4 ring-white">
                    {step.n}
                  </span>
                  <h3 className="mt-4 font-display font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/jobs" className="btn-primary">
            Find jobs
          </Link>
          <Link href="/employer" className="btn-secondary">
            Hire talent
          </Link>
          <Link href="/contact" className="btn-secondary">
            Contact us
          </Link>
        </div>
      </div>
    </>
  );
}
