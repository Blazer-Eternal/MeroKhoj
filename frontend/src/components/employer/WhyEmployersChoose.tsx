import Link from 'next/link';

/**
 * "Why leading employers choose MeroKhoj" — a proof band pairing four
 * concrete reasons with a closing argument. Deliberately not a three-icon
 * box grid: reasons sit in a two-column ledger with numbered rules, and
 * the right side carries one testimonial-style panel with real platform
 * figures instead of a stock quote.
 */

const REASONS = [
  {
    title: 'The reach does the sourcing for you',
    body: 'One posting surfaces in search, category pages, job alerts, your profile and the homepage board, so qualified candidates arrive without you chasing them.',
  },
  {
    title: 'Screening happens before you read',
    body: 'Role-specific questions filter out applications that miss your bar, turning a hundred profiles into a shortlist you can finish in one sitting.',
  },
  {
    title: 'Everyone hiring sees the same record',
    body: 'Pipeline stage, interview feedback, notes and the final decision live on one candidate file instead of scattered across email threads.',
  },
  {
    title: 'Trust is visible from the first glance',
    body: 'The verified badge sits on your profile and postings, telling candidates a real organisation was reviewed by our team before they spend time applying.',
  },
];

export function WhyEmployersChoose({
  jobsTotal,
  companiesTotal,
}: {
  jobsTotal: number;
  companiesTotal: number;
}) {
  return (
    <section className="bg-brand-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              Why leading employers choose <span className="text-brand-600">MeroKhoj</span>
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
              Hiring tools are only worth the decisions they improve. These are the four reasons
              teams give when they move their pipeline here.
            </p>

            <dl className="mt-9 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {REASONS.map((reason, index) => (
                <div key={reason.title} className="border-t-2 border-slate-900/10 pt-4">
                  <dt className="flex items-baseline gap-3">
                    <span className="font-display text-sm font-black text-brand-600">
                      0{index + 1}
                    </span>
                    <span className="font-display text-base font-bold leading-snug text-slate-900">
                      {reason.title}
                    </span>
                  </dt>
                  <dd className="mt-2 pl-8 text-[15px] leading-relaxed text-slate-600">
                    {reason.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Proof panel: real platform figures, no fabricated testimonial. */}
          <aside className="self-start rounded-2xl bg-navy-900 p-7 text-white shadow-[0_32px_64px_-40px_rgba(23,46,92,0.8)]">
            <p className="font-display text-lg font-bold leading-snug">
              The board employers are posting into
            </p>
            <p className="mt-2 text-sm leading-relaxed text-blue-200">
              Every figure below is the live platform count on this page load, not a marketing
              estimate.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
                <span className="text-sm font-semibold text-blue-200">Live roles open now</span>
                <span className="font-display text-2xl font-black text-white">
                  {jobsTotal.toLocaleString('en-US')}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
                <span className="text-sm font-semibold text-blue-200">Employers hiring here</span>
                <span className="font-display text-2xl font-black text-white">
                  {companiesTotal.toLocaleString('en-US')}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-blue-200">Cost to apply, always</span>
                <span className="font-display text-2xl font-black text-accent-400">Rs. 0</span>
              </div>
            </div>

            <p className="mt-6 rounded-xl bg-white/5 px-4 py-3 text-sm leading-relaxed text-blue-100 ring-1 ring-white/10">
              Candidates pay nothing to search or apply, which is why the applications you receive
              keep coming from people who are genuinely looking.
            </p>

            <Link
              href="/register"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-display text-sm font-bold text-navy-900 transition-colors hover:bg-brand-100"
            >
              Create employer account
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
