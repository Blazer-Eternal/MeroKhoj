import Link from 'next/link';

export const metadata = { title: 'About' };

const VALUES = [
  {
    icon: '🎯',
    title: 'Khoj is a function',
    text: 'Discovery runs in both directions — seekers find jobs, employers find talent. No channel, just search.',
  },
  {
    icon: '✅',
    title: 'Verified employers',
    text: 'Company verification, job moderation, and audit logs keep the marketplace trustworthy.',
  },
  {
    icon: '🔐',
    title: 'Authorization first',
    text: 'Every action is checked on the server. Roles for jobseekers, employers, and administrators.',
  },
];

const TIMELINE = [
  { phase: 'Phase 1', text: 'Foundation — users, auth, roles, 36-table schema' },
  { phase: 'Phase 2', text: 'Jobseeker side — profiles, education, experience, resumes' },
  { phase: 'Phase 3', text: 'Employer side — companies, members, verification, jobs' },
  { phase: 'Phase 4', text: 'Pipeline — applications, interviews, hiring, talent rosters' },
  { phase: 'Phase 5', text: 'Billing — service plans, orders, payments, invoices' },
  { phase: 'Frontend', text: 'This app — public site + three dashboards on the API' },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          About MeroKhoj
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          MeroKhoj (&quot;find what&apos;s yours&quot;) is a full-stack job portal: a Next.js
          frontend on top of an Express + PostgreSQL API with 36 entities spanning accounts,
          companies, jobs, the hiring pipeline, and billing.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {VALUES.map((value) => (
          <div key={value.title} className="card">
            <span className="text-3xl">{value.icon}</span>
            <h2 className="mt-3 font-semibold text-slate-900">{value.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{value.text}</p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-xl font-bold text-slate-900">How it was built</h2>
        <ol className="mt-6 space-y-4 border-l-2 border-brand-100 pl-6">
          {TIMELINE.map((item) => (
            <li key={item.phase} className="relative">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-brand-100" />
              <p className="text-sm font-bold uppercase tracking-wide text-brand-600">
                {item.phase}
              </p>
              <p className="text-sm text-slate-600">{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-14 flex flex-wrap gap-3">
        <Link href="/jobs" className="btn-primary">Find jobs</Link>
        <Link href="/register" className="btn-secondary">Create an account</Link>
        <Link href="/contact" className="btn-secondary">Contact us</Link>
      </div>
    </div>
  );
}
