import Link from 'next/link';
import type { ServicePlan } from '@/types';
import { formatMoney } from '@/utils/format';

/**
 * Pricing tiers rendered from the live /service-plans catalogue (admin
 * manages the rows). Smoke/test fixtures are filtered out and the three
 * real tiers are ordered by price; the middle tier is highlighted.
 *
 * There is no self-serve checkout in this app yet, so paid CTAs point at
 * /contact (talk to the team) and the free tier at /register.
 */

interface Tier {
  plan: ServicePlan;
  /** Feature lines shown under the price, derived from plan limits. */
  features: string[];
  cta: { href: string; label: string };
}

function featuresFor(plan: ServicePlan): string[] {
  const jobs =
    plan.job_posting_limit == null
      ? 'Unlimited job postings'
      : plan.job_posting_limit === 1
        ? '1 active job posting'
        : `${plan.job_posting_limit} active job postings`;
  const duration =
    plan.duration_days == null
      ? 'No expiry on your entitlement'
      : `${plan.duration_days} days of coverage`;
  const featured =
    plan.featured_jobs_limit > 0
      ? `${plan.featured_jobs_limit} featured job slot${plan.featured_jobs_limit > 1 ? 's' : ''}`
      : 'Standard placement in search and categories';

  return [
    jobs,
    duration,
    featured,
    'Applicant pipeline with screening questions',
    'Verified employer badge once approved',
  ];
}

function buildTiers(plans: ServicePlan[]): Tier[] {
  const visible = plans
    .filter((plan) => plan.status === 'ACTIVE')
    .filter((plan) => !/^smoke\b/i.test(plan.name.trim()))
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);

  return visible.map((plan) => {
    const free = Number(plan.price) === 0;
    return {
      plan,
      features: featuresFor(plan),
      cta: free
        ? { href: '/register', label: 'Start free' }
        : { href: '/contact', label: 'Talk to sales' },
    };
  });
}

export function PricingTiers({ plans }: { plans: ServicePlan[] }) {
  const tiers = buildTiers(plans);
  if (tiers.length === 0) return null;

  const highlightIndex = tiers.length >= 2 ? Math.min(1, tiers.length - 1) : -1;

  return (
    <section className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            Plans that match <span className="text-brand-600">how often you hire</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Start on the free tier and publish your first role today. Move up when you need more
            live postings at once or want your roles lifted above the standard list.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {tiers.map(({ plan, features, cta }, index) => {
            const highlighted = index === highlightIndex;
            const free = Number(plan.price) === 0;

            return (
              <div
                key={plan.id}
                className={`mk-rise relative flex flex-col rounded-2xl p-7 ${
                  highlighted
                    ? 'bg-navy-900 text-white shadow-[0_32px_64px_-40px_rgba(23,46,92,0.75)] lg:-translate-y-3'
                    : 'border border-slate-200 bg-white text-slate-900'
                }`}
                style={{ '--mk-delay': `${index * 120}ms` } as React.CSSProperties}
              >
                {highlighted && (
                  <span className="absolute -top-3 left-7 rounded-full bg-brand-600 px-3.5 py-1 text-xs font-black uppercase tracking-wide text-white shadow-md">
                    Most popular
                  </span>
                )}

                <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                {plan.description && (
                  <p
                    className={`mt-1 min-h-[2.5rem] text-sm leading-snug ${
                      highlighted ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {plan.description}
                  </p>
                )}

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-black">
                    {free ? 'Free' : formatMoney(plan.price, plan.currency)}
                  </span>
                  {!free && plan.duration_days != null && (
                    <span
                      className={`text-sm font-semibold ${highlighted ? 'text-blue-200' : 'text-slate-500'}`}
                    >
                      / {plan.duration_days} days
                    </span>
                  )}
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <span
                        aria-hidden
                        className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ${
                          highlighted ? 'bg-accent-500 text-white' : 'bg-brand-600 text-white'
                        }`}
                      >
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden className="h-2.5 w-2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10.5l3.2 3.2L15 7" />
                        </svg>
                      </span>
                      <span className={highlighted ? 'text-blue-100' : 'text-slate-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={cta.href}
                  className={`mt-7 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-display text-sm font-bold transition-colors ${
                    highlighted
                      ? 'bg-white text-navy-900 hover:bg-brand-100'
                      : free
                        ? 'btn-primary'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cta.label}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
          Verified companies publish freely while billing is optional on MeroKhoj. Plans add
          posting volume, coverage windows and featured slots when your team needs them.
        </p>
      </div>
    </section>
  );
}
