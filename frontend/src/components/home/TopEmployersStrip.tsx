import Link from 'next/link';
import type { Company } from '@/types';

/**
 * Top Employers — a single logo row drifting left over 60s.
 * The row repeats its logo set 3× per half (so it always out-widths the
 * container), the track doubles that half, and the keyframe shifts by exactly
 * -50% — the second copy slides in seamlessly with no gap.
 * Hovering the row freezes it exactly where the cursor is (CSS play-state).
 */
export function TopEmployersStrip({ companies }: { companies: Company[] }) {
  if (companies.length === 0) return null;

  const logos = companies.slice(0, 14);
  // Each half holds the set 3× so it always out-widths the 1280px container;
  // the track doubles it and the keyframe shifts by exactly -50% (three sets),
  // which lands on the same sequence — no gap.
  const half = [...logos, ...logos, ...logos];
  const track = [...half, ...half];

  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <h2 className="mb-3 font-display text-lg font-bold text-slate-900">Top Employers</h2>
        <div className="overflow-hidden py-1.5">
          <div className="mk-marquee-track" data-direction="ltr">
            {track.map((company, i) => {
              const chip = (
                <>
                  {company.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={company.logo_url} alt="" className="h-6 w-6 object-contain" />
                  ) : (
                    <span className="grid h-6 w-6 place-items-center rounded bg-brand-600 text-[11px] font-black text-white">
                      {company.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="max-w-[120px] truncate text-xs font-semibold text-slate-500">
                    {company.name}
                  </span>
                </>
              );

              // Everything past the first set exists only to fill the loop:
              // keep it out of the tab order and the accessibility tree.
              if (i >= logos.length) {
                return (
                  <span
                    key={`${company.id}-${i}`}
                    aria-hidden="true"
                    tabIndex={-1}
                    className="flex h-11 shrink-0 items-center gap-2.5 rounded-lg border border-slate-100 bg-white px-4 shadow-sm"
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
                  className="flex h-11 shrink-0 items-center gap-2.5 rounded-lg border border-slate-100 bg-white px-4 shadow-sm transition-colors hover:border-brand-200"
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
