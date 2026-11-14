'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * "How do you like to recruit?" — tabbed expanding-card carousel
 * (reference images 3-5).
 *
 * Every card of the active tab lives in one horizontal track (rendered three
 * times so the row can loop seamlessly). The track slides so the leading card
 * sits at the left edge: it is wider, tinted, and shows a mock + blurb, while
 * the rest are equal-height chips. Arrows and chip clicks slide the row and
 * expand the new lead card in a single500ms motion, and the lead card
 * overhangs the bottom of the blue panel like the reference design.
 */

type MockKind = 'list' | 'form' | 'reach' | 'board' | 'filter' | 'calendar';

interface RecruitCard {
  id: string;
  title: string;
  blurb: string;
  icon: keyof typeof ICONS;
  mock: MockKind;
  href: string;
}

interface RecruitTab {
  key: string;
  label: string;
  desc: string;
  cards: RecruitCard[];
}

const SELF_SERVE = '/register';
const TALK_TO_US = '/contact';

const TABS: RecruitTab[] = [
  {
    key: 'posting',
    label: 'Job Posting',
    desc: 'Publish a role once and let it reach jobseekers who are already looking. Every application lands in one place, so your team reviews, shortlists, and moves ahead without digging through inboxes.',
    cards: [
      {
        id: 'ats',
        title: 'AI-Powered ATS',
        blurb:
          'Screen every application against your requirements before you open a single profile.',
        icon: 'spark',
        mock: 'list',
        href: SELF_SERVE,
      },
      {
        id: 'questions',
        title: 'Custom Questionnaires',
        blurb:
          'Ask the same role-specific questions of every candidate and compare answers side by side.',
        icon: 'clipboard',
        mock: 'form',
        href: SELF_SERVE,
      },
      {
        id: 'reach',
        title: 'Wider Reach',
        blurb:
          'One posting goes out to active jobseekers across the board and our partner channels.',
        icon: 'globe',
        mock: 'reach',
        href: SELF_SERVE,
      },
      {
        id: 'ats-mgmt',
        title: 'ATS Management',
        blurb:
          'Move each candidate from applied to offered on one board your whole team can see.',
        icon: 'board',
        mock: 'board',
        href: SELF_SERVE,
      },
      {
        id: 'filters',
        title: 'Smart Filters',
        blurb:
          'Sort a hundred applications down to a shortlist by skill, experience, and location.',
        icon: 'filter',
        mock: 'filter',
        href: SELF_SERVE,
      },
    ],
  },
  {
    key: 'instahire',
    label: 'InstaHire',
    desc: 'Urgent opening? Post the role, review matched candidates ranked by fit, and confirm interview slots without the back-and-forth.',
    cards: [
      {
        id: 'shortlist',
        title: 'Instant Shortlist',
        blurb:
          'Post an urgent role and get a ranked shortlist of matched candidates within hours.',
        icon: 'bolt',
        mock: 'list',
        href: SELF_SERVE,
      },
      {
        id: 'slots',
        title: 'Confirmed Slots',
        blurb:
          'Offer open interview times and let candidates confirm without the email back-and-forth.',
        icon: 'calendar',
        mock: 'calendar',
        href: SELF_SERVE,
      },
      {
        id: 'available',
        title: 'Available Now',
        blurb:
          'Reach jobseekers ready to start on short notice, filtered by how soon they can join.',
        icon: 'user',
        mock: 'filter',
        href: SELF_SERVE,
      },
      {
        id: 'days',
        title: 'Hire in Days',
        blurb:
          'Keep a hard deadline by moving from posting to offer inside the same week.',
        icon: 'clock',
        mock: 'board',
        href: SELF_SERVE,
      },
    ],
  },
  {
    key: 'executive',
    label: 'Executive Search',
    desc: 'For the roles that steer a company, we run a discreet search through a curated pool of senior leaders and present a shortlist worth the meeting.',
    cards: [
      {
        id: 'leadership',
        title: 'Leadership Talent',
        blurb:
          'Tap a curated pool of senior candidates for the roles that steer a company.',
        icon: 'user',
        mock: 'list',
        href: TALK_TO_US,
      },
      {
        id: 'confidential',
        title: 'Confidential Search',
        blurb:
          'Run the hunt privately, with your company and the role hidden from public listings.',
        icon: 'shield',
        mock: 'form',
        href: TALK_TO_US,
      },
      {
        id: 'mapping',
        title: 'Market Mapping',
        blurb:
          'See who holds the skills you need, where they work, and what it takes to bring them across.',
        icon: 'globe',
        mock: 'reach',
        href: TALK_TO_US,
      },
      {
        id: 'consultant',
        title: 'Dedicated Consultant',
        blurb:
          'Work with a search specialist who owns the mandate from briefing to signed offer.',
        icon: 'chat',
        mock: 'board',
        href: TALK_TO_US,
      },
    ],
  },
  {
    key: 'support',
    label: 'Recruitment & Selection Support',
    desc: 'Hand the pipeline over. We screen applicants, run structured interviews, and pass along only the people you should spend time with.',
    cards: [
      {
        id: 'screening',
        title: 'Screening at Scale',
        blurb:
          'We work through large applicant pools and hand you only the people worth meeting.',
        icon: 'filter',
        mock: 'filter',
        href: TALK_TO_US,
      },
      {
        id: 'interviews',
        title: 'Structured Interviews',
        blurb:
          'Shared scorecards keep every interviewer rating candidates against the same bar.',
        icon: 'clipboard',
        mock: 'form',
        href: TALK_TO_US,
      },
      {
        id: 'testing',
        title: 'Skill Testing',
        blurb:
          'Practical assessments show what a candidate can do rather than what they claim.',
        icon: 'chart',
        mock: 'list',
        href: TALK_TO_US,
      },
      {
        id: 'offers',
        title: 'Offer & Onboarding',
        blurb:
          'We guide the offer stage so a strong candidate does not slip away at the finish.',
        icon: 'chat',
        mock: 'board',
        href: TALK_TO_US,
      },
    ],
  },
];

