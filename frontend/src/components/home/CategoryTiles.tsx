import Link from 'next/link';
import type { ReactNode } from 'react';
import type { JobCategory } from '@/types';

interface Props {
  categories: JobCategory[];
  counts: Map<string, number>;
}

const stroke = (children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    aria-hidden
    className="h-5 w-5"
  >
    {children}
  </svg>
);

/** Keyword → glyph, so a taxonomy without artwork still reads at a glance. */
const GLYPHS: { test: RegExp; node: ReactNode }[] = [
  {
    test: /soft|engineer|develop|program|it\b|data|network|cloud|devops|qa|tech/i,
    node: stroke(
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8L4.5 12l4 4M15.5 8l4 4-4 4M13.5 5l-3 14" />
      </>,
    ),
  },
  {
    test: /market|sales|business develop|growth|communi|advertis/i,
    node: stroke(
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5v3a1.5 1.5 0 0 0 1.5 1.5H7l6 4V5L7 9H5.5A1.5 1.5 0 0 0 4 10.5z" />
        <path strokeLinecap="round" d="M17.5 9.5a4 4 0 0 1 0 5" />
      </>,
    ),
  },
  {
    test: /financ|account|bank|invest|audit|econom/i,
    node: stroke(
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M6.5 19v-6M11 19V8M15.5 19v-4M20 19V5" />
      </>,
    ),
  },
  {
    test: /health|medic|nurs|clinic|pharma|dental|care/i,
    node: stroke(
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20s-7-4.6-7-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7 2.8c0 5-7 9.6-7 9.6z" />
        <path strokeLinecap="round" d="M12 10.5v4M10 12.5h4" />
      </>,
    ),
  },
  {
    test: /educat|teach|train|school|academ|instruct/i,
    node: stroke(
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-4 9 4-9 4-9-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.2V16c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6v-4.8" />
      </>,
    ),
  },
  {
    test: /design|creative|art|graphic|content|writ|media/i,
    node: stroke(
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5 4 20z" />
        <path strokeLinecap="round" d="M13.5 7l3.5 3.5" />
      </>,
    ),
  },
  {
    test: /hospital|hotel|tour|travel|restaur|food|kitchen/i,
    node: stroke(
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 17h16M5.5 17a6.5 6.5 0 0 1 13 0M12 7V5.5M12 5.5a1.5 1.5 0 1 0 0-.001" />
      </>,
    ),
  },
  {
    test: /construct|architect|civil|mechan|electric|technic|maintenance/i,
    node: stroke(
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 17.5h16M6 17.5v-2a6 6 0 0 1 12 0v2M10 6.5h4M12 6.5v-2" />
      </>,
    ),
  },
  {
    test: /human resource|recruit|talent|people|admin|office|support/i,
    node: stroke(
      <>
        <circle cx="9" cy="8.5" r="3.4" />
        <path strokeLinecap="round" d="M2.8 20c0-3.3 2.8-5.4 6.2-5.4s6.2 2.1 6.2 5.4" />
        <path strokeLinecap="round" d="M16.4 5.8a3.4 3.4 0 0 1 0 6.4M18.6 20c0-2.3-.9-4.1-2.4-5.2" />
      </>,
    ),
  },
  {
    test: /legal|law|complian|secretar/i,
    node: stroke(
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M6 8h12M6 8l-2.5 5a2.8 2.8 0 0 0 5 0L6 8zM18 8l-2.5 5a2.8 2.8 0 0 0 5 0L18 8z" />
      </>,
    ),
  },
];

const FALLBACK = stroke(
  <>
    <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
    <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
  </>,
);

function glyphFor(name: string): ReactNode {
  return GLYPHS.find((glyph) => glyph.test.test(name))?.node ?? FALLBACK;
}

/** Icon-tile grid for browsing the taxonomy (replaces flat link rows). */
export function CategoryTiles({ categories, counts }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {categories.map((category) => {
        const count = counts.get(category.id) ?? 0;
        return (
          <Link
            key={category.id}
            href={`/jobs?category_id=${category.id}`}
            className="group lift flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
          >
            <span
              aria-hidden
              className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white"
            >
              {glyphFor(category.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold text-slate-900 transition-colors group-hover:text-brand-700">
                {category.name}
              </span>
              <span className="mt-1 block text-xs font-medium text-slate-500">
                {count === 1 ? '1 open role' : `${count} open roles`}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
