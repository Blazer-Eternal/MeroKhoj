import Link from 'next/link';
import type { Company } from '@/types';

/**
 * "Trusted by Nepal's leading employers" — a logo marquee reusing the
 * .mk-marquee-track loop (slowed to 80s via .mk-marquee-slow so it never
 * reads as a copy of the jobseeker strip). The set repeats three times per
 * half so the -50% keyframe always lands on the same sequence.
 */
export function TrustedEmployers({ companies }: { companies: Company[] }) {
  const logos = companies.filter((company) => company.logo_url).slice(0, 12);
  if (logos.length === 0) return null;

  const half = [...logos, ...logos, ...logos];
  const track = [...half, ...half];

  return (
    <section className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Trusted by Nepal&apos;s leading employers
            </h2>
            <p className="mt-2 max-w-xl text-slate-600">
              Verified teams across retail, finance, health, telecom and education publish their
              roles on MeroKhoj and hire from the same pipeline you are about to open.
            </p>
          </div>
          <Link
            href="/companies"
            className="text-sm font-bold text-brand-600 hover:text-brand-700"
          >
            Browse all employers
          </Link>
        </div>

        <div className="overflow-hidden py-2">
          <div className="mk-marquee-track mk-marquee-slow" data-direction="ltr">
            {track.map((company, i) => {
              const chip = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={company.logo_url!} alt="" className="h-8 w-8 object-contain" />
                  <span className="max-w-[160px] truncate text-sm font-bold text-slate-600">
                    {company.name}
                  </span>
                  <svg viewBox="0 0 20 20" fill="#1b64f5" aria-hidden className="h-3.5 w-3.5 shrink-0">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </>
              );

              // Everything past the first set only fills the loop: keep it
              // out of the tab order and the accessibility tree.
              if (i >= logos.length) {
                return (
                  <span
                    key={`${company.id}-${i}`}
                    aria-hidden="true"
                    tabIndex={-1}
                    className="flex h-14 shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5"
                  >
                    {chip}
                  </span>
                );
              }
              return (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  title={company.name}
                  className="flex h-14 shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 transition-colors hover:border-brand-300"
                >
                  {chip}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