const ICONS: Record<string, ReactNode> = {
  spark: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9L12 3.5z"
    />
  ),
  clipboard: (
    <>
      <path strokeLinecap="round" d="M9 5.5h6M9 9.5h6M9 13.5h4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 4H6.5A1.5 1.5 0 005 5.5v14A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5v-14A1.5 1.5 0 0017.5 4H16"
      />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" d="M3.5 12h17M12 3.5c2.4 2.3 3.7 5.3 3.7 8.5S14.4 18.2 12 20.5c-2.4-2.3-3.7-5.3-3.7-8.5S9.6 5.8 12 3.5z" />
    </>
  ),
  board: (
    <>
      <rect x="4" y="5" width="4.5" height="11" rx="1" />
      <rect x="9.75" y="5" width="4.5" height="7" rx="1" />
      <rect x="15.5" y="5" width="4.5" height="14" rx="1" />
    </>
  ),
  filter: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 5.5h15l-5.8 6.8v5.4l-3.4 1.8v-7.2L4.5 5.5z"
    />
  ),
  bolt: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 3L5.5 13.5H11L10 21l7.5-10.5H12L13 3z"
    />
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="1.5" />
      <path strokeLinecap="round" d="M8 3.5v4M16 3.5v4M4 10.5h16M8.5 14.5h2M13.5 14.5h2M8.5 17.5h2" />
    </>
  ),
  user: (
    <>
      <circle cx="10" cy="8" r="3.5" />
      <path
        strokeLinecap="round"
        d="M4 20c0-3.2 2.7-5.2 6-5.2s6 2 6 5.2"
      />
      <path strokeLinecap="round" d="M17 8.5h4M19 6.5v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
    </>
  ),
  shield: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3.5l7 2.8v5.4c0 4.1-2.9 7.4-7 8.8-4.1-1.4-7-4.7-7-8.8V6.3l7-2.8z"
    />
  ),
  chat: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7a2.5 2.5 0 01-2.5 2.5H9l-5 4V6.5z"
    />
  ),
  chart: (
    <>
      <path strokeLinecap="round" d="M4 20h16" />
      <path strokeLinecap="round" d="M6.5 20v-5.5M11.5 20V8M16.5 20v-9" />
    </>
  ),
};

const ArrowRight = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h11M11 5.5L15.5 10 11 14.5" />
  </svg>
);

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    aria-hidden
    className="h-5 w-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d={dir === 'left' ? 'M12.5 4.5L7 10l5.5 5.5' : 'M7.5 4.5L13 10l-5.5 5.5'}
    />
  </svg>
);

