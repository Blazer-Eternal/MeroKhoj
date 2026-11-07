import Link from 'next/link';
import type { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  body: string;
  cta: { href: string; label: string };
  stat: { value: string; label: string };
}

/**
 * Two-column feature band with a oversized display numeral on the right
 * (matches the reference "Everything You Need" section).
 */
export function EverythingYouNeed({ title, body, cta, stat }: Props) {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">{body}</p>
          <Link
            href={cta.href}
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-brand-700"
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
        <div className="flex flex-col items-center lg:items-end">
          <p className="font-display text-[8.5rem] font-black leading-none text-brand-600 sm:text-[10rem]">
            {stat.value}
          </p>
          <p className="mt-4 text-lg font-semibold text-slate-500">{stat.label}</p>
        </div>
      </div>
    </section>
  );
}
