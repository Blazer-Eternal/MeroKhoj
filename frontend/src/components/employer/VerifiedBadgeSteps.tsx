import Link from 'next/link';

/**
 * "Build trust with the verified employer badge" — the real verification
 * flow the backend implements: the company submits documents and remarks,
 * an admin reviews and returns a decision with a note, and the badge then
 * shows on the profile. Three steps, drawn as a connected rail.
 */

const STEPS = [
  {
    num: '01',
    title: 'Submit your documents',
    body: 'Upload your company registration and any supporting paperwork from the employer dashboard, then add remarks so the reviewer knows what they are looking at.',
  },
  {
    num: '02',
    title: 'An admin reviews the file',
    body: 'Our team reads the submission and returns a decision with a written note. Approved companies move to Verified; anything incomplete comes back with exactly what to fix.',
  },
  {
    num: '03',
    title: 'The badge goes live',
    body: 'Your company profile and every posting carry the verified mark, so candidates know a real organisation stands behind the role before they apply.',
  },
];

export function VerifiedBadgeSteps() {
  return (
    <section className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              Build trust with the{' '}
              <span className="text-brand-600">verified employer badge</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Candidates apply to more roles than they can count, so the fastest way to stand out
              is to prove you are real before they read your posting. Verification is reviewed by
              a person, not an algorithm, and the decision arrives with a note you can act on.
            </p>

            {/* Badge mock — the mark candidates will see everywhere. */}
            <div aria-hidden className="mt-8 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/25">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-7 w-7">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3l7 3v5c0 4.5-3 8.3-7 10-1.7-1.7-7-5.5-7-10V6l7-3z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12l2.3 2.3L15.5 9.5" />
                </svg>
              </span>
              <div>
                <p className="flex items-center gap-1.5 font-display text-base font-bold text-slate-900">
                  Verified Employer
                  <svg viewBox="0 0 20 20" fill="#1b64f5" aria-hidden className="h-4 w-4">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Shown on your profile, every posting, and search results.
                </p>
              </div>
            </div>

            <Link href="/register" className="btn-primary mt-7 px-6 py-3">
              Verify your company
            </Link>
          </div>

          {/* Connected step rail */}
          <ol className="relative">
            <span
              aria-hidden
              className="absolute left-[27px] top-14 hidden h-[calc(100%-7rem)] w-0.5 bg-slate-200 sm:block"
            />
            {STEPS.map((step, index) => (
              <li
                key={step.num}
                className="mk-rise relative mb-8 flex gap-5 last:mb-0"
                style={{ '--mk-delay': `${index * 130}ms` } as React.CSSProperties}
              >
                <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-navy-900 font-display text-lg font-black text-white ring-4 ring-white">
                  {step.num}
                </span>
                <div className="min-w-0 pt-1">
                  <h3 className="font-display text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{step.body}</p>
                  {index === 1 && (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Pending review shows on your dashboard until a decision arrives
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
