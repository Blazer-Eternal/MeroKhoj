import Link from 'next/link';

export const metadata = { title: 'About' };

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-6 w-6">
    <circle cx="11" cy="11" r="7" />
    <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-6 w-6">
    <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-6 w-6">
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
  </svg>
);

const VALUES = [
  {
    icon: <SearchIcon />,
    title: 'Khoj means to search',
    text: 'The name is the brief. Seekers search roles, employers search people, and both sides meet in the middle of one board.',
  },
  {
    icon: <ShieldIcon />,
    title: 'A board worth reading',
    text: 'Companies verify before they post, jobs pass moderation before they publish, and every sensitive action leaves a record.',
  },
  {
    icon: <LockIcon />,
    title: 'Permissions, not promises',
    text: 'Access is checked on the server for every request. Jobseekers, employers and administrators each see what belongs to them.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Search and shortlist',
    text: 'Filter by function, industry, city, or salary. Save what looks right and set alerts for the rest.',
  },
  {
    n: '2',
    title: 'Apply and track',
    text: 'One profile, one click to apply. Every application shows its own status, from submitted to decision.',
  },
  {
    n: '3',
    title: 'Interview and decide',
    text: 'Employers schedule interviews, collect feedback, and record the hiring decision in the same pipeline.',
  },
];

export default function AboutPage() {
  return (
    <>
      <div className="border-b border-slate-100 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h1 className="max-w-3xl font-display text-4xl font-extrabold text-slate-900 sm:text-5xl">
            About MeroKhoj
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
            MeroKhoj is where Nepal&apos;s jobseekers and employers find each other. One search
            box for candidates, one pipeline for hiring teams, and a board that stays clean
            because companies and jobs are checked before they go live.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="card">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-50 text-brand-600">
                {value.icon}
              </span>
              <h2 className="mt-4 font-display text-lg font-bold text-slate-900">{value.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{value.text}</p>
            </div>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-extrabold text-slate-900">How MeroKhoj works</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="relative">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-navy-800 font-display text-lg font-black text-white">
                  {step.n}
                </span>
                <h3 className="mt-4 font-display font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/jobs" className="btn-primary">Find jobs</Link>
          <Link href="/employer" className="btn-secondary">Hire talent</Link>
          <Link href="/contact" className="btn-secondary">Contact us</Link>
        </div>
      </div>
    </>
  );
}