/** Small wireframe mock shown inside the expanded card. */
function CardMock({ kind }: { kind: MockKind }) {
  const frame = (
    <rect x="1" y="1" width="218" height="108" rx="8" className="fill-white" stroke="#cfe0f5" />
  );

  if (kind === 'list') {
    return (
      <svg viewBox="0 0 220 110" aria-hidden className="w-full">
        {frame}
        {[24, 54, 84].map((y, i) => (
          <g key={y}>
            <circle cx="24" cy={y + 8} r="8" className={i === 0 ? 'fill-brand-600' : 'fill-brand-200'} />
            <rect x="42" y={y} width={i === 1 ? 96 : 84} height="7" rx="3.5" className="fill-brand-100" />
            <rect x="42" y={y + 12} width="58" height="6" rx="3" className="fill-slate-100" />
            <rect x="164" y={y + 2} width="38" height="13" rx="6.5" className="fill-brand-50" />
          </g>
        ))}
      </svg>
    );
  }

  if (kind === 'form') {
    return (
      <svg viewBox="0 0 220 110" aria-hidden className="w-full">
        {frame}
        <rect x="18" y="16" width="120" height="7" rx="3.5" className="fill-brand-100" />
        <circle cx="26" cy="40" r="6" className="fill-brand-600" />
        <rect x="40" y="36" width="86" height="7" rx="3.5" className="fill-slate-100" />
        <circle cx="26" cy="60" r="6" className="fill-white" stroke="#8ec6ff" />
        <rect x="40" y="56" width="70" height="7" rx="3.5" className="fill-slate-100" />
        <rect x="18" y="82" width="74" height="16" rx="8" className="fill-brand-600" />
        <rect x="104" y="82" width="52" height="16" rx="8" className="fill-brand-50" />
      </svg>
    );
  }

  if (kind === 'reach') {
    const dots = [0, 60, 120, 180, 240, 300].map((deg) => {
      const rad = (deg * Math.PI) / 180;
      return { x: 110 + Math.cos(rad) * 66, y: 55 + Math.sin(rad) * 38 };
    });
    return (
      <svg viewBox="0 0 220 110" aria-hidden className="w-full">
        {frame}
        {dots.map((d, i) => (
          <g key={i}>
            <line x1="110" y1="55" x2={d.x} y2={d.y} stroke="#d9ebff" strokeWidth="2" />
            <circle cx={d.x} cy={d.y} r="7" className={i % 2 === 0 ? 'fill-brand-500' : 'fill-brand-200'} />
          </g>
        ))}
        <circle cx="110" cy="55" r="16" className="fill-brand-600" />
        <path
          d="M110 47l2.4 6.6 6.6 2.4-6.6 2.4L110 65l-2.4-6.6L101 56l6.6-2.4L110 47z"
          className="fill-white"
        />
      </svg>
    );
  }

  if (kind === 'board') {
    return (
      <svg viewBox="0 0 220 110" aria-hidden className="w-full">
        {frame}
        {[16, 83, 150].map((x, col) => (
          <g key={x}>
            <rect x={x} y="14" width="54" height="82" rx="6" className="fill-brand-50" />
            <rect x={x + 8} y="24" width="38" height="7" rx="3.5" className="fill-brand-200" />
            <rect x={x + 8} y="40" width="38" height="20" rx="4" className="fill-white" />
            <rect x={x + 8} y="66" width="38" height="20" rx="4" className={col === 0 ? 'fill-white' : 'fill-brand-100'} />
          </g>
        ))}
      </svg>
    );
  }

  if (kind === 'filter') {
    return (
      <svg viewBox="0 0 220 110" aria-hidden className="w-full">
        {frame}
        <path d="M62 22h96l-30 34v28l-36 16V56L62 22z" className="fill-brand-100" stroke="#8ec6ff" />
        <rect x="74" y="30" width="72" height="6" rx="3" className="fill-brand-300" />
        <rect x="16" y="88" width="44" height="14" rx="7" className="fill-brand-600" />
        <rect x="68" y="88" width="44" height="14" rx="7" className="fill-brand-100" />
        <rect x="120" y="88" width="44" height="14" rx="7" className="fill-brand-100" />
        <rect x="172" y="88" width="34" height="14" rx="7" className="fill-slate-100" />
      </svg>
    );
  }

  // calendar
  const cells: ReactNode[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const x = 24 + col * 27;
      const y = 26 + row * 26;
      const active = row === 1 && col === 3;
      cells.push(
        <circle
          key={`${row}-${col}`}
          cx={x}
          cy={y}
          r={active ? 8 : 5.5}
          className={active ? 'fill-brand-600' : 'fill-brand-100'}
        />
      );
    }
  }
  return (
    <svg viewBox="0 0 220 110" aria-hidden className="w-full">
      {frame}
      <rect x="18" y="10" width="60" height="7" rx="3.5" className="fill-brand-200" />
      {cells}
    </svg>
  );
}

