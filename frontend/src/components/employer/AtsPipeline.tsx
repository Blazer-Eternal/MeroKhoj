import Link from 'next/link';

/**
 * "AI-Powered ATS" — the six real application stages the backend tracks
 * (APPLIED → UNDER_REVIEW → SHORTLISTED → INTERVIEW → SELECTED → HIRED),
 * drawn as one horizontal rail with a moving marker so the flow reads as a
 * single pipeline rather than six unrelated features.
 */

const STAGES = [
  {
    key: 'APPLIED',
    label: 'Applied',
    title: 'Every application lands in one inbox',
    body: 'Candidates apply through the posting with their profile and screening answers attached, so nothing arrives as a stray email your team has to forward around.',
  },
  {
    key: 'UNDER_REVIEW',
    label: 'Under review',
    title: 'Your team reads side by side',
    body: 'Assign the review, leave notes on a candidate, and compare answers against the same screening questions before anyone moves forward.',
  },
  {
    key: 'SHORTLISTED',
    label: 'Shortlisted',
    title: 'The shortlist the whole team sees',
    body: 'Move the keepers into one list. Everyone hiring for the role sees the same names in the same order, with the reasoning attached.',
  },
  {
    key: 'INTERVIEW',
    label: 'Interview',
    title: 'Slots confirmed, feedback recorded',
    body: 'Offer open times, let candidates confirm without the back-and-forth, and capture interview feedback against your own criteria while the conversation is fresh.',
  },
  {
    key: 'SELECTED',
    label: 'Selected',
    title: 'The offer leaves a record',
    body: 'The decision, the notes and the person who made the call stay on the file, so handover to onboarding is a lookup rather than a search.',
  },
  {
    key: 'HIRED',
    label: 'Hired',
    title: 'Closed roles stay searchable',
    body: 'Past hires remain in your company history, and the talent roster keeps warm runners-up ready for the next similar opening.',
  },
];

const REJECTED_NOTE =
  'Rejected and withdrawn candidates keep their history too, so nothing disappears from the pipeline and every decision can be explained later.';

export function AtsPipeline() {
  return (
    <section className="bg-navy-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              AI-Powered ATS: one pipeline, <span className="text-brand-400">application to offer</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-blue-200">
              Six stages, one board. Every candidate moves along the same rail your team can see,
              so at any point you know how many people are waiting, who owns the next step, and
              what was decided.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-blue-200/80">{REJECTED_NOTE}</p>
            <Link
              href="/register"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-display text-sm font-bold text-navy-900 transition-colors hover:bg-brand-100"
            >
              Open your pipeline
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M3 10a1 1 0 0 1 1-1h10.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L14.586 11H4a1 1 0 0 1-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>

          {/* Stage rail: connector behind, nodes in front. Decorative mock. */}
          <div aria-hidden className="relative">
            <div className="relative rounded-2xl bg-navy-800 p-6 shadow-[0_32px_64px_-40px_rgba(0,0,0,0.7)] sm:p-8">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold text-white">Frontend Engineer pipeline</p>
                <span className="rounded-md bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white">
                  6 stages
                </span>
              </div>

              {/* Horizontal rail with a lit path through all six nodes */}
              <div className="relative mt-7">
                <div className="absolute left-[8%] right-[8%] top-[15px] h-0.5 bg-white/15" />
                <div className="absolute left-[8%] right-[8%] top-[15px] h-0.5 bg-gradient-to-r from-brand-400 via-brand-400 to-accent-400" />
                <ol className="relative flex justify-between">
                  {STAGES.map((stage, index) => (
                    <li key={stage.key} className="flex w-[16%] flex-col items-center text-center">
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-full font-display text-[11px] font-black ${
                          index < 4
                            ? 'bg-brand-500 text-white ring-4 ring-brand-500/25'
                            : index === 4
                              ? 'bg-accent-500 text-white ring-4 ring-accent-500/25'
                              : 'bg-white/10 text-blue-200 ring-4 ring-white/5'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`mt-2 text-[11px] font-bold leading-tight ${
                          index < 5 ? 'text-white' : 'text-blue-300'
                        }`}
                      >
                        {stage.label}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Detail cards for the active middle of the funnel */}
              <ul className="mt-7 space-y-3">
                {STAGES.slice(1, 4).map((stage, index) => (
                  <li
                    key={stage.key}
                    className="mk-rise rounded-xl bg-navy-900/70 p-4 ring-1 ring-white/10"
                    style={{ '--mk-delay': `${120 + index * 110}ms` } as React.CSSProperties}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500 text-[10px] font-black text-white">
                        {index + 2}
                      </span>
                      <p className="font-display text-sm font-bold text-white">{stage.title}</p>
                    </div>
                    <p className="mt-1.5 pl-7 text-sm leading-snug text-blue-200/85">{stage.body}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-accent-500/15 px-4 py-3 ring-1 ring-accent-400/30">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-500 text-white">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10.5l3.2 3.2L15 7" />
                  </svg>
                </span>
                <p className="text-xs font-semibold leading-snug text-blue-100">
                  Every stage change is timestamped and visible to your team, so no candidate is
                  ever lost between inboxes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
