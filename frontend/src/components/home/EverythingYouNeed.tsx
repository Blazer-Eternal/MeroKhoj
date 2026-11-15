import Link from 'next/link';
import type { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  body: string;
  cta: { href: string; label: string };
  /** Short headline figure rendered inside the panel footer pill. */
  stat: { value: string; label: string };
  /** Checklist of concrete outcomes shown in the panel. */
  points: string[];
}

const Check = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.6} aria-hidden className="h-3 w-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5l3.5 3.5 7.5-8" />
  </svg>
);

/**
 * Two-column value band: argument on the left, a proof panel of concrete
 * outcomes on the right. The figure sits in a footer pill rather than as a
 * display numeral, so it reads as a claim instead of decoration.
 */
export function EverythingYouNeed({ title, body, cta, stat, points }: Props) {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">{body}</p>
          <Link
            href={cta.href}
            className="btn-primary mt-7 px-6 py-3"
          >
            {cta.label}
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M3 10a1 1 0 0 1 1-1h10.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L14.586 11H4a1 1 0 0 1-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        <div className="relative">
          {/* Offset colour chips give the panel physical depth without a
              gradient or a glow — just two flat shapes sitting behind it. */}
          <div
            aria-hidden
            className="absolute -bottom-5 -right-5 -z-10 h-28 w-28 rounded-3xl bg-brand-100"
          />
          <div
            aria-hidden
            className="absolute -left-5 -top-5 -z-10 h-20 w-20 rounded-2xl bg-accent-500/20"
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_28px_56px_-36px_rgba(15,23,42,0.45)] sm:p-8">
            <ul className="space-y-4">
              {points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-[15px] leading-snug text-slate-700"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white"
                  >
                    <Check />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3.5">
              <span className="font-display text-2xl font-black leading-none text-brand-700">
                {stat.value}
              </span>
              <span className="text-sm font-semibold leading-tight text-slate-600">
                {stat.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
