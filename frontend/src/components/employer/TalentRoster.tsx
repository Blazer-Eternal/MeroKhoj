import Link from 'next/link';

/**
 * "Talent Roster" — company-owned shortlists (the backend's talent_rosters
 * tables: a named roster per company, members with private notes). Roster
 * APIs require an employer session, so this public section shows a mock of
 * what a roster looks like inside the dashboard rather than fetching one.
 */

const ROSTER = {
  name: 'Backend shortlist — Q3',
  description: 'Saved from the Platform Engineer pipeline. Strong Go + Postgres, available within a month.',
  members: [
    { initials: 'AK', name: 'Aayush Karki', note: 'Excellent systems design round; wanted a hybrid week.' },
    { initials: 'ST', name: 'Sujata Thapa', note: 'Referred by the DevOps lead; free after contract ends.' },
    { initials: 'RG', name: 'Ritesh Gurung', note: 'Applied twice; ready for a senior title this time.' },
  ],
};

const USES = [
  {
    title: 'Save anyone from a pipeline',
    body: 'Add a candidate to a roster straight from their application, with the notes you already wrote on them.',
  },
  {
    title: 'Notes stay with the person',
    body: 'Private remarks live on the roster member, not the old job post, so context survives the role closing.',
  },
  {
    title: 'Start the next search warm',
    body: 'When a similar opening goes live, reach out to the roster first instead of restarting from zero.',
  },
];

export function TalentRoster() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            Talent Roster: keep the people{' '}
            <span className="text-brand-600">you almost hired</span>
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
            The best candidate for your next role is often someone you already interviewed. A
            roster keeps that shortlist alive between openings, scoped to your company and
            visible only to your team.
          </p>

          <dl className="mt-8 space-y-5">
            {USES.map((use) => (
              <div key={use.title} className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-white"
                >
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.6} aria-hidden className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5l3.5 3.5 7.5-8" />
                  </svg>
                </span>
                <div>
                  <dt className="font-display text-[15px] font-bold text-slate-900">{use.title}</dt>
                  <dd className="mt-0.5 text-[15px] leading-relaxed text-slate-600">{use.body}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary px-6 py-3">
              Create employer account
            </Link>
            <Link href="/contact" className="btn-secondary px-6 py-3">
              Talk to our team
            </Link>
          </div>
        </div>

        {/* Roster mock — decorative stand-in for the dashboard view. */}
        <div aria-hidden className="relative">
          <div
            aria-hidden
            className="absolute -bottom-5 -right-5 -z-10 h-28 w-28 rounded-3xl bg-brand-100"
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_28px_56px_-36px_rgba(15,23,42,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-base font-bold text-slate-900">{ROSTER.name}</p>
                <p className="mt-1 text-sm leading-snug text-slate-500">{ROSTER.description}</p>
              </div>
              <span className="shrink-0 rounded-md bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 ring-1 ring-brand-100">
                {ROSTER.members.length} saved
              </span>
            </div>

            <ul className="mt-5 divide-y divide-slate-100">
              {ROSTER.members.map((member, index) => (
                <li
                  key={member.name}
                  className="mk-rise flex items-start gap-3.5 py-3.5 first:pt-0"
                  style={{ '--mk-delay': `${100 + index * 110}ms` } as React.CSSProperties}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-800 font-display text-xs font-black text-white">
                    {member.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{member.name}</p>
                    <p className="mt-0.5 text-sm leading-snug text-slate-500">{member.note}</p>
                  </div>
                  <span className="ml-auto mt-0.5 shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                    Available
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500">Add from a past pipeline…</p>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">
                +
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
