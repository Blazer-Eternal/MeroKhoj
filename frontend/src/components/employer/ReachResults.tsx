import Link from 'next/link';
import { CountUp } from '@/components/home/CountUp';

/**
 * "Hire better with more reach and faster results" — the reach argument
 * for the employer zone. Left: copy plus a count-up of the live board the
 * posting joins. Right: a distribution stack showing every surface one
 * published role appears on, staggered in on mount (mk-rise, not a
 * viewport reveal).
 */

const SURFACES = [
  {
    title: 'Search results',
    detail: 'Ranked by title, skill and location match for every query candidates run.',
  },
  {
    title: 'Category pages',
    detail: 'Listed under the function and industry browsers are already scanning.',
  },
  {
    title: 'Job alerts',
    detail: 'Delivered by email to candidates whose saved criteria match your role.',
  },
  {
    title: 'Company profile',
    detail: 'Every live opening sits under your verified profile and logo.',
  },
  {
    title: 'Homepage board',
    detail: 'Fresh roles surface on the front page while they are still new.',
  },
];

export function ReachResults({
  jobsTotal,
  companiesTotal,
}: {
  jobsTotal: number;
  companiesTotal: number;
}) {
  return (
    <section className="border-t border-slate-100 bg-white">
      <div className="mx-auto grid max-w-7xl items-start gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            Hire better with more reach{' '}
            <span className="text-brand-600">and faster results</span>
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
            One posting goes to work across the whole board at once. Candidates find it while they
            search, while they browse their field, and in the alerts they set for exactly this kind
            of role, so applications start arriving while the posting is still fresh.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-12 gap-y-6">
            <div>
              <p className="font-display text-4xl font-black text-navy-900">
                <CountUp value={jobsTotal} />
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                live roles your posting competes alongside
              </p>
            </div>
            <div>
              <p className="font-display text-4xl font-black text-navy-900">
                <CountUp value={companiesTotal} />
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                employers already publishing here
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-brand-50 px-5 py-4">
            <p className="text-[15px] leading-relaxed text-slate-700">
              Screening questions filter out the applications that miss your bar before you read
              them, so the reach never costs you extra time at the shortlist stage.
            </p>
          </div>

          <Link href="/register" className="btn-primary mt-7 px-6 py-3">
            Publish your first role
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M3 10a1 1 0 0 1 1-1h10.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L14.586 11H4a1 1 0 0 1-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        {/* Distribution stack: one post, five surfaces. Decorative mock. */}
        <div aria-hidden className="relative">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_56px_-36px_rgba(15,23,42,0.45)]">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 font-display text-sm font-black text-white">
                M
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-slate-900">
                  Senior Frontend Engineer
                </p>
                <p className="truncate text-xs text-slate-500">MeroKhoj Labs · Kathmandu</p>
              </div>
              <span className="ml-auto rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                Live
              </span>
            </div>

            <ul className="mt-2 divide-y divide-slate-100">
              {SURFACES.map((surface, index) => (
                <li
                  key={surface.title}
                  className="mk-rise flex items-start gap-3.5 py-3.5"
                  style={{ '--mk-delay': `${80 + index * 90}ms` } as React.CSSProperties}
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 font-display text-[11px] font-black text-brand-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{surface.title}</p>
                    <p className="mt-0.5 text-sm leading-snug text-slate-500">{surface.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