interface TrackSizes {
  open: number;
  closed: number;
  gap: number;
  h: number;
}

const FALLBACK_SIZES: TrackSizes = { open: 360, closed: 200, gap: 16, h: 296 };

/**
 * Size the cards from the measured track width so the row always fills the
 * panel edge to edge: four cards when they fit comfortably, three or two on
 * narrower panels, one full-width card on phones.
 */
function computeSizes(w: number): TrackSizes {
  if (w <= 0) return FALLBACK_SIZES;
  const gap = w < 640 ? 10 : 16;
  let open: number;
  let closed: number;
  if (w >= 798) {
    open = Math.round(Math.min(460, Math.max(300, w * 0.36)));
    closed = Math.floor((w - open - gap * 3) / 3);
  } else if (w >= 612) {
    open = Math.round(Math.min(420, Math.max(280, w * 0.4)));
    closed = Math.floor((w - open - gap * 2) / 2);
  } else if (w >= 390) {
    open = Math.round(Math.min(380, Math.max(240, w * 0.55)));
    closed = w - open - gap;
  } else {
    open = w;
    closed = 160;
  }
  const h = Math.max(250, Math.round(closed * 1.43));
  return { open, closed, gap, h };
}

function CardView({
  card,
  expanded,
  hidden,
  sizes,
  onPromote,
}: {
  card: RecruitCard;
  expanded: boolean;
  hidden: boolean;
  sizes: TrackSizes;
  onPromote: () => void;
}) {
  const icon = (
    <span
      className={`grid shrink-0 place-items-center rounded-full ${
        expanded
          ? 'h-10 w-10 bg-white/85 text-brand-700'
          : 'h-12 w-12 bg-[#e9f3fe] text-brand-600'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        aria-hidden
        className="h-5 w-5"
      >
        {ICONS[card.icon]}
      </svg>
    </span>
  );

  if (expanded) {
    return (
      <div
        aria-hidden={hidden}
        className="flex shrink-0 flex-col rounded-2xl bg-[#b9d5fb] p-5 shadow-sm transition-[width] duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] sm:p-6"
        style={{ width: sizes.open, minHeight: sizes.h }}
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-display text-base font-bold leading-snug text-slate-900 sm:text-lg">
            {card.title}
          </h3>
        </div>
        <div className="mt-4">
          <CardMock kind={card.mock} />
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-900 sm:text-base">
          {card.blurb}
        </p>
        <Link
          href={card.href}
          tabIndex={hidden ? -1 : 0}
          className="mt-4 inline-flex items-center gap-1.5 self-start text-[15px] font-bold text-brand-700 hover:text-brand-800"
        >
          Learn More
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onPromote}
      tabIndex={hidden ? -1 : 0}
      aria-expanded={false}
      aria-hidden={hidden}
      className="flex shrink-0 flex-col items-center overflow-hidden rounded-2xl bg-white px-4 pb-5 pt-14 text-center shadow-sm transition-[width] duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] sm:px-5 sm:pt-20"
      style={{ width: sizes.closed, height: sizes.h }}
    >
      {icon}
      <span className="mt-5 font-display text-sm font-bold leading-snug text-slate-900 sm:text-[15px]">
        {card.title}
      </span>
      <span
        aria-hidden
        className="mt-auto grid h-9 w-9 place-items-center rounded-lg bg-[#d9ebff] text-brand-700"
      >
        <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
}

export function RecruitSection() {
  const [tabKey, setTabKey] = useState(TABS[0].key);
  // Canonical position lives in the middle copy of the track ([len, 2*len)).
  const [pos, setPos] = useState(() => TABS[0].cards.length);
  const [slide, setSlide] = useState(false);
  const [sizes, setSizes] = useState<TrackSizes>(FALLBACK_SIZES);
  const clipRef = useRef<HTMLDivElement>(null);

  const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0];
  const len = tab.cards.length;

  // Measure the visible track so four cards always fill the panel.
  useEffect(() => {
    const el = clipRef.current;
    if (!el) return;
    const measure = () => setSizes(computeSizes(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // After a loop crossing, snap back to the middle copy with transitions off
  // (the track is periodic, so the jump lands on identical pixels).
  useEffect(() => {
    if (pos >= len && pos < 2 * len) return;
    const timer = window.setTimeout(() => {
      setSlide(false);
      setPos((p) => {
        let n = p;
        while (n < len) n += len;
        while (n >= 2 * len) n -= len;
        return n;
      });
    }, 520);
    return () => window.clearTimeout(timer);
  }, [pos, len]);

  const selectTab = (key: string) => {
    const next = TABS.find((t) => t.key === key) ?? TABS[0];
    setSlide(false);
    setTabKey(key);
    setPos(next.cards.length);
  };

  const step = (delta: number) => {
    setSlide(true);
    setPos((p) => p + delta);
  };

  const promote = (index: number) => {
    if (index === pos) return;
    setSlide(true);
    setPos(index);
  };

  const trackCards = [...tab.cards, ...tab.cards, ...tab.cards];
  const offset = -(pos * (sizes.closed + sizes.gap));

  return (
    <section className="border-t border-slate-100 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            How do you like to recruit?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
            Pick the hiring solution that matches your need for speed, volume, or specialization.
          </p>
        </div>

        <div className="relative mt-8 rounded-2xl bg-[#e9f3fe]">
          {/* Faint concentric circles behind the cards, clipped to the panel. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
          >
            <svg
              viewBox="0 0 300 300"
              fill="none"
              className="absolute -right-16 top-1/2 h-72 w-72 -translate-y-1/2 text-[#cfe4fb] sm:-right-24 sm:h-96 sm:w-96"
            >
              <circle cx="150" cy="150" r="60" stroke="currentColor" strokeWidth="2" />
              <circle cx="150" cy="150" r="105" stroke="currentColor" strokeWidth="2" />
              <circle cx="150" cy="150" r="150" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <div className="relative">
            {/* Tabs sit on the panel; the active one is a white folder tab. */}
            <div
              className="flex flex-wrap items-end gap-1 px-3 pt-3 sm:justify-around sm:px-4"
              role="tablist"
              aria-label="Recruitment solutions"
            >
              {TABS.map((t) => {
                const isActive = t.key === tabKey;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => selectTab(t.key)}
                    className={`rounded-t-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${
                      isActive
                        ? 'border-slate-200 border-b-0 bg-white text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-brand-700'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* What this hiring solution is for. */}
            <p className="px-4 pb-1 pt-3 text-[15px] leading-relaxed text-slate-600 sm:px-6 sm:text-base">
              {tab.desc}
            </p>

            <div className="relative mt-2">
              <div className="px-12 sm:px-7">
                <div
                  ref={clipRef}
                  className="overflow-x-clip overflow-y-visible"
                  style={{ height: sizes.h }}
                >
                  <div
                    className="flex items-start"
                    style={{
                      gap: sizes.gap,
                      transform: `translate3d(${offset}px, 0, 0)`,
                      transition: slide
                        ? 'transform 500ms cubic-bezier(0.22, 0.61, 0.36, 1)'
                        : 'none',
                    }}
                  >
                    {trackCards.map((card, i) => {
                      const copy = Math.floor(i / len);
                      return (
                        <CardView
                          key={`${copy}:${card.id}`}
                          card={card}
                          expanded={i === pos}
                          hidden={copy !== 1}
                          sizes={sizes}
                          onPromote={() => promote(i)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Prev/next half-overlap the panel edges from sm up. */}
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous solution"
                className="absolute left-1 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white shadow-md transition-colors hover:bg-brand-700 sm:left-0 sm:h-11 sm:w-11 sm:-translate-x-1/2 sm:shadow-[0_0_0_4px_#fff]"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next solution"
                className="absolute right-1 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white shadow-md transition-colors hover:bg-brand-700 sm:right-0 sm:h-11 sm:w-11 sm:translate-x-1/2 sm:shadow-[0_0_0_4px_#fff]"
              >
                <Chevron dir="right" />
              </button>
            </div>

            {/* Blue below the chips; the taller lead card overhangs it. */}
            <div className="h-6 sm:h-8" />
          </div>
        </div>
      </div>
    </section>
  );
}
